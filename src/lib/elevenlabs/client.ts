import "server-only";

export class ElevenLabsNotConfiguredError extends Error {
  constructor() {
    super("ElevenLabs is not configured");
    this.name = "ElevenLabsNotConfiguredError";
  }
}

export class ElevenLabsApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(`ElevenLabs API ${status}: ${message}`);
    this.name = "ElevenLabsApiError";
    this.status = status;
  }
}

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  model: string;
}

export const ELEVENLABS_MODEL = "eleven_turbo_v2_5";

export function getElevenLabsConfig(): ElevenLabsConfig {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim();
  if (!apiKey || !voiceId) {
    throw new ElevenLabsNotConfiguredError();
  }
  return { apiKey, voiceId, model: ELEVENLABS_MODEL };
}

export function isElevenLabsConfigured(): boolean {
  return Boolean(
    process.env.ELEVENLABS_API_KEY?.trim() &&
      process.env.ELEVENLABS_VOICE_ID?.trim()
  );
}

const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true,
};

function buildRequestBody(text: string, model: string) {
  return JSON.stringify({
    text,
    model_id: model,
    voice_settings: VOICE_SETTINGS,
  });
}

async function throwIfNotOk(response: Response): Promise<void> {
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ElevenLabsApiError(
      response.status,
      detail.slice(0, 500) || response.statusText
    );
  }
}

/**
 * Call ElevenLabs text-to-speech and return the full MP3 bytes after synthesis completes.
 * Caller is responsible for chunking (ElevenLabs accepts up to ~5000 chars per request).
 */
export async function synthesizeSpeech(
  text: string,
  config: ElevenLabsConfig
): Promise<ArrayBuffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
    config.voiceId
  )}?output_format=mp3_44100_128`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": config.apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: buildRequestBody(text, config.model),
  });

  await throwIfNotOk(response);
  return response.arrayBuffer();
}

/**
 * Call ElevenLabs streaming TTS and return a ReadableStream of MP3 bytes that
 * resolves as synthesis happens (not after). Use this for low-latency playback.
 */
export async function synthesizeSpeechStream(
  text: string,
  config: ElevenLabsConfig
): Promise<ReadableStream<Uint8Array>> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
    config.voiceId
  )}/stream?output_format=mp3_44100_128`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": config.apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: buildRequestBody(text, config.model),
  });

  await throwIfNotOk(response);
  if (!response.body) {
    throw new ElevenLabsApiError(500, "Empty response body from stream endpoint");
  }
  return response.body;
}
