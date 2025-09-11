// components/productPage/mainSwiper/index.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import styles from "./styles.module.scss";

export interface MainSwiperImage { url: string; alt?: string }
export interface MainSwiperProps {
  images: Array<string | MainSwiperImage>;
  activeImg?: string; // can override main image externally (e.g., hover color)
  zoom?: number;      // magnification factor
}

export default function MainSwiper({ images, activeImg, zoom = 2 }: MainSwiperProps) {
  const normalized = useMemo<MainSwiperImage[]>(
    () =>
      (images ?? [])
        .map((img) => (typeof img === "string" ? { url: img } : img))
        .filter((x): x is MainSwiperImage => !!x?.url),
    [images]
  );

  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lens, setLens] = useState<{ x: number; y: number; show: boolean }>({
    x: 0,
    y: 0,
    show: false,
  });

  if (!normalized.length) {
    return <div className={styles.swiper}>No images available</div>;
  }

  const currentSrc = activeImg || normalized[active].url;

  function onEnter() {
    setLens((p) => ({ ...p, show: true }));
  }
  function onLeave() {
    setLens({ x: 0, y: 0, show: false });
  }
  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLens({ x, y, show: true });
  }

  // background position for zoom preview
  const bgPos = {
    backgroundImage: `url(${currentSrc})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${zoom * 100}% ${zoom * 100}%`,
    backgroundPosition: `${(-lens.x * (zoom - 1))}px ${(-lens.y * (zoom - 1))}px`,
  } as const;

  return (
    <div className={styles.swiper}>
      <div
        ref={containerRef}
        className={styles.swiper__active}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onMouseMove={onMove}
      >
        {/* Base image */}
        <img src={currentSrc} alt={normalized[active]?.alt ?? "Product image"} />

        {/* Zoom overlay */}
        {lens.show && <div className={styles.zoomOverlay} style={bgPos} />}
      </div>

      <div className={styles.swiper__list}>
        {normalized.map((img, i) => (
          <button
            type="button"
            className={`${styles.swiper__list_item} ${i === active ? styles.active : ""}`}
            key={i}
            onMouseOver={() => setActive(i)}
            onClick={() => setActive(i)}
            aria-label={`Preview ${i + 1}`}
          >
            <img src={img.url} alt={img.alt ?? `Thumbnail ${i + 1}`} />
          </button>
        ))}
      </div>
    </div>
  );
}