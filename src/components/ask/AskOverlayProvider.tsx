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
import { AskOverlay } from "./AskOverlay";
import { usePageContext } from "@/components/layout/PageContextProvider";
import type {
  AskChatContextType,
  AskChatInitialContext,
} from "./AskChat";

export interface AskOverlayOpenOptions {
  context?: AskChatInitialContext | null;
  prompt?: string;
}

interface AskOverlayStore {
  open: (options?: AskOverlayOpenOptions) => void;
  close: () => void;
  isOpen: boolean;
}

const Ctx = createContext<AskOverlayStore | null>(null);

export function AskOverlayProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<{
    context: AskChatInitialContext | null;
    prompt?: string;
    key: number;
  }>({ context: null, key: 0 });
  const pageContext = usePageContext();
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = useCallback(
    (options?: AskOverlayOpenOptions) => {
      triggerRef.current = document.activeElement as HTMLElement | null;
      const resolvedContext =
        options?.context !== undefined
          ? options.context
          : pageContext
            ? ({
                type: pageContext.type as AskChatContextType,
                slug: pageContext.slug,
                title: pageContext.title,
              } satisfies AskChatInitialContext)
            : null;
      setSnapshot((prev) => ({
        context: resolvedContext,
        prompt: options?.prompt,
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

  const value = useMemo<AskOverlayStore>(
    () => ({ open, close, isOpen }),
    [open, close, isOpen],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <AskOverlay
        key={snapshot.key}
        open={isOpen}
        context={snapshot.context}
        initialPrompt={snapshot.prompt}
        onClose={close}
      />
    </Ctx.Provider>
  );
}

export function useAskOverlay(): AskOverlayStore {
  const store = useContext(Ctx);
  if (!store) {
    throw new Error("useAskOverlay must be used within AskOverlayProvider");
  }
  return store;
}
