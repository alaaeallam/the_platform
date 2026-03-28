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
  const isLargeTablet = useMediaQuery({ query: "(max-width:1300px)" });
  const isTablet = useMediaQuery({ query: "(max-width:900px)" });
  const isMobile = useMediaQuery({ query: "(max-width:550px)" });

  const take = isMobile ? 4 : isTablet ? 4 : isLargeTablet ? 5 : 6;
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
              width={150}
              height={150}
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