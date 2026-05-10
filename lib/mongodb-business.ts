import type { Document } from "mongodb";
import type { Business, Review } from "@/lib/data";
import { getMongoClient } from "@/lib/mongodb";
import { filterReviewsNoDevanagari, reviewHasNoDevanagari } from "@/lib/review-language";

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

function dbNames() {
  const dbName = process.env.MONGODB_DB?.trim() || "reviewqr";
  const collName = process.env.MONGODB_BUSINESSES_COLLECTION?.trim() || "businesses";
  return { dbName, collName };
}

/** Raw Mongo document for a business slug (may be reviews-only overlay). */
export async function findBusinessDocumentBySlug(
  rawSlug: string
): Promise<Document | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const key = rawSlug.trim().toLowerCase();
  if (!key) return null;
  const { dbName, collName } = dbNames();
  const coll = client.db(dbName).collection(collName);

  return coll.findOne({
    $or: [{ qrSlug: key }, { slug: key }, { id: key }],
  });
}

/** Parsed `reviews` array when present and valid; empty array is allowed. */
export function parseReviewsFromDoc(doc: Document): Review[] | undefined {
  if (!Object.prototype.hasOwnProperty.call(doc, "reviews")) return undefined;
  const rawReviews = doc.reviews;
  if (!Array.isArray(rawReviews)) return undefined;
  if (!rawReviews.every(isReviewDoc)) return undefined;
  return filterReviewsNoDevanagari(
    rawReviews.map((r) => ({
      text: r.text.trim(),
      name: r.name.trim(),
      avatar: r.avatar.trim().slice(0, 1) || "?",
    }))
  );
}

/** Validates and normalizes a JSON reviews array from the client. */
export function normalizeReviewsArray(raw: unknown): Review[] | null {
  if (!Array.isArray(raw)) return null;
  const out: Review[] = [];
  for (const item of raw) {
    if (!isReviewDoc(item)) return null;
    const r: Review = {
      text: item.text.trim(),
      name: item.name.trim(),
      avatar: item.avatar.trim().slice(0, 1) || "?",
    };
    if (reviewHasNoDevanagari(r)) out.push(r);
  }
  return out.length > 0 ? out : null;
}

export type BusinessSnapshotForUpsert = {
  name: string;
  type: string;
  icon: string;
  rating: string;
  googleUrl: string;
  location?: string;
};

/** Upserts reviews for a slug; optional snapshot fills required fields for Mongo-only listings. */
export async function upsertReviewsForSlug(
  rawSlug: string,
  reviews: Review[],
  snapshot?: BusinessSnapshotForUpsert
): Promise<void> {
  const client = await getMongoClient();
  if (!client) {
    throw new Error(
      process.env.MONGODB_URI?.trim()
        ? "Database unavailable"
        : "MONGODB_URI is not configured"
    );
  }

  const key = rawSlug.trim().toLowerCase();
  if (!key) throw new Error("Invalid slug");
  const { dbName, collName } = dbNames();
  const coll = client.db(dbName).collection(collName);

  const setDoc: Record<string, unknown> = {
    qrSlug: key,
    id: key,
    reviews,
    updatedAt: new Date(),
  };

  if (snapshot) {
    setDoc.name = snapshot.name;
    setDoc.type = snapshot.type;
    setDoc.icon = snapshot.icon;
    setDoc.rating = snapshot.rating;
    setDoc.googleUrl = snapshot.googleUrl;
    if (snapshot.location) setDoc.location = snapshot.location;
  }

  await coll.updateOne(
    { $or: [{ qrSlug: key }, { id: key }] },
    { $set: setDoc },
    { upsert: true }
  );
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
  const reviews: Review[] = filterReviewsNoDevanagari(
    rawReviews.map((r) => ({
      text: r.text.trim(),
      name: r.name.trim(),
      avatar: r.avatar.trim().slice(0, 1) || "?",
    }))
  );

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
  const doc = await findBusinessDocumentBySlug(rawSlug);
  if (!doc) return null;
  return mongoDocToBusiness(doc);
}
