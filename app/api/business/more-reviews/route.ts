import { NextRequest, NextResponse } from "next/server";
import { generateCasualReviews } from "@/lib/anthropic-more-reviews";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      type?: string;
      personalize?: boolean;
    };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const type = typeof body.type === "string" ? body.type.trim() : "Business";
    if (!name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }

    const personalize = body.personalize !== false;

    const reviews = await generateCasualReviews(name, type, { personalize });
    if (reviews.length === 0) {
      return NextResponse.json(
        { error: "No reviews generated" },
        { status: 422 }
      );
    }

    return NextResponse.json({ reviews });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed";
    const status =
      message.includes("ANTHROPIC_API_KEY") || message.includes("not configured")
        ? 503
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
