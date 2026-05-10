import { NextRequest, NextResponse } from "next/server";
import { getMergedBusinessForSlug } from "@/lib/merge-business";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const business = await getMergedBusinessForSlug(slug);
  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    { business },
    {
      headers: {
        "Cache-Control": "private, no-store, must-revalidate",
      },
    }
  );
}
