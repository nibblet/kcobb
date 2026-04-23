import { NextResponse } from "next/server";
import { requireKeith } from "@/lib/auth/require-keith";
import { generateStartHelper } from "@/lib/snippets/start-helper";

export async function POST(req: Request) {
  const gate = await requireKeith();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const body = (await req.json().catch(() => null)) as {
    topic?: string;
    snippetId?: string;
  } | null;
  if (!body || (!body.topic && !body.snippetId)) {
    return NextResponse.json(
      { error: "topic or snippetId is required" },
      { status: 400 }
    );
  }
  try {
    const result = await generateStartHelper({
      topic: body.topic,
      snippetId: body.snippetId,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
