import { NextResponse } from "next/server";
import { requireKeith } from "@/lib/auth/require-keith";
import {
  createSnippet,
  listSnippets,
  type SnippetEra,
} from "@/lib/snippets";
import { autoTagSnippet } from "@/lib/snippets/auto-tag";

export async function GET() {
  const gate = await requireKeith();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  try {
    const snippets = await listSnippets({ limit: 100 });
    return NextResponse.json({ snippets });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const gate = await requireKeith();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const body = (await req.json().catch(() => null)) as {
    text?: string;
    themes?: string[];
    people?: string[];
    era?: SnippetEra | null;
    autoTag?: boolean;
  } | null;

  const text = body?.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    let themes = body?.themes ?? [];
    let people = body?.people ?? [];
    let era: SnippetEra | null = body?.era ?? null;

    if (body?.autoTag !== false) {
      const tags = await autoTagSnippet(text);
      themes = themes.length ? themes : tags.themes;
      people = people.length ? people : tags.people;
      era = era ?? tags.era;
    }

    const snippet = await createSnippet(
      { text, themes, people, era, source: "capture-tab" },
      gate.user!.id
    );
    return NextResponse.json({ snippet });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
