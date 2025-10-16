// components/banners/BannerFromApi.tsx
"use client";

import useSWR from "swr";
import HeroBannerClient from "./HeroBannerClient";

type Slide = { image: string; alt?: string };
type ApiBanner = { image: string; alt?: string };
type ApiResponse = { banners?: ApiBanner[] };

const fetcher = async (url: string): Promise<ApiResponse> =>
  fetch(url).then((r) => r.json() as Promise<ApiResponse>);

export default function BannerFromApi({
  placement = "home-hero",
  locale,
}: {
  placement?: string;
  locale?: string;
}) {
  const { data } = useSWR<ApiResponse>(
    `/api/banners?placement=${encodeURIComponent(placement)}${
      locale ? `&locale=${locale}` : ""
    }`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const slides: Slide[] = (data?.banners ?? []).map((b) => ({
    image: b.image,
    alt: b.alt,
  }));

  if (!slides.length) return null; // or show a skeleton
  return <HeroBannerClient slides={slides} />;
}