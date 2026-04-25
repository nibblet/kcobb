"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAskOverlay } from "@/components/ask/AskOverlayProvider";
import { useTellOverlay } from "@/components/tell/TellOverlayProvider";
import { WhatsNextPill } from "./WhatsNextPill";
import { WhatsNextTile } from "./WhatsNextTile";
import type { WhatsNextData } from "@/lib/navigation/whats-next";

function readReduceMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function WhatsNext({
  data,
  floating = false,
}: {
  data: WhatsNextData;
  floating?: boolean;
}) {
  const [shouldShow, setShouldShow] = useState(false);
  const [reduceMotion, setReduceMotion] = useState<boolean>(() =>
    readReduceMotion(),
  );
  const { open } = useAskOverlay();
  const { open: openTell } = useTellOverlay();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const check = () => {
      const doc = document.documentElement;
      const scrollY = doc.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight;
      const percent = max <= 0 ? 0 : Math.min(100, (scrollY / max) * 100);
      const viewport = window.innerHeight;
      const docH = doc.scrollHeight;
      const floatingThreshold =
        percent > 88 || scrollY + viewport > docH - 160;
      const inflowThreshold = percent > 60 || scrollY + viewport > docH - 400;
      if (floating) {
        setShouldShow(floatingThreshold);
      } else if (inflowThreshold) {
        setShouldShow(true);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [floating]);

  const visible = shouldShow || (reduceMotion && !floating);
  const transitionClasses = reduceMotion
    ? "opacity-100 translate-y-0"
    : `transition-[opacity,transform] duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`;

  const pills = (
    <>
      {data.pills.map((pill, i) => {
        if (pill.action === "ask") {
          return (
            <WhatsNextPill
              key={`${pill.label}-${i}`}
              onClick={() =>
                open({
                  context: {
                    type: data.askContext.type,
                    slug: data.askContext.slug,
                    title: data.askContext.title,
                  },
                })
              }
            >
              {pill.label}
            </WhatsNextPill>
          );
        }
        if (pill.action === "tell") {
          return (
            <WhatsNextPill
              key={`${pill.label}-${i}`}
              onClick={() =>
                openTell({
                  about: {
                    type: data.askContext.type,
                    slug: data.askContext.slug,
                    title: data.askContext.title,
                  },
                })
              }
            >
              {pill.label}
            </WhatsNextPill>
          );
        }
        if (pill.href) {
          return (
            <WhatsNextPill key={`${pill.label}-${i}`} href={pill.href}>
              {pill.label}
            </WhatsNextPill>
          );
        }
        return null;
      })}
    </>
  );

  if (floating) {
    return (
      <div
        aria-label="What's next"
        className={`fixed inset-x-0 bottom-[72px] z-40 md:bottom-0 ${transitionClasses}`}
      >
        <div className="w-full border-t border-[var(--color-border)] bg-warm-white/95 backdrop-blur-md">
          <div className="mx-auto grid max-w-content gap-2 px-[var(--page-padding-x)] py-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-4 md:py-3">
            {data.primary ? (
              <Link
                href={data.primary.href}
                className="group block min-w-0 rounded-md px-1 py-0.5"
              >
                <p className="type-meta truncate text-ink-ghost">{data.primary.label}</p>
                <p className="truncate font-[family-name:var(--font-playfair)] text-base text-ink transition-colors group-hover:text-clay">
                  {data.primary.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
            <div className="flex flex-wrap gap-2 md:justify-end">{pills}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="What's next"
      className={`mt-10 pb-24 md:pb-10 ${transitionClasses}`}
    >
      <div className="flex flex-col gap-4">
        {data.primary && <WhatsNextTile primary={data.primary} />}
        <div className="flex flex-wrap gap-2">{pills}</div>
      </div>
    </section>
  );
}
