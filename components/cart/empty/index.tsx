// components/cart/empty/index.tsx
"use client";

import Image from "next/image";
import styles from "./styles.module.scss";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

export default function Empty() {
  const { data: session } = useSession();

  return (
    <div className={styles.empty}>
      <Image
        src="/images/empty.png"
        alt="Empty cart"
        width={200}
        height={200}
        priority
      />
      <h1>Cart is empty</h1>

      {!session && (
        <button onClick={() => signIn()} className={styles.empty__btn}>
          SIGN IN / REGISTER
        </button>
      )}

      <Link href="/browse">
        <button className={`${styles.empty__btn} ${styles.empty__btn_v2}`}>
          SHOP NOW
        </button>
      </Link>
    </div>
  );
}