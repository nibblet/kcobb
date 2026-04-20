"""Reflow a story's Full Text by re-extracting paragraph blocks from its PDF.

Usage: python3 reflow_story_from_pdf.py <pdf_path>
Prints the reflowed Full Text body to stdout.
"""
import sys
import re
import fitz

PAGE_HEADER_PATTERNS = [
    re.compile(r'^\s*Keith Cobb\s*$'),
    re.compile(r'^\s*O\s*U\s*T\s+O\s*F\s+T\s*H\s*E\s+R\s*E\s*D\s+C\s*L\s*A\s*Y\s+H\s*I\s*L\s*L\s*S\s*$', re.I),
    re.compile(r'^\s*\d+\s*$'),
]

def is_page_chrome(text: str) -> bool:
    s = text.strip()
    if not s:
        return True
    for pat in PAGE_HEADER_PATTERNS:
        if pat.match(s):
            return True
    return False

def clean_text(s: str) -> str:
    # join intra-block soft wraps
    s = re.sub(r'-\n(?=[a-z])', '', s)          # hyphenated line break
    s = re.sub(r'\s*\n\s*', ' ', s)              # remaining newlines → spaces
    s = re.sub(r' {2,}', ' ', s).strip()
    return s

def extract_blocks(pdf_path: str):
    """Return list of (page_index, y0, y1, text) for non-chrome blocks."""
    doc = fitz.open(pdf_path)
    out = []
    for pi, page in enumerate(doc):
        blocks = page.get_text('blocks')
        # blocks is list of (x0,y0,x1,y1,text,block_no,block_type)
        blocks = sorted(blocks, key=lambda b: (b[1], b[0]))
        for b in blocks:
            raw = b[4]
            if is_page_chrome(raw):
                continue
            cleaned = clean_text(raw)
            if not cleaned:
                continue
            out.append((pi, b[1], b[3], cleaned))
    return out

def reflow(pdf_path: str) -> str:
    blocks = extract_blocks(pdf_path)
    # Merge cross-page continuations: if previous block didn't end with
    # sentence terminator and the next starts with lowercase, concat.
    merged = []
    TERMINATORS = tuple('.!?"”\')')
    for (pi, y0, y1, text) in blocks:
        if merged:
            prev = merged[-1]
            prev_end = prev.rstrip()[-1:] if prev.strip() else ''
            first_ch = text.lstrip()[:1]
            if prev_end and prev_end not in TERMINATORS and first_ch and first_ch.islower():
                merged[-1] = prev.rstrip() + ' ' + text.lstrip()
                continue
        merged.append(text)
    # Join consecutive title lines ("A Towhead from the" + "Red Clay Hills") if very short
    # and first two blocks — but really we'll just drop the H1 title from body (caller handles).
    return '\n\n'.join(merged)

if __name__ == '__main__':
    print(reflow(sys.argv[1]))
