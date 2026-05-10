import type { Business, Review } from "@/lib/data";
import { filterReviewsNoDevanagari } from "@/lib/review-language";

function isReview(x: unknown): x is Review {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.text === "string" &&
    typeof o.name === "string" &&
    typeof o.avatar === "string"
  );
}

function isBusiness(x: unknown): x is Business {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.name !== "string" ||
    typeof o.type !== "string" ||
    typeof o.icon !== "string" ||
    typeof o.rating !== "string" ||
    typeof o.googleUrl !== "string"
  ) {
    return false;
  }
  if (!Array.isArray(o.reviews) || !o.reviews.every(isReview)) return false;
  if (
    "location" in o &&
    o.location !== undefined &&
    typeof o.location !== "string"
  ) {
    return false;
  }
  return o.googleUrl.startsWith("http");
}

/** Compact payload for QR codes (browser-safe base64url). */
export function encodeBusinessSnapshot(business: Business): string {
  const json = JSON.stringify(business);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((byte) => {
    bin += String.fromCharCode(byte);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeBusinessSnapshot(encoded: string): Business | null {
  try {
    const padLen = (4 - (encoded.length % 4)) % 4;
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLen);
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    const parsed: unknown = JSON.parse(json);
    if (!isBusiness(parsed)) return null;
    const b = parsed as Business;
    return { ...b, reviews: filterReviewsNoDevanagari(b.reviews) };
  } catch {
    return null;
  }
}
