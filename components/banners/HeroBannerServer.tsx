// components/banners/HeroBannerServer.tsx
import "server-only";
import { unstable_cache } from "next/cache";
import { getHeroBanners } from "@/lib/banners";
import HeroBannerClient from "./HeroBannerClient";

// Cache banner queries per placement + locale for 1 hour (3600s)
const getCachedSlides = unstable_cache(
  async (placement: string, locale?: string) => {
    try {
      const rows = await getHeroBanners(placement, locale);
      return rows.map((r) => ({
        image: r.mobileImage || r.image,
        alt: r.title || "Banner",
      }));
    } catch (err) {
      console.error("Banner fetch failed:", err);
      return [] as Array<{ image: string; alt?: string }>;
    }
  },
  // Cache key parts (must be stable)
  ["hero-banners"],
  {
    revalidate: 3600, // 1 hour
    tags: ["banners"], // optional tag if you later revalidateTag("banners")
  }
);

export default async function HeroBannerServer({
  placement = "home-hero",
  locale,
}: {
  placement?: string;
  locale?: string;
}) {
  const slides = await getCachedSlides(placement, locale);
  if (!slides?.length) return null;
  return <HeroBannerClient slides={slides} />;
}