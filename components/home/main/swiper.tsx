"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { Autoplay, Pagination, Navigation } from "swiper/modules";

export default function MainSwiper(): React.JSX.Element {
  return (
    <Swiper
      slidesPerView={1}
      spaceBetween={30}
      loop
      pagination={{ clickable: true }}
      autoplay={{
        delay: 2000,
        disableOnInteraction: false,
      }}
      navigation
      modules={[Autoplay, Pagination, Navigation]}
      className="mainSwiper"
    >
      {[...Array(10).keys()].map((i) => {
        const src = `/images/swiper/${i + 1}.jpg`;

        return (
          <SwiperSlide key={i}>
            <Image
              src={src}
              alt={`Slide ${i + 1}`}
              width={750}
              height={300}
              priority={i === 0} // first slide loads fast
              className="swiper-img"
              style={{
                width: "100%",
                height: "auto",
                objectFit: "cover",
              }}
            />
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}