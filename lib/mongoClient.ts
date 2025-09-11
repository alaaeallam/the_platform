// lib/mongoClient.ts
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI ?? process.env.MONGODB_URL ?? "";
if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI / MONGODB_URL");
}

type GlobalWithMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};
const _global = globalThis as GlobalWithMongo;

const clientPromise: Promise<MongoClient> =
  _global._mongoClientPromise ??
  new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  }).connect();

if (process.env.NODE_ENV !== "production") {
  _global._mongoClientPromise = clientPromise;
}

export default clientPromise;