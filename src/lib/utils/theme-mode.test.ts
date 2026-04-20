import test from "node:test";
import assert from "node:assert/strict";
import {
  THEME_MODE_SEQUENCE,
  nextThemeMode,
  resolveThemeMode,
  themeModeLabel,
  type ThemeResolvedMode,
} from "@/lib/utils/theme-mode";
import type { ThemeMode } from "@/types";

test("themeModeLabel returns friendly labels", () => {
  assert.equal(themeModeLabel("light"), "Day");
  assert.equal(themeModeLabel("dark"), "Night");
  assert.equal(themeModeLabel("auto"), "Auto");
});

test("nextThemeMode cycles through all modes", () => {
  const start: ThemeMode = "light";
  const first = nextThemeMode(start);
  const second = nextThemeMode(first);
  const third = nextThemeMode(second);

  assert.deepEqual(THEME_MODE_SEQUENCE, ["light", "dark", "auto"]);
  assert.equal(first, "dark");
  assert.equal(second, "auto");
  assert.equal(third, "light");
});

test("resolveThemeMode returns explicit selection for light and dark", () => {
  const darkSystem: ThemeResolvedMode = "dark";
  const lightSystem: ThemeResolvedMode = "light";
  assert.equal(resolveThemeMode("light", darkSystem), "light");
  assert.equal(resolveThemeMode("dark", lightSystem), "dark");
});

test("resolveThemeMode maps auto to current system preference", () => {
  assert.equal(resolveThemeMode("auto", "light"), "light");
  assert.equal(resolveThemeMode("auto", "dark"), "dark");
});
