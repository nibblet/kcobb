import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  ElevenLabsApiError,
  ElevenLabsNotConfiguredError,
  isElevenLabsConfigured,
} from "@/lib/elevenlabs/client";
import {
  createStreamingAudioResponse,
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

  // Rate-limit generations per user to bound ElevenLabs spend.
  // Shares the budget with the JSON metadata endpoint via the same key.
  const rate = checkRateLimit(`story-audio:${user.id}`, 5, 15 * 60_000);
  if (!rate.allowed) {
    return Response.json(
      {
        error:
          "Too many audio generations. Try again in a few minutes.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rate.retryAfterMs / 1000)),
        },
      }
    );
  }

  let stream: ReadableStream<Uint8Array>;
  try {
    stream = createStreamingAudioResponse(storyId.trim());
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
    if (err instanceof ElevenLabsNotConfiguredError) {
      return Response.json(
        { error: "Audio provider not configured" },
        { status: 501 }
      );
    }
    if (err instanceof ElevenLabsApiError) {
      console.error("[story-audio] elevenlabs error", err);
      return Response.json(
        { error: "Audio provider error" },
        { status: 502 }
      );
    }
    console.error("[story-audio] stream setup failed", err);
    return Response.json(
      { error: "Failed to start audio stream" },
      { status: 500 }
    );
  }

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
