"use client";

import Link from "next/link";
import type { ProfileNavBadge } from "@/hooks/useProfileNotificationBadge";

type ProfileNavLinkProps = {
  className?: string;
  badge?: ProfileNavBadge | null;
};

export function ProfileNavLink({
  className = "",
  badge = null,
}: ProfileNavLinkProps) {
  return (
    <Link
      href="/profile"
      aria-label="Profile"
      className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-[var(--color-muted)] hover:text-ink ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        aria-hidden
      >
        <path
          d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" />
      </svg>
      {badge?.kind === "number" && (
        <span
          aria-label={`${badge.value} pending question${
            badge.value === 1 ? "" : "s"
          }`}
          className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-clay px-1 text-[0.5625rem] font-semibold leading-none text-warm-white"
        >
          {badge.value}
        </span>
      )}
      {badge?.kind === "dot" && (
        <span
          aria-label="New answer"
          className="absolute right-0.5 top-0.5 inline-block h-2 w-2 rounded-full bg-gold"
        />
      )}
    </Link>
  );
}
