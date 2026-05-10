import type { Business } from "@/lib/data";
import { getBusinessBySlug } from "@/lib/static-businesses";

/** Static curated listing first, then MongoDB via `/api/business/by-slug`. */
export async function resolveBusinessBySlug(
  rawSlug: string
): Promise<Business | null> {
  const trimmed = rawSlug.trim();
  if (!trimmed) return null;

  const local = getBusinessBySlug(trimmed);
  if (local) return local;

  try {
    const res = await fetch(
      `/api/business/by-slug?slug=${encodeURIComponent(trimmed)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { business?: Business };
    return data.business ?? null;
  } catch {
    return null;
  }
}
