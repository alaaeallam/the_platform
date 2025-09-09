// utils/db.ts
import mongoose from "mongoose";
import { env } from "@/lib/env";

type Cached = {
  conn: mongoose.Mongoose | null;
  isConnected: number; // 0 = disconnected, 1 = connected
};

// Reuse a global cache in dev to survive HMR
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: Cached | undefined;
}

const cached: Cached = global._mongooseCache ?? { conn: null, isConnected: 0 };
if (!global._mongooseCache) {
  global._mongooseCache = cached;
}

function resolveMongoUri(): string {
  // Support either key (Auth.js samples often use MONGODB_URI)
  const uri = process.env.MONGODB_URI ?? (process.env.MONGODB_URI as string | undefined);
  if (!uri) throw new Error("Please define MONGODB_URI in environment variables");
  return uri;
}

export async function connectDb() {
  if (cached.isConnected === 1 && cached.conn) {
    // Already connected
    return;
  }

  const uri = resolveMongoUri();

  // If a prior instance exists but isn't connected, disconnect first
  if (mongoose.connections.length > 0 && mongoose.connections[0].readyState !== 1) {
    await mongoose.disconnect();
  }

  try {
    const db = await mongoose.connect(uri);
    cached.conn = db;
    cached.isConnected = db.connections[0].readyState; // 1 = connected
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

export async function disconnectDb() {
  if (cached.isConnected && process.env.NODE_ENV === "production") {
    await mongoose.disconnect();
    cached.conn = null;
    cached.isConnected = 0;
  } else {
    // Keep connection open in dev for faster HMR
  }
}

const db = { connectDb, disconnectDb };
export default db;