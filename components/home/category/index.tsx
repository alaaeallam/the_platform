// components/home/category/index.tsx
"use client";

import { BsArrowRightCircle } from "react-icons/bs";
import styles from "./styles.module.scss";
import { useMediaQuery } from "react-responsive";
import Image from "next/image";

export type CategoryItem = {
  id?: string | number;
  image: string;
  price?: number | string;
  link?: string;
  discount?: number | string;
  sold?: number | string;
};

export type CategoryProps = {
  header: string;
  products: CategoryItem[];
  background?: string;
};

export default function Category({ header, products, background }: CategoryProps) {
  const isMedium = useMediaQuery({ query: "(max-width:1300px)" });
  const isMobile = useMediaQuery({ query: "(max-width:550px)" });

  const take = isMobile ? 6 : isMedium ? 4 : 6;
  const visible = products.slice(0, take);

  return (
    <div className={styles.category} style={background ? { background } : undefined}>
      <div className={styles.category__header}>
        <h1>{header}</h1>
        <BsArrowRightCircle />
      </div>

      <div className={styles.category__products}>
        {visible.map((product, idx) => (
          <div className={styles.product} key={product.id ?? idx}>
            {/* keep your UI; using next/image is optional */}
            <Image
              src={product.image}
              alt={header}
              width={220}
              height={220}
              className={styles.product__img}
              unoptimized
            />
            {/* if you later want to show price/discount, you have the fields typed */}
          </div>
        ))}
      </div>
    </div>
  );
}