import type { Business } from "@/lib/data";
import { getBusinessBySlug } from "@/lib/static-businesses";
import { pickRandomReviews } from "@/lib/random-reviews";
import { reviewPoolForStaticBusiness } from "@/lib/review-pool";

/** Resolves merged business; falls back to randomized static pool when API misses. */
export async function resolveBusinessBySlug(
  rawSlug: string
): Promise<Business | null> {
  const trimmed = rawSlug.trim();
  if (!trimmed) return null;

  try {
    const res = await fetch(
      `/api/business/by-slug?slug=${encodeURIComponent(trimmed)}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = (await res.json()) as { business?: Business };
      if (data.business) return data.business;
    }
  } catch {
    /* fall through */
  }

  const local = getBusinessBySlug(trimmed);
  if (!local) return null;
  const pool = reviewPoolForStaticBusiness(local);
  return {
    ...local,
    reviews: pickRandomReviews(pool.length ? pool : [...local.reviews], 4),
  };
}
