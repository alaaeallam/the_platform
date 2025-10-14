"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import styles from "@/app/styles/profile.module.scss";

export interface WishlistItemVM {
  _id: string;
  productId: string;
  name: string;
  slug: string;
  image: string;
  style: number;
}

interface WishlistClientProps {
  wishlist: WishlistItemVM[];
}

export default function WishlistClient({ wishlist }: WishlistClientProps) {
  const [items, setItems] = useState<WishlistItemVM[]>(wishlist);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const handleRemove = async (id: string) => {
    try {
      setLoading(id);
      await axios.put("/api/user/removeFromWishlist", { wishlist_id: id });
      setItems((prev) => prev.filter((x) => x._id !== id));
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Failed to remove item.");
      } else {
        setError("Failed to remove item.");
      }
    } finally {
      setLoading(null);
    }
  };

  if (!items.length) {
    return <p className={styles.empty}>Your wishlist is empty.</p>;
  }

  return (
    <div className={styles.wishlist}>
      {items.map((item) => (
        <div key={item._id} className={styles.wishlist__item}>
          <Link href={`/products/${item.slug}?style=${item.style}`}>
            <Image
              src={item.image}
              alt={item.name}
              width={120}
              height={120}
              className={styles.wishlist__image}
            />
          </Link>
          <div className={styles.wishlist__info}>
            <h4>{item.name}</h4>
            <button
              disabled={loading === item._id}
              onClick={() => handleRemove(item._id)}
              className={styles.remove}
            >
              {loading === item._id ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
      ))}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}