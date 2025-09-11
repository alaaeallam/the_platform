// lib/mongodb.ts
import mongoose from "mongoose";

/**
 * Mongoose connection helper for Next.js (App Router).
 * Reuses a single connection across hot reloads in dev.
 */
type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCached: Cached | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI ?? process.env.MONGODB_URL;
if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI / MONGODB_URL");
}

const cached: Cached = global._mongooseCached || { conn: null, promise: null };
global._mongooseCached = cached;

export default async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
      // You can add options here if needed
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
