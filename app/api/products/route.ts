// app/api/products/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";

type PriceCountry = {
  price?: number | string;
  salePrice?: number | string;
};

type PriceSize = {
  price?: number | string;
  salePrice?: number | string;
  countryPrices?: PriceCountry[];
};

type LeanSubProduct = {
  images?: string[];
  discount?: number | string;
  price?: number | string;
  sizes?: PriceSize[];
  countryPrices?: PriceCountry[];
};

type LeanProduct = {
  name?: string;
  slug?: string;
  subProducts?: LeanSubProduct[];
  rating?: number;
  numReviews?: number;
  createdAt?: Date | string;
  marketingTags?: unknown[];
  discount?: number | string;
};

function getFirstPrice(product: LeanProduct): number {
  const firstSub = product.subProducts?.[0];

  let sizes: PriceSize[] = [];
  if (Array.isArray(firstSub?.sizes)) {
    sizes = firstSub.sizes;
  } else if (firstSub?.sizes && typeof firstSub.sizes === "object") {
    sizes = Object.values(firstSub.sizes) as PriceSize[];
  }

  const firstSize = sizes[0];
  const firstSizeCountryPrice = firstSize?.countryPrices?.[0];
  const firstSubCountryPrice = firstSub?.countryPrices?.[0];

  const candidates = [
    firstSizeCountryPrice?.salePrice,
    firstSizeCountryPrice?.price,
    firstSize?.salePrice,
    firstSize?.price,
    firstSubCountryPrice?.salePrice,
    firstSubCountryPrice?.price,
    firstSub?.price,
  ];

  for (const value of candidates) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) return num;
  }

  console.log("[api/products] price resolution fallback", {
    name: product.name,
    slug: product.slug,
    firstSub,
    firstSize,
    firstSizeCountryPrice,
    firstSubCountryPrice,
  });

  return 0;
}

function getFirstDiscount(product: LeanProduct): number {
  const raw = product.subProducts?.[0]?.discount ?? product.discount ?? 0;
  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

export async function GET() {
  try {
    await dbConnect();

    const rawProducts = await Product.find({})
      .sort({ createdAt: -1 })
      .select("name slug subProducts rating numReviews createdAt marketingTags discount")
      .lean<LeanProduct[]>();

    const products = rawProducts.map((product) => ({
      ...product,
      price: getFirstPrice(product),
      discount: getFirstDiscount(product),
    }));

    return NextResponse.json(products, { status: 200 });
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}