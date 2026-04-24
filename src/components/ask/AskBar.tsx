"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { usePageContext } from "@/components/layout/PageContextProvider";
import { useAskOverlay } from "./AskOverlayProvider";
import type { PageContextType } from "@/components/layout/PageContextProvider";

const HIDE_ON_PATHS = new Set([
  "/login",
  "/signup",
  "/welcome",
  "/ask",
]);

function placeholderFor(
  type: PageContextType | undefined,
  title: string | undefined,
): string {
  if (!type) return "Ask Keith anything…";
  const name = title?.trim() ? title : "this";
  switch (type) {
    case "story":
      return `Ask about "${name}" — a passage, a theme…`;
    case "journey":
      return `Ask about this journey or any story in it…`;
    case "principle":
      return `Ask about this principle or where it shows up…`;
    case "person":
      return `Ask about ${name} — their stories, relationships…`;
    default:
      return "Ask Keith anything…";
  }
}

export function AskBar() {
  const pathname = usePathname();
  const pageContext = usePageContext();
  const { open } = useAskOverlay();
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);

  useEffect(() => {
    const handler = () => {
      const y = document.documentElement.scrollTop;
      const delta = y - lastYRef.current;
      lastYRef.current = y;
      if (delta > 2 && y > 120) {
        setHidden(true);
      } else if (delta < -2 || y < 40) {
        setHidden(false);
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  if (HIDE_ON_PATHS.has(pathname)) return null;

  const placeholder = placeholderFor(pageContext?.type, pageContext?.title);

  return (
    <div
      className={`sticky top-0 z-40 border-b border-[var(--color-border)] bg-warm-white/95 backdrop-blur supports-[backdrop-filter]:bg-warm-white/75 transition-transform duration-200 ease-out md:top-[60px] ${
        hidden ? "md:translate-y-0 -translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-2">
        <button
          type="button"
          onClick={() => open()}
          className="type-ui flex w-full items-center gap-2 rounded-full border border-[var(--color-border)] bg-warm-white-2 px-4 py-2 text-left text-ink-ghost transition-colors hover:border-clay-border hover:text-clay"
          aria-label="Open Ask About Keith"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M20 20l-3.5-3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="truncate">{placeholder}</span>
        </button>
      </div>
    </div>
  );
}
