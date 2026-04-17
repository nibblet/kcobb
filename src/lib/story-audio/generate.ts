import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getElevenLabsConfig,
  synthesizeSpeech,
  synthesizeSpeechStream,
  type ElevenLabsConfig,
} from "@/lib/elevenlabs/client";
import { getStoryById, type WikiStory } from "@/lib/wiki/parser";
import { markdownToSpeech } from "@/lib/story-audio/markdown-to-speech";
import { chunkTextForSpeech } from "@/lib/story-audio/chunk";
import { DEFAULT_LISTEN_WPM } from "@/lib/story-audio";

const BUCKET_ID = "story-audio";

export class StoryNotFoundError extends Error {
  constructor(storyId: string) {
    super(`Story not found: ${storyId}`);
    this.name = "StoryNotFoundError";
  }
}

export class StoryNotEligibleError extends Error {
  constructor(storyId: string, source: string) {
    super(`Story ${storyId} (source=${source}) is not eligible for audio`);
    this.name = "StoryNotEligibleError";
  }
}

export interface AudioResult {
  audioUrl: string;
  cached: boolean;
  durationSec: number;
  charCount: number;
}

function storagePathFor(voiceId: string, storyId: string): string {
  return `${voiceId}/${storyId}.mp3`;
}

function publicUrlFor(storagePath: string): string {
  const admin = createAdminClient();
  const { data } = admin.storage.from(BUCKET_ID).getPublicUrl(storagePath);
  return data.publicUrl;
}

function concatenateUint8(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}

/**
 * Load a story eligible for audio generation, or throw a typed error.
 */
export function loadEligibleStory(storyId: string): WikiStory {
  const story = getStoryById(storyId);
  if (!story) throw new StoryNotFoundError(storyId);
  if (story.source !== "memoir" && story.source !== "interview") {
    throw new StoryNotEligibleError(storyId, story.source);
  }
  return story;
}

/**
 * Return a cached audio URL for (storyId, voice_id) if one exists.
 * Returns null on miss; does not generate.
 */
export async function getCachedAudio(
  storyId: string,
  voiceId: string
): Promise<AudioResult | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("sb_story_audio")
    .select("storage_path, duration_sec, char_count")
    .eq("story_id", storyId)
    .eq("voice_id", voiceId)
    .maybeSingle();

  if (!data) return null;

  return {
    audioUrl: publicUrlFor(data.storage_path),
    cached: true,
    durationSec: data.duration_sec ?? 0,
    charCount: data.char_count ?? 0,
  };
}

/**
 * Persist a fully-generated MP3 to Storage and insert the ledger row.
 * Idempotent via upsert on (story_id, voice_id).
 */
export async function persistAudio(params: {
  storyId: string;
  story: WikiStory;
  config: ElevenLabsConfig;
  mp3: Uint8Array;
  charCount: number;
}): Promise<void> {
  const { storyId, story, config, mp3, charCount } = params;
  const admin = createAdminClient();
  const storagePath = storagePathFor(config.voiceId, storyId);

  const { error: uploadError } = await admin.storage
    .from(BUCKET_ID)
    .upload(storagePath, mp3, {
      contentType: "audio/mpeg",
      upsert: true,
    });
  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const durationSec = Math.max(
    1,
    Math.round((story.wordCount / DEFAULT_LISTEN_WPM) * 60)
  );

  const { error: insertError } = await admin
    .from("sb_story_audio")
    .upsert(
      {
        story_id: storyId,
        voice_id: config.voiceId,
        model: config.model,
        storage_path: storagePath,
        byte_size: mp3.byteLength,
        char_count: charCount,
        duration_sec: durationSec,
      },
      { onConflict: "story_id,voice_id" }
    );
  if (insertError) {
    throw new Error(`Ledger insert failed: ${insertError.message}`);
  }
}

/**
 * Build a ReadableStream that (a) streams MP3 bytes to the caller as ElevenLabs
 * synthesizes each chunk, and (b) persists the concatenated MP3 + ledger row
 * to Supabase Storage after the last chunk completes.
 *
 * First-audio latency ≈ time for ElevenLabs to start streaming the first chunk
 * (~500ms–1s for short chunks), not the full generation time.
 */
export function createStreamingAudioResponse(
  storyId: string
): ReadableStream<Uint8Array> {
  const story = loadEligibleStory(storyId);
  const config = getElevenLabsConfig();

  const narration = `${story.title}. ${markdownToSpeech(story.fullText)}`;
  const chunks = chunkTextForSpeech(narration);
  const charCount = narration.length;

  const collected: Uint8Array[] = [];

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (let i = 0; i < chunks.length; i++) {
          const chunkText = chunks[i];
          const chunkStream = await synthesizeSpeechStream(chunkText, config);
          const reader = chunkStream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            collected.push(value);
            controller.enqueue(value);
          }
        }

        // Persist the full MP3 + ledger row before closing. Client has already
        // received all bytes; the extra await only delays the HTTP response
        // finalization, not audio playback.
        const merged = concatenateUint8(collected);
        try {
          await persistAudio({ storyId, story, config, mp3: merged, charCount });
          console.info(
            `[story-audio] streamed+cached story=${storyId} voice=${config.voiceId} chunks=${chunks.length} chars=${charCount} bytes=${merged.byteLength}`
          );
        } catch (err) {
          console.error("[story-audio] cache write failed after stream", err);
        }

        controller.close();
      } catch (err) {
        console.error("[story-audio] stream generation failed", err);
        controller.error(err);
      }
    },
  });
}

/**
 * Non-streaming generate + upload. Kept for batch / admin flows that need the
 * finalized URL up front. Stream path is preferred for user-facing playback.
 */
export async function generateAndCacheAudio(
  storyId: string
): Promise<AudioResult> {
  const story = loadEligibleStory(storyId);
  const config = getElevenLabsConfig();

  const narration = `${story.title}. ${markdownToSpeech(story.fullText)}`;
  const chunks = chunkTextForSpeech(narration);

  const mp3Parts: Uint8Array[] = [];
  for (const chunk of chunks) {
    const bytes = await synthesizeSpeech(chunk, config);
    mp3Parts.push(new Uint8Array(bytes));
  }
  const merged = concatenateUint8(mp3Parts);
  const charCount = narration.length;

  await persistAudio({ storyId, story, config, mp3: merged, charCount });

  const durationSec = Math.max(
    1,
    Math.round((story.wordCount / DEFAULT_LISTEN_WPM) * 60)
  );

  console.info(
    `[story-audio] generated story=${storyId} voice=${config.voiceId} chunks=${chunks.length} chars=${charCount} bytes=${merged.byteLength}`
  );

  return {
    audioUrl: publicUrlFor(storagePathFor(config.voiceId, storyId)),
    cached: false,
    durationSec,
    charCount,
  };
}
