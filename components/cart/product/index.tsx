"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BsHeart } from "react-icons/bs";
import { AiOutlineDelete } from "react-icons/ai";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import type { CartProduct } from "@/types/cart";

import styles from "./styles.module.scss";
// import { updateCart } from "@/store/cartSlice";

/* ---------- Types ---------- */

export interface ProductImage {
  url: string;
}

export interface ProductColor {
  image: string;
}

export interface ProductType {
  _uid: string;
  name: string;
  qty: number;
  quantity: number;
  price: number;
  priceBefore?: number;
  discount: number;
  size?: string;
  images: ProductImage[];
  color: ProductColor;
  shipping?: number;
}

interface CartState {
  cartItems: ProductType[];
}

interface RootState {
  cart: CartState;
}

interface ProductProps {
  product: CartProduct;
  selected: CartProduct[];
  setSelected: React.Dispatch<React.SetStateAction<CartProduct[]>>;
}

/* ---------- Component ---------- */

const Product: React.FC<ProductProps> = ({ product, selected, setSelected }) => {
  const { cart } = useSelector((state: RootState) => state);
  const [active, setActive] = useState<boolean>(false);
  const dispatch = useDispatch();

  /* Track selection state */
  useEffect(() => {
    const isSelected = selected.some((p) => p._uid === product._uid);
    setActive(isSelected);
  }, [selected, product._uid]);

  /* Update quantity */
  const updateQty = (type: "plus" | "minus"): void => {
    const newCart = cart.cartItems.map((p) =>
      p._uid === product._uid
        ? {
            ...p,
            qty: type === "plus" ? p.qty + 1 : p.qty - 1,
          }
        : p
    );
    // dispatch(updateCart(newCart));
  };

  /* Remove product */
  const removeProduct = (id: string): void => {
    const newCart = cart.cartItems.filter((p) => p._uid !== id);
    // dispatch(updateCart(newCart));
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
        <img src="/images/store.webp" alt="Store logo" />
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
        <img src={product.images[0]?.url} alt={product.name} />

        <div className={styles.col}>
          {/* Title + actions */}
          <div className={styles.grid}>
            <h1>
              {product.name.length > 30
                ? `${product.name.substring(0, 30)}…`
                : product.name}
            </h1>
            <div style={{ zIndex: 2 }}>
              <BsHeart />
            </div>
            <div
              style={{ zIndex: 2 }}
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
            <img src={product.color.image} alt="Color option" />
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
                <span className={styles.priceBefore}>
                  USD {product.priceBefore}$
                </span>
              )}
              {typeof product.discount === "number" && product.discount > 0 && (
                <span className={styles.discount}>-{product.discount}%</span>
              )}
            </div>
            <div className={styles.product__priceQty_qty}>
              <button
                disabled={product.qty < 2}
                onClick={() => updateQty("minus")}
              >
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
            {product.shipping
              ? `+${product.shipping}$ Shipping fee`
              : "Free Shipping"}
          </div>

          {/* Out of stock notice */}
          {product.quantity < 1 && (
            <div className={styles.notAvailable}>
              This product is out of stock. Add it to your wishlist, it may get
              restocked.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Product;