import type { WikiTimelineEvent } from "./parser";

/**
 * Key-date feature for the homepage.
 *
 * Two-layered display:
 *   - Always-on "typewriter" dateline under the hero subtitle.
 *   - Wax-seal medallion overlay for Tier-1 family events (birthdays / wedding anniversary).
 *
 * Selection priority for `selectFeature()`:
 *   1. Any exact (month + day) match today → promote top-tier entry to the seal + caption.
 *   2. Any exact entry within ±7 days → "Tomorrow" / "Yesterday" / "This week" caption.
 *   3. Year-only timeline events, rotated deterministically by day-of-year.
 *   4. Hard fallback (app tagline).
 */

export type KeyDateKind =
  | "birthday"
  | "anniversary"
  | "engagement"
  | "career";

export type KeyDateTier = 1 | 2;

export interface KeyDate {
  kind: KeyDateKind;
  tier: KeyDateTier;
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
  year: number;
  /** Person or couple the event is about, e.g. "Paul", "Keith and Dot". */
  subject: string;
  /** Verb phrase, e.g. "was born", "were married", "joined Peat Marwick". */
  verb: string;
  /** Location noun phrase, e.g. "St. Dominic Hospital, Jackson". */
  place?: string;
  /** Optional memoir/interview story ID. */
  storyRef?: string;
}

/**
 * Exact-day events mined from the memoir (P1_S34, P1_S35, P1_S39, P1_S18, P1_S25, P1_S12).
 * Year-only events live in content/wiki/timeline/career-timeline.md and are loaded separately.
 */
export const EXACT_DATES: readonly KeyDate[] = [
  {
    kind: "birthday",
    tier: 1,
    month: 3,
    day: 2,
    year: 1941,
    subject: "Keith",
    verb: "was born",
    place: "Calhoun City, Mississippi",
    storyRef: "P1_S01",
  },
  {
    kind: "birthday",
    tier: 1,
    month: 8,
    day: 16,
    year: 1943,
    subject: "Dot",
    verb: "was born",
    storyRef: "P1_S12",
  },
  {
    kind: "birthday",
    tier: 1,
    month: 5,
    day: 1,
    year: 1968,
    subject: "Paul",
    verb: "was born",
    place: "St. Dominic Hospital, Jackson",
    storyRef: "P1_S34",
  },
  {
    kind: "birthday",
    tier: 1,
    month: 10,
    day: 29,
    year: 1971,
    subject: "John",
    verb: "was born",
    place: "Orange Memorial Hospital, Orlando",
    storyRef: "P1_S34",
  },
  {
    kind: "birthday",
    tier: 1,
    month: 4,
    day: 11,
    year: 1977,
    subject: "Mark",
    verb: "was born",
    place: "Holy Cross Hospital, Fort Lauderdale",
    storyRef: "P1_S34",
  },
  {
    kind: "birthday",
    tier: 1,
    month: 1,
    day: 24,
    year: 1995,
    subject: "Miranda",
    verb: "was born",
    storyRef: "P1_S35",
  },
  {
    kind: "birthday",
    tier: 1,
    month: 5,
    day: 18,
    year: 1998,
    subject: "Jordan",
    verb: "was born",
    storyRef: "P1_S35",
  },
  {
    kind: "birthday",
    tier: 1,
    month: 1,
    day: 27,
    year: 2007,
    subject: "Avery",
    verb: "was born",
    place: "Chicago",
    storyRef: "P1_S35",
  },
  {
    kind: "birthday",
    tier: 1,
    month: 9,
    day: 22,
    year: 2008,
    subject: "Allison",
    verb: "was born",
    storyRef: "P1_S35",
  },
  {
    kind: "birthday",
    tier: 1,
    month: 3,
    day: 15,
    year: 2012,
    subject: "Ethan Keith",
    verb: "was born",
    storyRef: "P1_S35",
  },
  {
    kind: "anniversary",
    tier: 1,
    month: 6,
    day: 15,
    year: 1963,
    subject: "Keith and Dot",
    verb: "were married",
    place: "First Baptist Church",
    storyRef: "P1_S39",
  },
  {
    kind: "engagement",
    tier: 2,
    month: 9,
    day: 15,
    year: 1962,
    subject: "Keith and Dot",
    verb: "became engaged",
    storyRef: "P1_S12",
  },
  {
    kind: "career",
    tier: 2,
    month: 7,
    day: 1,
    year: 1963,
    subject: "Keith",
    verb: "joined Peat Marwick",
    place: "Jackson, Mississippi",
    storyRef: "P1_S18",
  },
  {
    kind: "career",
    tier: 2,
    month: 4,
    day: 1,
    year: 1995,
    subject: "Keith",
    verb: "became CEO of Alamo Rent A Car",
    place: "Fort Lauderdale",
    storyRef: "P1_S25",
  },
];

// ---------- Output shapes ----------

export interface SealData {
  /** Text that runs around the top arc of the seal, e.g. "KEITH AND DOT". */
  subjectLabel: string;
  /** Big stamped number in the middle of the seal, e.g. "63". */
  centerNumber: string;
  /** Italic small label under the number, e.g. "years". */
  centerLabel: string;
  /** Small date line across the bottom of the seal, e.g. "JUN 15 · 1963". */
  dateLabel: string;
  /** Localized full-date label used for accessibility, e.g. "June 15, 1963". */
  accessibleDate: string;
}

export interface DatelineData {
  /** Short uppercase tag rendered in gold, e.g. "TODAY", "TOMORROW", "IN 1971". */
  prefix: string;
  /** Body copy that gets typed out character-by-character. */
  text: string;
  /** Optional memoir story reference so we can link the dateline later. */
  storyRef?: string;
}

export interface HomeTodayFeature {
  seal?: SealData;
  dateline: DatelineData;
}

// ---------- Helpers ----------

const MONTH_ABBR = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const MONTH_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function sealFor(entry: KeyDate, years: number): SealData {
  return {
    subjectLabel: entry.subject.toUpperCase(),
    centerNumber: String(years),
    centerLabel: "years",
    dateLabel: `${MONTH_ABBR[entry.month - 1]} ${entry.day} · ${entry.year}`,
    accessibleDate: `${MONTH_FULL[entry.month - 1]} ${entry.day}, ${entry.year}`,
  };
}

function exactDayCaption(entry: KeyDate, years: number): DatelineData {
  const at = entry.place ? ` at ${entry.place}` : "";
  let text: string;
  switch (entry.kind) {
    case "birthday":
      text = `${years} years ago, ${entry.subject} ${entry.verb}${at}.`;
      break;
    case "anniversary":
      text = `${years} years ago, ${entry.subject} ${entry.verb}${at}.`;
      break;
    case "engagement":
      text = `${years} years ago, ${entry.subject} ${entry.verb}.`;
      break;
    case "career":
      text = `${years} years ago, ${entry.subject} ${entry.verb}${at}.`;
      break;
  }
  return { prefix: "TODAY", text, storyRef: entry.storyRef };
}

function labelFor(entry: KeyDate, upcomingYears: number): string {
  switch (entry.kind) {
    case "birthday":
      return `${entry.subject}'s ${ordinal(upcomingYears)} birthday`;
    case "anniversary":
      return `${entry.subject}'s ${ordinal(upcomingYears)} anniversary`;
    case "engagement":
      return `${entry.subject}'s engagement anniversary`;
    case "career":
      return `${entry.subject} ${entry.verb}`;
  }
}

function soonCaption(
  entry: KeyDate,
  diffDays: number,
  targetYear: number,
): DatelineData {
  const upcomingYears = targetYear - entry.year;
  const label = labelFor(entry, upcomingYears);

  if (diffDays > 0) {
    if (diffDays === 1) {
      return {
        prefix: "TOMORROW",
        text: `${label}.`,
        storyRef: entry.storyRef,
      };
    }
    return {
      prefix: "THIS WEEK",
      text: `in ${diffDays} days, ${label}.`,
      storyRef: entry.storyRef,
    };
  }
  const n = -diffDays;
  if (n === 1) {
    return {
      prefix: "YESTERDAY",
      text: `was ${label}.`,
      storyRef: entry.storyRef,
    };
  }
  return {
    prefix: "THIS WEEK",
    text: `${n} days ago, ${label}.`,
    storyRef: entry.storyRef,
  };
}

function yearEventCaption(evt: WikiTimelineEvent): DatelineData {
  const loc = evt.location ? `, ${evt.location}` : "";
  const event = evt.event.trim().replace(/\.+$/, "");
  return {
    prefix: `IN ${evt.year}`,
    text: `${event}${loc}.`,
    storyRef: evt.storyRef,
  };
}

/** Zero-based day-of-year (Jan 1 → 0). */
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const utcMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((utcMidnight.getTime() - start.getTime()) / 86400000);
}

/**
 * Pure selector — takes today's date, the hard-coded exact-date catalog, and
 * the parsed year-only timeline, and returns the homepage feature to render.
 */
export function selectFeature(
  today: Date,
  exactDates: readonly KeyDate[] = EXACT_DATES,
  yearEvents: readonly WikiTimelineEvent[] = [],
): HomeTodayFeature {
  const m = today.getMonth() + 1;
  const d = today.getDate();
  const year = today.getFullYear();

  // 1. Exact-day matches
  const matches = exactDates
    .filter((e) => e.month === m && e.day === d && e.year < year)
    .slice()
    .sort((a, b) => a.tier - b.tier);

  if (matches.length > 0) {
    const top = matches[0];
    const years = year - top.year;
    return {
      seal: top.tier === 1 ? sealFor(top, years) : undefined,
      dateline: exactDayCaption(top, years),
    };
  }

  // 2. Within ±7 days — check this year's occurrence plus next year's (for late-December → early-January wrap)
  let soon: { entry: KeyDate; diff: number; targetYear: number } | null = null;
  const todayMid = new Date(year, today.getMonth(), today.getDate());
  for (const e of exactDates) {
    for (const yearOffset of [0, 1]) {
      const targetYear = year + yearOffset;
      const target = new Date(targetYear, e.month - 1, e.day);
      const diff = Math.round(
        (target.getTime() - todayMid.getTime()) / 86400000,
      );
      if (Math.abs(diff) > 0 && Math.abs(diff) <= 7) {
        if (
          !soon ||
          Math.abs(diff) < Math.abs(soon.diff) ||
          (Math.abs(diff) === Math.abs(soon.diff) && e.tier < soon.entry.tier)
        ) {
          soon = { entry: e, diff, targetYear };
        }
      }
    }
  }
  if (soon) {
    return { dateline: soonCaption(soon.entry, soon.diff, soon.targetYear) };
  }

  // 3. Year-only rotation (daily)
  const valid = yearEvents.filter((e) => e.year > 1900 && e.year <= year);
  if (valid.length > 0) {
    const idx = dayOfYear(today) % valid.length;
    return { dateline: yearEventCaption(valid[idx]) };
  }

  // 4. Hard fallback
  return {
    dateline: { prefix: "A LIFE", text: "in progress." },
  };
}
