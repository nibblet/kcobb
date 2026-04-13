import { AgeModeSwitcher } from "./AgeModeSwitcher";

export function Header() {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-stone-200">
      <h1 className="font-serif text-lg font-bold text-stone-800">
        Keith Cobb
      </h1>
      <AgeModeSwitcher />
    </header>
  );
}
