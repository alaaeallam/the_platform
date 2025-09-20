// components/productPage/reviews/Images.tsx
"use client";

import { useRef, useState } from "react";
import Image from "next/image"; // ✅ use Next Image
import { MdOutlineRemoveCircle } from "react-icons/md";
import styles from "./styles.module.scss";

type ImagesProps = {
  images: string[]; // data: URLs
  setImages: (updater: (prev: string[]) => string[]) => void;
};

const MAX_IMAGES = 3;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function Images({ images, setImages }: ImagesProps): React.JSX.Element {
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remainingSlots = Math.max(0, MAX_IMAGES - images.length);
    const toProcess = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      setError(`Maximum ${MAX_IMAGES} images are allowed.`);
    }

    toProcess.forEach((file) => {
      if (!ALLOWED_TYPES.has(file.type)) {
        setError(`${file.name} format is unsupported. Only JPEG, PNG, WEBP are allowed.`);
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is too large. Max 5MB allowed.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === "string") {
          setImages((prev) => [...prev, result]);
          setError("");
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeImage = (imgToRemove: string) => {
    setImages((prev) => prev.filter((img) => img !== imgToRemove));
    if (images.length - 1 < MAX_IMAGES) setError("");
  };

  return (
    <div>
      <input
        type="file"
        ref={inputRef}
        hidden
        onChange={handleImages}
        multiple
        accept="image/png,image/jpeg,image/webp"
      />

      <button
        type="button"
        className={styles.login_btn}
        style={{ width: 150 }}
        onClick={() => inputRef.current?.click()}
      >
        Add images
      </button>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.imgs_wrap}>
        {images.map((img, i) => (
          <span key={`${i}-${img.slice(0, 16)}`}>
            <MdOutlineRemoveCircle
              onClick={() => removeImage(img)}
              aria-label="Remove image"
              role="button"
              tabIndex={0}
            />
            {/* ✅ Next Image for data URLs; mark unoptimized and give fixed size */}
            <Image
              src={img}
              alt={`User uploaded ${i + 1}`}
              width={96}
              height={96}
              sizes="96px"
              className={styles.preview}
              unoptimized
            />
          </span>
        ))}
      </div>
    </div>
  );
}