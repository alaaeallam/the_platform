// components/home/main/index.tsx
// Re-export the client component from its location under /app.
// This avoids importing server-only code into client trees.
export { default } from "@/components/home/main/HomeMainClient";