import { headers } from "next/headers";

export async function GET() {
  const h = await headers();

  return Response.json({
    country: h.get("x-vercel-ip-country"),
    city: h.get("x-vercel-ip-city"),
  });
}