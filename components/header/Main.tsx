// components/header/Main.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.scss";
import { RiSearch2Line } from "react-icons/ri";
import { FaOpencart } from "react-icons/fa";
import { useAppSelector } from "@/store";
import { useState, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";

import { selectCartLineCount } from "@/store/cartSlice";

export default function Main() {
  const router = useRouter();
  const pathname = usePathname();
  const badgeCount = useAppSelector(selectCartLineCount);
  const [query, setQuery] = useState("");

  // Local search handler
  const searchHandler = (q: string) => {
    console.log("Search query:", q);
    // TODO: Replace with your actual search logic if needed
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (pathname !== "/browse") {
      router.push(`/browse?search=${encodeURIComponent(trimmed)}`);
    } else {
      searchHandler(trimmed);
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
          <span>{badgeCount}</span>
        </Link>
      </div>
    </div>
  );
}