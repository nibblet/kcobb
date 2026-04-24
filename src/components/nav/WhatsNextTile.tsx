"use client";

import Link from "next/link";
import type { WhatsNextPrimary } from "@/lib/navigation/whats-next";

export function WhatsNextTile({ primary }: { primary: WhatsNextPrimary }) {
  return (
    <Link
      href={primary.href}
      className="group block rounded-xl border border-[var(--color-border)] bg-warm-white p-5 transition-colors hover:border-clay-border"
    >
      <span className="type-meta block text-ink-ghost">{primary.label}</span>
      <span className="mt-2 block font-[family-name:var(--font-playfair)] text-xl text-ink group-hover:text-clay">
        {primary.title}
      </span>
      {primary.blurb && (
        <span className="mt-2 block line-clamp-2 font-[family-name:var(--font-lora)] text-sm text-ink-muted">
          {primary.blurb}
        </span>
      )}
    </Link>
  );
}
