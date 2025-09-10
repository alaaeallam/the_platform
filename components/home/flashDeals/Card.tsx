"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.scss";
import { MdFlashOn } from "react-icons/md";

// ---- Types ----
type Product = {
  id?: string | number;
  link: string;
  image: string;
  price: number;
  discount: number; // e.g. 20 for 20%
  sold: number;     // e.g. 75 for 75%
};

interface FlashCardProps {
  product: Product;
}

export default function FlashCard({ product }: FlashCardProps): React.JSX.Element {
  // 💡 safer calculation for discounted price
  const discountedPrice = product.price * (1 - product.discount / 100);
  const saved = product.price - discountedPrice;

  return (
    <div className={styles.card}>
      {/* Product Image */}
      <div className={styles.card__img}>
        <Link href={product.link}>
          <Image
            src={product.image}
            alt={product.link || "Flash product"}
            width={220}
            height={220}
            className={styles.card__image}
            unoptimized
          />
        </Link>
        <div className={styles.flash}>
          <MdFlashOn />
          <span>-{product.discount}%</span>
        </div>
      </div>

      {/* Price */}
      <div className={styles.card__price}>
        <span>USD {discountedPrice.toFixed(2)}$</span>
        <span>-USD {saved.toFixed(2)}$</span>
      </div>

      {/* Progress Bar */}
      <div className={styles.card__bar}>
        <div
          className={styles.card__bar_inner}
          style={{ width: `${product.sold}%` }}
        />
      </div>

      {/* Sold Percentage */}
      <div className={styles.card__percentage}>{product.sold}%</div>
    </div>
  );
}