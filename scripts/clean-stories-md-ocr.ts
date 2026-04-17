/**
 * Fixes common OCR / PDF-export glitches in memoir + interview raw markdown:
 * - spaces before commas and similar punctuation
 * - stray spaces inside words (e.g. "o ff", "re flect", "T om")
 *
 * Run: npx tsx scripts/clean-stories-md-ocr.ts
 * Then: npx tsx scripts/compile-wiki.ts (and compile-interview-stories if IV files changed)
 */
import * as fs from "fs";
import * as path from "path";

const ROOT = process.cwd();

const DIRS = [
  path.join(ROOT, "content/raw/stories_md"),
  path.join(ROOT, "content/raw/interview/stories_md"),
];

/** Two-letter tokens that are usually real words before another word — do not merge. */
const TWO_LETTER_SKIP = new Set([
  "of", "to", "in", "it", "is", "if", "or", "as", "at", "be", "by", "do", "go", "no", "on",
  "so", "up", "us", "am", "an", "me", "my", "we", "he", "im", "oh", "ok", "ah", "um", "er",
  "hm", "eh", "ex", "ad", "al", "ed", "en", "et", "lo", "ma", "mi", "mu", "nu", "od", "os",
  "ow", "ox", "pa", "pi", "ta", "ti", "tu", "ut", "ya", "ye",
  // doubled letters (avoid "ff of", "ll y", etc.)
  "aa", "bb", "cc", "dd", "ee", "ff", "gg", "hh", "ii", "jj", "kk", "ll", "mm", "nn", "oo",
  "pp", "qq", "rr", "ss", "tt", "uu", "vv", "ww", "xx", "yy", "zz",
]);

/** Three-letter starts that are usually whole words — do not merge as "prefix + rest". */
const THREE_LETTER_SKIP = new Set([
  "the", "and", "for", "not", "are", "but", "can", "all", "one", "our", "out", "has", "had",
  "was", "his", "her", "you", "she", "may", "way", "who", "how", "its", "let", "put", "say",
  "get", "got", "new", "now", "any", "two", "too", "use", "him", "own", "day", "man", "men",
  "run", "saw", "set", "six", "ten", "try", "yes", "yet", "nor", "off", "end", "why", "ask",
  "bad", "big", "did", "few", "per", "via", "war", "won", "old", "see", "sit", "red", "sat",
  "but", "cut", "car", "dog", "cat", "him", "her", "boy", "sir", "mad", "low", "job", "law",
  "led", "met", "pay", "pen", "pet", "ran", "rid", "rip", "rob", "row", "rub", "sad", "sea",
  "son", "sun", "tan", "tap", "tax", "tea", "ten", "tie", "tin", "tip", "ton", "top", "toy",
  "van", "vet", "wet", "win", "won", "zip", "ago", "age", "air", "arm", "ate", "awe", "bay",
  "bed", "bet", "bid", "bit", "box", "bus", "buy", "cop", "cry", "cup", "dam", "die", "dig",
  "dry", "due", "ear", "eat", "egg", "era", "eye", "fan", "far", "fat", "fed", "fit", "fix",
  "fly", "fox", "fun", "gap", "gas", "gun", "guy", "hat", "hip", "hit", "hot", "ice", "ill",
  "jam", "joy", "key", "kid", "lay", "leg", "lie", "lit", "lot", "map", "mix", "mom", "mud",
  "net", "nut", "odd", "oil", "owe", "pal", "pan", "pie", "pin", "pit", "pop", "pot", "raw",
  "rod", "rug", "shy", "sin", "ski", "sky", "sly", "sow", "spy", "sum", "tab", "tag", "toe",
  "web", "wed", "wow", "yes", "you", "zoo", "ant", "art", "act", "sub", "sum", "pro", "con",
  "pre", "mis", "dis", "non", "int", "ext", "ins", "del", "col", "cor", "par", "per", "sup",
  "exp", "imp", "obs", "abs", "rel", "ret", "rev", "div", "sol", "vol", "reg", "rep", "res",
]);

function fixLongSplits(s: string): string {
  return s
    .replace(/\bTothe\b/g, "To the")
    .replace(/\bcommi\s+ttee\b/gi, "committee")
    .replace(/\bcom\s+mittee\b/gi, "committee")
    .replace(/\bsigni\s+ficant\b/gi, "significant")
    .replace(/\bma\s+tters\b/gi, "matters")
    .replace(/\bsu\s+ffering\b/gi, "suffering")
    .replace(/\bpro\s+ficient\b/gi, "proficient")
    .replace(/\bpro\s+fessional\b/gi, "professional")
    .replace(/\bcon\s+fidential\b/gi, "confidential")
    .replace(/\bRi\s+ttenhouse\b/g, "Rittenhouse")
    .replace(/\brami\s+fications\b/gi, "ramifications")
    .replace(/\bStudent A ffairs\b/g, "Student Affairs")
    .replace(/\bin\s+fluences\b/gi, "influences")
    .replace(/\bin\s+fluenced\b/gi, "influenced")
    .replace(/\bin\s+fluence\b/gi, "influence")
    .replace(/\bcon\s+fidentially\b/gi, "confidentially")
    .replace(/\btrans\s+fixed\b/gi, "transfixed")
    .replace(/\bunforge\s+ttable\b/gi, "unforgettable")
    .replace(/\btwel\s+fth\b/gi, "twelfth")
    .replace(/\ban Sshape\b/g, "an S shape")
    .replace(/\bliftme\b/gi, "lift me")
    .replace(/\bbe\s+tter\b/gi, "better")
    .replace(/\ba\s+ttention\b/gi, "attention")
    .replace(/\ba\s+ttempt\b/gi, "attempt")
    .replace(/\bma\s+tter\b/gi, "matter")
    .replace(/\bno\s+ma\s+tter\b/gi, "no matter")
    .replace(/\bmagni\s+ficent\b/gi, "magnificent")
    .replace(/\bcerti\s+fiable\b/gi, "certifiable")
    .replace(/\bidenti\s+fied\b/gi, "identified")
    .replace(/\bidenti\s+fy\b/gi, "identify")
    .replace(/\bcon\s+firmed\b/gi, "confirmed")
    .replace(/\ba\s+ffiliates\b/gi, "affiliates")
    .replace(/\ba\s+ffiliate\b/gi, "affiliate")
    .replace(/\ba\s+ffiliated\b/gi, "affiliated")
    .replace(/\bMalo\s+tte\b/g, "Malotte")
    .replace(/\bT\s+o Love\b/g, "To Love")
    .replace(/\brpmdisc\b/gi, "rpm disc")
    .replace(/\bcommi\s+ttees\b/gi, "committees")
    .replace(/\badmi\s+ttedly\b/gi, "admittedly")
    .replace(/\bsigni\s+ficantly\b/gi, "significantly")
    .replace(/\bHa\s+ttiesburg\b/g, "Hattiesburg")
    .replace(/\bWi\s+tter\b/g, "Witter")
    .replace(/\bGanne\s+tt\b/g, "Gannett")
    .replace(/\bMa\s+tterhorn\b/g, "Matterhorn")
    .replace(/\bZerma\s+tt\b/g, "Zermatt")
    .replace(/\bcha\s+tted\b/gi, "chatted")
    .replace(/\bgabfor\b/gi, "gab for")
    .replace(/\bhumof\b/gi, "hum of")
    .replace(/\bgintwo\b/gi, "gin two")
    .replace(/\bRachmanino\s+ff\b/gi, "Rachmaninoff")
    .replace(/\ba\s+ttending\b/gi, "attending")
    .replace(/\ba\s+ttend\b/gi, "attend")
    .replace(/\ba\s+ttic\b/gi, "attic")
    .replace(/\ba\s+ttendees\b/gi, "attendees")
    .replace(/\ba\s+ttributes\b/gi, "attributes")
    .replace(/\binsu\s+fficient\b/gi, "insufficient")
    .replace(/\breshu\s+ffling\b/gi, "reshuffling")
    .replace(/\bshu\s+ttling\b/gi, "shuttling")
    .replace(/\bwri\s+tten\b/gi, "written")
    .replace(/\ba\s+ttractive\b/gi, "attractive");
}

/** Sentence-initial "A " OCR splits (article uses "A "; word should be one token). */
function fixUpperArticleOcr(s: string): string {
  return s
    .replace(/\bA fter\b/g, "After")
    .replace(/\bA bout\b/g, "About")
    .replace(/\bA gain\b/g, "Again")
    .replace(/\bA lone\b/g, "Alone")
    .replace(/\bA cross\b/g, "Across")
    .replace(/\bA round\b/g, "Around")
    .replace(/\bA rise\b/g, "Arise");
}

function fixExplicit(s: string): string {
  return s
    .replace(/\bhe\s+re\b/g, "here")
    .replace(/\bHe\s+re\b/g, "Here")
    .replace(/\bwe\s+re\b/g, "were")
    .replace(/\bWe\s+re\b/g, "Were")
    .replace(/\bthe\s+re\b/g, "there")
    .replace(/\bThe\s+re\b/g, "There");
}

function fixPunctuation(s: string): string {
  return s
    .replace(/\s+,/g, ",")
    .replace(/\s+;/g, ";")
    .replace(/(?<![\d:])\s+:(?!\d)/g, ":")
    .replace(/"\s+,/g, '",')
    .replace(/"\s+\./g, '".')
    .replace(/'\s+,/g, "',")
    .replace(/'\s+\./g, "'.")
    .replace(/([A-Za-z])\s+\.(?=\s|$)/g, "$1.")
    .replace(/\s+\)/g, ")")
    .replace(/\s+\]/g, "]")
    .replace(/\(\s+(?=[A-Za-z])/g, "(");
}

/** Do not merge clitic letters after apostrophe (e.g. n't + especially). */
function mergeLowerSingle(s: string): string {
  return s.replace(/(?<![\u2019'])\b([a-z])\s+([a-z]{2,})\b/g, (full, a: string, b: string) => {
    if (a === "a") return full; // indefinite article
    // "T o the" must not become T + (o merged with the) → "Tothe"
    if (a === "o" && b === "the") return full;
    return a + b;
  });
}

function mergeUpperSingle(s: string): string {
  return s.replace(/\b([A-Z])\s+([a-z]{2,})\b/g, (full, A: string, b: string) => {
    if (A === "I" || A === "A") return full; // pronoun / article; use fixUpperArticleOcr for A fter, etc.
    return A + b;
  });
}

function mergeLowerDouble(s: string): string {
  // Skip tokens must not consume the match, or "of di fferent" blocks fixing "di fferent".
  const skipAlt = [...TWO_LETTER_SKIP]
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b")
    .join("|");
  const re = new RegExp(`\\b(?!${skipAlt})([a-z]{2})\\s+([a-z]{2,})\\b`, "g");
  return s.replace(re, "$1$2");
}

function mergeLowerTriple(s: string): string {
  return s.replace(/\b([a-z]{3})\s+([a-z]{2,})\b/g, (full, a: string, b: string) => {
    if (THREE_LETTER_SKIP.has(a)) return full;
    return a + b;
  });
}

function cleanBody(text: string): string {
  let prev = "";
  let cur = fixPunctuation(fixLongSplits(text));
  let guard = 0;
  while (cur !== prev && guard++ < 20) {
    prev = cur;
    cur = fixExplicit(cur);
    cur = fixUpperArticleOcr(cur);
    cur = mergeLowerSingle(cur);
    cur = mergeUpperSingle(cur);
    cur = mergeLowerDouble(cur);
    cur = mergeLowerTriple(cur);
    cur = fixLongSplits(cur);
    cur = fixPunctuation(cur);
  }
  return cur;
}

function processFile(filePath: string): boolean {
  const raw = fs.readFileSync(filePath, "utf-8");
  const next = cleanBody(raw);
  if (next === raw) return false;
  fs.writeFileSync(filePath, next, "utf-8");
  return true;
}

function main() {
  let files = 0;
  let changed = 0;
  for (const dir of DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".md")) continue;
      files++;
      const fp = path.join(dir, name);
      if (processFile(fp)) {
        changed++;
        console.log(`updated ${path.relative(ROOT, fp)}`);
      }
    }
  }
  console.log(`Done. ${changed}/${files} files modified.`);
}

main();
