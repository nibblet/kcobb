"""Reflow a story's Full Text by re-extracting paragraph blocks from its PDF.

Usage: python3 reflow_story_from_pdf.py <pdf_path> [story_id]
Prints the reflowed Full Text body to stdout. If story_id is given, images are
emitted at their block positions using filenames from book_images_manifest.csv.
"""
import csv
import sys
import re
from pathlib import Path
import fitz

PAGE_HEADER_PATTERNS = [
    re.compile(r'^\s*Keith Cobb\s*$'),
    re.compile(r'^\s*O\s*U\s*T\s+O\s*F\s+T\s*H\s*E\s+R\s*E\s*D\s+C\s*L\s*A\s*Y\s+H\s*I\s*L\s*L\s*S\s*$', re.I),
    re.compile(r'^\s*\d+\s*$'),
]

PUBLIC_IMAGE_PREFIX = '/book-images/'
MANIFEST_PATH = Path(__file__).resolve().parents[1] / 'book_images_manifest.csv'

# Load a word list once so we can decide whether a soft-hyphenated line break
# represents a real hyphenated word ("fifty-five") or a soft wrap that should
# merge ("some-\nthing" -> "something").
_WORDS: set[str] | None = None

def _words() -> set[str]:
    global _WORDS
    if _WORDS is None:
        try:
            with open('/usr/share/dict/words', 'r') as f:
                _WORDS = {w.strip().lower() for w in f if w.strip()}
        except Exception:
            _WORDS = set()
    return _WORDS


def is_page_chrome(text: str) -> bool:
    s = text.strip()
    if not s:
        return True
    for pat in PAGE_HEADER_PATTERNS:
        if pat.match(s):
            return True
    return False


def _resolve_soft_hyphen(match: re.Match) -> str:
    left, right = match.group(1), match.group(2)
    words = _words()
    concat = (left + right).lower()
    hyph = f"{left.lower()}-{right.lower()}"
    if words and concat in words and hyph not in words:
        return left + right
    return f"{left}-{right}"


def clean_text(s: str) -> str:
    s = re.sub(r'(\w+)-\n(\w+)', _resolve_soft_hyphen, s)
    s = re.sub(r'\s*\n\s*', ' ', s)
    s = re.sub(r' {2,}', ' ', s).strip()
    return s


def _split_lineage(block_text: str) -> list[str]:
    pattern = re.compile(
        r'([A-Z][A-Za-z.]+(?:\s+[A-Z][A-Za-z.]+)+(?:,\s*(?:Jr|Sr|II|III|IV)\.?)?\s+\d{4}[–\-]\d{0,4}(?:\s|$))'
    )
    matches = list(pattern.finditer(block_text))
    if len(matches) < 3:
        return [block_text]
    covered = sum(m.end() - m.start() for m in matches)
    if covered / max(len(block_text), 1) < 0.5:
        return [block_text]
    entries = [m.group(1).strip() for m in matches]
    pre = block_text[:matches[0].start()].strip()
    post = block_text[matches[-1].end():].strip()
    out: list[str] = []
    if pre:
        out.append(pre)
    out.extend(entries)
    if post:
        out.append(post)
    return out


TERMINATORS = tuple('.!?"”\')')


def _images_for_story(story_id: str) -> list[str]:
    """Return the manifest's image filenames for a story, in manifest order."""
    if not MANIFEST_PATH.exists():
        return []
    out: list[tuple[int, int, str]] = []
    with open(MANIFEST_PATH, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['story_id_or_timeline_id'] == story_id:
                out.append((int(row['pdf_page']), int(row['image_index']), row['filename']))
    out.sort()
    return [fn for _, _, fn in out]


def extract_elements(pdf_path: str, story_id: str | None = None):
    """Return a mixed list of (page, y0, y1, kind, payload).

    kind='text' payload=cleaned paragraph string
    kind='image' payload=filename (relative to PUBLIC_IMAGE_PREFIX) or None
    """
    doc = fitz.open(pdf_path)
    image_filenames = _images_for_story(story_id) if story_id else []
    img_cursor = 0

    elements: list[tuple[int, float, float, str, str | None]] = []
    for pi, page in enumerate(doc):
        blocks = page.get_text('dict')['blocks']
        blocks = sorted(blocks, key=lambda b: (b['bbox'][1], b['bbox'][0]))
        for b in blocks:
            x0, y0, x1, y1 = b['bbox']
            if b['type'] == 1:  # image
                fname = image_filenames[img_cursor] if img_cursor < len(image_filenames) else None
                img_cursor += 1
                elements.append((pi, y0, y1, 'image', fname))
            else:  # text
                # Reconstruct the raw text of this block from its spans.
                lines = []
                for line in b.get('lines', []):
                    line_text = ''.join(span['text'] for span in line.get('spans', []))
                    lines.append(line_text)
                raw = '\n'.join(lines)
                if is_page_chrome(raw):
                    continue
                cleaned = clean_text(raw)
                if not cleaned:
                    continue
                elements.append((pi, y0, y1, 'text', cleaned))
    return elements


def _strip_leading_title_elements(elements):
    out = list(elements)
    dropped = 0
    while out and dropped < 2:
        pi, _, _, kind, payload = out[0]
        if pi != 0 or kind != 'text':
            break
        text = payload
        if len(text) >= 50 or text.endswith(TERMINATORS) or not text[:1].isupper():
            break
        out.pop(0)
        dropped += 1
    return out


def _is_caption_like(text: str) -> bool:
    """Short, non-sentence-ending text looks like a photo caption."""
    if not text:
        return False
    if len(text) > 150:
        return False
    if text.endswith(('.', '!', '?')):
        # Captions in this book usually don't end with a period.
        return False
    # Title-case-ish or starts with uppercase.
    return text[:1].isupper() or text[:1] == '_'


CAPTION_PROXIMITY = 60.0  # points of vertical separation to consider adjacent


def _attach_captions(elements):
    """Attach short text blocks to adjacent images as captions.

    A candidate caption is consumed only if it is clearly trailing (no body
    paragraph follows on the same page) — this avoids swallowing subsection
    headings that use the same italic caption font as captions.

    Returns a list of (kind, payload) where payload for 'image' is
    (filename, caption).
    """
    consumed = set()
    result: list[tuple[str, object]] = []

    def _next_text_on_page(i: int, page: int):
        for j in range(i + 1, len(elements)):
            jpi, _, _, jkind, jpayload = elements[j]
            if jpi != page:
                return None, None
            if jkind == 'text' and j not in consumed:
                return j, elements[j]
        return None, None

    def _next_text_anywhere(i: int):
        for j in range(i + 1, len(elements)):
            jkind = elements[j][3]
            if jkind == 'text' and j not in consumed:
                return j, elements[j]
        return None, None

    def _is_body(text: str) -> bool:
        return len(text) > 160 or text.rstrip().endswith('.')

    for i, (pi, y0, y1, kind, payload) in enumerate(elements):
        if i in consumed:
            continue
        if kind != 'text':
            # Non-image non-text (shouldn't happen) — pass through.
            if kind != 'image':
                result.append((kind, payload))
                continue

            caption = ''
            # Look just below the image on the same page.
            j, jelem = _next_text_on_page(i, pi)
            if jelem is not None:
                jpi, jy0, jy1, jkind, jtext = jelem
                if jy0 - y1 <= CAPTION_PROXIMITY and _is_caption_like(jtext):
                    # Don't consume if a body paragraph follows it anywhere
                    # in reading order — that means the candidate is a
                    # subheading. (Cross-page merges can relocate the body.)
                    _, kelem = _next_text_anywhere(j)
                    body_follows = kelem is not None and _is_body(kelem[4])
                    if not body_follows:
                        caption = jtext
                        consumed.add(j)

            # Otherwise try directly above the image.
            if not caption:
                for j in range(i - 1, -1, -1):
                    jpi, jy0, jy1, jkind, jtext = elements[j]
                    if jpi != pi or j in consumed:
                        break
                    if jkind != 'text':
                        continue
                    if y0 - jy1 > CAPTION_PROXIMITY:
                        break
                    if _is_caption_like(jtext):
                        # Only claim an above-image block if no body paragraph
                        # separates them.
                        caption = jtext
                        consumed.add(j)
                    break

            result.append(('image', (payload, caption)))
            continue

        result.append((kind, payload))
    return result


def reflow(pdf_path: str, story_id: str | None = None) -> str:
    elements = extract_elements(pdf_path, story_id)
    elements = _strip_leading_title_elements(elements)

    # Cross-page continuation merge for consecutive text elements.
    merged: list[tuple[int, float, float, str, object]] = []
    for elem in elements:
        pi, y0, y1, kind, payload = elem
        if kind == 'text' and merged and merged[-1][3] == 'text':
            prev_pi, _, _, _, prev_text = merged[-1]
            prev_end = prev_text.rstrip()[-1:] if prev_text.strip() else ''
            if prev_pi != pi and prev_end and prev_end not in TERMINATORS:
                merged[-1] = (pi, y0, y1, 'text',
                              prev_text.rstrip() + ' ' + payload.lstrip())
                continue
        merged.append(elem)

    attached = _attach_captions(merged)

    # Emit markdown.
    out_parts: list[str] = []
    for kind, payload in attached:
        if kind == 'image':
            fname, caption = payload
            if not fname:
                continue
            alt = caption.replace(']', '').replace('[', '').strip() if caption else ''
            out_parts.append(f'![{alt}]({PUBLIC_IMAGE_PREFIX}{fname})')
        else:
            for piece in _split_lineage(payload):
                out_parts.append(piece)

    return '\n\n'.join(out_parts)


if __name__ == '__main__':
    pdf = sys.argv[1]
    sid = sys.argv[2] if len(sys.argv) > 2 else None
    print(reflow(pdf, sid))
