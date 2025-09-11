// app/(shop)/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import styles from "../styles/Home.module.scss";
import Main from "@/components/home/main";
import FlashDeals from "@/components/home/flashDeals";
import Category from "@/components/home/category";
import { women_dresses, women_shoes, women_accessories, women_swiper } from "@/data/home";
import ProductsSwiper from "@/components/productsSwiper";
import ProductCard from "@/components/productCard";

/* ---------- Types that MATCH ProductCard's expected shape ---------- */
type CardSize = {
  size: string;
  price: number;           // ProductCard expects this
  basePrice?: number;      // optional, we keep it if present
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

/* ---------- Type-safe converters from unknown ---------- */
function toCardSize(s: unknown): CardSize | null {
  if (typeof s !== "object" || s === null) return null;
  const obj = s as Record<string, unknown>;
  const size = typeof obj.size === "string" ? obj.size : "";
  const basePrice =
    typeof obj.basePrice === "number"
      ? obj.basePrice
      : typeof obj.basePrice === "string" && obj.basePrice.trim() !== ""
      ? Number(obj.basePrice)
      : undefined;

  const legacyPrice =
    typeof obj.price === "number"
      ? obj.price
      : typeof obj.price === "string" && obj.price.trim() !== ""
      ? Number(obj.price)
      : undefined;

  const price = legacyPrice ?? basePrice ?? 0;
  if (!size) return null;

  return { size, basePrice, price };
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

export default function Home(): React.JSX.Element {
  const [products, setProducts] = useState<CardProduct[]>([]);

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
        <Main />
        <FlashDeals />
        <div className={styles.home__category}>
          <Category header="Dresses" products={women_dresses} background="#5a31f4" />
          <Category header="Shoes" products={women_shoes} background="#3c811f" />
          <Category header="Accessories" products={women_accessories} background="#000" />
        </div>
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