"use client";

import { useEffect, useRef, useState } from "react";

interface JourneyConnectorProps {
  text: string;
}

export function JourneyConnector({ text }: JourneyConnectorProps) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || done) return;

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [started, text, done]);

  return (
    <div
      ref={containerRef}
      className="my-8 rounded-xl border border-clay-border bg-gold-pale/60 px-5 py-4"
    >
      <p className="type-era-label mb-2 text-clay">Connecting to the next story</p>
      <p className="min-h-[2.5rem] font-[family-name:var(--font-lora)] text-sm italic leading-relaxed text-ink-muted">
        {displayed}
        {!done && (
          <span
            aria-hidden="true"
            className="ml-px inline-block h-[1em] w-[2px] translate-y-[1px] animate-pulse bg-clay-mid align-middle"
          />
        )}
      </p>
    </div>
  );
}
