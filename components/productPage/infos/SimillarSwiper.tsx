// components/productPage/infos/SimillarSwiper.tsx
"use client";

import Link from "next/link";
import Image from "next/image"; // ✅ use Next Image
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import styles from "./styles.module.scss";
import React from "react";

export interface SimilarSwiperProps {
  images?: string[];
  hrefBuilder?: (index: number) => string;
  slidesPerView?: number;
  className?: string;
}

export default function SimillarSwiper({
  images = [],
  hrefBuilder,
  slidesPerView = 4,
  className,
}: SimilarSwiperProps): React.JSX.Element | null {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  if (list.length === 0) return null;

  return (
    <Swiper
      modules={[Navigation]}
      navigation
      slidesPerView={slidesPerView}
      slidesPerGroup={Math.max(1, Math.min(3, slidesPerView))}
      spaceBetween={8}
      className={`swiper ${styles.simillar_swiper} products__swiper ${className ?? ""}`}
      breakpoints={{
        640: { slidesPerView: Math.min(5, slidesPerView) },
        1024: { slidesPerView },
      }}
    >
      {list.map((src, i) => (
        <SwiperSlide key={i}>
          <Link href={hrefBuilder ? hrefBuilder(i) : "#"} aria-label={`Similar product ${i + 1}`}>
            <Image
              src={src}
              alt={`Similar product ${i + 1}`}
              width={240}      // tweak to your card size
              height={240}
              className={styles.similar_img}
            />
          </Link>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}