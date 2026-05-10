import type { Business, Review } from "@/lib/data";
import { getBusinessBySlug } from "@/lib/static-businesses";
import {
  findBusinessDocumentBySlug,
  mongoDocToBusiness,
  parseReviewsFromDoc,
} from "@/lib/mongodb-business";
import { dedupeReviewsByText, pickRandomReviews } from "@/lib/random-reviews";
import { reviewPoolForStaticBusiness } from "@/lib/review-pool";
import { filterReviewsNoDevanagari } from "@/lib/review-language";

const SAMPLE_COUNT = 4;

function buildReviewPool(
  staticBiz: Business | null,
  mongoBiz: Business | null,
  overlayReviews: Review[] | undefined
): Review[] {
  const chunks: Review[][] = [];

  if (staticBiz) {
    chunks.push(reviewPoolForStaticBusiness(staticBiz));
  }

  if (overlayReviews?.length) {
    chunks.push([...overlayReviews]);
  }

  if (staticBiz && mongoBiz?.reviews?.length) {
    chunks.push([...mongoBiz.reviews]);
  }

  if (!staticBiz && mongoBiz?.reviews?.length) {
    chunks.push([...mongoBiz.reviews]);
  }

  return filterReviewsNoDevanagari(dedupeReviewsByText(chunks.flat()));
}

function sampleDisplayReviews(pool: Review[]): Review[] {
  if (pool.length === 0) return [];
  return pickRandomReviews(pool, SAMPLE_COUNT);
}

/**
 * Static curated row + Mongo; each request returns a random sample of reviews
 * from the combined pool (curated batches, saved AI lines, etc.).
 */
export async function getMergedBusinessForSlug(
  rawSlug: string
): Promise<Business | null> {
  const key = rawSlug.trim().toLowerCase();
  if (!key) return null;

  const staticBiz = getBusinessBySlug(key);
  let doc = null;
  try {
    doc = await findBusinessDocumentBySlug(key);
  } catch (e) {
    console.warn(
      "[merge-business] Mongo lookup failed, using static only:",
      e instanceof Error ? e.message : e
    );
    doc = null;
  }

  if (!doc) {
    if (!staticBiz) return null;
    const pool = buildReviewPool(staticBiz, null, undefined);
    const reviews = sampleDisplayReviews(pool);
    return { ...staticBiz, reviews };
  }

  const mongoBiz = mongoDocToBusiness(doc);
  const overlayReviews = parseReviewsFromDoc(doc);

  const pool = buildReviewPool(staticBiz, mongoBiz, overlayReviews);
  let reviews = sampleDisplayReviews(pool);

  if (reviews.length === 0 && staticBiz?.reviews?.length) {
    reviews = pickRandomReviews(reviewPoolForStaticBusiness(staticBiz), SAMPLE_COUNT);
  }
  if (reviews.length === 0 && mongoBiz?.reviews?.length) {
    reviews = pickRandomReviews([...mongoBiz.reviews], SAMPLE_COUNT);
  }

  if (staticBiz) {
    return { ...staticBiz, reviews };
  }

  if (mongoBiz) {
    return { ...mongoBiz, reviews };
  }

  return null;
}
