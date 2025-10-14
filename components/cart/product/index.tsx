"use client";
// ---- Strong types for pricing lookups on cart line ----
interface CountryPriceEntry { country: string; price: number }
interface CountryGroupPriceEntry { group?: string; price: number }

interface SizeLike {
  size?: string;
  price?: number;
  basePrice?: number;
  countryPrices?: CountryPriceEntry[];
  countryGroupPrices?: CountryGroupPriceEntry[];
}

// The cart line (client) may carry various optional pricing fields
// in addition to the core CartProduct fields.
type CartLineLike = CartProduct & {
  sizeIndex?: number;
  basePrice?: number;
  priceBefore?: number;
  countryPrices?: CountryPriceEntry[];
  countryGroupPrices?: CountryGroupPriceEntry[];
  size?: string; // label of the selected size
  sizes?: SizeLike[]; // optional: full sizes collection
  discount?: number;
};
// components/cart/product/index.tsx

import * as React from "react";
import Image from "next/image";
import { BsHeart } from "react-icons/bs";
import { AiOutlineDelete } from "react-icons/ai";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

import styles from "./styles.module.scss";
import type { CartProduct } from "@/types/cart";
import { useAppDispatch } from "@/store/hooks";
import { removeFromCart, setItemQty } from "@/store/cartSlice";
import type { SyncedCartLine } from "@/types/cart-sync";

type SyncedLineWithOptionals = SyncedCartLine & {
  priceBefore?: number;
  shipping?: number;
};

/* ---------- Props ---------- */
interface ProductProps {
  product: CartProduct;
  selected: CartProduct[];
  setSelected: React.Dispatch<React.SetStateAction<CartProduct[]>>;
  /** Optional server-resolved pricing for this line (from /api/cart/sync). */
  syncedLine?: SyncedLineWithOptionals;
}

/* ---------- Local helpers ---------- */
type Maybe<T> = T | undefined | null;

function asNum(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

/**
 * Resolve the display price with the following priority:
 * 1) syncedLine.price (server authoritative)
 * 2) countryPrices for the shopper's country (try several shapes)
 * 3) countryGroupPrices (if present)
 * 4) product.price / basePrice fallback
 *
 * We also try to match the selected size by label when sizeIndex is not available.
 */
function resolveDisplayPrice(
  product: CartLineLike,
  syncedLine: Maybe<SyncedLineWithOptionals>,
  countryCode: string
): { price: number; before?: number; shipping?: number } {
  // 1) Server-resolved line wins
  if (typeof syncedLine?.price === "number") {
    return {
      price: syncedLine.price,
      before:
        typeof syncedLine.priceBefore === "number"
          ? syncedLine.priceBefore
          : undefined,
      shipping:
        typeof syncedLine.shipping === "number" ? syncedLine.shipping : undefined,
    };
  }

  const cc = String(countryCode || "").toUpperCase();

  // Helper to pull a country price out of an array like [{country, price}]
  const pickCountryPrice = (arr?: CountryPriceEntry[] | null): number | undefined =>
    (Array.isArray(arr) ? arr : [])
      .find((x) => String(x?.country || "").toUpperCase() === cc)?.price;

  // Helper to pull a group price out of an array like [{group, price}]
  const pickGroupPrice = (arr?: CountryGroupPriceEntry[] | null): number | undefined =>
    (Array.isArray(arr) ? arr : []).find((x) => typeof x?.price === "number")?.price;

  // Try to identify the selected size object either by index or by label
  const sizes: SizeLike[] = Array.isArray(product?.sizes) ? (product.sizes as SizeLike[]) : [];
  const sizeIndex: number | undefined =
    typeof product?.sizeIndex === "number" && product.sizeIndex >= 0
      ? product.sizeIndex
      : undefined;
  const sizeByIndex: SizeLike | undefined = typeof sizeIndex === "number" ? sizes[sizeIndex] : undefined;
  const sizeByLabel: SizeLike | undefined =
    sizes.find((s) => String(s?.size) === String(product?.size));
  const selectedSize: SizeLike | undefined = sizeByIndex ?? sizeByLabel;

  // 2) Country-specific price (check several shapes)
  const candidateCountryPrice =
    // a) flat on the line
    pickCountryPrice(product?.countryPrices) ??
    // b) on the selected size object
    pickCountryPrice(selectedSize?.countryPrices);

  if (candidateCountryPrice != null) {
    const before = asNum(product?.priceBefore);
    return {
      price: asNum(candidateCountryPrice),
      before: before || undefined,
      shipping: asNum(product?.shipping) || undefined,
    };
  }

  // 3) Country-group price
  const candidateGroupPrice =
    pickGroupPrice(product?.countryGroupPrices) ??
    pickGroupPrice(selectedSize?.countryGroupPrices);

  if (candidateGroupPrice != null) {
    const before = asNum(product?.priceBefore);
    return {
      price: asNum(candidateGroupPrice),
      before: before || undefined,
      shipping: asNum(product?.shipping) || undefined,
    };
  }

  // 4) Fallback to client/base price
  const fallbackPrice =
    asNum(product?.price) ||
    asNum(selectedSize?.price) ||
    asNum(product?.basePrice) ||
    asNum(selectedSize?.basePrice);

  const before = asNum(product?.priceBefore);
  return {
    price: fallbackPrice,
    before: before > fallbackPrice ? before : undefined,
    shipping: asNum(product?.shipping) || undefined,
  };
}

/* ---------- Component ---------- */
const Product: React.FC<ProductProps> = ({
  product,
  selected,
  setSelected,
  syncedLine,
}) => {
  const dispatch = useAppDispatch();
  const [active, setActive] = React.useState<boolean>(false);

  // TODO: replace with country from session/profile/IP (e.g., read from session.user.country or a geo cookie)
  const COUNTRY = "EG";

  const {
    price: displayPrice,
    before: displayBefore,
    shipping: displayShipping,
  } = React.useMemo(() => resolveDisplayPrice(product, syncedLine, COUNTRY), [
    product,
    syncedLine,
  ]);

  const discountPct = React.useMemo(() => {
    if (typeof displayBefore === "number" && displayBefore > displayPrice) {
      return Math.round((1 - displayPrice / displayBefore) * 100);
    }
    const d = Number((product as CartLineLike)?.discount);
    return Number.isFinite(d) && d > 0 ? Math.round(d) : 0;
  }, [displayBefore, displayPrice, product]);

  /* Derived, safe values */
  const thumbSrc =
    (Array.isArray(product.images) && product.images?.[0]?.url) ||
    "/placeholder.png";
  const colorSrc = product.color?.image || "/placeholder.png";
  const qty = Math.max(1, asNum(product.qty, 1));
  const quantityAvailable = Math.max(0, asNum(product.quantity, 0));

  /* Track selection state */
  React.useEffect(() => {
    setActive(selected.some((p) => p._uid === product._uid));
  }, [selected, product._uid]);

  /* Update quantity via slice + optimistically sync `selected` */
  const updateQty = (type: "plus" | "minus"): void => {
    const next =
      type === "plus"
        ? Math.min(qty + 1, quantityAvailable)
        : Math.max(qty - 1, 1);

    if (next === qty) return;

    dispatch(setItemQty({ _uid: product._uid, qty: next }));
    setSelected((prev) =>
      prev.map((p) => (p._uid === product._uid ? { ...p, qty: next } : p))
    );
  };

  /* Remove product via slice + sync selection */
  const removeLine = (id: string): void => {
    dispatch(removeFromCart(id));
    setSelected((prev) => prev.filter((p) => p._uid !== id));
  };

  /* Toggle selection */
  const handleSelect = (): void => {
    setSelected(
      active
        ? selected.filter((p) => p._uid !== product._uid)
        : [...selected, product]
    );
  };

  return (
    <div className={`${styles.card} ${styles.product}`}>
      {quantityAvailable < 1 && <div className={styles.blur} />}

      {/* Header */}
      <div className={styles.product__header}>
        <Image src="/images/store.webp" alt="Store logo" width={18} height={18} />
        M74JJI Official Store
      </div>

      {/* Image + details */}
      <div className={styles.product__image}>
        <div
          className={`${styles.checkbox} ${active ? styles.active : ""}`}
          onClick={handleSelect}
          role="button"
          aria-pressed={active}
          tabIndex={0}
        />

        <div className={styles.thumb}>
          <Image
            src={thumbSrc}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 200px, 260px"
            style={{ objectFit: "contain", objectPosition: "center" }}
            priority={false}
          />
        </div>

        <div className={styles.col}>
          {/* Title + actions */}
          <div className={styles.grid}>
            <h1 title={product.name}>
              {product.name.length > 30
                ? `${product.name.substring(0, 30)}…`
                : product.name}
            </h1>
            <div style={{ zIndex: 2 }}>
              <BsHeart aria-label="Add to wishlist" role="button" tabIndex={0} />
            </div>
            <div
              style={{ zIndex: 2, cursor: "pointer" }}
              onClick={() => removeLine(product._uid)}
              role="button"
              aria-label="Remove product"
              tabIndex={0}
            >
              <AiOutlineDelete />
            </div>
          </div>

          {/* Style chip (size only; price shown below to avoid double display) */}
          <div className={styles.product__style}>
            <Image src={colorSrc} alt="Color option" width={20} height={20} />
            {product.size ? <span>{product.size}</span> : null}
            <MdOutlineKeyboardArrowRight />
          </div>

          {/* Price & Qty */}
          <div className={styles.product__priceQty}>
            <div className={styles.product__priceQty_price}>
              <span className={styles.price}>USD {displayPrice.toFixed(2)}$</span>
              {typeof displayBefore === "number" && displayBefore > displayPrice && (
                <span className={styles.priceBefore}>
                  USD {displayBefore.toFixed(2)}$
                </span>
              )}
              {discountPct > 0 && (
                <span className={styles.discount}>-{discountPct}%</span>
              )}
            </div>

            <div className={styles.product__priceQty_qty}>
              <button
                disabled={qty < 2}
                onClick={() => updateQty("minus")}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span aria-live="polite">{qty}</span>
              <button
                disabled={qty === quantityAvailable}
                onClick={() => updateQty("plus")}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Shipping */}
          <div className={styles.product__shipping}>
            {asNum(displayShipping) > 0
              ? `+${displayShipping}$ Shipping fee`
              : "Free Shipping"}
          </div>

          {/* Out of stock notice */}
          {quantityAvailable < 1 && (
            <div className={styles.notAvailable}>
              This product is out of stock. Add it to your wishlist, it may get restocked.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Product;