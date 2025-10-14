// app/components/admin/createProduct/images/index.tsx
"use client";

import * as React from "react";
import { useRef } from "react";
import { useField } from "formik";
import { useAppDispatch } from "@/store"; // typed hooks you’re already using elsewhere
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
  /** Formik field name (for validation message display) */
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

  // We only use Formik for error display, so we read the field meta by name
  const [, meta] = useField<string>(name);

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
      {/* Header + inline error */}
      <div className={`${styles.header} ${meta.error ? styles.header__error : ""}`}>
        <div className={styles.flex}>
          {meta.error && <Image src="/images/warning.png" alt="Warning" width={16} height={16} />}
          {header}
        </div>
        <span>
          {meta.touched && meta.error && (
            <div className={styles.error__msg}>
              <span />
              {/* Formik's <ErrorMessage> is fine, but we already have meta.error here */}
              {String(meta.error)}
            </div>
          )}
        </span>
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
            <Image src="/images/no_image.png" alt="No image" width={220} height={160} />
          ) : (
            images.map((img, i) => (
              <div className={styles.images__main_grid_wrap} key={`${img}-${i}`}>
                <div className={styles.blur} />
                <Image src={img} alt={`Product image ${i + 1}`} width={400} height={400} style={{ objectFit: "cover" }} />
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

      {/* Trigger picker */}
      <button
        type="button"
        disabled={images.length >= MAX_IMAGES}
        style={{ opacity: images.length >= MAX_IMAGES ? 0.5 : 1 }}
        onClick={() => fileInputRef.current?.click()}
        className={`${styles.btn} ${styles.btn__primary}`}
      >
        {text}
      </button>
    </div>
  );
}