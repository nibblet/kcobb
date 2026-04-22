import { createClient } from "@/lib/supabase/server";
import {
  getElevenLabsConfig,
  isElevenLabsConfigured,
} from "@/lib/elevenlabs/client";
import {
  getCachedNarrationAudio,
  narrationStreamUrlFromPayload,
} from "@/lib/narration/generate";
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

  let config;
  try {
    config = getElevenLabsConfig();
  } catch {
    return Response.json(
      { error: "Audio provider not configured" },
      { status: 501 }
    );
  }

  try {
    const cached = await getCachedNarrationAudio(
      payload.contentHash,
      config.voiceId
    );
    if (cached) {
      return Response.json(cached);
    }
  } catch (err) {
    console.error("[narration-audio] cache lookup failed", err);
  }

  return Response.json({
    audioUrl: narrationStreamUrlFromPayload(payload),
    cached: false,
    streaming: true,
    durationSec: 0,
    charCount: 0,
  });
}
