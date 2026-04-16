"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAgeMode } from "@/hooks/useAgeMode";

export function ThemesYoungReaderRedirect({ children }: { children: ReactNode }) {
  const { ageMode } = useAgeMode();
  const router = useRouter();

  useEffect(() => {
    if (ageMode === "young_reader") {
      router.replace("/journeys");
    }
  }, [ageMode, router]);

  if (ageMode === "young_reader") {
    return (
      <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-10 text-center text-sm text-ink-muted">
        Redirecting…
      </div>
    );
  }

  return children;
}
