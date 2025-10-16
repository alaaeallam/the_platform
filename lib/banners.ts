// lib/banners.ts
import "server-only";
import Banner from "@/models/Banner";
import { connectDb } from "@/utils/db";
import type { FilterQuery } from "mongoose";
import type { BannerDoc } from "@/models/Banner";

/** Many banners (for sliders, carousels) */
export async function getHeroBanners(placement = "home-hero", locale?: string) {
  await connectDb();
  const now = new Date();
  const q: FilterQuery<BannerDoc> = {
    placement,
    active: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  };
  if (locale) q.$or = [{ locale }, { locale: null }, { locale: "" }];

  return Banner.find(q).sort({ priority: -1, updatedAt: -1 }).lean<BannerDoc[]>();
}

/** Single “top” banner (if you ever need one) */
export async function getActiveBanner(placement = "home-hero", locale?: string) {
  const rows = await getHeroBanners(placement, locale);
  return rows[0] ?? null;
}