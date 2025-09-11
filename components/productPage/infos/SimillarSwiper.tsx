// components/productPage/infos/SimillarSwiper.tsx
"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import styles from "./styles.module.scss";
import React from "react";
export interface SimilarSwiperProps {
  /** Array of image URLs to show */
  images?: string[];
  /** Optional builder to generate the link for each slide (defaults to "#") */
  hrefBuilder?: (index: number) => string;
  /** Slides visible on desktop (default 4) */
  slidesPerView?: number;
  /** CSS class override */
  className?: string;
}

export default function SimillarSwiper({
  images = [],
  hrefBuilder,
  slidesPerView = 4,
  className,
}: SimilarSwiperProps): React.JSX.Element | null {
  // Normalize & bail early if empty
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
            <img src={src} alt={`Similar product ${i + 1}`} />
          </Link>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}