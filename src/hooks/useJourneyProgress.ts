"use client";

import { useCallback, useEffect, useState } from "react";

const storageKey = (slug: string) => `journey_progress_${slug}`;

export interface JourneyProgress {
  visitedSteps: number[];
  completed: boolean;
}

export function readJourneyProgressClient(slug: string): JourneyProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const p = JSON.parse(raw) as JourneyProgress;
    if (!Array.isArray(p.visitedSteps)) return null;
    return {
      visitedSteps: p.visitedSteps,
      completed: Boolean(p.completed),
    };
  } catch {
    return null;
  }
}

export function writeJourneyProgressClient(slug: string, p: JourneyProgress) {
  localStorage.setItem(storageKey(slug), JSON.stringify(p));
}

export function furthestVisitedStep(progress: JourneyProgress | null): number {
  if (!progress || progress.visitedSteps.length === 0) return 0;
  return Math.max(...progress.visitedSteps);
}

/** Next step to read (1-based). After visiting step 3, returns 4. */
export function nextStepToContinue(
  progress: JourneyProgress | null,
  totalSteps: number
): number | null {
  if (!progress || progress.completed) return null;
  const furthest = furthestVisitedStep(progress);
  const next = furthest + 1;
  if (next > totalSteps) return null;
  return next;
}

export function useJourneyProgress(slug: string | null) {
  const [progress, setProgress] = useState<JourneyProgress | null>(null);

  useEffect(() => {
    if (!slug) return;
    setProgress(readJourneyProgressClient(slug));
  }, [slug]);

  const recordVisit = useCallback((s: string, step: number) => {
    const prev = readJourneyProgressClient(s) || {
      visitedSteps: [],
      completed: false,
    };
    const visited = [...new Set([...prev.visitedSteps, step])].sort(
      (a, b) => a - b
    );
    const next: JourneyProgress = {
      visitedSteps: visited,
      completed: prev.completed,
    };
    writeJourneyProgressClient(s, next);
    setProgress(next);
  }, []);

  const markComplete = useCallback((s: string) => {
    const prev = readJourneyProgressClient(s) || {
      visitedSteps: [],
      completed: false,
    };
    const next: JourneyProgress = { ...prev, completed: true };
    writeJourneyProgressClient(s, next);
    setProgress(next);
  }, []);

  return { progress, recordVisit, markComplete };
}
