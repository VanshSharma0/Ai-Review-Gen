import Anthropic from "@anthropic-ai/sdk";
import type { Review } from "@/lib/data";
import { REVIEW_OWNER_NAMES, REVIEW_STAFF_NAMES } from "@/lib/review-personas";

function stripJsonFence(s: string): string {
  let t = s.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\n?```\s*$/, "");
  }
  return t.trim();
}

function extractJsonObject(s: string): string {
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object in response");
  return s.slice(start, end + 1);
}

function extractJsonArray(s: string): string {
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start === -1 || end <= start) throw new Error("No JSON array in response");
  return s.slice(start, end + 1);
}

function normalizeReviewsPayload(parsed: unknown): unknown {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object" && "reviews" in parsed) {
    return (parsed as { reviews: unknown }).reviews;
  }
  return [];
}

function parseReviews(raw: unknown): Review[] {
  if (!Array.isArray(raw)) return [];
  const out: Review[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const text = typeof o.text === "string" ? o.text.trim() : "";
    const name = typeof o.name === "string" ? o.name.trim() : "Customer";
    let avatar =
      typeof o.avatar === "string" ? o.avatar.trim().slice(0, 1) : "";
    if (!avatar) avatar = name.charAt(0).toUpperCase() || "?";
    if (text.length > 380) continue;
    if (text) out.push({ text, name, avatar });
  }
  return out.slice(0, 6);
}

export async function generateCasualReviews(
  businessName: string,
  businessType: string,
  options?: {
    personalize?: boolean;
    location?: string;
    /** Passed from the client so each click asks for a distinct batch. */
    variationNonce?: string | number;
  }
): Promise<Review[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) throw new Error("ANTHROPIC_API_KEY is not configured");

  const model =
    process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5";

  const client = new Anthropic({ apiKey });

  const personalize = options?.personalize !== false;

  const location = options?.location?.trim();
  const locationBlock = location
    ? `
Location context (use naturally, not in every sentence): ${JSON.stringify(location)}
Weave local SEO phrases sparingly across the set where they sound like something a real customer would say — for example ideas like "best ${businessType.toLowerCase()} in [area]", "most affordable rates", "trusted shop in [area]" — but NEVER keyword-stuff; each review must feel authentic and readable.
`
    : `
Across the set, a few reviews may naturally include helpful search-style wording (e.g. naming the category and rough area or value like rates or trust) only where it fits a believable Google review — avoid robotic repetition.
`;

  const nonce = options?.variationNonce;
  const variationBlock =
    nonce !== undefined && nonce !== ""
      ? `
Freshness (required): Generation batch id ${JSON.stringify(String(nonce))}.
These four reviews must feel NEW compared to any generic earlier set: vary angles (e.g. staff, pricing transparency, collection range, wedding shopping, repair/polishing, trust, wait time), vocabulary, and scenarios. Do not mirror boilerplate wording across batches.
`
      : "";

  const personaBlock = personalize
    ? `
Personalisation (when naming someone):
- OWNERS: ${REVIEW_OWNER_NAMES.join(", ")}. STAFF: ${REVIEW_STAFF_NAMES.join(", ")}.
- At most ONE person's first name per review — never two names in the same review. Many reviews should name nobody.
- Prefer SHORT blurbs: include 2–3 reviews that are a single short sentence (under ~90 characters); keep the remaining 1–2 still concise (ideally under ~200 characters each unless Hindi needs an extra few words).
- About half the set may use Hindi or Hinglish where it fits; keep wording natural.
`
    : "";

  const prompt = `Business name: ${JSON.stringify(businessName)}
Category: ${JSON.stringify(businessType)}
${locationBlock}
${variationBlock}
${personaBlock}
Return ONLY valid JSON (no markdown): {"reviews":[{"text":"...","name":"First L.","avatar":"F"}, ...]}

Generate exactly 4 NEW positive Google-review-style blurbs a customer might paste.
Requirements:
- Keep each review COMPACT: casual mobile-review length — avoid long paragraphs. Typical blurbs ~1–2 short sentences; several should be very brief one-liners.
- Use correct grammar and spelling throughout. Casual tone is fine; avoid stuffing typos or broken English.
- SEO: At least ONE review should naturally mention locality or value in a tight phrase (e.g. area + affordable rates), without long filler — still human and short.
- NO em dashes. Vary length across the four but bias shorter overall.
- Reviewer "name" field: plausible customer names (Hindi script OK for Hindi reviews); avatar = first meaningful character of the display name.

JSON only.`;

  const temperature =
    options?.variationNonce !== undefined && options.variationNonce !== ""
      ? 0.93
      : 0.85;

  const msg = await client.messages.create({
    model,
    max_tokens: 4096,
    temperature,
    messages: [{ role: "user", content: prompt }],
  });

  const block = msg.content[0];
  if (!block || block.type !== "text") throw new Error("Unexpected model response");

  const rawText = stripJsonFence(block.text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    try {
      parsed = JSON.parse(extractJsonObject(rawText));
    } catch {
      parsed = JSON.parse(extractJsonArray(rawText));
    }
  }

  return parseReviews(normalizeReviewsPayload(parsed));
}
