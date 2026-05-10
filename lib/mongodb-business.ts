import type { Document } from "mongodb";
import type { Business, Review } from "@/lib/data";
import { getMongoClient } from "@/lib/mongodb";

function isReviewDoc(x: unknown): x is Review {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.text === "string" &&
    typeof o.name === "string" &&
    typeof o.avatar === "string" &&
    o.text.trim().length > 0
  );
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function mongoDocToBusiness(doc: Document): Business | null {
  const name = asString(doc.name);
  const type = asString(doc.type) ?? "Business";
  const icon = asString(doc.icon) ?? "📍";
  const rating = asString(doc.rating) ?? "—";
  const googleUrl = asString(doc.googleUrl);
  if (!name || !googleUrl || !googleUrl.startsWith("http")) return null;

  const rawReviews = doc.reviews;
  if (!Array.isArray(rawReviews) || !rawReviews.every(isReviewDoc)) return null;
  const reviews: Review[] = rawReviews.map((r) => ({
    text: r.text.trim(),
    name: r.name.trim(),
    avatar: r.avatar.trim().slice(0, 1) || "?",
  }));

  const id =
    asString(doc.id) ??
    (doc._id != null ? String(doc._id) : null) ??
    asString(doc.slug) ??
    asString(doc.qrSlug);
  if (!id?.trim()) return null;

  const slug = asString(doc.qrSlug) ?? asString(doc.slug) ?? id;
  const location = asString(doc.location) ?? undefined;

  return {
    id,
    qrSlug: slug,
    name,
    type,
    icon,
    rating,
    googleUrl,
    reviews,
    ...(location ? { location } : {}),
  };
}

export async function getBusinessFromMongoBySlug(
  rawSlug: string
): Promise<Business | null> {
  const clientP = getMongoClient();
  if (!clientP) return null;

  const key = rawSlug.trim().toLowerCase();
  if (!key) return null;

  const client = await clientP;
  const dbName = process.env.MONGODB_DB?.trim() || "reviewqr";
  const collName = process.env.MONGODB_BUSINESSES_COLLECTION?.trim() || "businesses";
  const coll = client.db(dbName).collection(collName);

  const doc = await coll.findOne({
    $or: [{ qrSlug: key }, { slug: key }, { id: key }],
  });
  if (!doc) return null;
  return mongoDocToBusiness(doc);
}
