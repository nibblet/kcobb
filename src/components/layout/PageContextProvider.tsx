"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type PageContextType = "story" | "journey" | "principle" | "person";

export interface PageContextValue {
  type: PageContextType;
  slug: string;
  title: string;
}

interface PageContextStore {
  current: PageContextValue | null;
  setContext: (value: PageContextValue | null) => void;
}

const Ctx = createContext<PageContextStore | null>(null);

export function PageContextProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<PageContextValue | null>(null);
  const value = useMemo<PageContextStore>(
    () => ({ current, setContext: setCurrent }),
    [current],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePageContext(): PageContextValue | null {
  const store = useContext(Ctx);
  return store?.current ?? null;
}

export function usePageContextStore(): PageContextStore {
  const store = useContext(Ctx);
  if (!store) {
    throw new Error("usePageContextStore must be used within PageContextProvider");
  }
  return store;
}
