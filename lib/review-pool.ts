import type { Business } from "@/lib/data";
import { getReviewBatchesForBusiness } from "@/lib/static-businesses";
import { dedupeReviewsByText } from "@/lib/random-reviews";
import { filterReviewsNoDevanagari } from "@/lib/review-language";

/** All curated lines available for random sampling (static listing). */
export function reviewPoolForStaticBusiness(b: Business) {
  const batches = getReviewBatchesForBusiness(b);
  const raw = batches?.length
    ? dedupeReviewsByText(batches.flat())
    : [...b.reviews];
  return filterReviewsNoDevanagari(raw);
}
