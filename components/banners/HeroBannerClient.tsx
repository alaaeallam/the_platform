"use client";

import React from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Link from "next/link";

export type HeroSlide = { image: string; alt?: string; href?: string; label?: string };

export default function HeroBannerClient({ slides }: { slides: HeroSlide[] }) {
  if (!slides?.length) return null;
console.log("[HeroBannerClient] slides:", slides);

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
      // Ensure Swiper doesn't swallow clicks completely
      preventClicks={false}
      preventClicksPropagation={false}
      touchStartPreventDefault={false}
      threshold={3}
    >
      {slides.map((s, i) => {
        const src = s.image.includes("/image/upload/")
          ? s.image.replace("/image/upload/", "/image/upload/f_auto,q_auto/")
          : s.image;

        return (
          <SwiperSlide key={i}>
            <div className="slide-root">
              <Image
                src={src}
                alt={s.alt ?? `Slide ${i + 1}`}
                width={1600}
                height={600}
                priority={i === 0}
                unoptimized
                draggable={false}
                className="swiper-img"
                style={{ width: "100%", height: "auto", objectFit: "cover" }}
              />

              {s.label && (
                <span
                  className="absolute bottom-4 left-4 rounded-md px-3 py-1 text-sm font-medium"
                  style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
                >
                  {s.label}
                </span>
              )}

              {/* Single overlay that never covers the nav arrows */}
              {s.href ? (
                <Link
                  href={s.href}
                  aria-label={s.label || s.alt || `Slide ${i + 1}`}
                  className="cta-overlay"
                  onClick={(e) => {
                    // Let the link handle navigation; don't bubble to Swiper
                    e.stopPropagation();
                  }}
                />
              ) : null}
            </div>
          </SwiperSlide>
        );
      })}

      <style jsx global>{`
        .mainSwiper {
          position: relative;
        }
        .mainSwiper .swiper-slide {
          position: relative;
          z-index: 1;
        }
        .slide-root {
          position: relative;
        }
        .slide-root .swiper-img {
          display: block;
          user-select: none;
          -webkit-user-drag: none;
          pointer-events: none;
        }
        /* Overlay sits above the image but leaves room for arrows */
        .cta-overlay {
          position: absolute;
          top: 0;
          bottom: 0;
          left: clamp(24px, 4vw, 96px);
          right: clamp(24px, 4vw, 96px);
          z-index: 20;
          display: block;
          pointer-events: auto;
          background: transparent;
          cursor: pointer;
          text-decoration: none;
        }
        /* Keep nav arrows always clickable and above overlay */
        .mainSwiper .swiper-button-next,
        .mainSwiper .swiper-button-prev {
          z-index: 9999 !important;
          pointer-events: auto !important;
          cursor: pointer;
        }
        .mainSwiper .swiper-pagination {
          z-index: 30 !important;
        }
      `}</style>
    </Swiper>
  );
}