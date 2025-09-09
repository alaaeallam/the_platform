// components/header/UserMenu.tsx
"use client";

import Link from "next/link";
import styles from "./styles.module.scss";
import Image from "next/image";
import { useSession, signOut, signIn } from "next-auth/react";

export default function UserMenu() {
  const { data: session } = useSession();

  return (
    <div className={styles.menu}>
      <h4>Welcome to Shoppay !</h4>

      {session ? (
        <div className={styles.flex}>
          <Image
            src={session.user?.image ?? "/avatar.jpg"}
            alt="user"
            className={styles.menu__img}
            width={40}
            height={40}
          />
          <div className={styles.col}>
            <span>Welcome Back,</span>
            <h3>{session.user?.name ?? session.user?.email}</h3>
            <button className={styles.linkLike} onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.flex}>
          <Link className={styles.btn_primary} href="/login?mode=register">
            Register
          </Link>
          <button className={styles.btn_outlined} onClick={() => signIn()}>
            Login
          </button>
        </div>
      )}

      <ul>
        <li><Link href="/profile">Account</Link></li>
        <li><Link href="/profile/orders">My Orders</Link></li>
        <li><Link href="/profile/messages">Message Center</Link></li>
        <li><Link href="/profile/address">Address</Link></li>
        <li><Link href="/profile/whishlist">Whishlist</Link></li>
      </ul>
    </div>
  );
}