"use client";

import { BsArrowRightCircle } from "react-icons/bs";
import styles from "./styles.module.scss";
import { useMediaQuery } from "react-responsive";

type Product = {
  id: string | number;
  image: string;
  alt?: string;
};

type CategoryProps = {
  header: string;
  products: Product[];
  background?: string;
};

export default function Category({
  header,
  products,
  background = "transparent",
}: CategoryProps): React.JSX.Element {
  const isMedium = useMediaQuery({ query: "(max-width:1300px)" });
  const isMobile = useMediaQuery({ query: "(max-width:550px)" });

  // ✅ limit visible products based on screen size
  const visibleProducts = products.slice(0, isMobile ? 6 : isMedium ? 4 : 6);

  return (
    <div className={styles.category} style={{ background }}>
      <div className={styles.category__header}>
        <h1>{header}</h1>
        <BsArrowRightCircle />
      </div>

      <div className={styles.category__products}>
        {visibleProducts.map((product) => (
          <div key={product.id} className={styles.product}>
            <img src={product.image} alt={product.alt ?? "Category product"} />
          </div>
        ))}
      </div>
    </div>
  );
}