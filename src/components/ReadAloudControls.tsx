"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { formatEstimatedListenLabel } from "@/lib/story-audio";

type PlaybackState = "idle" | "playing" | "paused" | "ended";

interface ReadAloudControlsProps {
  title: string;
  text: string;
}

function stripMarkdown(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function ReadAloudControls({ title, text }: ReadAloudControlsProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const statusId = useId();

  const hasSpeechSupport = useSyncExternalStore(
    () => () => {},
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => false
  );

  const narration = useMemo(() => {
    const body = stripMarkdown(text);
    if (!body) return "";
    return title ? `${title}. ${body}` : body;
  }, [title, text]);

  const wordCount = useMemo(() => {
    if (!narration) return 0;
    return narration.split(/\s+/).length;
  }, [narration]);

  const listenLabel = useMemo(
    () => formatEstimatedListenLabel(wordCount),
    [wordCount]
  );

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const isPlaying = playbackState === "playing";
  const isPaused = playbackState === "paused";
  const canStop = isPlaying || isPaused;

  const play = useCallback(() => {
    if (!hasSpeechSupport || !narration) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(narration);
    utterance.onstart = () => setPlaybackState("playing");
    utterance.onpause = () => setPlaybackState("paused");
    utterance.onresume = () => setPlaybackState("playing");
    utterance.onend = () => {
      utteranceRef.current = null;
      setPlaybackState("ended");
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setPlaybackState("idle");
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [narration, hasSpeechSupport]);

  function handlePauseResume() {
    if (!hasSpeechSupport) return;
    if (isPlaying) {
      window.speechSynthesis.pause();
    } else if (isPaused) {
      window.speechSynthesis.resume();
    }
  }

  function handleStop() {
    if (!hasSpeechSupport) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setPlaybackState("idle");
  }

  function handlePrimary() {
    if (isPlaying || isPaused) {
      handlePauseResume();
      return;
    }
    play();
  }

  function getPrimaryLabel() {
    if (isPlaying) return "⏸ Pause";
    if (isPaused) return "▶ Resume";
    if (playbackState === "ended") return "▶ Play again";
    return `▶ Listen · ${listenLabel}`;
  }

  function getPrimaryAriaLabel() {
    if (isPlaying) return "Pause narration";
    if (isPaused) return "Resume narration";
    if (playbackState === "ended") return "Play narration again";
    return `Play narration, ${listenLabel}`;
  }

  function getStatusMessage() {
    switch (playbackState) {
      case "playing":
        return "Playing narration";
      case "paused":
        return "Narration paused";
      case "ended":
        return "Narration finished";
      default:
        return hasSpeechSupport
          ? "Ready to listen"
          : "Listening isn't available in this browser.";
    }
  }

  if (!hasSpeechSupport) {
    return (
      <section className="mb-5">
        <button
          type="button"
          disabled
          className="type-ui cursor-not-allowed text-ink-ghost"
        >
          Listening unavailable in this browser
        </button>
        <p id={statusId} aria-live="polite" className="sr-only">
          {getStatusMessage()}
        </p>
      </section>
    );
  }

  return (
    <section className="mb-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlePrimary}
          aria-label={getPrimaryAriaLabel()}
          className="inline-flex items-center rounded-full bg-ocean px-4 py-2 text-sm font-medium text-warm-white transition-colors hover:bg-[#3f6e8a]"
        >
          {getPrimaryLabel()}
        </button>
        {canStop && (
          <button
            type="button"
            onClick={handleStop}
            aria-label="Stop narration"
            className="type-ui text-ink-ghost underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Stop
          </button>
        )}
      </div>
      <p id={statusId} aria-live="polite" className="sr-only">
        {getStatusMessage()}
      </p>
    </section>
  );
}
