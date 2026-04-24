import type { AskChatContextType } from "@/components/ask/AskChat";

export interface WhatsNextPrimary {
  href: string;
  label: string;
  title: string;
  blurb?: string;
}

export interface WhatsNextPillData {
  label: string;
  /** Either a link or a client-side action. */
  href?: string;
  action?: "ask" | "tell" | "none";
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
  firstPrincipleSlug?: string | null;
  firstPrincipleTitle?: string | null;
}

export function getStoryWhatsNext({
  storyId,
  title,
  relatedStories,
  firstPrincipleSlug,
  firstPrincipleTitle,
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

  const pills: WhatsNextPillData[] = [
    { label: "Share a memory", action: "tell" },
    { label: "Ask about this story", action: "ask" },
  ];

  if (firstPrincipleSlug) {
    pills.push({
      label: firstPrincipleTitle
        ? `See principle: ${firstPrincipleTitle}`
        : "See a related principle",
      href: `/principles/${encodeURIComponent(firstPrincipleSlug)}`,
    });
  }

  return {
    primary,
    pills,
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
      { label: "Share a memory", action: "tell" },
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
      { label: `Share a memory of ${title}`, action: "tell" },
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
      { label: "Share a memory", action: "tell" },
      { label: "Ask about these themes", action: "ask" },
      { label: "Browse all stories", href: "/stories" },
    ],
    askContext: { type: "journey", slug, title },
  };
}
