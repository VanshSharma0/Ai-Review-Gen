import type { Review } from "@/lib/data";

/** Devanagari script (Hindi, Marathi, etc.) — excluded from all customer-facing reviews. */
const DEVANAGARI = /[\u0900-\u097F]/;

export function containsDevanagari(s: string): boolean {
  return DEVANAGARI.test(s);
}

/** True if review text, name, and avatar use no Devanagari. */
export function reviewHasNoDevanagari(r: Review): boolean {
  return (
    !containsDevanagari(r.text) &&
    !containsDevanagari(r.name) &&
    !containsDevanagari(r.avatar)
  );
}

export function filterReviewsNoDevanagari(reviews: Review[]): Review[] {
  return reviews.filter(reviewHasNoDevanagari);
}
