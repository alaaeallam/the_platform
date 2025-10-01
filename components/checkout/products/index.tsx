// components/checkout/products/index.tsx
"use client";

import * as React from "react";
import styles from "./styles.module.scss";
import type { CartVM, CartLine } from "@/types/checkout";

type ProductsProps = {
  cart: CartVM;
};

export default function Products({ cart }: ProductsProps) {
  const products: CartLine[] = Array.isArray(cart?.products) ? cart.products : [];
  const itemCount = products.length;

  return (
    <div className={styles.products}>
      {/* Header */}
      <div className={styles.products__header}>
        <h1>Cart</h1>
        <span>{itemCount === 1 ? "1 item" : `${itemCount} items`}</span>
      </div>

      {/* Products list */}
      <div className={styles.products__wrap}>
        {products.map((product) => {
          // prefer _id; fall back to productId/product slug + size for a stable key
          const key =
            product._id ??
            `${product.product ?? product.productId ?? product.slug ?? product.name}-${product.size}`;

          const lineTotal = Number(product.price) * Number(product.qty || 0);
          const mainImg = product.image || "/placeholder.png";
          const colorImg = product.color?.image;

          return (
            <div key={key} className={styles.product}>
              {/* Left: images */}
              <div className={styles.product__img}>
                <img src={mainImg} alt={product.name} />
                <div className={styles.product__infos}>
                  {colorImg && (
                    <img
                      src={colorImg}
                      alt="Selected color"
                      className={styles.product__color}
                    />
                  )}
                  {product.size !== undefined && <span>{String(product.size)}</span>}
                  <span>x{product.qty}</span>
                </div>
              </div>

              {/* Middle: name */}
              <div className={styles.product__name} title={product.name}>
                {product.name.length > 18
                  ? `${product.name.substring(0, 18)}…`
                  : product.name}
              </div>

              {/* Right: price */}
              <div className={styles.product__price}>{lineTotal.toFixed(2)}$</div>
            </div>
          );
        })}
      </div>

      {/* Subtotal */}
      <div className={styles.products__total}>
        Subtotal : <b>{Number(cart?.cartTotal || 0).toFixed(2)}$</b>
      </div>
    </div>
  );
}