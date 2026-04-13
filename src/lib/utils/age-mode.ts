import type { AgeMode } from "@/types";

export function ageModeFromAge(age: number | null): AgeMode {
  if (age === null) return "adult";
  if (age <= 10) return "young_reader";
  if (age <= 17) return "teen";
  return "adult";
}

export function ageModeLabel(mode: AgeMode): string {
  switch (mode) {
    case "young_reader":
      return "Young Reader";
    case "teen":
      return "Teen";
    case "adult":
      return "Adult";
  }
}
