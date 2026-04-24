"use client";

import { useEffect, useState } from "react";
import { useAskOverlay } from "@/components/ask/AskOverlayProvider";
import { WhatsNextPill } from "./WhatsNextPill";
import { WhatsNextTile } from "./WhatsNextTile";
import type { WhatsNextData } from "@/lib/navigation/whats-next";

function readReduceMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function WhatsNext({ data }: { data: WhatsNextData }) {
  const [shouldShow, setShouldShow] = useState(false);
  const [reduceMotion, setReduceMotion] = useState<boolean>(() =>
    readReduceMotion(),
  );
  const { open } = useAskOverlay();

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
      if (percent > 60 || scrollY + viewport > docH - 400) {
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
  }, []);

  const visible = shouldShow || reduceMotion;
  const transitionClasses = reduceMotion
    ? "opacity-100 translate-y-0"
    : `transition-[opacity,transform] duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`;

  return (
    <section
      aria-label="What's next"
      className={`mt-10 pb-24 md:pb-10 ${transitionClasses}`}
    >
      <div className="flex flex-col gap-4">
        <WhatsNextTile primary={data.primary} />
        <div className="flex flex-wrap gap-2">
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
            if (pill.href) {
              return (
                <WhatsNextPill key={`${pill.label}-${i}`} href={pill.href}>
                  {pill.label}
                </WhatsNextPill>
              );
            }
            return null;
          })}
        </div>
      </div>
    </section>
  );
}
