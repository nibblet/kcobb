import Link from "next/link";
import { HomeHero } from "@/components/home/HomeHero";
import { AgeModeSwitcher } from "@/components/layout/AgeModeSwitcher";
import { Reveal } from "@/components/ui/Reveal";

const navCards = [
  {
    href: "/stories",
    title: "Read a Story",
    description:
      "Browse 39 stories from Keith's life — from growing up in Mississippi to leading national organizations.",
  },
  {
    href: "/themes",
    title: "Explore by Topic",
    description:
      "Discover the principles and values that shaped Keith's decisions — integrity, work ethic, leadership, and more.",
  },
  {
    href: "/ask",
    title: "Ask a Question",
    description:
      "Have a conversation guided by Keith's stories. Ask about life, career, decisions, or family.",
  },
];

export default function HomePage() {
  return (
    <div className="pb-12">
      <HomeHero />

      <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-12 md:py-16">
        <Reveal className="mb-10 text-center">
          <h2 className="type-page-title mb-3 text-balance">
            The Keith Cobb Story Library
          </h2>
          <p className="type-ui mx-auto max-w-md text-ink-muted">
            A collection of stories, lessons, and values from a life well lived
            — preserved for the family.
          </p>
        </Reveal>

        <div className="mb-10 hidden justify-center md:flex">
          <AgeModeSwitcher />
        </div>

        <div className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
          {navCards.map((card) => (
            <Reveal key={card.href}>
              <Link
                href={card.href}
                className="group block h-full rounded-xl border border-[var(--color-border)] bg-warm-white p-6 shadow-none transition-[transform,box-shadow,border-color] duration-[var(--duration-slow)] ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:border-clay-border hover:shadow-[0_12px_40px_rgba(44,28,16,0.08)]"
              >
                <h3 className="type-story-title mb-2 transition-colors group-hover:text-burgundy">
                  {card.title}
                </h3>
                <p className="font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink-muted">
                  {card.description}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
