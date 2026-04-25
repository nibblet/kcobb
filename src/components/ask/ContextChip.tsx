"use client";

import type { AskChatContextType } from "./AskChat";

interface ContextChipProps {
  type: AskChatContextType;
  title: string;
  onDismiss?: () => void;
}

const TYPE_LABEL: Record<AskChatContextType, string> = {
  story: "story",
  journey: "journey",
  principle: "principle",
  person: "person",
};

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export function ContextChip({ type, title, onDismiss }: ContextChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-gold-pale/50 px-3 py-1 text-xs text-ink">
      <span className="text-ink-ghost">about {TYPE_LABEL[type]}:</span>
      <span className="font-medium">{truncate(title, 42)}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Remove context"
          className="ml-0.5 rounded-full text-ink-ghost transition-colors hover:text-ink"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </span>
  );
}
