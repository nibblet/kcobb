"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/stories", label: "Stories", icon: "📖" },
  { href: "/themes", label: "Themes", icon: "💡" },
  { href: "/timeline", label: "Timeline", icon: "📅" },
  { href: "/ask", label: "Ask", icon: "💬" },
];

export function Nav() {
  const pathname = usePathname();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      {/* Desktop nav - top */}
      <nav className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-stone-200">
        <Link href="/" className="font-serif text-lg font-bold text-stone-800">
          Keith Cobb Storybook
        </Link>
        <div className="flex items-center gap-6">
          {navItems.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "text-amber-700"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Mobile nav - bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                pathname === item.href
                  ? "text-amber-700"
                  : "text-stone-400"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
