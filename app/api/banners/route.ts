// app/api/banners/route.ts
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getHeroBanners } from "@/lib/banners";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  noStore();
  const { searchParams } = new URL(req.url);
  const placement = searchParams.get("placement") || "home-hero";
  const locale = searchParams.get("locale") || undefined;
  const banners = await getHeroBanners(placement, locale);
  return NextResponse.json({
    banners: banners.map((b) => ({
      image: b.mobileImage || b.image,
      alt: b.title || "Banner",
      title: b.title,
      subtitle: b.subtitle,
      ctaLabel: b.ctaLabel,
      ctaHref: b.ctaHref,
      theme: b.theme,
    })),
  });
}