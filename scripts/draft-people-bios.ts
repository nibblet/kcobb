/**
 * draft-people-bios.ts
 *
 * For each curated person in content/wiki/people/, gather the passages in the
 * memoir and interview stories where they are mentioned, and ask Claude to
 * write a grounded bio. The bio is injected between markers so regeneration
 * is idempotent and Keith's reviewed edits are never overwritten.
 *
 * Marker shape:
 *   <!-- ai-draft:start generated="YYYY-MM-DD" reviewed="false" -->
 *   ...markdown body...
 *   <!-- ai-draft:end -->
 *
 * CLI:
 *   npx tsx scripts/draft-people-bios.ts --dry-run            # no API calls
 *   npx tsx scripts/draft-people-bios.ts --person bayne-cobb  # one person
 *   npx tsx scripts/draft-people-bios.ts                      # every person
 *                                                               without an
 *                                                               existing draft
 *   npx tsx scripts/draft-people-bios.ts --force              # overwrite
 *                                                               unreviewed
 *                                                               drafts too
 *
 * Reviewed blocks (reviewed="true") are ALWAYS skipped unless --force-reviewed
 * is passed.
 */

import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-5";
const WIKI = path.join(process.cwd(), "content/wiki");
const PEOPLE_DIR = path.join(WIKI, "people");
const STORIES_DIR = path.join(WIKI, "stories");

const STORY_ID_PAT = "(?:P\\d+|IV)_S\\d+";

interface PersonFile {
  slug: string;
  name: string;
  note: string;
  memoirIds: string[];
  interviewIds: string[];
  raw: string;
  path: string;
  existingDraft: "none" | "draft" | "reviewed";
}

function loadPerson(filename: string): PersonFile | null {
  const filepath = path.join(PEOPLE_DIR, filename);
  const raw = fs.readFileSync(filepath, "utf-8");
  const slug =
    raw.match(/\*\*Slug:\*\*\s*(.+)/)?.[1]?.trim() || filename.replace(/\.md$/, "");
  const name = raw.match(/^# (.+)/m)?.[1]?.trim() || slug;
  const note =
    raw
      .match(/## Note\n\n([\s\S]*?)(?=\n## |\n---|\n<!--|$)/)?.[1]
      ?.trim() || "";

  const extractIds = (header: string): string[] => {
    const m = raw.match(
      new RegExp(`## ${header}\\n\\n([\\s\\S]*?)(?=\\n## |\\n---|\\n<!--|$)`)
    );
    if (!m) return [];
    const ids: string[] = [];
    const re = new RegExp(`\\((${STORY_ID_PAT})\\)`, "g");
    let x: RegExpExecArray | null;
    while ((x = re.exec(m[1])) !== null) ids.push(x[1]);
    return ids;
  };

  const draftMatch = raw.match(
    /<!-- ai-draft:start(?:\s+generated="[^"]*")?(?:\s+reviewed="(true|false)")? -->/
  );
  const existingDraft: PersonFile["existingDraft"] = draftMatch
    ? draftMatch[1] === "true"
      ? "reviewed"
      : "draft"
    : "none";

  return {
    slug,
    name,
    note,
    memoirIds: extractIds("Memoir stories"),
    interviewIds: extractIds("Interview stories"),
    raw,
    path: filepath,
    existingDraft,
  };
}

function loadStoryFullText(storyId: string): { title: string; text: string } | null {
  const file = fs.readdirSync(STORIES_DIR).find((f) => f.startsWith(`${storyId}-`));
  if (!file) return null;
  const raw = fs.readFileSync(path.join(STORIES_DIR, file), "utf-8");
  const title = raw.match(/^# (.+)/m)?.[1]?.trim() || storyId;
  const text = raw.match(/## Full Text\n\n([\s\S]*?)(?=\n## )/)?.[1]?.trim() || "";
  return { title, text };
}

/**
 * Return passages (paragraphs) from a story where `needle` appears, plus the
 * adjacent paragraphs for context. Keep it compact — we send many of these.
 */
function passagesMentioning(text: string, needle: string): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const hits = new Set<number>();
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].includes(needle)) {
      hits.add(i);
      if (i > 0) hits.add(i - 1);
      if (i < paragraphs.length - 1) hits.add(i + 1);
    }
  }
  return [...hits].sort((a, b) => a - b).map((i) => paragraphs[i]);
}

const VOICE_GUIDE = `
## Voice guidance (from the memoir's own doctrine)

The memoir's voice is:
- Concrete and specific: names people and institutions with respect, cites dates and places, uses exact amounts and sequences over generalizations.
- Reflective and modest: acknowledges luck, help, and mentorship rather than claiming sole credit.
- Calm moral clarity without preachiness: right and wrong are plain, but the tone never scolds.
- Grateful in plain language: "profoundly grateful," "lot of help along the way," "I shall be forever grateful."
- Grounded in lifelong observation: "I learned from X mostly through observation."

When Keith himself uses a signature phrase about this person in the passages (e.g. "trustworthy and honest to the bone," "a spool of blue thread," "treating me like a partner"), prefer **quoting or mirroring that exact phrase** rather than paraphrasing it away. Those phrases carry Keith's voice.

Avoid: moralizing, sweeping generalities, speculation about feelings, first-person "I" narration as if you are Keith. You are writing *about* this person for readers of the wiki.
`;

function buildPrompt(person: PersonFile, passages: { storyId: string; title: string; body: string }[]): string {
  const block = passages
    .map(
      (p) =>
        `### From ${p.storyId} — ${p.title}\n\n${p.body}\n`
    )
    .join("\n");

  return `You are drafting a short biographical sketch of **${person.name}** for a family memoir wiki about Keith Cobb.
${VOICE_GUIDE}

The sketch must be grounded ONLY in the passages below. Do not invent dates, places, relationships, or anecdotes that are not supported by the text. If a detail is not in the passages, omit it.

${person.note ? `Curator's note about this person: ${person.note}\n` : ""}

## Source passages

${block}

## Your task

Write a markdown section with this structure:

\`\`\`
## About ${person.name}

A 1–2 sentence summary that captures who they were in relation to Keith.

Then 1–2 short paragraphs of biographical detail — relationship to Keith, notable roles, what the memoir or interviews emphasize about them. Cite story ids inline in parentheses like (P1_S06) where specific moments are drawn from a specific passage.

**Notable moments**

- One short bulleted moment with story id, e.g. "Drove Keith to his first day at Ole Miss (P1_S13)" — only if directly supported by a passage.
- Add 2–4 bullets if the passages support them. Omit this section entirely if there's nothing concrete.

**A representative quote** (optional — only if a direct quote from or about this person appears in a passage)

> "..."
> — _context where it appears_
\`\`\`

Rules:
- Every factual claim must trace to a passage. When in doubt, drop the claim.
- Do NOT speculate about inner thoughts, feelings, or opinions that aren't stated.
- Prefer Keith's own framing where the passages quote him.
- Keep the whole section under 250 words.
- Do NOT wrap the output in code fences. Emit plain markdown starting with \`## About ${person.name}\`.`;
}

async function generateDraft(
  client: Anthropic,
  person: PersonFile,
  passages: { storyId: string; title: string; body: string }[]
): Promise<string> {
  const prompt = buildPrompt(person, passages);
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });
  const textBlock = res.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text in response");
  }
  return textBlock.text.trim();
}

function injectDraft(raw: string, body: string, generated: string): string {
  const marker = `<!-- ai-draft:start generated="${generated}" reviewed="false" -->\n${body}\n<!-- ai-draft:end -->`;

  // Replace any existing unreviewed draft block, else insert before trailing --- footer.
  const existing = raw.match(
    /<!-- ai-draft:start[\s\S]*?<!-- ai-draft:end -->/
  );
  if (existing) {
    return raw.replace(existing[0], marker);
  }
  // Insert before the first `---` horizontal rule (the "Sources" footer).
  const hrIdx = raw.indexOf("\n---\n");
  if (hrIdx === -1) return `${raw.trimEnd()}\n\n${marker}\n`;
  return raw.slice(0, hrIdx) + `\n${marker}\n` + raw.slice(hrIdx);
}

interface Options {
  dryRun: boolean;
  onlySlug: string | null;
  force: boolean;
  forceReviewed: boolean;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
    forceReviewed: args.includes("--force-reviewed"),
    onlySlug: (() => {
      const i = args.indexOf("--person");
      return i >= 0 && args[i + 1] ? args[i + 1] : null;
    })(),
  };
}

async function main() {
  const opts = parseArgs();
  const generated = new Date().toISOString().slice(0, 10);

  const files = fs
    .readdirSync(PEOPLE_DIR)
    .filter((f) => f.endsWith(".md"))
    .filter((f) => !opts.onlySlug || f === `${opts.onlySlug}.md`);

  if (opts.onlySlug && files.length === 0) {
    console.error(`No person file for --person ${opts.onlySlug}`);
    process.exit(1);
  }

  const people = files
    .map(loadPerson)
    .filter((p): p is PersonFile => !!p);

  const candidates = people.filter((p) => {
    if (p.existingDraft === "reviewed" && !opts.forceReviewed) return false;
    if (p.existingDraft === "draft" && !opts.force && !opts.onlySlug) return false;
    return true;
  });

  console.log(
    `${people.length} people | ${candidates.length} to process | dryRun=${opts.dryRun}`
  );

  const client = opts.dryRun
    ? null
    : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

  if (!opts.dryRun && !process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set");
    process.exit(1);
  }

  for (const person of candidates) {
    const ids = [...person.memoirIds, ...person.interviewIds];
    const passages: { storyId: string; title: string; body: string }[] = [];
    for (const sid of ids) {
      const story = loadStoryFullText(sid);
      if (!story) continue;
      for (const p of passagesMentioning(story.text, person.name)) {
        passages.push({ storyId: sid, title: story.title, body: p });
      }
    }

    const totalChars = passages.reduce((n, p) => n + p.body.length, 0);
    console.log(
      `- ${person.slug} · ${ids.length} stories · ${passages.length} passages · ${totalChars} chars`
    );

    if (passages.length === 0) {
      console.log(`   (skipped — no passages match the full name "${person.name}")`);
      continue;
    }
    if (opts.dryRun) continue;

    try {
      const body = await generateDraft(client!, person, passages);
      const updated = injectDraft(person.raw, body, generated);
      fs.writeFileSync(person.path, updated);
      console.log(`   ✓ wrote draft (${body.length} chars)`);
    } catch (err) {
      console.error(`   ✗ ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
