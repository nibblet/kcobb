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

type PlaybackState = "idle" | "loading" | "playing" | "paused" | "ended";
type AudioMode = "elevenlabs" | "web-speech";

interface StoryAudioControlsProps {
  storyId: string;
  title: string;
  fullText: string;
  wordCount: number;
}

export function StoryAudioControls({
  storyId,
  title,
  fullText,
  wordCount,
}: StoryAudioControlsProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [mode, setMode] = useState<AudioMode>("elevenlabs");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const autoPlayRequestedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const statusId = useId();

  const hasSpeechSupport = useSyncExternalStore(
    () => () => {},
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => false
  );

  const listenLabel = useMemo(
    () => formatEstimatedListenLabel(wordCount),
    [wordCount]
  );

  const fallbackToWebSpeech = useCallback(() => {
    setMode("web-speech");
    setAudioUrl(null);
  }, []);

  // Cleanup on unmount / storyId change.
  useEffect(() => {
    const audioEl = audioRef.current;
    return () => {
      if (audioEl) {
        audioEl.pause();
        audioEl.src = "";
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [storyId]);

  // Auto-play when a fresh URL is available and playback was requested.
  useEffect(() => {
    if (!autoPlayRequestedRef.current || !audioUrl) return;
    const el = audioRef.current;
    if (!el) return;
    autoPlayRequestedRef.current = false;
    el.play().catch(() => setPlaybackState("idle"));
  }, [audioUrl]);

  const isLoading = playbackState === "loading";
  const isPlaying = playbackState === "playing";
  const isPaused = playbackState === "paused";
  const canStop = isPlaying || isPaused;
  const isUnsupported = mode === "web-speech" && !hasSpeechSupport;

  function buildNarrationText() {
    const cleanBody = fullText.replace(/\s+/g, " ").trim();
    return `${title}. ${cleanBody}`;
  }

  function attachUtteranceLifecycle(utterance: SpeechSynthesisUtterance) {
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
  }

  function playWebSpeech() {
    if (!hasSpeechSupport) return;
    const narration = buildNarrationText();
    if (!narration) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(narration);
    utteranceRef.current = utterance;
    attachUtteranceLifecycle(utterance);
    window.speechSynthesis.speak(utterance);
  }

  async function playElevenLabs() {
    // If we already have a URL, just play it.
    if (audioUrl && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      } catch {
        setPlaybackState("idle");
      }
      return;
    }

    setPlaybackState("loading");
    try {
      const res = await fetch(`/api/stories/${encodeURIComponent(storyId)}/audio`);
      if (res.status === 501 || res.status === 403 || res.status === 404) {
        // Provider not configured or story not eligible → silent fallback.
        fallbackToWebSpeech();
        setPlaybackState("idle");
        // Attempt Web Speech immediately so the click still produces audio.
        if (hasSpeechSupport) {
          playWebSpeech();
        }
        return;
      }
      if (!res.ok) {
        setPlaybackState("idle");
        if (hasSpeechSupport) {
          fallbackToWebSpeech();
          playWebSpeech();
        }
        return;
      }
      const data = (await res.json()) as { audioUrl?: string };
      if (!data.audioUrl) {
        setPlaybackState("idle");
        return;
      }
      // Triggering playback inline races React's commit — the <audio> element
      // may not exist yet. Set a ref flag; a useEffect invokes play() once the
      // element is mounted with the new src.
      autoPlayRequestedRef.current = true;
      setAudioUrl(data.audioUrl);
    } catch {
      setPlaybackState("idle");
      if (hasSpeechSupport) {
        fallbackToWebSpeech();
        playWebSpeech();
      }
    }
  }

  function handleListen() {
    if (mode === "web-speech") {
      playWebSpeech();
      return;
    }
    void playElevenLabs();
  }

  function handlePauseResume() {
    if (mode === "elevenlabs" && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else if (isPaused) {
        audioRef.current.play().catch(() => setPlaybackState("idle"));
      }
      return;
    }
    if (!hasSpeechSupport) return;
    if (isPlaying) {
      window.speechSynthesis.pause();
    } else if (isPaused) {
      window.speechSynthesis.resume();
    }
  }

  function handleStop() {
    if (mode === "elevenlabs" && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaybackState("idle");
      return;
    }
    if (!hasSpeechSupport) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setPlaybackState("idle");
  }

  function getStatusMessage() {
    if (isLoading) return "Preparing audio…";
    switch (playbackState) {
      case "playing":
        return "Playing narration";
      case "paused":
        return "Narration paused";
      case "ended":
        return "Narration finished";
      default:
        if (mode === "web-speech" && !hasSpeechSupport) {
          return "Listening isn't available in this browser.";
        }
        return "Ready to listen";
    }
  }

  const playDisabled =
    isLoading || (mode === "web-speech" && !hasSpeechSupport);

  return (
    <section className="mb-6 rounded-xl border border-clay-border bg-ocean-pale/55 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="type-meta mb-1 text-ocean">Listen To This Story</p>
          <p className="type-ui text-ink">{listenLabel}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleListen}
            disabled={playDisabled}
            className="rounded-lg bg-ocean px-4 py-2 text-sm font-medium text-warm-white transition-colors hover:bg-[#3f6e8a] disabled:cursor-not-allowed disabled:bg-ink-ghost"
          >
            {isLoading
              ? "Preparing…"
              : isPlaying || isPaused
                ? "Play Again"
                : "Click Here to Listen"}
          </button>
          <button
            type="button"
            onClick={handlePauseResume}
            disabled={isUnsupported || (!isPlaying && !isPaused)}
            className="rounded-lg border border-[var(--color-border-strong)] bg-warm-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-clay-border disabled:cursor-not-allowed disabled:text-ink-ghost"
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={handleStop}
            disabled={isUnsupported || !canStop}
            className="rounded-lg border border-[var(--color-border-strong)] bg-warm-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-clay-border disabled:cursor-not-allowed disabled:text-ink-ghost"
          >
            Stop
          </button>
        </div>
      </div>

      <p
        id={statusId}
        aria-live="polite"
        className="mt-3 font-[family-name:var(--font-lora)] text-sm text-ink-muted"
      >
        {getStatusMessage()}
      </p>

      {mode === "elevenlabs" && audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="none"
          onPlay={() => setPlaybackState("playing")}
          onPause={() => {
            if (audioRef.current && audioRef.current.ended) return;
            setPlaybackState("paused");
          }}
          onEnded={() => setPlaybackState("ended")}
          onError={() => {
            setPlaybackState("idle");
            if (hasSpeechSupport) {
              fallbackToWebSpeech();
            }
          }}
          className="sr-only"
        />
      )}
    </section>
  );
}
