import type { Review } from "@/lib/data";

export function shuffleArray<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

/** Dedupe by review text, first occurrence wins. */
export function dedupeReviewsByText(reviews: Review[]): Review[] {
  const seen = new Set<string>();
  const out: Review[] = [];
  for (const r of reviews) {
    const k = r.text.trim();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

/** Random subset (shuffled) of up to `count` reviews from `pool`. */
export function pickRandomReviews(pool: Review[], count: number): Review[] {
  if (pool.length === 0) return [];
  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
