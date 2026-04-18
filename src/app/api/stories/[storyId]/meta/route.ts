import { NextResponse } from "next/server";
import { getCanonicalStoryById } from "@/lib/wiki/corpus";

export async function GET(
  _request: Request,
  context: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await context.params;
  const story = await getCanonicalStoryById(storyId);
  if (!story) {
    return NextResponse.json({ title: null }, { status: 404 });
  }
  return NextResponse.json({ title: story.title });
}
