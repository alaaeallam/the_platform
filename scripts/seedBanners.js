// scripts/seedBanners.js
/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: ".env" }); // or ".env.local" if that’s where your URI lives
const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI missing in env");
  process.exit(1);
}

const BannerSchema = new mongoose.Schema(
  {
    placement: { type: String, required: true, index: true }, // "home-hero"
    title: String,
    subtitle: String,
    image: { type: String, required: true }, // can be /images/swiper/1.jpg
    mobileImage: String,
    ctaLabel: String,
    ctaHref: String,
    theme: {
      bg: String,
      fg: String,
      align: { type: String, default: "center" },
    },
    active: { type: Boolean, default: true, index: true },
    startsAt: Date,
    endsAt: Date,
    priority: { type: Number, default: 0, index: true },
    locale: String,
    variant: String,
    meta: Object,
  },
  { timestamps: true }
);
const Banner =
  mongoose.models.Banner || mongoose.model("Banner", BannerSchema);

async function main() {
  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    dbName: process.env.MONGODB_DB || undefined,
  });

  const now = new Date();
  const docs = [
    {
      placement: "home-hero",
      title: "Fun AND fast",
      subtitle: "RC toys & building blocks, 3–10 day delivery!",
      image: "/images/swiper/1.jpg",
      ctaLabel: "Shop now",
      ctaHref: "/browse",
      active: true,
      startsAt: new Date(now.getTime() - 3600_000),
      endsAt: null,
      priority: 100,
      theme: { bg: "#ffffff", fg: "#111111", align: "left" },
    },
    {
      placement: "home-hero",
      title: "Hot Deals",
      subtitle: "Up to 40% off",
      image: "/images/swiper/2.jpg",
      ctaLabel: "Discover",
      ctaHref: "/browse",
      active: true,
      priority: 90,
      theme: { bg: "#0B1021", fg: "#ffffff", align: "center" },
    },
    {
      placement: "home-hero",
      title: "New Arrivals",
      subtitle: "Fresh picks this week",
      image: "/images/swiper/3.jpg",
      ctaLabel: "See what's new",
      ctaHref: "/browse",
      active: true,
      priority: 80,
      theme: { bg: "#ffffff", fg: "#111111", align: "right" },
    },
  ];

  // optional: clear old
  await Banner.deleteMany({ placement: "home-hero" });
  await Banner.insertMany(docs);

  console.log("Seeded banners:", docs.length);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});