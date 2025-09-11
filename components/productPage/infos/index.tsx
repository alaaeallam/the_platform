// components/productPage/infos/index.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TbPlus, TbMinus } from "react-icons/tb";
import { BsHandbagFill, BsHeart } from "react-icons/bs";
import styles from "./styles.module.scss";

// import Share from "./share";
import Accordian from "./Accordian";
import SimillarSwiper from "./SimillarSwiper";

/* ---------- Types ---------- */
type SizeItem = { size: string; qty: number };
type Color = { image?: string; color?: string };
type SubProductVM = { images: string[] };

export interface ProductInfosVM {
  _id: string;
  name: string;
  slug: string;
  rating: number;
  numReviews: number;
  createdAt: string; // <-- add this
  description: string;
  details: Array<string | { name?: string; value?: string }>;
  style: number;
  images: string[];
  sizes: { size: string; qty: number }[];
  discount: number;
  sku: string;
  colors: Array<{ color?: string; image?: string }>;
  priceRange: string;
  price: number;        // <-- add
  priceBefore: number;  // <-- add
  quantity: number;     // stock for current size
  shipping?: number;
  subProducts: { images: string[] }[];
}

interface InfosProps {
  product: ProductInfosVM;
  setActiveImg: (url: string) => void;
}

export default function Infos({ product, setActiveImg }: InfosProps) {
  const searchParams = useSearchParams();
  const sizeIndex = Number(searchParams.get("size") ?? "0");
  const styleIndex = Number(searchParams.get("style") ?? String(product.style ?? 0));

  const [sizeLabel, setSizeLabel] = useState<string | undefined>(
    product.sizes[sizeIndex]?.size
  );
  const [qty, setQty] = useState<number>(1);
  const [error, setError] = useState<string>("");   // inline error (optional UI)
  const [success, setSuccess] = useState<string>("");

  // Total pieces across sizes (used when no specific size selected)
  const totalPiecesAvailable = useMemo(
    () => product.sizes.reduce((acc, s) => acc + (s.qty ?? 0), 0),
    [product.sizes]
  );

  // Reset on style change
  useEffect(() => {
    setSizeLabel(product.sizes[0]?.size);
    setQty(1);
  }, [styleIndex, product.sizes]);

  // Clamp qty by available quantity (for chosen size)
  useEffect(() => {
    if (qty > product.quantity) setQty(product.quantity);
  }, [sizeIndex, product.quantity, qty]);

  const addToCartHandler = async () => {
    setError("");
    setSuccess("");

    if (Number.isNaN(sizeIndex)) {
      setError("Please select a size.");
      return;
    }

    // TODO: wire to your cart API/slice.
    // For now, just show a quick success:
    setSuccess("Added to cart.");
  };

  // Prepare detail strings for the accordion
  const detailStrings: string[] = useMemo(() => {
    const tail = product.details
      .map((d) =>
        typeof d === "string"
          ? d
          : [d?.name, d?.value].filter(Boolean).join(": ")
      )
      .filter((s): s is string => Boolean(s && s.trim()));
    return [product.description, ...tail];
  }, [product.description, product.details]);

  return (
    <div className={styles.infos}>
      <div className={styles.infos__container}>
        <h1 className={styles.infos__name}>{product.name}</h1>
        {product.sku && <h2 className={styles.infos__sku}>{product.sku}</h2>}

        <div className={styles.infos__rating}>
          {/* Hook your Rating component back when ready */}
          &nbsp;(
          {product.numReviews}
          {product.numReviews === 1 ? " review" : " reviews"})
        </div>

        <div className={styles.infos__price}>
          {Number.isNaN(sizeIndex) ? (
            <h2>{product.priceRange}</h2>
          ) : (
            <h1>{product.price}$</h1>
          )}
          {product.discount > 0 && (
            <h3>
              {!Number.isNaN(sizeIndex) && <span>{product.priceBefore}$</span>}
              <span>(-{product.discount}%)</span>
            </h3>
          )}
        </div>

        <span className={styles.infos__shipping}>
          {product.shipping ? `+${product.shipping}$ Shipping fee` : "Free Shipping"}
        </span>

        <span>
          {!Number.isNaN(sizeIndex) ? product.quantity : totalPiecesAvailable}{" "}
          pieces available.
        </span>

        {/* Sizes */}
        <div className={styles.infos__sizes}>
          <h4>Select a Size :</h4>
          <div className={styles.infos__sizes_wrap}>
            {product.sizes.map((s, i) => {
              // ✅ plural route + query
              const href = `/products/${product.slug}?style=${styleIndex}&size=${i}`;
              const active = i === sizeIndex;
              return (
                <Link href={href} key={`${s.size}-${i}`} aria-label={`Size ${s.size}`}>
                  <div
                    className={`${styles.infos__sizes_size} ${active ? styles.active_size : ""}`}
                    onClick={() => setSizeLabel(s.size)}
                  >
                    {s.size}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Colors */}
        <div className={styles.infos__colors}>
          {product.colors?.map((color, i) => {
            // ✅ plural route + query
            const href = `/products/${product.slug}?style=${i}`;
            const active = i === styleIndex;
            const preview = product.subProducts?.[i]?.images?.[0];
            return (
              <span
                key={`color-${i}`}
                className={active ? styles.active_color : ""}
                onMouseOver={() => preview && setActiveImg(preview)}
                onMouseLeave={() => setActiveImg("")}
              >
                <Link href={href} aria-label={`Color ${color.color ?? i + 1}`}>
                  <img src={color.image ?? ""} alt={color.color ?? `Color ${i + 1}`} />
                </Link>
              </span>
            );
          })}
        </div>

        {/* Quantity */}
        <div className={styles.infos__qty}>
          <button onClick={() => qty > 1 && setQty((prev) => prev - 1)}>
            <TbMinus />
          </button>
          <span>{qty}</span>
          <button onClick={() => qty < product.quantity && setQty((prev) => prev + 1)}>
            <TbPlus />
          </button>
        </div>

        {/* Actions */}
        <div className={styles.infos__actions}>
          <button
            disabled={product.quantity < 1}
            style={{ cursor: product.quantity < 1 ? "not-allowed" as const : undefined }}
            onClick={addToCartHandler}
          >
            <BsHandbagFill />
            <b>ADD TO CART</b>
          </button>
          <button>
            <BsHeart />
            WISHLIST
          </button>
        </div>

        {error && <span className={styles.error}>{error}</span>}
        {success && <span className={styles.success}>{success}</span>}

        {/* <Share /> */}
        <Accordian details={detailStrings} />
        <SimillarSwiper />
      </div>
    </div>
  );
}