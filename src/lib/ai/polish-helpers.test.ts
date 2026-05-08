import test from "node:test";
import assert from "node:assert/strict";
import {
  buildUserPrompt,
  extractJSON,
  extractJSONFromTextBlocks,
  alignSuggestionToTaxonomy,
  enforceTaxonomyConfidence,
} from "@/lib/ai/polish-helpers";

test("buildUserPrompt emits all labeled fields including empty placeholders", () => {
  const prompt = buildUserPrompt({ title: "", body: "" });
  assert.match(prompt, /TITLE: \(empty\)/);
  assert.match(prompt, /LIFE_STAGE: \(empty\)/);
  assert.match(prompt, /YEAR_START: \(empty\)/);
  assert.match(prompt, /THEMES: \(empty\)/);
  assert.match(prompt, /PRINCIPLES: \(empty\)/);
  assert.match(prompt, /QUOTES: \(empty\)/);
  assert.match(prompt, /BODY .+preserve tags/);
});

test("buildUserPrompt serializes arrays with commas and pipes", () => {
  const prompt = buildUserPrompt({
    title: "First job",
    body: "<p>I was 17.</p>",
    themes: ["first job", "resilience"],
    quotes: ["It was cold.", "I kept going."],
  });
  assert.match(prompt, /THEMES: first job, resilience/);
  assert.match(prompt, /QUOTES: It was cold\. \| I kept going\./);
});

test("extractJSON parses a clean JSON object", () => {
  const got = extractJSON('{"title":"Polished","rationale":"ok"}');
  assert.deepEqual(got, { title: "Polished", rationale: "ok" });
});

test("extractJSON strips markdown code fences", () => {
  const got = extractJSON('```json\n{"title":"Polished"}\n```');
  assert.deepEqual(got, { title: "Polished" });
});

test("extractJSON tolerates a bare ```-fence without language tag", () => {
  const got = extractJSON('```\n{"body":"x"}\n```');
  assert.deepEqual(got, { body: "x" });
});

test("extractJSON recovers a JSON block embedded in prose", () => {
  const got = extractJSON(
    'Sure, here is the suggestion:\n{"title":"Lake Trip","themes":["family"]}\nHope that helps.'
  );
  assert.deepEqual(got, { title: "Lake Trip", themes: ["family"] });
});

test("extractJSON returns null when no JSON is present", () => {
  assert.equal(extractJSON("I could not produce JSON for you."), null);
});

test("extractJSON returns null for malformed JSON with no recoverable block", () => {
  assert.equal(extractJSON("{not valid"), null);
});

test("extractJSON parses fenced JSON with trailing commas", () => {
  const got = extractJSON(
    '```json\n{"title":"Polished","themes":["family",],"quotes":["x",],}\n```'
  );
  assert.deepEqual(got, {
    title: "Polished",
    themes: ["family"],
    quotes: ["x"],
  });
});

test("extractJSON parses a wrapped JSON object with smart quotes", () => {
  const got = extractJSON(
    'Result:\n{“title”: “Twilight”, “rationale”: “Light copyedits.”}\nThanks.'
  );
  assert.deepEqual(got, {
    title: "Twilight",
    rationale: "Light copyedits.",
  });
});

test("extractJSONFromTextBlocks parses when JSON spans multiple blocks", () => {
  const got = extractJSONFromTextBlocks([
    '{"title":"Twilight",',
    '"themes":["family"],',
    '"rationale":"smoothed wording."}',
  ]);
  assert.deepEqual(got, {
    title: "Twilight",
    themes: ["family"],
    rationale: "smoothed wording.",
  });
});

test("extractJSONFromTextBlocks falls back to later valid block", () => {
  const got = extractJSONFromTextBlocks([
    "Here is my suggestion:",
    '{"title":"Musing in the Twilight Hours"}',
  ]);
  assert.deepEqual(got, { title: "Musing in the Twilight Hours" });
});

test("alignSuggestionToTaxonomy keeps only known themes and principles", () => {
  const got = alignSuggestionToTaxonomy(
    {
      themes: ["Family", "random new bucket", "Leadership"],
      principles: [
        "lead by example",
        "invented principle",
        "Do What Is Right, Even When It Costs You",
      ],
    },
    ["Family", "Leadership", "Curiosity"],
    [
      "Lead by Example",
      "Do What Is Right, Even When It Costs You",
      "Keep Learning",
    ]
  );

  assert.deepEqual(got.themes, ["Family", "Leadership"]);
  assert.deepEqual(got.principles, [
    "Lead by Example",
    "Do What Is Right, Even When It Costs You",
  ]);
});

test("alignSuggestionToTaxonomy omits empty theme/principle arrays", () => {
  const got = alignSuggestionToTaxonomy(
    {
      title: "Test",
      themes: ["made up"],
      principles: ["also made up"],
    },
    ["Family"],
    ["Lead by Example"]
  );

  assert.equal(got.title, "Test");
  assert.equal("themes" in got, false);
  assert.equal("principles" in got, false);
});

test("enforceTaxonomyConfidence emits note when taxonomy had no confident match", () => {
  const got = enforceTaxonomyConfidence(
    { title: "x" },
    { themes: ["new bucket"], principles: ["invented value"] }
  );

  assert.equal(got.title, "x");
  assert.match(
    got.rationale ?? "",
    /No confident taxonomy match for themes\/principles/i
  );
});

test("enforceTaxonomyConfidence keeps existing rationale and appends note", () => {
  const got = enforceTaxonomyConfidence(
    { rationale: "Light copyedits." },
    { themes: ["not-known"] }
  );

  assert.match(got.rationale ?? "", /Light copyedits\./);
  assert.match(got.rationale ?? "", /No confident taxonomy match/i);
});

test("enforceTaxonomyConfidence does nothing when there is a taxonomy match", () => {
  const got = enforceTaxonomyConfidence(
    { themes: ["Family"], rationale: "ok" },
    { themes: ["family"] }
  );

  assert.deepEqual(got, { themes: ["Family"], rationale: "ok" });
});
