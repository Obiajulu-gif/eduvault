import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is not set in environment variables");
}

let client;
let clientPromise;

// Reuse the client across hot reloads in dev
if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export async function getDb() {
  const client = await clientPromise;
  // When DB name is in connection string, driver selects it automatically.
  // Otherwise, fallback to "eduvault".
  const dbName = process.env.MONGODB_DB || "eduvault";
  return client.db(dbName);
}