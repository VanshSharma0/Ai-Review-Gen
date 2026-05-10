import { NextRequest, NextResponse } from "next/server";
import {
  normalizeReviewsArray,
  upsertReviewsForSlug,
  type BusinessSnapshotForUpsert,
} from "@/lib/mongodb-business";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.MONGODB_URI?.trim()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const body = (await req.json()) as {
      qrSlug?: string;
      reviews?: unknown;
      snapshot?: Record<string, unknown>;
    };

    const qrSlug = typeof body.qrSlug === "string" ? body.qrSlug.trim() : "";
    const reviews = normalizeReviewsArray(body.reviews);

    if (!qrSlug || reviews === null) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    let snapshot: BusinessSnapshotForUpsert | undefined;
    const s = body.snapshot;
    if (s && typeof s === "object") {
      const name = typeof s.name === "string" ? s.name.trim() : "";
      const type = typeof s.type === "string" ? s.type.trim() : "Business";
      const icon = typeof s.icon === "string" ? s.icon.trim() : "📍";
      const rating = typeof s.rating === "string" ? s.rating.trim() : "—";
      const googleUrl = typeof s.googleUrl === "string" ? s.googleUrl.trim() : "";
      const location =
        typeof s.location === "string" ? s.location.trim() : undefined;

      if (name && googleUrl.startsWith("http")) {
        snapshot = {
          name,
          type,
          icon,
          rating,
          googleUrl,
          ...(location ? { location } : {}),
        };
      }
    }

    await upsertReviewsForSlug(qrSlug, reviews, snapshot);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    const status =
      message.includes("MONGODB_URI") ||
      message.includes("Database unavailable")
        ? 503
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
