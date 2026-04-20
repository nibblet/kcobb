"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ThemeMode } from "@/types";
import {
  resolveThemeMode,
  type ThemeResolvedMode,
} from "@/lib/utils/theme-mode";
import { createClient } from "@/lib/supabase/client";

const THEME_MODE_STORAGE_KEY = "kcobb_theme_mode";

function isValidThemeMode(v: string | null): v is ThemeMode {
  return v === "light" || v === "dark" || v === "auto";
}

function getSystemThemeMode(): ThemeResolvedMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

interface ThemeModeContextValue {
  themeMode: ThemeMode;
  resolvedThemeMode: ThemeResolvedMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  themeMode: "auto",
  resolvedThemeMode: "light",
  setThemeMode: () => {},
});

export function ThemeModeProvider({
  initialMode,
  children,
}: {
  initialMode: ThemeMode;
  children: ReactNode;
}) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialMode);
  const [systemMode, setSystemMode] = useState<ThemeResolvedMode>("light");

  useEffect(() => {
    setSystemMode(getSystemThemeMode());
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemMode(mql.matches ? "dark" : "light");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) return;
      const raw = localStorage.getItem(THEME_MODE_STORAGE_KEY);
      if (isValidThemeMode(raw)) setThemeModeState(raw);
    });
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("sb_profiles")
        .update({ theme_mode: mode, updated_at: new Date().toISOString() })
        .eq("id", user.id);
    } else {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    }
  }, []);

  const resolvedThemeMode = useMemo(
    () => resolveThemeMode(themeMode, systemMode),
    [themeMode, systemMode]
  );

  return (
    <ThemeModeContext.Provider
      value={{ themeMode, resolvedThemeMode, setThemeMode }}
    >
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
