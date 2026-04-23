import { NextResponse } from "next/server";
import { requireKeith } from "@/lib/auth/require-keith";
import {
  deleteSnippet,
  updateSnippet,
  type SnippetEra,
} from "@/lib/snippets";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireKeith();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    text?: string;
    themes?: string[];
    people?: string[];
    era?: SnippetEra | null;
    expandable?: boolean;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  try {
    const snippet = await updateSnippet(id, body, gate.user!.id);
    return NextResponse.json({ snippet });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireKeith();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { id } = await params;
  try {
    await deleteSnippet(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
