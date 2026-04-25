"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TellOverlay } from "./TellOverlay";
import { usePageContext } from "@/components/layout/PageContextProvider";

export type TellAboutType = "story" | "journey" | "principle" | "person";

export interface TellAboutContext {
  type: TellAboutType;
  slug: string;
  title: string;
}

export interface TellOverlayOpenOptions {
  about?: TellAboutContext | null;
}

interface TellOverlayStore {
  open: (options?: TellOverlayOpenOptions) => void;
  close: () => void;
  isOpen: boolean;
}

const Ctx = createContext<TellOverlayStore | null>(null);

export function TellOverlayProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<{
    about: TellAboutContext | null;
    key: number;
  }>({ about: null, key: 0 });
  const pageContext = usePageContext();
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = useCallback(
    (options?: TellOverlayOpenOptions) => {
      triggerRef.current = document.activeElement as HTMLElement | null;
      const resolvedAbout =
        options?.about !== undefined
          ? options.about
          : pageContext
            ? ({
                type: pageContext.type as TellAboutType,
                slug: pageContext.slug,
                title: pageContext.title,
              } satisfies TellAboutContext)
            : null;
      setSnapshot((prev) => ({
        about: resolvedAbout,
        key: prev.key + 1,
      }));
      setIsOpen(true);
    },
    [pageContext],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    if (triggerRef.current && typeof triggerRef.current.focus === "function") {
      triggerRef.current.focus();
    }
  }, []);

  const value = useMemo<TellOverlayStore>(
    () => ({ open, close, isOpen }),
    [open, close, isOpen],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <TellOverlay
        key={snapshot.key}
        open={isOpen}
        about={snapshot.about}
        onClose={close}
      />
    </Ctx.Provider>
  );
}

export function useTellOverlay(): TellOverlayStore {
  const store = useContext(Ctx);
  if (!store) {
    throw new Error("useTellOverlay must be used within TellOverlayProvider");
  }
  return store;
}
