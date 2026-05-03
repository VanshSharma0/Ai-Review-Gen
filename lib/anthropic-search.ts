import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import type { Business, Review } from "@/lib/data";

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
    if (text.length > 280) continue;
    if (text) out.push({ text, name, avatar });
  }
  return out.slice(0, 4);
}

function parseBusiness(raw: unknown): Business | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!name) return null;
  const type = typeof o.type === "string" ? o.type.trim() : "Business";
  const icon =
    typeof o.icon === "string" && o.icon.trim()
      ? o.icon.trim().slice(0, 6)
      : "📍";
  const ratingRaw = o.rating;
  const rating =
    typeof ratingRaw === "number"
      ? ratingRaw.toFixed(1)
      : typeof ratingRaw === "string"
        ? ratingRaw.trim() || "4.8"
        : "4.8";
  const googleUrl =
    typeof o.googleUrl === "string" && o.googleUrl.startsWith("http")
      ? o.googleUrl
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
  const reviews = parseReviews(o.reviews);
  return {
    id: randomUUID(),
    name,
    type,
    icon,
    rating,
    googleUrl,
    reviews,
  };
}

export async function searchBusinessesWithAnthropic(userQuery: string): Promise<Business[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const model =
    process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5";

  const client = new Anthropic({ apiKey });

  const prompt = `The user is searching for businesses with this query: ${JSON.stringify(userQuery)}

Return ONLY valid JSON (no markdown fences, no commentary) with exactly this shape:
{"businesses":[{"name":"string","type":"short category label","icon":"one emoji","rating":"4.7","googleUrl":"https://www.google.com/maps/search/?api=1&query=...","reviews":[{"text":"string max 160 chars","name":"First L.","avatar":"F"}, ...]}, ...]}

Rules:
- Return between 4 and 6 businesses that plausibly match the query (names + implied city/region if inferable).
- Each business must have exactly 3 reviews: believable positive templates (not quotes from real named individuals).
- googleUrl: proper Google Maps search URL including business name + location hints when possible.
- rating: string between "4.2" and "5.0".
- Keep JSON compact so total output stays reasonable.

JSON only.`;

  const msg = await client.messages.create({
    model,
    max_tokens: 8192,
    temperature: 0.35,
    messages: [{ role: "user", content: prompt }],
  });

  const block = msg.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected response from model");
  }

  const rawText = stripJsonFence(block.text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = JSON.parse(extractJsonObject(rawText));
  }

  const businessesRaw = (parsed as { businesses?: unknown }).businesses;
  if (!Array.isArray(businessesRaw)) return [];

  return businessesRaw
    .map(parseBusiness)
    .filter((b): b is Business => b !== null)
    .slice(0, 8);
}
