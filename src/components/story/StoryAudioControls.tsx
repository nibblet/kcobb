"use client";

import { NarrationControls } from "@/components/audio/NarrationControls";

export function StoryAudioControls({
  storyId,
  title,
  fullText,
  wordCount,
}: {
  storyId: string;
  title: string;
  fullText: string;
  wordCount: number;
}) {
  return (
    <NarrationControls
      playbackKey={storyId}
      title={title}
      fullText={fullText}
      wordCount={wordCount}
      audioEndpoint={`/api/stories/${encodeURIComponent(storyId)}/audio`}
    />
  );
}
