import mongoose from "mongoose";
import { env } from "@/lib/env";

interface Cached {
  conn: typeof mongoose | null;
  isConnected: number;
}

// Reuse a global cache in dev
const globalForMongoose = globalThis as unknown as { _mongoose?: Cached };
const cached: Cached = globalForMongoose._mongoose ?? { conn: null, isConnected: 0 };
globalForMongoose._mongoose = cached;

export async function connectDb() {
  if (cached.isConnected === 1 && cached.conn) {
    console.log("Already connected to the database.");
    return;
  }

  if (!env.MONGODB_URL) {
    throw new Error("Please define the MONGODB_URL environment variable");
  }

  try {
    // If a prior mongoose instance exists but not connected, disconnect first
    if (mongoose.connections.length > 0 && mongoose.connections[0].readyState !== 1) {
      await mongoose.disconnect();
    }

    const db = await mongoose.connect(env.MONGODB_URL);
    cached.conn = db;
    cached.isConnected = db.connections[0].readyState; // 1 = connected
    console.log("New connection to the database.");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

export async function disconnectDb() {
  if (cached.isConnected && env.NODE_ENV === "production") {
    await mongoose.disconnect();
    cached.conn = null;
    cached.isConnected = 0;
  } else {
    console.log("Not disconnecting from the database (dev mode).");
  }
}
export const db = { connectDb, disconnectDb };