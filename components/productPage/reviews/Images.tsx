// components/productPage/reviews/Images.tsx
"use client";

import { useRef, useState } from "react";
import { MdOutlineRemoveCircle } from "react-icons/md";
import styles from "./styles.module.scss";

type ImagesProps = {
  /** Data-URI images selected by the user */
  images: string[];
  /** Setter provided by parent to update images */
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

    // Respect max count
    const remainingSlots = Math.max(0, MAX_IMAGES - images.length);
    const toProcess = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      setError(`Maximum ${MAX_IMAGES} images are allowed.`);
    }

    toProcess.forEach((file) => {
      // Validate type
      if (!ALLOWED_TYPES.has(file.type)) {
        setError(
          `${file.name} format is unsupported. Only JPEG, PNG, WEBP are allowed.`
        );
        return;
      }
      // Validate size
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is too large. Max 5MB allowed.`);
        return;
      }

      // Read as Data URL
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === "string") {
          setImages((prev) => [...prev, result]);
          // Clear any prior error if we successfully add at least one image
          setError("");
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input so selecting the same file again will trigger onChange
    e.target.value = "";
  };

  const removeImage = (imgToRemove: string) => {
    setImages((prev) => prev.filter((img) => img !== imgToRemove));
    // Clear error if we’re back under the cap
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
            <img src={img} alt={`User uploaded ${i + 1}`} />
          </span>
        ))}
      </div>
    </div>
  );
}