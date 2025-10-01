// components/cart/product/index.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { BsHeart } from "react-icons/bs";
import { AiOutlineDelete } from "react-icons/ai";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

import styles from "./styles.module.scss";
import type { CartProduct } from "@/types/cart";
import { useAppDispatch } from "@/store/hooks";
import { removeFromCart, setItemQty } from "@/store/cartSlice";

/* ---------- Props ---------- */
interface ProductProps {
  product: CartProduct;
  selected: CartProduct[];
  setSelected: React.Dispatch<React.SetStateAction<CartProduct[]>>;
}

/* ---------- Component ---------- */
const Product: React.FC<ProductProps> = ({ product, selected, setSelected }) => {
  const dispatch = useAppDispatch();
  const [active, setActive] = React.useState<boolean>(false);

  /* Derived, safe values */
  const thumbSrc =
    (Array.isArray(product.images) && product.images?.[0]?.url) || "/placeholder.png";
  const colorSrc = product.color?.image || "/placeholder.png";
  const unitPrice = Number(product.price) || 0;
  const qty = Math.max(1, Number(product.qty) || 1);
  const quantityAvailable = Math.max(0, Number(product.quantity) || 0);
  const lineTotal = (unitPrice * qty).toFixed(2);

  /* Track selection state */
  React.useEffect(() => {
    setActive(selected.some((p) => p._uid === product._uid));
  }, [selected, product._uid]);

  /* Update quantity via slice + optimistically sync `selected` */
  const updateQty = (type: "plus" | "minus"): void => {
    const next =
      type === "plus" ? Math.min(qty + 1, quantityAvailable) : Math.max(qty - 1, 1);

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
    if (active) {
      setSelected(selected.filter((p) => p._uid !== product._uid));
    } else {
      setSelected([...selected, product]);
    }
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
        <Image
          src={thumbSrc}
          alt={product.name}
          width={120}
          height={120}
          className={styles.product__thumb}
        />

        <div className={styles.col}>
          {/* Title + actions */}
          <div className={styles.grid}>
            <h1 title={product.name}>
              {product.name.length > 30 ? `${product.name.substring(0, 30)}…` : product.name}
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

          {/* Style */}
          <div className={styles.product__style}>
            <Image src={colorSrc} alt="Color option" width={20} height={20} />
            {product.size ? <span>{product.size}</span> : null}
            {unitPrice > 0 ? <span>{unitPrice.toFixed(2)}$</span> : null}
            <MdOutlineKeyboardArrowRight />
          </div>

          {/* Price & Qty */}
          <div className={styles.product__priceQty}>
            <div className={styles.product__priceQty_price}>
              <span className={styles.price}>USD {lineTotal}$</span>
              {product.priceBefore &&
                Number(product.priceBefore) !== unitPrice && (
                  <span className={styles.priceBefore}>
                    USD {Number(product.priceBefore).toFixed(2)}$
                  </span>
                )}
              {typeof product.discount === "number" && product.discount > 0 && (
                <span className={styles.discount}>-{product.discount}%</span>
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
            {product.shipping ? `+${product.shipping}$ Shipping fee` : "Free Shipping"}
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