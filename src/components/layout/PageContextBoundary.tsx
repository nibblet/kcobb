"use client";

import { useEffect } from "react";
import {
  usePageContextStore,
  type PageContextType,
} from "./PageContextProvider";

interface PageContextBoundaryProps {
  type: PageContextType;
  slug: string;
  title: string;
}

export function PageContextBoundary({
  type,
  slug,
  title,
}: PageContextBoundaryProps) {
  const { setContext } = usePageContextStore();
  useEffect(() => {
    setContext({ type, slug, title });
    return () => setContext(null);
  }, [type, slug, title, setContext]);
  return null;
}
