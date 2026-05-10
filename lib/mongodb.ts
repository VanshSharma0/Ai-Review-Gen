import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI?.trim();

let cachedClient: MongoClient | null = null;
let inFlight: Promise<MongoClient | null> | null = null;
/** After a failed connect, skip retries briefly to avoid log spam and slow requests. */
let backoffUntil = 0;
const BACKOFF_MS = 45_000;

/**
 * Returns a connected client, or `null` when `MONGODB_URI` is unset or connection fails.
 * Does not throw — callers should fall back (e.g. static business data).
 */
export async function getMongoClient(): Promise<MongoClient | null> {
  if (!uri) return null;
  if (cachedClient) return cachedClient;
  if (Date.now() < backoffUntil) return null;

  if (!inFlight) {
    inFlight = (async () => {
      try {
        const client = new MongoClient(uri);
        await client.connect();
        cachedClient = client;
        return client;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`[mongodb] Connection failed (using fallback): ${msg}`);
        backoffUntil = Date.now() + BACKOFF_MS;
        return null;
      } finally {
        inFlight = null;
      }
    })();
  }

  return inFlight;
}
