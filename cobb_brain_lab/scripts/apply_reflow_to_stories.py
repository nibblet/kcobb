"""Replace the Full Text body of each memoir story (P1_S01..P1_S39) with a
paragraph-reflowed version extracted from the original per-story PDF.

Updates BOTH:
  - content/raw/stories_md/P1_Sxx_*.md
  - content/wiki/stories/P1_Sxx-*.md

Only the block between `## Full Text\\n\\n` and the next `## ` heading is
replaced. All metadata, principles, heuristics, quotes, themes, timeline,
summary, and related-stories sections are preserved verbatim.
"""
import re
import sys
from pathlib import Path

from reflow_story_from_pdf import reflow

REPO_ROOT = Path(__file__).resolve().parents[2]
PDF_DIR = REPO_ROOT / 'cobb_brain_lab' / 'out' / 'pdf'
RAW_DIR = REPO_ROOT / 'content' / 'raw' / 'stories_md'
WIKI_DIR = REPO_ROOT / 'content' / 'wiki' / 'stories'

# Replace the body between "## Full Text\n\n" and the next "\n## " heading.
# We keep the heading itself and the next section untouched.
FULLTEXT_RE = re.compile(r'(## Full Text\n\n)([\s\S]*?)(?=\n## )')


def replace_full_text(md_path: Path, new_body: str) -> bool:
    src = md_path.read_text(encoding='utf-8')
    if '## Full Text' not in src:
        print(f'  !! no "## Full Text" section in {md_path}', file=sys.stderr)
        return False
    new_body = new_body.rstrip() + '\n'
    replaced = FULLTEXT_RE.sub(lambda m: m.group(1) + new_body, src, count=1)
    if replaced == src:
        print(f'  !! no substitution occurred for {md_path}', file=sys.stderr)
        return False
    md_path.write_text(replaced, encoding='utf-8')
    return True


def find_story_file(story_id: str, directory: Path) -> Path | None:
    # Raw uses underscores: P1_S01_*.md; wiki uses dashes: P1_S01-*.md
    for pat in (f'{story_id}_*.md', f'{story_id}-*.md'):
        hits = list(directory.glob(pat))
        if hits:
            return hits[0]
    return None


def main(dry_run: bool = False) -> int:
    pdfs = sorted(PDF_DIR.glob('P1_S*.pdf'))
    if not pdfs:
        print(f'No PDFs found in {PDF_DIR}', file=sys.stderr)
        return 1

    updated = skipped = 0
    for pdf in pdfs:
        # Story ID is the leading P1_Sxx from the filename.
        m = re.match(r'(P1_S\d+)_', pdf.name)
        if not m:
            continue
        story_id = m.group(1)
        body = reflow(str(pdf), story_id)

        for directory in (RAW_DIR, WIKI_DIR):
            md = find_story_file(story_id, directory)
            if not md:
                print(f'  {story_id}: no file in {directory.relative_to(REPO_ROOT)}')
                skipped += 1
                continue
            if dry_run:
                print(f'  DRY {story_id} -> {md.relative_to(REPO_ROOT)}')
                continue
            if replace_full_text(md, body):
                print(f'  OK  {story_id} -> {md.relative_to(REPO_ROOT)}')
                updated += 1
            else:
                skipped += 1

    print(f'\nDone. updated={updated} skipped={skipped}')
    return 0


if __name__ == '__main__':
    sys.exit(main(dry_run='--dry-run' in sys.argv))
