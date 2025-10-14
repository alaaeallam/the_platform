// lib/mongodb.ts
import mongoose, { type ConnectOptions } from "mongoose";

/**
 * Reuse a single Mongoose connection across hot reloads in Next.js.
 * Adds IPv4 preference to avoid SRV/IPv6 DNS issues (ETIMEOUT).
 */

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // Node global cache for the Mongoose connection (type declaration only)
  var _mongooseCached: Cached | undefined;
}

// Allow TS to “see” the augmented global property
const g = global as typeof globalThis & { _mongooseCached?: Cached };

const MONGODB_URI = process.env.MONGODB_URI ?? process.env.MONGODB_URL;
if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI / MONGODB_URL");
}

// Optional explicit DB name if it's not embedded in the URI
const DB_NAME = process.env.MONGODB_DB;

const cached: Cached = g._mongooseCached ?? { conn: null, promise: null };
g._mongooseCached = cached;

export default async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts: ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10_000,
      family: 4, // prefer IPv4; avoids common SRV DNS timeouts
      ...(DB_NAME ? { dbName: DB_NAME } : {}),
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}