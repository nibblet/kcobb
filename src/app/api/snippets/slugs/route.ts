import { NextResponse } from "next/server";
import { requireKeith } from "@/lib/auth/require-keith";
import { getPersonSlugs, getThemeSlugs } from "@/lib/wiki/wiki-slugs";

export async function GET() {
  const gate = await requireKeith();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  return NextResponse.json({
    themes: getThemeSlugs(),
    people: getPersonSlugs(),
  });
}
