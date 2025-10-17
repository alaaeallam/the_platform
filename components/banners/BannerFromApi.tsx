"use client";

import React from "react";
import useSWR from "swr";
import HeroBannerClient, { HeroSlide } from "./HeroBannerClient";

type ApiBanner = {
  image: string;
  alt?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  theme?: { bg?: string; fg?: string; align?: "left" | "center" | "right" };
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function BannerFromApi({
  placement = "home-hero",
  locale,
}: {
  placement?: string;
  locale?: string;
}) {
  const { data } = useSWR<{ banners: ApiBanner[] }>(
    `/api/banners?placement=${encodeURIComponent(placement)}${locale ? `&locale=${encodeURIComponent(locale)}` : ""}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const slides: HeroSlide[] =
    data?.banners?.map((b) => ({
      image: b.image,
      alt: b.alt ?? b.title ?? "Banner",
      href: b.ctaHref || undefined,   // <-- keep CTA
      label: b.ctaLabel || undefined, // <-- keep CTA
    })) ?? [];

  // Debug: verify href exists
  if (slides.length) {
    // eslint-disable-next-line no-console
    console.log("[BannerFromApi] slides:", slides);
  }

  if (!slides.length) return null;
  return <HeroBannerClient slides={slides} />;
}