"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/journeys", label: "Journeys", match: (p: string) => p.startsWith("/journeys") },
  {
    href: "/principles",
    label: "Principles",
    match: (p: string) => p.startsWith("/principles"),
  },
  { href: "/themes", label: "Themes", match: (p: string) => p.startsWith("/themes") },
  { href: "/people", label: "People", match: (p: string) => p.startsWith("/people") },
] as const;

export function ExploreSubnav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Explore sections"
      className="border-b border-[var(--color-border)] bg-warm-white/90 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-content px-[var(--page-padding-x)] pt-3 pb-2 md:pt-4">
        <ul className="flex list-none flex-wrap gap-x-1 gap-y-1 md:gap-x-2">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={`type-ui relative inline-block px-2.5 py-2 text-[0.8125rem] no-underline transition-colors duration-[var(--duration-fast)] md:px-3 md:text-[0.875rem] ${
                    active
                      ? "text-burgundy after:absolute after:left-0 after:right-0 after:top-full after:mt-0.5 after:h-0.5 after:rounded-sm after:bg-burgundy"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
