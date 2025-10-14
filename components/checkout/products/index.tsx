"use client";

import * as React from "react";
import styles from "./styles.module.scss";
import type { CartVM, CartLine } from "@/types/checkout";
import Image from "next/image";

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
{products.map((product, i) => {
  // style as a number when available; fallback token 'x'
  const styleKey: number | "x" =
    typeof product.style === "number" && Number.isFinite(product.style)
      ? product.style
      : "x";

  // prefer productId; otherwise use legacy `product` if it's a string
  const productIdForKey =
    product.productId ??
    (typeof product.product === "string" ? product.product : "pid");

  // stable React key
  const reactKey =
    product._id ||
    `${productIdForKey}-${styleKey}-${product.size ?? "x"}-${i}`;

  const lineTotal = Number(product.price) * Number(product.qty || 0);
  const displayName =
    typeof product.name === "string" ? product.name : "Item";

  const mainImg =
    (typeof product?.image === "string" && product.image) ||
    "/placeholder.png";

  const colorImg =
    product?.color && typeof product.color.image === "string"
      ? product.color.image
      : undefined;

  return (
    <div key={reactKey} className={styles.product}>
      <div className={styles.product__img}>
        <Image
          src={mainImg}
          alt={displayName}
          width={80}
          height={80}
          sizes="80px"
          style={{ width: 80, height: 80, objectFit: "cover" }}
          priority={false}
        />
        <div className={styles.product__infos}>
          {colorImg && (
            <Image
              src={colorImg}
              alt="Selected color"
              width={20}
              height={20}
              sizes="20px"
              className={styles.product__color}
              style={{ width: 20, height: 20, objectFit: "contain" }}
            />
          )}
          {product.size !== undefined && <span>{String(product.size)}</span>}
          <span>x{product.qty}</span>
        </div>
      </div>

      <div className={styles.product__name} title={displayName}>
        {displayName.length > 18
          ? `${displayName.substring(0, 18)}…`
          : displayName}
      </div>

      <div className={styles.product__price}>
        {lineTotal.toFixed(2)}$
      </div>
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