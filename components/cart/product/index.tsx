// components/cart/product/index.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { BsHeart } from "react-icons/bs";
import { AiOutlineDelete } from "react-icons/ai";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

import styles from "./styles.module.scss";
import type { CartProduct } from "@/types/cart";
import { useAppDispatch} from "@/store/hooks";
import { removeFromCart, setItemQty } from "@/store/cartSlice";

/* ---------- Types ---------- */

export interface ProductImage {
  url: string;
}
export interface ProductColor {
  image: string;
}

interface ProductProps {
  product: CartProduct;
  selected: CartProduct[];
  setSelected: React.Dispatch<React.SetStateAction<CartProduct[]>>;
}

/* ---------- Component ---------- */

const Product: React.FC<ProductProps> = ({ product, selected, setSelected }) => {
  const dispatch = useAppDispatch();
  
  const [active, setActive] = useState<boolean>(false);

  /* Track selection state */
  useEffect(() => {
    setActive(selected.some((p) => p._uid === product._uid));
  }, [selected, product._uid]);

  /* Update quantity via slice (no unused vars) */
  const updateQty = (type: "plus" | "minus"): void => {
    const next =
      type === "plus"
        ? Math.min(product.qty + 1, product.quantity)
        : Math.max(product.qty - 1, 1);

    if (next !== product.qty) {
      dispatch(setItemQty({ _uid: product._uid, qty: next }));
    }
  };

  /* Remove product via slice */
  const removeProduct = (id: string): void => {
    dispatch(removeFromCart(id));
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
      {product.quantity < 1 && <div className={styles.blur} />}

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
          src={product.images[0]?.url || "/placeholder.png"}
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
              <BsHeart />
            </div>
            <div
              style={{ zIndex: 2, cursor: "pointer" }}
              onClick={() => removeProduct(product._uid)}
              role="button"
              aria-label="Remove product"
              tabIndex={0}
            >
              <AiOutlineDelete />
            </div>
          </div>

          {/* Style */}
          <div className={styles.product__style}>
            <Image
              src={product.color.image || "/placeholder.png"}
              alt="Color option"
              width={20}
              height={20}
            />
            {product.size && <span>{product.size}</span>}
            {product.price && <span>{product.price.toFixed(2)}$</span>}
            <MdOutlineKeyboardArrowRight />
          </div>

          {/* Price & Qty */}
          <div className={styles.product__priceQty}>
            <div className={styles.product__priceQty_price}>
              <span className={styles.price}>
                USD {(product.price * product.qty).toFixed(2)}$
              </span>
              {product.priceBefore && product.priceBefore !== product.price && (
                <span className={styles.priceBefore}>USD {product.priceBefore}$</span>
              )}
              {typeof product.discount === "number" && product.discount > 0 && (
                <span className={styles.discount}>-{product.discount}%</span>
              )}
            </div>
            <div className={styles.product__priceQty_qty}>
              <button disabled={product.qty < 2} onClick={() => updateQty("minus")}>
                -
              </button>
              <span>{product.qty}</span>
              <button
                disabled={product.qty === product.quantity}
                onClick={() => updateQty("plus")}
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
          {product.quantity < 1 && (
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