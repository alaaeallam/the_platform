//app/components/banners/HeroBannerServer.tsx
import "server-only";
import { unstable_cache } from "next/cache";
import { getHeroBanners } from "@/lib/banners";
import HeroBannerClient from "./HeroBannerClient";

type Slide = { image: string; alt?: string; href?: string; label?: string };

// Create a per-args cached getter (placement+locale) and immediately invoke it
async function getCachedSlides(placement: string, locale?: string): Promise<Slide[]> {
  const cached = unstable_cache(
    async () => {
      const rows = await getHeroBanners(placement, locale);
      return rows.map((r) => ({
        image: r.mobileImage || r.image,
        alt: r.title || "Banner",
        href: r.ctaHref || undefined,     // <-- forward CTA
        label: r.ctaLabel || undefined,   // <-- forward CTA
      }));
    },
    // Bump version so old cache (without href) is ignored; include args in key
    [`hero-banners:v2:${placement}:${locale ?? ""}`],
    { revalidate: 600, tags: ["banners", `banners:${placement}`] }
  );
  return cached();
}

export default async function HeroBannerServer({
  placement = "home-hero",
  locale,
}: { placement?: string; locale?: string }) {
  const slides = await getCachedSlides(placement, locale);
  if (!slides.length) return null;
  return <HeroBannerClient slides={slides} />;
}