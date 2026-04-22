import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getElevenLabsConfig,
  synthesizeSpeechStream,
  type ElevenLabsConfig,
} from "@/lib/elevenlabs/client";
import { chunkTextForSpeech } from "@/lib/story-audio/chunk";
import { DEFAULT_LISTEN_WPM } from "@/lib/story-audio";
import type { NarrationPayload } from "@/lib/narration/resolve";

const BUCKET_ID = "story-audio";

export interface NarrationAudioResult {
  audioUrl: string;
  cached: boolean;
  durationSec: number;
  charCount: number;
}

function storagePathFor(voiceId: string, contentHash: string): string {
  return `${voiceId}/narration/${contentHash}.mp3`;
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

export async function getCachedNarrationAudio(
  contentHash: string,
  voiceId: string
): Promise<NarrationAudioResult | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("sb_narration_audio")
    .select("storage_path, duration_sec, char_count")
    .eq("content_hash", contentHash)
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

async function persistNarrationAudio(params: {
  payload: NarrationPayload;
  config: ElevenLabsConfig;
  mp3: Uint8Array;
  charCount: number;
}): Promise<void> {
  const { payload, config, mp3, charCount } = params;
  const admin = createAdminClient();
  const storagePath = storagePathFor(config.voiceId, payload.contentHash);

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
    Math.round((payload.wordCount / DEFAULT_LISTEN_WPM) * 60)
  );

  const { error: insertError } = await admin.from("sb_narration_audio").upsert(
    {
      content_hash: payload.contentHash,
      voice_id: config.voiceId,
      model: config.model,
      storage_path: storagePath,
      byte_size: mp3.byteLength,
      char_count: charCount,
      duration_sec: durationSec,
      entity_type: payload.entity,
    },
    { onConflict: "content_hash,voice_id" }
  );
  if (insertError) {
    throw new Error(`Ledger insert failed: ${insertError.message}`);
  }
}

export function narrationStreamUrlFromPayload(payload: NarrationPayload): string {
  const u = new URLSearchParams();
  u.set("entity", payload.entity);
  u.set("slug", payload.slug);
  if (payload.entity === "journey-step" && payload.step != null) {
    u.set("step", String(payload.step));
  }
  return `/api/narration/audio/stream?${u.toString()}`;
}

export function createStreamingNarrationResponse(
  payload: NarrationPayload
): ReadableStream<Uint8Array> {
  const config = getElevenLabsConfig();
  const narration = payload.narrationText;
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

        const merged = concatenateUint8(collected);
        try {
          await persistNarrationAudio({
            payload,
            config,
            mp3: merged,
            charCount,
          });
          console.info(
            `[narration-audio] streamed+cached entity=${payload.entity} slug=${payload.slug} hash=${payload.contentHash.slice(0, 12)} chunks=${chunks.length} chars=${charCount} bytes=${merged.byteLength}`
          );
        } catch (err) {
          console.error("[narration-audio] cache write failed after stream", err);
        }

        controller.close();
      } catch (err) {
        console.error("[narration-audio] stream generation failed", err);
        controller.error(err);
      }
    },
  });
}
