// utils/db.ts
import mongoose from "mongoose";

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Reuse a global cache in dev to survive HMR
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: Cached | undefined;
}

const cached: Cached =
  global._mongooseCache ?? { conn: null, promise: null };

if (!global._mongooseCache) {
  global._mongooseCache = cached;
}

function resolveMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Please define MONGODB_URI in environment variables");
  return uri;
}

// Optional: quiet deprecated behaviour noise and align with strictness
mongoose.set("strictQuery", true);

const CONNECT_OPTS: mongoose.ConnectOptions = {
  bufferCommands: false,
  // tune networking a bit to avoid transient timeouts on cold start
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
};

async function tryConnect(uri: string, attempt = 1): Promise<typeof mongoose> {
  try {
    return await mongoose.connect(uri, CONNECT_OPTS);
  } catch (err) {
    if (attempt >= 3) throw err;
    // small backoff between retries
    await new Promise((r) => setTimeout(r, attempt * 1000));
    return tryConnect(uri, attempt + 1);
  }
}

export async function connectDb(): Promise<typeof mongoose> {
  // Fast path: already connected
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  // If there is an inflight connection promise, await it
  if (cached.promise) {
    cached.conn = await cached.promise;
    return cached.conn;
  }

  // Ensure we don't keep a bad half-open connection around
  if (mongoose.connections.length > 0 && mongoose.connections[0].readyState === 2) {
    // 2 = connecting; let it finish
    // do nothing; we will still create a promise below if needed
  } else if (mongoose.connections.length > 0 && mongoose.connections[0].readyState > 2) {
    // 3 = disconnecting, 0 = disconnected
    // allow reconnect
  }

  const uri = resolveMongoUri();

  cached.promise = tryConnect(uri).then((m) => {
    cached.conn = m;
    return m;
  });

  cached.conn = await cached.promise;
  return cached.conn;
}

export async function disconnectDb(): Promise<void> {
  // Keep DB open in dev for HMR speed; close only in prod
  if (process.env.NODE_ENV === "production") {
    await mongoose.disconnect().catch(() => {});
    cached.conn = null;
    cached.promise = null;
  }
}

export default { connectDb, disconnectDb };