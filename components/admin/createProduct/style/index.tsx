// app/components/admin/createProduct/style/index.tsx
"use client";

import * as React from "react";
import { useRef } from "react";
import { useField, ErrorMessage } from "formik";
import { useAppDispatch } from "@/store"; // ✅ typed dispatch hook
import { showDialog } from "@/store/DialogSlice";

import styles from "./styles.module.scss";

/* =========================
   Types
   ========================= */

interface ProductColor {
  color: string;
  image: string;
}

interface ProductShape {
  color: ProductColor;
  [key: string]: unknown;
}

interface StyleProps {
  product: ProductShape;
  setProduct: React.Dispatch<React.SetStateAction<ProductShape>>;
  name: string;
  colorImage?: string;
}

type AcceptableMime = "image/jpeg" | "image/png" | "image/webp";

/* =========================
   Constants
   ========================= */

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED: AcceptableMime[] = ["image/jpeg", "image/png", "image/webp"];

/* =========================
   Component
   ========================= */

export default function Style({
  product,
  setProduct,
  name,
  colorImage,
}: StyleProps): React.JSX.Element {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [, meta] = useField(name);

  const openDialog = (title: string, message: string): void => {
    dispatch(
      showDialog({
        header: title,
        msgs: [{ msg: message, type: "error" }],
      })
    );
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const img = e.target.files?.[0];
    if (!img) return;

    if (!ACCEPTED.includes(img.type as AcceptableMime)) {
      openDialog(
        "Unsupported Format",
        `${img.name} format is unsupported! Only JPEG, PNG, WEBP are allowed.`
      );
      return;
    }

    if (img.size > MAX_BYTES) {
      openDialog(
        "File Too Large",
        `${img.name} size is too large. Maximum of 10MB allowed.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        const updatedColor: ProductColor = {
          color: product.color?.color ?? "",
          image: result,
        };
        setProduct({ ...product, color: updatedColor });
      }
    };
    reader.readAsDataURL(img);
  };

  return (
    <div className={styles.images}>
      {/* Header */}
      <div className={`${styles.header} ${meta.error ? styles.header__error : ""}`}>
        <div className={styles.flex}>
          {meta.error && <img src="/images/warning.png" alt="Warning" />}
          Pick a Product Style Image
        </div>
        {meta.touched && meta.error && (
          <div className={styles.error__msg}>
            <span />
            <ErrorMessage name={name} />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        name="colorImageInput"
        hidden
        accept={ACCEPTED.join(",")}
        onChange={handleImage}
      />

      {/* Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={`${styles.btn} ${styles.btn__primary}`}
      >
        Pick Style
      </button>
    </div>
  );
}