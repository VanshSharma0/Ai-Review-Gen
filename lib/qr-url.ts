import { encodeBusinessSnapshot } from "@/lib/business-snapshot";
import type { Business } from "@/lib/data";

/** Customer-facing URL encoded in QR codes — prefers short `b=` slug over heavy snapshots. */
export function buildCustomerReviewUrl(origin: string, business: Business): string {
  const slug = business.qrSlug?.trim();
  if (slug) {
    return `${origin.replace(/\/$/, "")}/?b=${encodeURIComponent(slug)}`;
  }
  return `${origin.replace(/\/$/, "")}/?biz=${encodeURIComponent(encodeBusinessSnapshot(business))}`;
}
