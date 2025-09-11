"use client";

import React, { useEffect, useRef } from "react";
import styles from "./styles.module.scss";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperType } from "swiper/types";

// Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// ✅ Autoplay is imported from swiper/modules
import { Autoplay } from "swiper/modules";

/* ---------- Types ---------- */
export type ProductImage = { url: string };

type ProductSwiperProps = {
  images: ProductImage[];
};

/* ---------- Component ---------- */
export default function ProductSwiper({ images }: ProductSwiperProps): React.JSX.Element {
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    if (swiperRef.current?.autoplay) {
      swiperRef.current.autoplay.stop();
    }
  }, []);

  const handleMouseEnter = () => {
    swiperRef.current?.autoplay?.start();
  };

  const handleMouseLeave = () => {
    if (swiperRef.current?.autoplay) {
      swiperRef.current.autoplay.stop();
      swiperRef.current.slideTo(0);
    }
  };

  return (
    <div
      className={styles.swiper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        centeredSlides
        autoplay={{ delay: 500, stopOnLastSlide: false }}
        speed={500}
        modules={[Autoplay]}
        className={styles.innerSwiper}
      >
        {images.map((img, idx) => (
          <SwiperSlide key={idx}>
            <img
              src={img.url}
              alt={`Product image ${idx + 1}`}
              className={styles.productImg}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}