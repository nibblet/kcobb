"use client";

import { useEffect, useState } from "react";
import type { DatelineData } from "@/lib/wiki/key-dates";

/**
 * Single-line dateline rendered under the hero subtitle. Types the body copy
 * character-by-character with a blinking gold caret. Respects
 * `prefers-reduced-motion` by skipping the typing animation and showing the
 * full line immediately.
 */
export function TypewriterDateline({ data }: { data: DatelineData }) {
  const [typed, setTyped] = useState("");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    queueMicrotask(() => setReduced(mq.matches));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced) {
      queueMicrotask(() => setTyped(data.text));
      return;
    }
    let i = 0;
    let id: number | undefined;
    queueMicrotask(() => setTyped(""));
    const tick = () => {
      i += 1;
      setTyped(data.text.slice(0, i));
      if (i < data.text.length) {
        id = window.setTimeout(tick, 26 + Math.random() * 22);
      }
    };
    id = window.setTimeout(tick, 450);
    return () => {
      if (id !== undefined) window.clearTimeout(id);
    };
  }, [data.text, reduced]);

  const done = typed.length >= data.text.length;

  return (
    <p className="typewriter-dateline" aria-live="polite">
      <span className="typewriter-prefix">{data.prefix}</span>
      <span className="typewriter-sep"> — </span>
      <span className="typewriter-text">{typed}</span>
      <span
        className={`typewriter-caret ${done ? "typewriter-caret-steady" : ""}`}
        aria-hidden="true"
      >
        |
      </span>
    </p>
  );
}
