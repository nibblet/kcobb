import { createClient } from "@/lib/supabase/server";
import {
  getElevenLabsConfig,
  isElevenLabsConfigured,
} from "@/lib/elevenlabs/client";
import {
  getCachedAudio,
  loadEligibleStory,
  StoryNotEligibleError,
  StoryNotFoundError,
} from "@/lib/story-audio/generate";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;
  if (!storyId?.trim()) {
    return Response.json({ error: "storyId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isElevenLabsConfigured()) {
    return Response.json(
      { error: "Audio provider not configured" },
      { status: 501 }
    );
  }

  // Validate the story exists and is eligible for audio BEFORE exposing a stream URL.
  try {
    loadEligibleStory(storyId.trim());
  } catch (err) {
    if (err instanceof StoryNotFoundError) {
      return Response.json({ error: "Story not found" }, { status: 404 });
    }
    if (err instanceof StoryNotEligibleError) {
      return Response.json(
        { error: "Audio not available for this story type" },
        { status: 403 }
      );
    }
    throw err;
  }

  let config;
  try {
    config = getElevenLabsConfig();
  } catch {
    return Response.json(
      { error: "Audio provider not configured" },
      { status: 501 }
    );
  }

  // Cache hit: return the Storage URL (fast CDN).
  try {
    const cached = await getCachedAudio(storyId.trim(), config.voiceId);
    if (cached) {
      return Response.json(cached);
    }
  } catch (err) {
    console.error("[story-audio] cache lookup failed", err);
  }

  // Cache miss: return the streaming endpoint. The client uses this as the
  // <audio src> so playback starts as bytes arrive, and the stream route
  // persists the full MP3 to Storage in the background for next time.
  return Response.json({
    audioUrl: `/api/stories/${encodeURIComponent(storyId.trim())}/audio/stream`,
    cached: false,
    streaming: true,
    durationSec: 0,
    charCount: 0,
  });
}
