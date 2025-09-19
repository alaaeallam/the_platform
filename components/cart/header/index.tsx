"use client";

import Link from "next/link";
import Image from "next/image";
import { MdPlayArrow } from "react-icons/md";
import styles from "./styles.module.scss";

export default function Header(): React.JSX.Element {
  return (
    <header className={styles.header}>
      <div className={styles.header__container}>
        {/* Left: Logo */}
        <div className={styles.header__left}>
          <Link href="/" aria-label="Go to homepage">
            <Image
              src="/logo.png"
              alt="Shop logo"
              width={120}
              height={40}
              priority
            />
          </Link>
        </div>

        {/* Right: Continue shopping link */}
        <div className={styles.header__right}>
          <Link href="/browse" className={styles.continueShopping}>
            Continue Shopping
            <MdPlayArrow aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}