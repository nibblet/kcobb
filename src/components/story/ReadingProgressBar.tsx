"use client";

import { useEffect, useState } from "react";

export function ReadingProgressBar() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const handler = () => {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight;
      const next = max <= 0 ? 0 : Math.min(100, (scrolled / max) * 100);
      setPct(next);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler, { passive: true });
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-14 z-[85] h-1 bg-[var(--color-divider)] md:top-[60px]">
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
        className="h-full bg-clay transition-[width] duration-100 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
