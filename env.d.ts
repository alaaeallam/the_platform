// env.d.ts
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string; // required
      NODE_ENV: "development" | "production" | "test";
      // Any client-exposed vars MUST start with NEXT_PUBLIC_
      NEXT_PUBLIC_API_BASE_URL?: string; // optional example
    }
  }
}