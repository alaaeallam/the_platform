import { NextRequest, NextResponse } from "next/server";

const COUNTRY_COOKIE = "country";
const DEFAULT_COUNTRY = "US";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function normalizeCountry(value?: string | null): string {
  const code = String(value || "")
    .trim()
    .toUpperCase();

  return /^[A-Z]{2}$/.test(code) ? code : "";
}

function detectCountry(req: NextRequest): string {
  const existingCookie = normalizeCountry(req.cookies.get(COUNTRY_COOKIE)?.value);
  if (existingCookie) return existingCookie;

  const vercelCountry = normalizeCountry(req.headers.get("x-vercel-ip-country"));
  if (vercelCountry) return vercelCountry;

  const acceptLanguage = req.headers.get("accept-language") || "";
  const parts = acceptLanguage.split(",");

  for (const part of parts) {
    const match = part.trim().match(/[-_]([A-Za-z]{2})(?:;|$)/);
    const code = normalizeCountry(match?.[1]);
    if (code) return code;
  }

  return DEFAULT_COUNTRY;
}

export function middleware(req: NextRequest) {
  const country = detectCountry(req);
  const res = NextResponse.next();

  const currentCookie = normalizeCountry(req.cookies.get(COUNTRY_COOKIE)?.value);
  if (currentCookie !== country) {
    res.cookies.set(COUNTRY_COOKIE, country, {
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  res.headers.set("x-country", country);
  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|fonts).*)",
  ],
};
