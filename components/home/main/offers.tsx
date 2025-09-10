"use client";

import Link from "next/link";
import styles from "./styles.module.scss";
import { offersAarray } from "../../../data/home";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Image from "next/image";

type Offer = {
  id?: string | number;
  image: string;
  price: number | string;
  discount: number | string;
  href?: string;
  title?: string;
};

const FALLBACK_IMG = "/images/no_image.png";

export default function Offers(): React.JSX.Element {
  const offers = (offersAarray as Offer[]).filter(
    (o) => typeof o.image === "string" && o.image.trim() !== ""
  );

  return (
    <div className={styles.offers}>
      <div className={styles.offers__text}>
        <p>
          use code <b>“MHAJJI”</b> for 30% off all products.
        </p>
        <Link href="/browse">Shop now</Link>
      </div>

      <Swiper
        slidesPerView={3}
        spaceBetween={10}
        pagination={{ clickable: true }}
        navigation
        modules={[Pagination, Navigation]}
        className="offers_swiper"
        observer
        observeParents
        loop={false}
      >
        {offers.map((offer) => {
          const key = String(offer.id ?? offer.image);
          const src = offer.image || FALLBACK_IMG;
          const alt = offer.title ?? "Offer";
          const href = offer.href ?? "#";

          return (
            <SwiperSlide key={key}>
              {/* wrapper ensures stable height so the slide never looks blank */}
              <div style={{ width: "100%" }}>
                <Link href={href} style={{ display: "block" }}>
                  <Image
                    src={src}
                    alt={alt}
                    width={220}
                    height={140}
                    unoptimized   // remove this if you whitelist domains for real optimization
                    className={styles.offerImg}
                    style={{
                      width: "100%",
                      height: "140px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      display: "block",
                    }}
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      if (!el.src.endsWith(FALLBACK_IMG)) el.src = FALLBACK_IMG;
                    }}
                  />
                </Link>
                <span>{offer.price}$</span>
                <span>-{offer.discount}%</span>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}