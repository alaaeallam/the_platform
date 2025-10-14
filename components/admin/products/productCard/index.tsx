"use client";

import styles from "./styles.module.scss";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules"; 
import "swiper/css";
import "swiper/css/navigation";

import { TbEdit } from "react-icons/tb";
import { AiOutlineEye } from "react-icons/ai";
import { RiDeleteBin2Line } from "react-icons/ri";

/* =========================
   Types exported for reuse
   ========================= */
export type ImageLike =
  | string
  | { url?: string | null; [k: string]: unknown };

export type SubProduct = {
  images?: ImageLike[] | null;
  // add anything else you use here (sizes, colors, etc.)
  [k: string]: unknown;
};

export type ProductCardProduct = {
  _id: string;
  name: string;
  slug: string;
  category?: { name?: string | null } | string | null;
  subProducts: SubProduct[];
};

type Props = {
  product: ProductCardProduct;
};

/* Get first image url regardless of stored shape */
function firstImageUrl(p: SubProduct): string | null {
  if (!p?.images || !Array.isArray(p.images) || p.images.length === 0) {
    return null;
  }
  const first = p.images[0];
  if (typeof first === "string") return first || null;
  if (first && typeof first === "object" && typeof first.url === "string") {
    return first.url || null;
  }
  return null;
}

export default function ProductCard({ product }: Props) {
  const catName =
    typeof product.category === "string"
      ? product.category
      : product.category?.name ?? "";

  return (
    <div className={styles.product}>
      <h1 className={styles.product__name}>{product.name}</h1>
      {catName && <h2 className={styles.product__category}>#{catName}</h2>}

      <Swiper
        slidesPerView={1}
        spaceBetween={10}
        navigation
        modules={[Navigation]}
        className="products__swiper"
        style={{ padding: "5px 0 5px 5px" }}
        breakpoints={{
          450: { slidesPerView: 2 },
          630: { slidesPerView: 3 },
          920: { slidesPerView: 4 },
          1232: { slidesPerView: 5 },
          1520: { slidesPerView: 6 },
        }}
      >
        {product.subProducts.map((sp, i) => {
          const img = firstImageUrl(sp);
          return (
            <SwiperSlide key={`${product._id}-${i}`}>
              <div className={styles.product__item}>
                <div className={styles.product__item_img}>
                  {/* Use <img> so you don't need next.config image domains */}
                  {img ? (
                    <Image
                      src={img}
                      alt={product.name}
                      width={120}
                      height={120}
                      sizes="120px"
                      style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }}
                      unoptimized
                      priority={false}
                    />
                  ) : (
                    <div
                      style={{
                        width: 120,
                        height: 120,
                        display: "grid",
                        placeItems: "center",
                        border: "1px dashed #ccc",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "#666",
                        background: "#fafafa",
                      }}
                    >
                      No image
                    </div>
                  )}
                </div>

                <div className={styles.product__actions}>
                  <Link href={`/admin/dashboard/product/${product._id}`} title="Edit">
                    <TbEdit />
                  </Link>
                  <Link
                    href={`/product/${product.slug}?style=${i}`}
                    title="View"
                  >
                    <AiOutlineEye />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      // hook your delete handler here
                    }}
                    title="Delete"
                    style={{ background: "transparent", border: 0, cursor: "pointer" }}
                  >
                    <RiDeleteBin2Line />
                  </button>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}