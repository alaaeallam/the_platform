//app/components/productsSwiper/index.tsx
"use client";

import React from "react";
import Image from "next/image"; // ✅ import Next.js Image
import styles from "./styles.module.scss";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

type Product = {
  id?: string | number;
  name: string;
  image: string;
  price?: number | string;
};

type ProductsSwiperProps = {
  header?: React.ReactNode;
  products: Product[];
  bg?: string;
};

export default function ProductsSwiper({
  header,
  products,
  bg,
}: ProductsSwiperProps): React.JSX.Element {
  return (
    <div className={styles.wrapper}>
      {header && (
        <div className={styles.header} style={{ background: bg ?? "" }}>
          {header}
        </div>
      )}

      <Swiper
        slidesPerView={1}
        spaceBetween={10}
        navigation
        modules={[Navigation]}
        className="products__swiper"
        breakpoints={{
          450: { slidesPerView: 2 },
          630: { slidesPerView: 3 },
          920: { slidesPerView: 4 },
          1232: { slidesPerView: 5 },
          1520: { slidesPerView: 6 },
        }}
      >
        {products.map((product) => {
          const key = String(product.id ?? product.image);
          const title = product.name ?? "Product";
          return (
            <SwiperSlide key={key}>
              <div className={styles.product}>
                <div className={styles.product__img}>
                  {/* ✅ Use Next.js Image */}
                  <Image
                    src={product.image}
                    alt={title}
                    width={300}   // you can adjust based on your design
                    height={300}  // keep ratio similar to actual image
                    className={styles.image}
                  />
                </div>

                <div className={styles.product__infos}>
                  <h1>
                    {title.length > 30 ? `${title.slice(0, 30)}...` : title}
                  </h1>
                  {product.price !== undefined && (
                    <span>USD {product.price}$</span>
                  )}
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}