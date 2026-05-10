import { encodeBusinessSnapshot } from "@/lib/business-snapshot";
import type { Business } from "@/lib/data";

/** Customer-facing URL encoded in QR codes — `/r/[slug]` opens reviews directly; snapshots stay on `biz=`. */
export function buildCustomerReviewUrl(origin: string, business: Business): string {
  const slug = business.qrSlug?.trim();
  if (slug) {
    return `${origin.replace(/\/$/, "")}/r/${encodeURIComponent(slug)}`;
  }
  return `${origin.replace(/\/$/, "")}/?biz=${encodeURIComponent(encodeBusinessSnapshot(business))}`;
}
