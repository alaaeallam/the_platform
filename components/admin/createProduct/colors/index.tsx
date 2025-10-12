// app/components/admin/createProduct/colors/index.tsx
"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useField, ErrorMessage } from "formik";
import ColorThief from "color-thief-browser";
import { TbArrowUpRightCircle } from "react-icons/tb";
import styles from "./styles.module.scss";

/* ---------- Types ---------- */
interface ProductColor {
  color: string;
  image: string;
}

interface ProductShape {
  color: ProductColor;
  [key: string]: unknown;
}

interface ColorsProps {
  product: ProductShape;
  setProduct: React.Dispatch<React.SetStateAction<ProductShape>>;
  name: string;
  colorImage?: string | null;
}

/* ---------- Component ---------- */
export default function Colors({
  product,
  setProduct,
  name,
  colorImage,
}: ColorsProps): React.JSX.Element {
  const [toggle, setToggle] = useState(false);
  const [palette, setPalette] = useState<string[]>([]);
  const [field, meta] = useField<string>(name);

  // Extract colors from the image whenever it changes
  useEffect(() => {
    if (!colorImage) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = colorImage;

    img.onload = () => {
      try {
        const thief = new ColorThief();
        const paletteRGB = thief.getPalette(img, 6);
        const paletteHex = paletteRGB.map(
          ([r, g, b]) => `rgb(${r}, ${g}, ${b})`
        );
        setPalette(paletteHex);
      } catch (err) {
        console.error("Color extraction failed:", err);
      }
    };
  }, [colorImage]);

  const applyColor = (picked: string) => {
    setProduct((prev) => ({
      ...prev,
      color: { color: picked, image: prev.color?.image ?? "" },
    }));
  };

  return (
    <div className={styles.colors}>
      <div className={`${styles.header} ${meta.error ? styles.header__error : ""}`}>
        <div className={styles.flex}>
          {meta.error && <img src="/images/warning.png" alt="Warning" />}
          Pick a product color
        </div>
        {meta.touched && meta.error && (
          <div className={styles.error__msg}>
            <ErrorMessage name={name} />
          </div>
        )}
      </div>

      <input
        type="text"
        hidden
        {...field}
        value={product.color?.color ?? ""}
        readOnly
      />

      {palette.length > 0 && (
        <div className={`${toggle ? styles.toggle : ""}`}>
          <div className={styles.wheel}>
            {palette.map((c, i) => (
              <button
                key={i}
                type="button"
                className={styles.square__color}
                style={{ backgroundColor: c }}
                onClick={() => applyColor(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {palette.length > 0 && (
        <TbArrowUpRightCircle
          className={styles.toggle__btn}
          onClick={() => setToggle((prev) => !prev)}
          style={{ transform: toggle ? "rotate(180deg)" : undefined }}
        />
      )}
    </div>
  );
}