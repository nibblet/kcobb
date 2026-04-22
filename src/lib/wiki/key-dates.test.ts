import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { EXACT_DATES, selectFeature, type KeyDate } from "./key-dates";
import type { WikiTimelineEvent } from "./parser";

const yearEvents: WikiTimelineEvent[] = [
  {
    year: 1959,
    event: "Entered college",
    organization: "USM",
    location: "Hattiesburg, Mississippi",
    storyRef: "P1_S36",
    source: "memoir",
  },
  {
    year: 1971,
    event: "Moved to Orlando to establish new Peat Marwick office",
    organization: "Peat Marwick",
    location: "Orlando, Florida",
    storyRef: "P1_S20",
    source: "memoir",
  },
  {
    year: 1995,
    event: "Became CEO of Alamo Rent A Car",
    organization: "Alamo Rent A Car",
    location: "Fort Lauderdale, Florida",
    storyRef: "P1_S25",
    source: "memoir",
  },
];

describe("selectFeature", () => {
  it("promotes a Tier-1 exact match to the wax seal and caption", () => {
    // Wedding anniversary: June 15, 1963
    const today = new Date(2026, 5, 15); // June 15, 2026
    const feature = selectFeature(today, EXACT_DATES, yearEvents);

    assert.ok(feature.seal, "seal should be present for Tier-1 match");
    assert.equal(feature.seal?.subjectLabel, "KEITH AND DOT");
    assert.equal(feature.seal?.centerNumber, "63");
    assert.equal(feature.seal?.dateLabel, "JUN 15 · 1963");
    assert.equal(feature.dateline.prefix, "TODAY");
    assert.match(feature.dateline.text, /63 years ago/);
    assert.match(feature.dateline.text, /First Baptist Church/);
  });

  it("picks a Tier-1 birthday over a Tier-2 event on the same day (none collide today, but sort is stable)", () => {
    // Paul: May 1, 1968
    const today = new Date(2026, 4, 1); // May 1, 2026
    const feature = selectFeature(today, EXACT_DATES, yearEvents);

    assert.ok(feature.seal);
    assert.equal(feature.seal?.subjectLabel, "PAUL");
    assert.equal(feature.seal?.centerNumber, "58");
  });

  it("does not render a seal for Tier-2 career events on the exact day", () => {
    // Keith joined Peat Marwick: July 1, 1963
    const today = new Date(2026, 6, 1); // July 1, 2026
    const feature = selectFeature(today, EXACT_DATES, yearEvents);

    assert.equal(feature.seal, undefined);
    assert.equal(feature.dateline.prefix, "TODAY");
    assert.match(feature.dateline.text, /joined Peat Marwick/);
  });

  it("uses 'TOMORROW' copy when a key date is one day away", () => {
    // Day before Paul's birthday (May 1)
    const today = new Date(2026, 3, 30); // April 30, 2026
    const feature = selectFeature(today, EXACT_DATES, yearEvents);

    assert.equal(feature.seal, undefined);
    assert.equal(feature.dateline.prefix, "TOMORROW");
    assert.match(feature.dateline.text, /Paul's 58th birthday/);
  });

  it("uses 'YESTERDAY' copy when a key date was one day ago", () => {
    // Day after Paul's birthday
    const today = new Date(2026, 4, 2); // May 2, 2026
    const feature = selectFeature(today, EXACT_DATES, yearEvents);

    assert.equal(feature.dateline.prefix, "YESTERDAY");
    assert.match(feature.dateline.text, /Paul's 58th birthday/);
  });

  it("uses 'THIS WEEK' copy for events 2–7 days out", () => {
    // 3 days before Paul's birthday
    const today = new Date(2026, 3, 28); // April 28, 2026
    const feature = selectFeature(today, EXACT_DATES, yearEvents);

    assert.equal(feature.dateline.prefix, "THIS WEEK");
    assert.match(feature.dateline.text, /in 3 days/);
  });

  it("falls back to a year-only event when nothing is close", () => {
    // Late July — no key dates within ±7 days
    const today = new Date(2026, 6, 25); // July 25, 2026
    const feature = selectFeature(today, EXACT_DATES, yearEvents);

    assert.equal(feature.seal, undefined);
    assert.match(feature.dateline.prefix, /^IN \d{4}$/);
    assert.ok(feature.dateline.text.length > 0);
  });

  it("rotates year-only events deterministically across consecutive days", () => {
    const a = selectFeature(new Date(2026, 6, 25), [], yearEvents);
    const b = selectFeature(new Date(2026, 6, 26), [], yearEvents);
    // Different days → different entries (assuming >1 event, which is true here)
    assert.notEqual(a.dateline.text, b.dateline.text);
  });

  it("returns a hard fallback when there is no data at all", () => {
    const today = new Date(2026, 6, 25);
    const feature = selectFeature(today, [], []);
    assert.equal(feature.seal, undefined);
    assert.equal(feature.dateline.prefix, "A LIFE");
  });

  it("does not match the current year (no 0-year anniversaries)", () => {
    // Construct a synthetic entry in the current year and verify it is skipped.
    const synthetic: KeyDate[] = [
      {
        kind: "birthday",
        tier: 1,
        month: 4,
        day: 22,
        year: 2026,
        subject: "Test",
        verb: "was born",
      },
    ];
    const today = new Date(2026, 3, 22); // April 22, 2026
    const feature = selectFeature(today, synthetic, yearEvents);
    assert.equal(feature.seal, undefined);
  });
});
