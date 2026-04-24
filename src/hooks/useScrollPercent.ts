"use client";

import { useEffect, useRef, useState } from "react";

export type ScrollDirection = "up" | "down" | "idle";

export interface ScrollPercentState {
  percent: number;
  direction: ScrollDirection;
  scrollY: number;
}

export function useScrollPercent(): ScrollPercentState {
  const [state, setState] = useState<ScrollPercentState>({
    percent: 0,
    direction: "idle",
    scrollY: 0,
  });
  const lastYRef = useRef(0);

  useEffect(() => {
    const handler = () => {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight;
      const percent = max <= 0 ? 0 : Math.min(100, (scrolled / max) * 100);
      const delta = scrolled - lastYRef.current;
      const direction: ScrollDirection =
        Math.abs(delta) < 2 ? "idle" : delta > 0 ? "down" : "up";
      lastYRef.current = scrolled;
      setState({ percent, direction, scrollY: scrolled });
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler, { passive: true });
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  return state;
}
