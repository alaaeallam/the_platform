"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductSwiper from "./ProductSwiper";
import styles from "./styles.module.scss";

/* ---------- Types ---------- */
type Size = { price: number };
type SubProduct = {
  images: string[];
  sizes: Size[];
  discount?: number; // percent
  color: { image?: string; color?: string };
};
export type Product = {
  slug: string;
  name: string;
  subProducts: SubProduct[];
};

type ProductCardProps = { product: Product };

/* ---------- Component ---------- */
export default function ProductCard({ product }: ProductCardProps): React.JSX.Element {
  // ✅ Memoize the normalized subProducts to avoid identity changes
  const safeSubProducts = useMemo<SubProduct[]>(
    () =>
      Array.isArray(product.subProducts) && product.subProducts.length
        ? product.subProducts
        : [{ images: [], sizes: [], color: {} }],
    [product.subProducts]
  );

  const [active, setActive] = useState<number>(0);

  // ✅ Clamp active when product (or count) changes
  useEffect(() => {
    if (active >= safeSubProducts.length) setActive(0);
  }, [active, safeSubProducts.length]);

  // ✅ Memoize the active subProduct
  const activeSub = useMemo(() => safeSubProducts[active], [safeSubProducts, active]);

  // Images for the active style
  const images = activeSub?.images ?? [];

  // Sorted price list for the active style
  const prices = useMemo<number[]>(
    () =>
      (activeSub?.sizes ?? [])
        .map((s) => s.price)
        .filter((p): p is number => typeof p === "number" && !Number.isNaN(p))
        .sort((a, b) => a - b),
    [activeSub]
  );

  // All style swatches
  const swatches = useMemo(() => safeSubProducts.map((p) => p.color), [safeSubProducts]);

  const hasDiscount = typeof activeSub?.discount === "number" && activeSub.discount! > 0;

  // Price label (USDxx$ | USDxx-yy$)
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

        {hasDiscount && <div className={styles.product__discount}>-{activeSub!.discount}%</div>}

        <div className={styles.product__infos}>
          <h1 title={product.name}>
            {product.name.length > 45 ? `${product.name.substring(0, 45)}...` : product.name}
          </h1>

          {priceLabel && <span>{priceLabel}</span>}

          <div className={styles.product__colors}>
            {swatches.map((style, i) => {
              const isActive = i === active;

              // ✅ Image swatch via Next/Image
              if (style.image) {
                return (
                  <Image
                    key={`swatch-img-${i}`}
                    src={style.image}
                    alt={`Style ${i + 1}`}
                    width={24}
                    height={24}
                    className={isActive ? styles.active : ""}
                    onMouseOver={() => setActive(i)}
                  />
                );
              }

              // Color swatch (fallback)
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