"use client";

import { useEffect, useRef, useState } from "react";
import { AskChat, type AskChatInitialContext } from "./AskChat";
import { ContextChip } from "./ContextChip";

interface AskOverlayProps {
  open: boolean;
  context: AskChatInitialContext | null;
  initialPrompt?: string;
  onClose: () => void;
}

export function AskOverlay({
  open,
  context,
  initialPrompt,
  onClose,
}: AskOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [showChip, setShowChip] = useState<boolean>(Boolean(context));

  useEffect(() => {
    setShowChip(Boolean(context));
  }, [context]);

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
        "input[type='text']",
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
      aria-label="Ask About Keith"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="flex h-full w-full flex-col overflow-hidden bg-warm-white shadow-2xl md:h-[min(80vh,720px)] md:max-w-[720px] md:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-[var(--page-padding-x)] py-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <h2 className="type-display truncate text-base font-semibold text-ink">
              Ask About Keith
            </h2>
            {context && showChip && (
              <ContextChip
                type={context.type}
                title={context.title ?? context.slug}
                onDismiss={() => setShowChip(false)}
              />
            )}
          </div>
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
          <AskChat
            mode="overlay"
            initialContext={showChip ? context : null}
            initialPrompt={initialPrompt}
          />
        </div>
      </div>
    </div>
  );
}
