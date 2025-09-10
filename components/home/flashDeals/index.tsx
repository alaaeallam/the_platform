"use client";

import styles from "./styles.module.scss";
import { MdFlashOn } from "react-icons/md";
import Countdown from "../../countdown";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { Navigation } from "swiper/modules";
import { flashDealsArray } from "../../../data/home";
import FlashCard from "./Card";

// ---- Types ----
// What your data source currently looks like (strings)
type SourceProduct = {
  id?: string | number;
  link: string;
  image: string;
  price: string;     // <-- string in your data
  discount: string;  // <-- string in your data
  sold: string;      // <-- string in your data
};

// What the UI components expect (numbers)
export type Product = {
  id?: string | number;
  link: string;
  image: string;
  price: number;
  discount: number; // e.g., 20 for 20%
  sold: number;     // e.g., 75 for 75%
};

// small helper to coerce strings/numbers safely
const toNum = (v: string | number | undefined | null): number =>
  Number.parseFloat(String(v ?? 0)) || 0;

export default function FlashDeals(): React.JSX.Element {
  // Normalize incoming strings -> numbers for the UI
  const products: Product[] = (flashDealsArray as SourceProduct[]).map((p, i) => ({
    id: p.id ?? i,
    link: p.link,
    image: p.image,
    price: toNum(p.price),
    discount: toNum(p.discount),
    sold: Math.max(0, Math.min(100, toNum(p.sold))), // clamp 0–100 for the bar
  }));

  return (
    <div className={styles.flashDeals}>
      {/* Header */}
      <div className={styles.flashDeals__header}>
        <h1>
          FLASH SALE <MdFlashOn />
        </h1>
        <Countdown date={new Date(2025, 11, 30)} />
      </div>

      {/* Swiper */}
      <Swiper
        slidesPerView={1}
        spaceBetween={10}
        navigation
        modules={[Navigation]}
        className="flashDeals__swiper"
        breakpoints={{
          450:  { slidesPerView: 2 },
          630:  { slidesPerView: 3 },
          920:  { slidesPerView: 4 },
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