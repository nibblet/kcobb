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
  primary?: WhatsNextPrimary;
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
  const next = relatedStories[0];

  const pills: WhatsNextPillData[] = [
    { label: "Share a memory", action: "tell" },
  ];

  if (firstPrincipleSlug) {
    pills.push({
      label: firstPrincipleTitle
        ? `Read about: ${firstPrincipleTitle}`
        : "Read about a principle",
      href: `/principles/${encodeURIComponent(firstPrincipleSlug)}`,
    });
  }

  if (next) {
    pills.push({
      label: `Read next: ${next.title}`,
      href: `/stories/${next.storyId}`,
    });
  } else {
    pills.push({ label: "Browse stories", href: "/stories" });
  }

  return {
    pills,
    askContext: { type: "story", slug: storyId, title },
  };
}

interface BuildJourneyCompleteArgs {
  slug: string;
  title: string;
  firstPrincipleSlug?: string | null;
  firstPrincipleTitle?: string | null;
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

export function getJourneyCompleteWhatsNext({
  slug,
  title,
  firstPrincipleSlug,
  firstPrincipleTitle,
}: BuildJourneyCompleteArgs): WhatsNextData {
  const pills: WhatsNextPillData[] = [
    { label: "Share a memory", action: "tell" },
  ];

  if (firstPrincipleSlug) {
    pills.push({
      label: firstPrincipleTitle
        ? `Read about: ${firstPrincipleTitle}`
        : "Read about a principle",
      href: `/principles/${encodeURIComponent(firstPrincipleSlug)}`,
    });
  }

  pills.push({ label: "Explore another journey", href: "/journeys" });

  return {
    pills,
    askContext: { type: "journey", slug, title },
  };
}
