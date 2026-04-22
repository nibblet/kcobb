import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  ElevenLabsApiError,
  ElevenLabsNotConfiguredError,
  isElevenLabsConfigured,
} from "@/lib/elevenlabs/client";
import { createStreamingNarrationResponse } from "@/lib/narration/generate";
import { resolveNarrationFromSearchParams } from "@/lib/narration/resolve";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const payload = await resolveNarrationFromSearchParams({
    entity: url.searchParams.get("entity"),
    slug: url.searchParams.get("slug"),
    step: url.searchParams.get("step"),
  });

  if (!payload) {
    return Response.json({ error: "Narration not found" }, { status: 404 });
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

  const rate = checkRateLimit(`narration-audio:${user.id}`, 5, 15 * 60_000);
  if (!rate.allowed) {
    return Response.json(
      {
        error: "Too many audio generations. Try again in a few minutes.",
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
    stream = createStreamingNarrationResponse(payload);
  } catch (err) {
    if (err instanceof ElevenLabsNotConfiguredError) {
      return Response.json(
        { error: "Audio provider not configured" },
        { status: 501 }
      );
    }
    if (err instanceof ElevenLabsApiError) {
      console.error("[narration-audio] elevenlabs error", err);
      return Response.json({ error: "Audio provider error" }, { status: 502 });
    }
    console.error("[narration-audio] stream setup failed", err);
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
