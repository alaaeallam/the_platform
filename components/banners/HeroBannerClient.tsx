// components/banners/HeroBannerClient.tsx
"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export type HeroSlide = { image: string; alt?: string };

export default function HeroBannerClient({ slides }: { slides: HeroSlide[] }) {
  if (!slides?.length) return null;

  return (
    <Swiper
      slidesPerView={1}
      spaceBetween={30}
      loop
      pagination={{ clickable: true }}
      autoplay={{ delay: 2000, disableOnInteraction: false }}
      navigation
      modules={[Autoplay, Pagination, Navigation]}
      className="mainSwiper"
    >
      {slides.map((s, i) => (
        <SwiperSlide key={i}>
          <Image
            src={s.image}
            alt={s.alt ?? `Slide ${i + 1}`}
            width={750}
            height={300}
            priority={i === 0}
            className="swiper-img"
            style={{ width: "100%", height: "auto", objectFit: "cover" }}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}