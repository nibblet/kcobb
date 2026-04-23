"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type BeyondMode = "qa" | "capture" | "chat" | "write" | "edit";

const TABS: { id: BeyondMode; label: string; description: string }[] = [
  { id: "qa", label: "Q&A", description: "Answer reader questions" },
  { id: "capture", label: "Capture", description: "Capture facts & memories to enrich your stories" },
  { id: "chat", label: "Chat", description: "Guided interview" },
  { id: "write", label: "Write", description: "Compose directly" },
  { id: "edit", label: "Edit", description: "Drafts, published stories & biographies" },
];

export function BeyondModeTabs({ active }: { active: BeyondMode }) {
  const router = useRouter();
  const params = useSearchParams();

  function switchTo(mode: BeyondMode) {
    const next = new URLSearchParams(params.toString());
    if (mode === "chat") next.delete("mode");
    else next.set("mode", mode);
    const qs = next.toString();
    router.replace(qs ? `/beyond?${qs}` : "/beyond");
  }

  return (
    <div className="border-b border-[var(--color-border)] bg-warm-white">
      <div className="mx-auto flex max-w-3xl gap-0.5 overflow-x-auto px-4 pt-3">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTo(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={`type-ui shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border border-b-0 border-[var(--color-border)] bg-warm-white-2 text-clay"
                  : "text-ink-muted hover:text-clay"
              }`}
              title={tab.description}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
