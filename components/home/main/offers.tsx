"use client";

import Link from "next/link";
import styles from "./styles.module.scss";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";

import "swiper/css/pagination";

import "swiper/css/navigation";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type MarketingTag = {
  tag?: string;
  active?: boolean | string;
  isActive?: boolean | string;
  startAt?: string | null;
  endAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  badgeText?: string | number | null;
  priority?: number | string | null;
};

type ProductApiItem = {
  _id?: string;
  slug?: string;
  name?: string;
  createdAt?: string;
  discount?: number | string;
  subProducts?: Array<{
    images?: string[];
    sizes?: Array<{
      price?: number | string;
    }>;
  }>;
  marketingTags?: MarketingTag[];
};

type Offer = {
  id: string;
  image: string;
  price: number;
  discount: number;
  href: string;
  title: string;
  priority: number;
  createdAtMs: number;
};

type ActiveCoupon = {
  code: string;
  discountPercent?: number | null;
  description?: string | null;
  href?: string | null;
};

const FALLBACK_IMG = "/images/no_image.png";

function parseDateMs(value?: string | null): number | null {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const ddmmyyyy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    const ms = new Date(Number(yyyy), Number(mm) - 1, Number(dd), 0, 0, 0, 0).getTime();
    return Number.isFinite(ms) ? ms : null;
  }

  const isoLike = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoLike) {
    const [, yyyy, mm, dd] = isoLike;
    const ms = new Date(Number(yyyy), Number(mm) - 1, Number(dd), 0, 0, 0, 0).getTime();
    return Number.isFinite(ms) ? ms : null;
  }

  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function getFirstImage(product: ProductApiItem): string {
  return Array.isArray(product.subProducts) &&
    Array.isArray(product.subProducts[0]?.images) &&
    typeof product.subProducts[0]?.images?.[0] === "string" &&
    product.subProducts[0].images[0].trim()
    ? product.subProducts[0].images[0]
    : FALLBACK_IMG;
}

function getFirstPrice(product: ProductApiItem): number {
  const firstSize = product.subProducts?.[0]?.sizes?.[0];
  return toNumber(firstSize?.price, 0);
}

function getActiveBestSellerTag(tags: ProductApiItem["marketingTags"], nowMs: number): MarketingTag | null {
  if (!Array.isArray(tags)) return null;

  for (const row of tags) {
    if (!row || String(row.tag ?? "").trim().toUpperCase() !== "BEST_SELLER") continue;

    const status = row.isActive ?? row.active;
    const isEnabled =
      status === true ||
      String(status ?? "") === "true" ||
      String(status ?? "").trim().toLowerCase() === "active";

    if (!isEnabled) continue;

    const startMs = parseDateMs(row.startAt ?? row.startDate ?? null);
    const endMs = parseDateMs(row.endAt ?? row.endDate ?? null);

    if (startMs !== null && nowMs < startMs) continue;
    if (endMs !== null && nowMs > endMs) continue;

    return row;
  }

  return null;
}

function mapProductsToOffers(items: ProductApiItem[]): Offer[] {
  const nowMs = Date.now();

  return items
    .map((product, index) => {
      const activeTag = getActiveBestSellerTag(product.marketingTags, nowMs);
      const slug = typeof product.slug === "string" ? product.slug.trim() : "";

      if (!activeTag) {
        return null;
      }

      if (!slug) {
        return null;
      }

      const image = getFirstImage(product);
      const price = getFirstPrice(product);
      const discount = toNumber(product.discount, 0);
      const priority = toNumber(activeTag.priority, 9999);
      const createdAtMs = parseDateMs(product.createdAt) ?? 0;
      const title = typeof product.name === "string" && product.name.trim()
        ? product.name.trim()
        : "Best seller";


      return {
        id: String(product._id ?? slug ?? index),
        image,
        price,
        discount,
        href: `/products/${slug}`,
        title,
        priority,
        createdAtMs,
      };
    })
    .filter((item): item is Offer => item !== null)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.createdAtMs - a.createdAtMs;
    })
    .slice(0, 8);
}

export default function Offers(): React.JSX.Element {
  const [activeCoupon, setActiveCoupon] = useState<ActiveCoupon | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadFeaturedCoupon() {
      try {
        const res = await fetch("/api/coupons/featured", {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = (await res.json()) as ActiveCoupon | null;
        if (!cancelled && data?.code) {
          setActiveCoupon(data);
        }
      } catch {
        // keep graceful fallback UI
      }
    }

    void loadFeaturedCoupon();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadBestSellerOffers() {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) return;

        const data: unknown = await res.json();
        if (!Array.isArray(data)) return;

        const mapped = mapProductsToOffers(data as ProductApiItem[]);
        if (!cancelled) {
          setOffers(mapped);
        }
      } catch (error) {
        console.error("Failed to load BEST_SELLER offers:", error);
      }
    }

    void loadBestSellerOffers();

    return () => {
      cancelled = true;
    };
  }, []);

  const couponCode = activeCoupon?.code?.trim() || "MHAJJI";
  const couponDiscount = activeCoupon?.discountPercent ?? 30;
  const couponHref = activeCoupon?.href?.trim() || "/browse";
  const couponDescription = useMemo(() => {
    if (activeCoupon?.description?.trim()) return activeCoupon.description.trim();
    return `for ${couponDiscount}% off all products.`;
  }, [activeCoupon?.description, couponDiscount]);

  return (
    <div className={styles.offers}>
      <div className={styles.offers__text}>
        <p>
          Use Code <b>“{couponCode}”</b> {couponDescription}
        </p>
        <Link href={couponHref}>Shop now</Link>
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
          const src = offer.image || FALLBACK_IMG;

          return (
            <SwiperSlide key={offer.id}>
              <div style={{ width: "100%" }}>
                <Link href={offer.href} style={{ display: "block" }} aria-label={offer.title}>
                  <Image
                    src={src}
                    alt={offer.title}
                    width={220}
                    height={140}
                    unoptimized
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
              </div>
            </SwiperSlide>
          );
        })}

        {!offers.length && (
          <SwiperSlide key="empty-offers">
            <div
              style={{
                width: "100%",
                height: "140px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "1rem",
                background: "#f5f5f5",
                borderRadius: "8px",
                fontWeight: 600,
              }}
            >
              Best seller products will appear here soon.
            </div>
          </SwiperSlide>
        )}
      </Swiper>
    </div>
  );
}