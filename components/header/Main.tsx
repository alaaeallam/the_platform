"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.scss";
import { RiSearch2Line } from "react-icons/ri";
import { FaOpencart } from "react-icons/fa";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useState, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Main() {
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState("");

  const cart = useSelector((s: RootState) => s.cart);
  const cartCount = cart?.items?.length ?? 0;

  // Local search handler
  const searchHandler = (q: string) => {
    console.log("Search query:", q);
    // TODO: Replace with your actual search logic if needed
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (pathname !== "/browse") {
      if (query.trim().length > 1) {
        router.push(`/browse?search=${encodeURIComponent(query.trim())}`);
      }
    } else {
      searchHandler(query.trim());
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.main__container}>
        <Link href="/" className={styles.logo}>
          <Image src="/silhouett.jpg" alt="Logo" width={170} height={170} />
        </Link>

        <form onSubmit={handleSearch} className={styles.search}>
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className={styles.search__icon} aria-label="Search">
            <RiSearch2Line />
          </button>
        </form>

        <Link href="/cart" className={styles.cart}>
          <FaOpencart />
          <span>{cartCount}</span>
        </Link>
      </div>
    </div>
  );
}