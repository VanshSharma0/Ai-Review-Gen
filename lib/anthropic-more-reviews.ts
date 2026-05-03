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
    if (text.length > 480) continue;
    if (text) out.push({ text, name, avatar });
  }
  return out.slice(0, 6);
}

export async function generateCasualReviews(
  businessName: string,
  businessType: string,
  options?: { personalize?: boolean }
): Promise<Review[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) throw new Error("ANTHROPIC_API_KEY is not configured");

  const model =
    process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5";

  const client = new Anthropic({ apiKey });

  const personalize = options?.personalize !== false;

  const personaBlock = personalize
    ? `
Personalisation (when naming someone):
- OWNERS: ${REVIEW_OWNER_NAMES.join(", ")}. STAFF: ${REVIEW_STAFF_NAMES.join(", ")}.
- At most ONE person's first name per review — never two names in the same review. Many reviews should name nobody.
- Include 1–2 very SHORT simple lines among the 4 (examples: "Very good showroom.", "Good collection.", "Recommended.").
- About half the set may use Hindi or Hinglish where it fits; keep wording natural.
`
    : "";

  const prompt = `Business name: ${JSON.stringify(businessName)}
Category: ${JSON.stringify(businessType)}
${personaBlock}
Return ONLY valid JSON (no markdown): {"reviews":[{"text":"...","name":"First L.","avatar":"F"}, ...]}

Generate exactly 4 NEW positive Google-review-style blurbs a customer might paste.
Requirements:
- Use correct grammar and spelling throughout. Casual tone is fine; avoid stuffing typos or broken English.
- Include 1–2 very short simple reviews in the set (e.g. praising showroom, collection, or service in a brief line).
- NO em dashes. Vary length across the four.
- Reviewer "name" field: plausible customer names (Hindi script OK for Hindi reviews); avatar = first meaningful character of the display name.

JSON only.`;

  const msg = await client.messages.create({
    model,
    max_tokens: 4096,
    temperature: 0.85,
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
