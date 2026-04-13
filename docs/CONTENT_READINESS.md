# Keith Cobb Storybook — Content Readiness Assessment

> **Last Updated**: 2026-04-13
> **Based on**: content/raw/ (imported from cobb_brain_lab)

---

## Summary

The content pipeline built in cobb_brain_lab produced significantly more usable material than initially assumed. The `upload_to_gpt/` directory is a proto-wiki — a pre-packaged knowledge base with story index, system prompt, all stories, career timeline, principles, heuristics, quotes, and family context. Wiki compilation (Phase 2) can restructure this rather than starting from scratch.

**Story count**: 39 (P1_S01 through P1_S39), not 41 as originally estimated.

---

## Asset Readiness

### Ready to Use (No Changes Needed)

| Asset | Path | Notes |
|-------|------|-------|
| 39 story markdowns | `stories_md/` | Clean body text. Filenames have OCR artifacts (will clean during wiki compilation). |
| 39 extracted JSONs | `stories_json/P1_S01.json` etc. | Principles, heuristics, quotes, leadership patterns, context — all evidence-backed. |
| GPT system prompt | `upload_to_gpt/GPT_Instructions.md` | Archive Mode + Mentor Mode, age modes, guardrails, voice rules. ~90% of our Claude system prompt. |
| Story navigation index | `upload_to_gpt/00_STORY_INDEX.md` | Theme directory + per-story metadata. Excellent for wiki index. |
| Voice style model | `voice/30_VOICE_STYLE.md` | 12 voice characteristics + rhetorical moves, all evidence-backed. |
| Career timeline | `library/career_timeline.json` | 40+ events with years, roles, organizations, story references, confidence. |
| Quotes index | `quotes/quotes.md` + `quotes/quotes.json` | Organized by story, ready to render. |
| All stories combined | `upload_to_gpt/STORIES_ALL.md` | Single file with all 39 stories — useful for bulk processing. |
| Manifest | `manifest.csv` | Story IDs, titles, slugs, page ranges, word counts. |

### Needs Human Review Before Use

| Asset | Path | Issue | Action Required |
|-------|------|-------|----------------|
| Principles doctrine | `doctrine/draft_principles_doctrine.md` | Cluster labels marked "(needs rename)" | Set `human_label` in `clusters/labels_editable.json` for ~10 clusters |
| Heuristics doctrine | `doctrine/draft_heuristics_doctrine.md` | Same — cluster labels need human review | Same |
| Core principles | `doctrine/core_principles.md` | Top 20 by frequency — depends on cluster labels | Review after labels are set |

### Needs Expansion

| Asset | Path | Issue | Action Required |
|-------|------|-------|----------------|
| Family context | `upload_to_gpt/family_context.md` | Only 5 bullet points (stub) | Flesh out: who Keith is, family tree, relationship to users |

### Not Needed for V1

| Asset | Path | Why |
|-------|------|-----|
| Cluster JSON files | `clusters/*.json` | Internal pipeline artifacts — the doctrine markdowns are the usable output |
| Library index JSON | `library/00_LIBRARY_INDEX.json` | Machine-readable version of the markdown index — we'll use the markdown |
| Sources index | `library/00_SOURCES_INDEX.*` | Only 2 sample sources — relevant for V2 when new sources are added |

---

## What Wiki Compilation Actually Needs to Do

Given what exists, the compilation script does NOT need to:
- Extract principles from stories (done — `stories_json/`)
- Build a story index (done — `upload_to_gpt/00_STORY_INDEX.md`)
- Extract quotes (done — `quotes/`)
- Build a career timeline (done — `library/career_timeline.json`)
- Write a system prompt (done — `upload_to_gpt/GPT_Instructions.md`)

It DOES need to:
1. **Restructure** existing content into per-page wiki format (one .md per story, per principle, per theme, per person, per timeline era)
2. **Clean OCR artifacts** in filenames and any remaining body text issues
3. **Add cross-references** between pages (which stories → which principles, which people → which stories, etc.)
4. **Generate the master index.md** from the restructured pages
5. **Generate guided prompts** per story (for Young Reader mode)
6. **Compile theme pages** by grouping principles under browseable themes
7. **Compile people pages** by extracting significant people from stories

Estimated effort: **60% less than originally planned.** The heavy extraction work is done.

---

## OCR Artifacts to Clean

Filenames with split-word artifacts from PDF extraction:

| Current | Corrected |
|---------|-----------|
| `A_T_owhead` | `A_Towhead` |
| `A_Very_Busy_T_eenager` | `A_Very_Busy_Teenager` |
| `T_ogetherness_on_Saturday` | `Togetherness_on_Saturday` |
| `Early_Y_ears_at_Peat_Marwick` | `Early_Years_at_Peat_Marwick` |
| `T_o_God_Be_The_Glory` | `To_God_Be_The_Glory` |
| `Cobbu2014d` | `Cobb—` (em dash encoding) |
| `KPMGu2014d` | `KPMG—` |
| `T_eachers_Legacy` | `Teachers_Legacy` |

These are systematic OCR artifacts from the PDF split pipeline. Body text was cleaned by `scripts/lib/text_clean.py` but filenames were not.

---

## Pre-Wiki Action Items

Before running wiki compilation:

- [ ] **Review cluster labels**: edit `clusters/labels_editable.json`, set `human_label` for ~10 principle clusters and ~15 heuristic clusters
- [ ] **Expand family context**: flesh out `upload_to_gpt/family_context.md` with family tree, who Keith is to the users, grandchildren's names if desired
- [ ] **Verify story count**: confirm 39 stories is complete (original PRD said 41)
