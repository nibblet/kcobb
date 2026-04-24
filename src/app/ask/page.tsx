"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AskChat, type AskChatInitialContext } from "@/components/ask/AskChat";

function getPreloadPassage(raw: string | null): string | undefined {
  if (raw === null || raw === "") return undefined;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const trimmed = decoded.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, 1000);
}

function getPreloadPrompt(raw: string | null): string | undefined {
  if (raw === null || raw === "") return undefined;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const trimmed = decoded.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, 600);
}

export default function AskPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-8 text-sm text-ink-ghost">
          Loading...
        </div>
      }
    >
      <AskPageContent />
    </Suspense>
  );
}

function AskPageContent() {
  const searchParams = useSearchParams();
  const storySlug = searchParams.get("story") || undefined;
  const journeySlug = searchParams.get("journey") || undefined;
  const prefilledPrompt = getPreloadPrompt(searchParams.get("prompt"));
  const highlightIdFromUrl = searchParams.get("highlight") || undefined;
  const startFreshFromHighlight = searchParams.get("new") === "1";
  const urlPassage = getPreloadPassage(searchParams.get("passage"));

  const initialContext: AskChatInitialContext | null = storySlug
    ? { type: "story", slug: storySlug }
    : journeySlug
      ? { type: "journey", slug: journeySlug }
      : null;

  const [contextStoryTitle, setContextStoryTitle] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!storySlug) return;
    let cancelled = false;
    fetch(`/api/stories/${encodeURIComponent(storySlug)}/meta`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { title?: string } | null) => {
        if (!cancelled && d?.title) setContextStoryTitle(d.title);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      setContextStoryTitle(null);
    };
  }, [storySlug]);

  const header = (
    <>
      <div className="border-b border-[var(--color-border)] py-4">
        <h1 className="type-page-title text-2xl">Ask About Keith</h1>
        <p className="type-ui mt-1 text-ink-ghost">
          Ask questions about Keith&apos;s stories. You&apos;ll get answers drawn
          from Keith&apos;s stories and life lessons.
          {journeySlug && !storySlug && (
            <span className="text-clay">
              {" "}
              &middot; Journey: {journeySlug.replace(/-/g, " ")}
            </span>
          )}
        </p>
      </div>

      {storySlug && (
        <div className="border-b border-[var(--color-border)] bg-gold-pale/30 py-3">
          <p className="type-meta text-ink">Story context</p>
          <p className="mt-1 font-[family-name:var(--font-lora)] text-sm text-ink">
            You&apos;re chatting with the archive in the context of:{" "}
            <Link
              href={`/stories/${encodeURIComponent(storySlug)}`}
              className="font-medium text-clay underline underline-offset-2 hover:text-clay-mid"
            >
              {contextStoryTitle ?? storySlug}
            </Link>
          </p>
        </div>
      )}

      {!storySlug && prefilledPrompt && (
        <div className="border-b border-[var(--color-border)] bg-gold-pale/30 py-3">
          <p className="type-meta text-ink">Principle prompt loaded</p>
          <p className="mt-1 font-[family-name:var(--font-lora)] text-sm text-ink">
            We loaded a suggested question into Ask. You can edit it before you
            send.
          </p>
        </div>
      )}
    </>
  );

  return (
    <AskChat
      mode="page"
      initialContext={initialContext}
      initialPrompt={prefilledPrompt}
      initialPassage={urlPassage}
      initialHighlightId={highlightIdFromUrl}
      startFresh={startFreshFromHighlight}
      headerSlot={header}
    />
  );
}
