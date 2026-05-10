import { NextRequest, NextResponse } from "next/server";
import { getBusinessFromMongoBySlug } from "@/lib/mongodb-business";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  if (!process.env.MONGODB_URI?.trim()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const business = await getBusinessFromMongoBySlug(slug);
  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ business });
}
