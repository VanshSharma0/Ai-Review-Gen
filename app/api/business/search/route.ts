import { NextRequest, NextResponse } from "next/server";
import { searchBusinessesWithAnthropic } from "@/lib/anthropic-search";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ businesses: [] });
  }

  try {
    const businesses = await searchBusinessesWithAnthropic(q);
    return NextResponse.json({ businesses });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    const status =
      message.includes("ANTHROPIC_API_KEY") || message.includes("not configured")
        ? 503
        : 500;
    return NextResponse.json({ error: message, businesses: [] }, { status });
  }
}
