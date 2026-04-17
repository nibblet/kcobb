/**
 * seed-people.ts — One-shot import of content/wiki/people/*.md into sb_people.
 *
 * Run: npx tsx scripts/seed-people.ts
 *
 * Idempotent: upserts by slug. Preserves existing bio_md/relationship/years on
 * subsequent runs unless the markdown has clearly newer content (we just
 * never overwrite anything the DB already has — the table is the new source
 * of truth going forward).
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local (Next.js does this automatically for `next dev`, but
// standalone tsx scripts don't). Tiny inline parser — no new dependency.
loadEnvLocal();

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const PEOPLE_DIR = path.join(process.cwd(), "content/wiki/people");

interface ParsedPerson {
  slug: string;
  display_name: string;
  bio_md: string;
}

function parsePersonFile(filePath: string): ParsedPerson | null {
  const raw = fs.readFileSync(filePath, "utf8");

  // Display name comes from the first `# ` heading.
  const titleMatch = raw.match(/^#\s+(.+?)\s*$/m);
  if (!titleMatch) return null;
  const display_name = titleMatch[1].trim();

  // Slug from the **Slug:** line, else derived from filename.
  const slugMatch = raw.match(/\*\*Slug:\*\*\s*([a-z0-9-]+)/i);
  const slug =
    slugMatch?.[1]?.trim() ?? path.basename(filePath, ".md").toLowerCase();

  // Strip the generated footer and the inventory-entry blockquote; keep the
  // rest as the bio body. Future edits happen in the DB and regenerate the md.
  let bio = raw
    .replace(/^#\s+.+?\n/, "") // first heading
    .replace(/^>\s*Inventory entry.*?\n/m, "")
    .replace(/\*\*Slug:\*\*\s*[a-z0-9-]+\s*\n/i, "")
    .replace(/\n---\n\*Sources:[\s\S]*?$/, "")
    .trim();

  // Collapse excess blank lines.
  bio = bio.replace(/\n{3,}/g, "\n\n");

  return { slug, display_name, bio_md: bio };
}

async function main() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env."
    );
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const files = fs
    .readdirSync(PEOPLE_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(PEOPLE_DIR, f));

  console.log(`Found ${files.length} people markdown files.`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    const parsed = parsePersonFile(file);
    if (!parsed) {
      console.warn(`  skip (no heading): ${path.basename(file)}`);
      skipped++;
      continue;
    }

    // Check for existing row by slug so we don't clobber edits.
    const { data: existing } = await supabase
      .from("sb_people")
      .select("id, bio_md")
      .eq("slug", parsed.slug)
      .maybeSingle();

    if (existing) {
      // Only backfill bio_md if the DB row is empty — never overwrite edits.
      if (!existing.bio_md || existing.bio_md.trim() === "") {
        const { error } = await supabase
          .from("sb_people")
          .update({
            bio_md: parsed.bio_md,
            display_name: parsed.display_name,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) {
          console.error(`  FAIL update ${parsed.slug}: ${error.message}`);
          skipped++;
        } else {
          console.log(`  updated bio: ${parsed.slug}`);
          updated++;
        }
      } else {
        skipped++;
      }
      continue;
    }

    const { error } = await supabase.from("sb_people").insert({
      slug: parsed.slug,
      display_name: parsed.display_name,
      bio_md: parsed.bio_md,
    });
    if (error) {
      console.error(`  FAIL insert ${parsed.slug}: ${error.message}`);
      skipped++;
    } else {
      console.log(`  inserted: ${parsed.slug}`);
      inserted++;
    }
  }

  console.log(
    `\nDone. inserted=${inserted}  backfilled=${updated}  skipped=${skipped}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
