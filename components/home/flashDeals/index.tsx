"use client";

import styles from "./styles.module.scss";
import { MdFlashOn } from "react-icons/md";
import Countdown from "../../countdown";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { Navigation } from "swiper/modules";
import FlashCard from "./Card";

export type FlashDealProduct = {
  id: string;
  link: string;
  image: string;
  price: number;
  discount: number;
  sold: number;
};

type Props = {
  products: FlashDealProduct[];
  countdownDate?: string | null;
};

export default function FlashDeals({
  products,
  countdownDate,
}: Props): React.JSX.Element | null {
  if (!products.length) return null;

  const countdownTarget = countdownDate
    ? new Date(countdownDate)
    : new Date(Date.now() + 1000 * 60 * 60 * 24);

  return (
    <div className={styles.flashDeals}>
      <div className={styles.flashDeals__header}>
        <h1>
          FLASH SALE <MdFlashOn />
        </h1>
        <Countdown date={countdownTarget} />
      </div>

      <Swiper
        slidesPerView={1}
        spaceBetween={10}
        navigation
        modules={[Navigation]}
        className="flashDeals__swiper"
        breakpoints={{
          450: { slidesPerView: 2 },
          630: { slidesPerView: 3 },
          920: { slidesPerView: 4 },
          1232: { slidesPerView: 5 },
          1520: { slidesPerView: 6 },
        }}
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <FlashCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}