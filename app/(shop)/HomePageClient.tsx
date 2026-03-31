"use client";

import React, { useEffect, useState } from "react";
import styles from "../styles/Home.module.scss";
import Main from "@/components/home/main";
import Category from "@/components/home/category";
import { women_dresses, women_shoes, women_accessories, women_swiper } from "@/data/home";
import ProductsSwiper from "@/components/productsSwiper";
import ProductCard from "@/components/productCard";
import FlashDeals, { type FlashDealProduct } from "@/components/home/flashDeals";

/* ---------- Types that MATCH ProductCard's expected shape ---------- */
type CardSize = {
  size: string;
  price: number;                 // normalized working price for the card
  basePrice?: number;
  discount?: number;             // size-level discount (if any)
  priceBefore?: number;          // optional original price
  countryPrices?: Array<{ country: string; price: number }>;
  countryGroupPrices?: Array<{ group: string; price: number }>;
};

type CardColor = { image?: string; color?: string };

type CardSubProduct = {
  images: string[];
  discount: number;
  color: CardColor;        // ensure always present (fallback {})
  sizes: CardSize[];       // each size has price
};

type CardProduct = {
  _id: string;
  name: string;
  slug: string;
  subProducts: CardSubProduct[];
  rating: number;
  numReviews: number;
  createdAt: string;
};
type HomeCategoryVM = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
};

/* ---------- Type-safe converters from unknown ---------- */
function toCardSize(s: unknown): CardSize | null {
  if (typeof s !== "object" || s === null) return null;
  const obj = s as Record<string, unknown>;

  const size = typeof obj.size === "string" ? obj.size : "";

  // normalize numeric helpers
  const toNum = (v: unknown): number | undefined => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const basePrice = toNum(obj.basePrice);
  const legacyPrice = toNum(obj.price);
  const price = (legacyPrice ?? basePrice ?? 0) as number;

  const discount = toNum(obj.discount);
  const priceBefore = toNum(obj.priceBefore);

  // countryPrices: [{ country, price }]
  const cpUnknown = (obj as Record<string, unknown>).countryPrices;
  const countryPrices = Array.isArray(cpUnknown)
    ? cpUnknown
        .map((row: unknown) => {
          if (typeof row !== "object" || row === null) return null;
          const r = row as Record<string, unknown>;
          const country = typeof r.country === "string" ? r.country : "";
          const cp = toNum(r.price);
          if (!country || cp == null) return null;
          return { country, price: cp };
        })
        .filter((x): x is { country: string; price: number } => x !== null)
    : undefined;

  // countryGroupPrices: [{ group, price }]
  const gpUnknown = (obj as Record<string, unknown>).countryGroupPrices;
  const countryGroupPrices = Array.isArray(gpUnknown)
    ? gpUnknown
        .map((row: unknown) => {
          if (typeof row !== "object" || row === null) return null;
          const r = row as Record<string, unknown>;
          const group = typeof r.group === "string" ? r.group : "";
          const gp = toNum(r.price);
          if (!group || gp == null) return null;
          return { group, price: gp };
        })
        .filter((x): x is { group: string; price: number } => x !== null)
    : undefined;

  if (!size) return null;

  return {
    size,
    price,
    basePrice,
    discount,
    priceBefore,
    countryPrices,
    countryGroupPrices,
  };
}

function toCardSubProduct(sp: unknown): CardSubProduct | null {
  if (typeof sp !== "object" || sp === null) return null;
  const obj = sp as Record<string, unknown>;

  const images =
    Array.isArray(obj.images) ? obj.images.filter((x): x is string => typeof x === "string") : [];

  const discount =
    typeof obj.discount === "number"
      ? obj.discount
      : typeof obj.discount === "string" && obj.discount.trim() !== ""
      ? Number(obj.discount)
      : 0;

  const color =
    typeof obj.color === "object" && obj.color !== null
      ? (obj.color as { image?: unknown; color?: unknown })
      : {};

  const colorSafe: CardColor = {
    image: typeof color.image === "string" ? color.image : undefined,
    color: typeof color.color === "string" ? color.color : undefined,
  };

  const sizesSrc = Array.isArray(obj.sizes) ? obj.sizes : [];
  const sizes = sizesSrc.map(toCardSize).filter((x): x is CardSize => x !== null);

  return { images, discount, color: colorSafe, sizes };
}

function toCardProduct(p: unknown): CardProduct | null {
  if (typeof p !== "object" || p === null) return null;
  const obj = p as Record<string, unknown>;

  const _id = obj._id != null ? String(obj._id) : "";
  const name = typeof obj.name === "string" ? obj.name : "";
  const slug = typeof obj.slug === "string" ? obj.slug : "";
  const rating =
    typeof obj.rating === "number" ? obj.rating : typeof obj.rating === "string" ? Number(obj.rating) : 0;
  const numReviews =
    typeof obj.numReviews === "number"
      ? obj.numReviews
      : typeof obj.numReviews === "string"
      ? Number(obj.numReviews)
      : 0;
  const createdAt =
    typeof obj.createdAt === "string" ? obj.createdAt : new Date().toISOString();

  const subProductsSrc = Array.isArray(obj.subProducts) ? obj.subProducts : [];
  const subProducts = subProductsSrc
    .map(toCardSubProduct)
    .filter((x): x is CardSubProduct => x !== null);

  if (!_id || !name || !slug) return null;

  return { _id, name, slug, subProducts, rating, numReviews, createdAt };
}

export default function Home({
  initialCategories,
  menuCategories,
  flashSaleProducts,
  flashSaleEndsAt,
}: {
  initialCategories: HomeCategoryVM[];
  menuCategories: HomeCategoryVM[];
  flashSaleProducts: FlashDealProduct[];
  flashSaleEndsAt: string | null;
}): React.JSX.Element {
  const [products, setProducts] = useState<CardProduct[]>([]);
  const categoryBackgrounds = [
    "#5a31f4",
    "#3c811f",
    "#000",
    "#c2410c",
    "#0f766e",
    "#7c3aed",
  ];

  const dbCategories = initialCategories.map((category, index) => ({
    header: category.name,
    background: categoryBackgrounds[index % categoryBackgrounds.length] ?? "#111",
    products: category.image
      ? [
          {
            id: category._id,
            image: category.image,
            link: category.slug ? `/browse?category=${category.slug}` : "/browse",
          },
        ]
      : [],
  }));

  const fallbackCategories = [
    { header: "Dresses", products: women_dresses, background: "#5a31f4" },
    { header: "Shoes", products: women_shoes, background: "#3c811f" },
    { header: "Accessories", products: women_accessories, background: "#000" },
  ];

  const homepageCategories = dbCategories.filter((category) => category.products.length > 0);
  const visibleHomepageCategories = homepageCategories.length > 0 ? homepageCategories : fallbackCategories;

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data: unknown = await res.json();

      if (Array.isArray(data)) {
        const normalized = data.map(toCardProduct).filter((x): x is CardProduct => x !== null);
        setProducts(normalized);
      } else {
        console.warn("Unexpected /api/products shape", data);
        setProducts([]);
      }
    })();
  }, []);

  return (
    <div className={styles.home}>
      <div className={styles.container}>
        <Main categories={menuCategories} />
        
        <FlashDeals
  products={flashSaleProducts}
  countdownDate={flashSaleEndsAt}
/>
        <section
          style={{
            marginTop: 24,
            marginBottom: 16,
            display: "grid",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: "#6b7280",
                }}
              >
                Featured Collections
              </span>
              <h2
                style={{
                  margin: 0,
                  fontSize: 28,
                  lineHeight: 1.1,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Swipe Through Categories
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "#6b7280",
                  maxWidth: 560,
                }}
              >
                Browse premium collections in a swipe-friendly rail on mobile and a smooth horizontal carousel on larger screens.
              </p>
            </div>
            <a
              href="/browse"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 42,
                padding: "0 16px",
                borderRadius: 999,
                textDecoration: "none",
                background: "#111827",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              Explore All
            </a>
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              overflowX: "auto",
              paddingBottom: 8,
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {visibleHomepageCategories.map((category, index) => (
              <Category
                key={`${category.header}-${index}`}
                header={category.header}
                products={category.products}
                background={category.background}
              />
            ))}
          </div>
        </section>
        <ProductsSwiper products={women_swiper} />
        <div className={styles.products}>
          {products.map((p) => (
            <ProductCard product={p} key={p._id || p.slug} />
          ))}
        </div>
      </div>
    </div>
  );
}