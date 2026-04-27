import type { Metadata } from "next";
import { TimelineView } from "@/components/timeline/TimelineView";

export const metadata: Metadata = {
  title: "Life Timeline — Keith Cobb Storybook",
  description:
    "A chronological view of key moments from Keith Cobb's life and career — decades, stories, and context.",
};

export default function StorybookTimelinePage() {
  return <TimelineView />;
}
