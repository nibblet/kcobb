import Link from "next/link";
import { AgeModeSwitcher } from "@/components/layout/AgeModeSwitcher";

const navCards = [
  {
    href: "/stories",
    title: "Read a Story",
    description:
      "Browse 39 stories from Keith's life — from growing up in Mississippi to leading national organizations.",
    icon: "📖",
  },
  {
    href: "/themes",
    title: "Explore by Topic",
    description:
      "Discover the principles and values that shaped Keith's decisions — integrity, work ethic, leadership, and more.",
    icon: "💡",
  },
  {
    href: "/ask",
    title: "Ask a Question",
    description:
      "Have a conversation guided by Keith's stories. Ask about life, career, decisions, or family.",
    icon: "💬",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
      {/* Intro */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-3">
          The Keith Cobb
          <br />
          Story Library
        </h1>
        <p className="text-stone-500 text-sm md:text-base max-w-md mx-auto">
          A collection of stories, lessons, and values from a life well lived —
          preserved for the family.
        </p>
      </div>

      {/* Age mode selector (desktop — also in header on mobile) */}
      <div className="hidden md:flex justify-center mb-10">
        <AgeModeSwitcher />
      </div>

      {/* Navigation cards */}
      <div className="space-y-4">
        {navCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block bg-white rounded-xl border border-stone-200 p-5 hover:border-amber-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-0.5">{card.icon}</span>
              <div>
                <h2 className="text-lg font-semibold text-stone-800 group-hover:text-amber-700 transition-colors">
                  {card.title}
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                  {card.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
