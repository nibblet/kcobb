"use client";

import type { ReactNode } from "react";
import { useReveal } from "@/hooks/useReveal";

export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { ref, inView } = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "reveal-in-view" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
