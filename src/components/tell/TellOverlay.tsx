"use client";

import { useEffect, useRef } from "react";
import { StoryContributionWorkspace } from "./StoryContributionWorkspace";
import type { TellAboutContext } from "./TellOverlayProvider";

interface TellOverlayProps {
  open: boolean;
  about: TellAboutContext | null;
  onClose: () => void;
}

export function TellOverlay({ open, about, onClose }: TellOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && panelRef.current) {
      const input = panelRef.current.querySelector<HTMLInputElement>(
        "input[type='text'], textarea",
      );
      input?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch justify-center bg-ink/40 p-0 md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Tell a Story"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="flex h-full w-full flex-col overflow-hidden bg-warm-white shadow-2xl md:h-[min(80vh,720px)] md:max-w-[720px] md:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-[var(--page-padding-x)] py-3 md:px-4">
          <h2 className="type-display text-base font-semibold text-ink">
            Tell a Story
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="type-ui rounded-full p-1 text-ink-ghost transition-colors hover:text-ink"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ×
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <StoryContributionWorkspace
            contributionMode="tell"
            mode="overlay"
            initialAbout={about}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
