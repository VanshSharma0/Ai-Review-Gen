import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI?.trim();

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient> | undefined;

if (uri) {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

/** Returns a connected client, or `null` when `MONGODB_URI` is not set. */
export function getMongoClient(): Promise<MongoClient> | null {
  if (!clientPromise) return null;
  return clientPromise;
}
