import { NextRequest, NextResponse } from "next/server";
import {
  getCanonicalPrincipleBySlug,
  getPersonBySlug,
} from "@/lib/wiki/parser";
import { getCanonicalStoryById } from "@/lib/wiki/corpus";
import { getJourneyBySlug } from "@/lib/wiki/journeys";

const VALID_TYPES = new Set(["story", "journey", "principle", "person"]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");

  if (!type || !slug || !VALID_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  let title: string | null = null;
  switch (type) {
    case "story": {
      const story = await getCanonicalStoryById(slug);
      title = story?.title ?? null;
      break;
    }
    case "journey": {
      const journey = getJourneyBySlug(slug);
      title = journey?.title ?? null;
      break;
    }
    case "principle": {
      const principle = getCanonicalPrincipleBySlug(slug);
      title = principle?.title ?? null;
      break;
    }
    case "person": {
      const person = getPersonBySlug(slug);
      title = person?.name ?? null;
      break;
    }
  }

  if (!title) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ type, slug, title });
}
