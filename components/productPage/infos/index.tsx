// components/productPage/infos/index.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TbPlus, TbMinus } from "react-icons/tb";
import { BsHandbagFill, BsHeart } from "react-icons/bs";
import styles from "./styles.module.scss";
import Rating from "@mui/material/Rating";

import Accordian, { type DetailKV } from "./Accordian";
import SimillarSwiper from "./SimillarSwiper";
import Share from "./share";
import DialogModal from "@/components/dialogModal";

/* ---------- Types ---------- */
export interface ProductInfosVM {
  _id: string;
  name: string;
  slug: string;
  rating: number;
  numReviews: number;
  createdAt: string;
  description: string;
  /** Must be KV rows only; description is passed separately. */
  details: DetailKV[];
  style: number;
  images: string[];
  sizes: { size: string; qty: number }[];
  discount: number;
  sku: string;
  colors: Array<{ color?: string; image?: string }>;
  priceRange: string;
  price: number;
  priceBefore: number;
  quantity: number;
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
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const totalPiecesAvailable = useMemo(
    () => product.sizes.reduce((acc, s) => acc + (s.qty ?? 0), 0),
    [product.sizes]
  );

  useEffect(() => {
    setSizeLabel(product.sizes[0]?.size);
    setQty(1);
  }, [styleIndex, product.sizes]);

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

    // TODO: wire to cart slice/API
    setSuccess("Added to cart.");
  };

  return (
    <div className={styles.infos}>
      <DialogModal />
      <div className={styles.infos__container}>
        <h1 className={styles.infos__name}>{product.name}</h1>
        {product.sku && <h2 className={styles.infos__sku}>{product.sku}</h2>}

        <div className={styles.infos__rating}>
          <Rating
            name="half-rating-read"
            defaultValue={product.rating}
            precision={0.5}
            readOnly
            style={{ color: "#FACF19" }}
          />
          ({product.numReviews}
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

        <Share />

        {/* ✅ Pass description separately; details is KV only */}
        <Accordian description={product.description} details={product.details ?? []} />

        <SimillarSwiper />
      </div>
    </div>
  );
}