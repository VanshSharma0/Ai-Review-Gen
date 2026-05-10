export interface Review {
  text: string;
  name: string;
  avatar: string;
}

export interface Business {
  /** Stable id (slug for curated listings, UUID from AI snapshot rows). */
  id: string;
  /** When set, QR uses compact `/?b=slug` (recommended for print). */
  qrSlug?: string;
  /** Area or neighbourhood for natural SEO-style phrases in generated reviews (e.g. "Uttam Nagar, Delhi"). */
  location?: string;
  name: string;
  type: string;
  icon: string;
  rating: string;
  googleUrl: string;
  reviews: Review[];
}

const TYPE_ICON: Record<string, string> = {
  restaurant: "🍽️",
  food: "🍽️",
  cafe: "☕",
  bar: "🍸",
  bakery: "🥐",
  meal_delivery: "🥡",
  meal_takeaway: "🥡",
  gym: "💪",
  spa: "💆",
  beauty_salon: "💇",
  hair_care: "💇",
  dentist: "🦷",
  doctor: "⚕️",
  hospital: "🏥",
  pharmacy: "💊",
  store: "🏪",
  shopping_mall: "🛍️",
  electronics_store: "💻",
  jewelry_store: "💍",
  florist: "🌸",
  lodging: "🏨",
  gas_station: "⛽",
  car_repair: "🔧",
  bank: "🏦",
  lawyer: "⚖️",
  real_estate_agency: "🏠",
  church: "⛪",
  mosque: "🕌",
  hindu_temple: "🛕",
  park: "🌳",
  tourist_attraction: "📍",
  museum: "🏛️",
  movie_theater: "🎬",
  night_club: "🎉",
};

export function iconForPlaceTypes(types?: string[]): string {
  if (!types?.length) return "📍";
  for (const t of types) {
    if (TYPE_ICON[t]) return TYPE_ICON[t];
  }
  return "📍";
}

export function formatPlaceTypes(types?: string[]): string {
  if (!types?.length) return "Business";
  const primary = types[0];
  return primary
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
