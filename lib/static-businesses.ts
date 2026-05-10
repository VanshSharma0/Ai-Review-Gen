import type { Business, Review } from "@/lib/data";

/** Short slug for scannable QR (must stay compact — avoid base64 payloads in QR). */
export const MURTI_SLUG = "murti";

/**
 * Page-ready batches (page 1 = index 0). English only; at most one staff/owner name per review.
 */
export const MURTI_REVIEW_BATCHES: Review[][] = [
  [
    {
      text: "Best jewellery showroom in Uttam Nagar, affordable rates and honest staff.",
      name: "Customer",
      avatar: "C",
    },
    {
      text: "Good collection. Worth visiting.",
      name: "Vikram N.",
      avatar: "V",
    },
    {
      text: "Very helpful staff. Tinku changed the ring size for us right away.",
      name: "Rajesh K.",
      avatar: "R",
    },
    {
      text: "Neeraj handled billing calmly and did not rush us.",
      name: "Meena L.",
      avatar: "M",
    },
  ],
  [
    {
      text: "Nice place for gold jewellery.",
      name: "Arjun T.",
      avatar: "A",
    },
    {
      text: "Harish ji explained the rates clearly. No pressure.",
      name: "Sonia P.",
      avatar: "S",
    },
    {
      text: "Gold rates are clearly posted on the board. Staff is courteous.",
      name: "Sneha S.",
      avatar: "S",
    },
    {
      text: "Musharaf showed many ring options and was patient throughout.",
      name: "Karan D.",
      avatar: "K",
    },
  ],
  [
    {
      text: "Very good staff. Friendly atmosphere.",
      name: "Fatima Z.",
      avatar: "F",
    },
    {
      text: "Anjali madam showed us the full collection at a comfortable pace.",
      name: "Ravi O.",
      avatar: "R",
    },
    {
      text: "Good service.",
      name: "Neha G.",
      avatar: "N",
    },
    {
      text: "Preeti coordinated my chain order and it was ready in three days.",
      name: "Deepak B.",
      avatar: "D",
    },
  ],
  [
    {
      text: "Honest weighing. Everything done in front of us.",
      name: "Leela K.",
      avatar: "L",
    },
    {
      text: "Vansh sir explained hallmark in simple words.",
      name: "Geeta V.",
      avatar: "G",
    },
    {
      text: "Anjali patiently walked us through the diamond options.",
      name: "Suresh H.",
      avatar: "S",
    },
    {
      text: "Repeat customer. Always satisfied.",
      name: "Pooja M.",
      avatar: "P",
    },
  ],
  [
    {
      text: "Beautiful jewellery on display.",
      name: "James C.",
      avatar: "J",
    },
    {
      text: "Tinku called when my chain order was ready.",
      name: "Riya B.",
      avatar: "R",
    },
    {
      text: "Making charges felt fair compared to other shops nearby.",
      name: "Amit P.",
      avatar: "A",
    },
    {
      text: "Harish ji remembered us from last time. A thoughtful touch.",
      name: "Harsh O.",
      avatar: "H",
    },
  ],
  [
    {
      text: "They speak Hindi and English at the counter. Easy to communicate.",
      name: "Manish V.",
      avatar: "M",
    },
    {
      text: "Neeraj called with clear updates on my order delivery.",
      name: "Lata S.",
      avatar: "L",
    },
    {
      text: "Recommended.",
      name: "Zoya A.",
      avatar: "Z",
    },
    {
      text: "Sunday rush but staff stayed polite. Polishing done the same day.",
      name: "David L.",
      avatar: "D",
    },
  ],
];

export const murtiJewellers: Business = {
  id: MURTI_SLUG,
  qrSlug: MURTI_SLUG,
  location: "Uttam Nagar, Delhi",
  name: "Murti Jewellers",
  type: "Gold & Diamond Jewellery",
  icon: "💍",
  rating: "4.9",
  googleUrl: "https://g.page/r/CXYwweXdV0-xEAI/review",
  reviews: MURTI_REVIEW_BATCHES[0],
};

const BY_SLUG: Record<string, Business> = {
  [MURTI_SLUG]: murtiJewellers,
};

export function getBusinessBySlug(slug: string): Business | null {
  const key = slug.trim().toLowerCase();
  return BY_SLUG[key] ?? null;
}

export function getReviewBatchesForBusiness(b: Business): Review[][] | null {
  if (b.qrSlug === MURTI_SLUG || b.id === MURTI_SLUG) {
    return MURTI_REVIEW_BATCHES;
  }
  return null;
}

export function searchStaticBusinesses(query: string): Business[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return Object.values(BY_SLUG).filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.type.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q)
  );
}
