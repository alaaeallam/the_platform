// app/components/admin/createProduct/images/index.tsx
"use client";

import * as React from "react";
import { useRef } from "react";
import { useAppDispatch } from "@/store/hooks";// typed hooks you’re already using elsewhere
import { showDialog } from "@/store/DialogSlice";

import Image from "next/image";

import { RiDeleteBin7Fill, RiShape2Line } from "react-icons/ri";
import { GiExtractionOrb } from "react-icons/gi";

import styles from "./styles.module.scss";

/* =========================
   Types
   ========================= */

interface ImagesProps {
  /** Current list of images as data URLs (base64) */
  images: string[];
  /** Setter for the images array */
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  /** Section header, can be text or any node */
  header: React.ReactNode;
  /** Button text */
  text: string;
  name: string;
  /** Select one image to be the color/style image */
  setColorImage: (img: string) => void;
}

type AcceptableMime = "image/jpeg" | "image/png" | "image/webp";

/* =========================
   Constants
   ========================= */

const MAX_IMAGES = 6;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED: AcceptableMime[] = ["image/jpeg", "image/png", "image/webp"];

/* =========================
   Component
   ========================= */

export default function Images({
  images,
  setImages,
  header,
  text,
  name,
  setColorImage,
}: ImagesProps): React.JSX.Element {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  const openDialog = (title: string, message: string) => {
    dispatch(
      showDialog({
        header: title,
        msgs: [{ msg: message, type: "error" }],
      })
    );
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files ?? []);
    if (!fileList.length) return;

    if (images.length >= MAX_IMAGES) {
      openDialog("Maximum reached", `A maximum of ${MAX_IMAGES} images are allowed.`);
      return;
    }

    // we’ll append valid files until we reach the limit
    for (const file of fileList) {
      if (images.length >= MAX_IMAGES) {
        openDialog(
          "Maximum reached",
          `A maximum of ${MAX_IMAGES} images are allowed.`
        );
        break;
      }

      // MIME type check
      if (!ACCEPTED.includes(file.type as AcceptableMime)) {
        openDialog(
          "Unsupported format",
          `${file.name} is unsupported. Only JPEG, PNG, and WEBP are allowed.`
        );
        continue;
      }

      // size check
      if (file.size > MAX_BYTES) {
        openDialog(
          "File too large",
          `${file.name} exceeds the 10MB limit.`
        );
        continue;
      }

      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        const result = ev.target?.result;
        if (typeof result === "string") {
          setImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    }

    // reset input so the same file can be chosen again if needed
    e.target.value = "";
  };

  const handleRemove = (image: string) => {
    setImages((prev) => prev.filter((item) => item !== image));
  };

  return (
    <div className={styles.images}>
      <div
        className={styles.header}
        style={{ marginBottom: "0.75rem", fontSize: "1rem", fontWeight: 700 }}
      >
        <div className={styles.flex}>{header}</div>
        <span />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        name={name}
        hidden
        multiple
        accept={ACCEPTED.join(",")}
        onChange={handleImages}
      />

      {/* Grid preview */}
      <div className={styles.images__main}>
        <div
          className={`${styles.images__main_grid} ${
            images.length === 2
              ? styles.grid__two
              : images.length === 3
              ? styles.grid__three
              : images.length === 4
              ? styles.grid__foor /* if your scss has this exact name, keep it */
              : images.length === 5
              ? styles.grid__five
              : images.length === 6
              ? styles.grid__six
              : ""
          }`}
        >
          {!images.length ? (
            <div
              style={{
                minHeight: 260,
                display: "grid",
                placeItems: "center",
                borderRadius: 14,
                border: "1px dashed #cbd5e1",
                background: "#f8fafc",
                padding: "1rem",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Image
                  src="/images/no_image.png"
                  alt="No image"
                  width={220}
                  height={160}
                  style={{ objectFit: "contain", margin: "0 auto" }}
                />
                <p
                  style={{
                    margin: "0.75rem 0 0",
                    color: "#64748b",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                  }}
                >
                  No images uploaded yet.
                </p>
              </div>
            </div>
          ) : (
            images.map((img, i) => (
              <div className={styles.images__main_grid_wrap} key={`${img}-${i}`}>
                <div className={styles.blur} />
                <Image
                  src={img}
                  alt={`Product image ${i + 1}`}
                  width={400}
                  height={400}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
                <div className={styles.images__main_grid_actions}>
                  <button type="button" onClick={() => handleRemove(img)} aria-label="Remove image">
                    <RiDeleteBin7Fill />
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorImage(img)}
                    aria-label="Use as style image"
                  >
                    <GiExtractionOrb />
                  </button>
                  <button type="button" aria-label="Shape/transform (not implemented)">
                    <RiShape2Line />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={images.length >= MAX_IMAGES}
        style={{
          opacity: images.length >= MAX_IMAGES ? 0.5 : 1,
          minHeight: 48,
          padding: "0 20px",
          borderRadius: 12,
          fontWeight: 700,
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`${styles.btn} ${styles.btn__primary}`}
      >
        {images.length >= MAX_IMAGES ? `Maximum ${MAX_IMAGES} images reached` : text}
      </button>
    </div>
  );
}