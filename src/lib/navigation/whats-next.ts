import type { AskChatContextType } from "@/components/ask/AskChat";

export interface WhatsNextPrimary {
  href: string;
  label: string;
  title: string;
  blurb?: string;
}

export interface WhatsNextPillData {
  label: string;
  /** Either link or the "open Ask overlay" action on the client. */
  href?: string;
  action?: "ask" | "none";
}

export interface WhatsNextData {
  primary: WhatsNextPrimary;
  pills: WhatsNextPillData[];
  askContext: { type: AskChatContextType; slug: string; title: string };
}

interface StoryLike {
  storyId: string;
  title: string;
  summary?: string | null;
}

interface BuildStoryArgs {
  storyId: string;
  title: string;
  relatedStories: StoryLike[];
}

export function getStoryWhatsNext({
  storyId,
  title,
  relatedStories,
}: BuildStoryArgs): WhatsNextData {
  const first = relatedStories[0];
  const primary: WhatsNextPrimary = first
    ? {
        href: `/stories/${first.storyId}`,
        label: "Read next",
        title: first.title,
        blurb: first.summary ?? undefined,
      }
    : {
        href: "/stories",
        label: "Browse",
        title: "More stories",
        blurb: "Return to the full library.",
      };
  return {
    primary,
    pills: [
      {
        label: "Share a memory",
        href: `/tell?about=story:${encodeURIComponent(storyId)}`,
      },
      { label: "Ask about this story", action: "ask" },
      { label: "Back to Stories", href: "/stories" },
    ],
    askContext: { type: "story", slug: storyId, title },
  };
}

interface BuildPrincipleArgs {
  slug: string;
  title: string;
  backingStories: StoryLike[];
}

export function getPrincipleWhatsNext({
  slug,
  title,
  backingStories,
}: BuildPrincipleArgs): WhatsNextData {
  const first = backingStories[0];
  const primary: WhatsNextPrimary = first
    ? {
        href: `/stories/${first.storyId}`,
        label: "Story that shows this",
        title: first.title,
        blurb: first.summary ?? undefined,
      }
    : {
        href: "/principles",
        label: "Browse",
        title: "More principles",
        blurb: "See the full set.",
      };
  return {
    primary,
    pills: [
      {
        label: "Share a memory",
        href: `/tell?about=principle:${encodeURIComponent(slug)}`,
      },
      { label: "Ask about this principle", action: "ask" },
      { label: "More principles", href: "/principles" },
    ],
    askContext: { type: "principle", slug, title },
  };
}

interface BuildPersonArgs {
  slug: string;
  title: string;
  featuredStory: StoryLike | null;
}

export function getPersonWhatsNext({
  slug,
  title,
  featuredStory,
}: BuildPersonArgs): WhatsNextData {
  const primary: WhatsNextPrimary = featuredStory
    ? {
        href: `/stories/${featuredStory.storyId}`,
        label: `A story featuring ${title}`,
        title: featuredStory.title,
        blurb: featuredStory.summary ?? undefined,
      }
    : {
        href: "/people",
        label: "Browse",
        title: "More people",
        blurb: "Return to the people index.",
      };
  return {
    primary,
    pills: [
      {
        label: `Share a memory of ${title}`,
        href: `/tell?about=person:${encodeURIComponent(slug)}`,
      },
      { label: `Ask about ${title}`, action: "ask" },
      { label: "Browse people", href: "/people" },
    ],
    askContext: { type: "person", slug, title },
  };
}

interface BuildJourneyCompleteArgs {
  slug: string;
  title: string;
}

export function getJourneyCompleteWhatsNext({
  slug,
  title,
}: BuildJourneyCompleteArgs): WhatsNextData {
  return {
    primary: {
      href: "/journeys",
      label: "Explore another journey",
      title: "All journeys",
      blurb: "Pick the next path through Keith's stories.",
    },
    pills: [
      {
        label: "Share a memory",
        href: `/tell?about=journey:${encodeURIComponent(slug)}`,
      },
      { label: "Ask about these themes", action: "ask" },
      { label: "Browse all stories", href: "/stories" },
    ],
    askContext: { type: "journey", slug, title },
  };
}
