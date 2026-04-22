import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getJourneyBySlug } from "@/lib/wiki/journeys";
import {
  getCanonicalPrincipleBySlug,
  getPersonBySlug,
  getStoryById,
} from "@/lib/wiki/parser";
import { markdownToSpeech } from "@/lib/story-audio/markdown-to-speech";
import { narrationContentHash } from "@/lib/narration/hash";

export type NarrationEntity =
  | "people"
  | "journey-intro"
  | "journey-step"
  | "journey-narrated"
  | "principle";

export interface NarrationPayload {
  entity: NarrationEntity;
  slug: string;
  step?: number;
  /** Plain narration string fed to TTS (title. body) */
  narrationText: string;
  /** Markdown→speech body only (no title); used for Web Speech UI */
  speechBodyPlain: string;
  wordCount: number;
  contentHash: string;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function buildPayload(
  entity: NarrationEntity,
  slug: string,
  step: number | undefined,
  narrationText: string,
  speechBodyPlain: string
): NarrationPayload {
  const wordCount = countWords(narrationText);
  return {
    entity,
    slug,
    step,
    narrationText,
    speechBodyPlain,
    wordCount,
    contentHash: narrationContentHash(narrationText),
  };
}

export function narrationAudioEndpoint(payload: NarrationPayload): string {
  const q = new URLSearchParams();
  q.set("entity", payload.entity);
  q.set("slug", payload.slug);
  if (payload.entity === "journey-step" && payload.step != null) {
    q.set("step", String(payload.step));
  }
  return `/api/narration/audio?${q.toString()}`;
}

export async function resolvePeopleNarration(
  slug: string
): Promise<NarrationPayload | null> {
  const person = getPersonBySlug(slug);
  if (!person) return null;

  const supabase = await createClient();
  const { data: dbPerson } = await supabase
    .from("sb_people")
    .select("display_name, bio_md")
    .eq("slug", slug)
    .maybeSingle();

  const markdown =
    dbPerson?.bio_md?.trim() || person.aiDraft?.trim() || "";
  if (!markdown) return null;

  const title = dbPerson?.display_name?.trim() || person.name;
  const speechBodyPlain = markdownToSpeech(markdown);
  const narrationText = `${title}. ${speechBodyPlain}`;
  return buildPayload(
    "people",
    slug,
    undefined,
    narrationText,
    speechBodyPlain
  );
}

export function resolveJourneyIntroNarration(
  slug: string
): NarrationPayload | null {
  const journey = getJourneyBySlug(slug);
  if (!journey) return null;

  const parts = [journey.description.trim()];
  if (journey.narratedDek?.trim()) {
    parts.push(journey.narratedDek.trim());
  }
  const combined = parts.filter(Boolean).join("\n\n");
  if (!combined) return null;

  const speechBodyPlain = markdownToSpeech(combined);
  const narrationText = `${journey.title}. ${speechBodyPlain}`;
  return buildPayload(
    "journey-intro",
    slug,
    undefined,
    narrationText,
    speechBodyPlain
  );
}

export function resolveJourneyStepNarration(
  slug: string,
  step: number
): NarrationPayload | null {
  const journey = getJourneyBySlug(slug);
  if (!journey || step < 1 || step > journey.storyIds.length) return null;

  const storyId = journey.storyIds[step - 1];
  const story = getStoryById(storyId);
  if (!story) return null;

  const markdownBody = `${story.summary}\n\n${story.fullText}`;
  const speechBodyPlain = markdownToSpeech(markdownBody);
  const narrationText = `${story.title}. ${speechBodyPlain}`;
  return buildPayload(
    "journey-step",
    slug,
    step,
    narrationText,
    speechBodyPlain
  );
}

export function resolveJourneyNarratedNarration(
  slug: string
): NarrationPayload | null {
  const journey = getJourneyBySlug(slug);
  if (!journey || journey.narratedSections.length === 0) return null;

  const combined = journey.narratedSections
    .map((s) => `## ${s.title}\n\n${s.body}`)
    .join("\n\n");

  const speechBodyPlain = markdownToSpeech(combined);
  const narrationText = `${journey.title}. ${speechBodyPlain}`;
  return buildPayload(
    "journey-narrated",
    slug,
    undefined,
    narrationText,
    speechBodyPlain
  );
}

export function resolvePrincipleNarration(
  slug: string
): NarrationPayload | null {
  const principle = getCanonicalPrincipleBySlug(slug);
  if (!principle || !principle.aiNarrative?.trim()) return null;

  const speechBodyPlain = markdownToSpeech(principle.aiNarrative);
  const narrationText = `${principle.title}. ${speechBodyPlain}`;
  return buildPayload(
    "principle",
    slug,
    undefined,
    narrationText,
    speechBodyPlain
  );
}

export async function resolveNarrationFromSearchParams(params: {
  entity: string | null;
  slug: string | null;
  step: string | null;
}): Promise<NarrationPayload | null> {
  const { entity, slug, step: stepStr } = params;
  if (!entity || !slug?.trim()) return null;

  switch (entity) {
    case "people":
      return resolvePeopleNarration(slug.trim());
    case "journey-intro":
      return resolveJourneyIntroNarration(slug.trim());
    case "journey-narrated":
      return resolveJourneyNarratedNarration(slug.trim());
    case "principle":
      return resolvePrincipleNarration(slug.trim());
    case "journey-step": {
      const step = parseInt(stepStr ?? "", 10);
      if (!Number.isFinite(step) || step < 1) return null;
      return resolveJourneyStepNarration(slug.trim(), step);
    }
    default:
      return null;
  }
}
