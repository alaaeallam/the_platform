// app/components/productCard/index.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductSwiper from "./ProductSwiper";
import styles from "./styles.module.scss";

/* ---------- Types (updated) ---------- */
type CountryPrice = { country: string; price: number };
type GroupPrice   = { group: string; price: number };

type Size = {
  price?: number;            // optional style/size price
  basePrice?: number;        // legacy base
  discount?: number;         // percent on this size
  priceBefore?: number;      // optional “was” price
  countryPrices?: CountryPrice[];
  countryGroupPrices?: GroupPrice[];
};

type SubProduct = {
  images: string[];
  sizes: Size[];
  discount?: number; // style-level discount (percent)
  color: { image?: string; color?: string };
};
export type Product = {
  slug: string;
  name: string;
  subProducts: SubProduct[];
};

type ProductCardProps = { product: Product };

/* ---------- Helpers ---------- */
const asNum = (v: unknown, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

// Prefer country price → group price → size.price → size.basePrice
function resolveSizePriceForCountry(size: Size, countryISO2: string, groups: string[] = []): number {
  // 1) Exact country price
  const cp = (size.countryPrices ?? []).find((x) => x?.country?.toUpperCase() === countryISO2.toUpperCase())?.price;
  if (cp != null) return asNum(cp);

  // 2) Country-group price (optional; only if you store it)
  const gp = (size.countryGroupPrices ?? []).find((x) => groups.includes(String(x?.group)))?.price;
  if (gp != null) return asNum(gp);

  // 3) size.price → 4) basePrice
  if (size.price != null) return asNum(size.price);
  return asNum(size.basePrice);
}

/* ---------- Component ---------- */
export default function ProductCard({ product }: ProductCardProps): React.JSX.Element {
  // TODO: pull these from user/session/cookie later
  const COUNTRY = "EG" as const;
  const COUNTRY_GROUPS = React.useMemo<string[]>(() => ["LOW_ECONOMY", "MENA"], []);

  const safeSubProducts = useMemo<SubProduct[]>(
    () =>
      Array.isArray(product.subProducts) && product.subProducts.length
        ? product.subProducts
        : [{ images: [], sizes: [], color: {} }],
    [product.subProducts]
  );

  const [active, setActive] = useState<number>(0);

  useEffect(() => {
    if (active >= safeSubProducts.length) setActive(0);
  }, [active, safeSubProducts.length]);

  const activeSub = useMemo(() => safeSubProducts[active], [safeSubProducts, active]);

  // Max of style-level and size-level discounts (if you want to show a badge)
  const activeDiscount = useMemo(() => {
    const subLevel = asNum(activeSub?.discount, 0);
    const sizeMax =
      (activeSub?.sizes ?? []).reduce((m, s) => Math.max(m, asNum(s.discount, 0)), 0);
    return Math.max(subLevel, sizeMax);
  }, [activeSub]);

  // Images for the active style
  const images = activeSub?.images ?? [];

  // Compute a price per size using COUNTRY/Groups and apply the size discount if present
  const prices = useMemo<number[]>(
    () =>
      (activeSub?.sizes ?? [])
        .map((s) => {
          const base = resolveSizePriceForCountry(s, COUNTRY, COUNTRY_GROUPS);
          const pct  = asNum(s.discount, 0);                // size-level discount only
          const val  = base * (1 - pct / 100);
          return Number(val.toFixed(2));
        })
        .filter((p) => Number.isFinite(p) && p > 0)
        .sort((a, b) => a - b),
    [activeSub, COUNTRY, COUNTRY_GROUPS]
  );

  const swatches = useMemo(() => safeSubProducts.map((p) => p.color), [safeSubProducts]);

  const priceLabel = useMemo(() => {
    if (prices.length === 0) return "";
    if (prices.length === 1) return `USD${prices[0]}$`;
    return `USD${prices[0]}-${prices[prices.length - 1]}$`;
  }, [prices]);

  return (
    <div className={styles.product}>
      <div className={styles.product__container}>
        <Link
          href={`/products/${product.slug}?style=${active}`}
          target="_blank"
          aria-label={product.name}
          className={styles.product__link}
        >
          <div>
            <ProductSwiper images={images.map((url) => ({ url }))} />
          </div>
        </Link>

        {activeDiscount > 0 && (
          <div className={styles.product__discount}>-{activeDiscount}%</div>
        )}

        <div className={styles.product__infos}>
          <h1 title={product.name}>
            {product.name.length > 45 ? `${product.name.substring(0, 45)}...` : product.name}
          </h1>

          {priceLabel && <span>{priceLabel}</span>}

          <div className={styles.product__colors}>
            {swatches.map((style, i) => {
              const isActive = i === active;
              if (style.image) {
                return (
                  <Image
                    key={`swatch-img-${i}`}
                    src={style.image}
                    alt={`Style ${i + 1}`}
                    width={24}
                    height={24}
                    sizes="24px"
                    className={isActive ? styles.active : ""}
                    onMouseOver={() => setActive(i)}
                  />
                );
              }
              return (
                <span
                  key={`swatch-color-${i}`}
                  className={isActive ? styles.active : ""}
                  style={{ backgroundColor: style.color ?? "#ccc" }}
                  onMouseOver={() => setActive(i)}
                  aria-label={`Style ${i + 1}`}
                  role="button"
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}