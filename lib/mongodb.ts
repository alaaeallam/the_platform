// lib/mongodb.ts
import { MongoClient } from "mongodb";

declare global {
  // It's fine to use `var` here for global augmentation
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
if (!uri) throw new Error("Missing MONGODB_URI/MONGODB_URL");

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;