"use client";

import Link from "next/link";
import styles from "./styles.module.scss";

type UserMenuProps = {
  loggedIn: boolean;
};

export default function UserMenu({ loggedIn }: UserMenuProps) {
  return (
    <div className={styles.menu} role="menu" aria-label="User menu">
      <h4>Welcome to Silhouett Egypt!</h4>

      {loggedIn ? (
        <div className={styles.flex}>
          <img
            src="https://avatars.githubusercontent.com/u/9919?s=280&v=4"
            alt="User avatar"
            className={styles.menu__img}
          />
          <div className={styles.col}>
            <span>Welcome Back,</span>
            <h3>Alaa Allam</h3>
            <button className={styles.linklike} type="button">
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.flex}>
          <Link href="/register" className={styles.btn_primary}>
            Register
          </Link>
          <Link href="/login" className={styles.btn_outlined}>
            Login
          </Link>
        </div>
      )}

      <ul className={styles.menu__list}>
        <li>
          <Link href="/profile">Account</Link>
        </li>
        <li>
          <Link href="/profile/orders">My Orders</Link>
        </li>
        <li>
          <Link href="/profile/messages">Message Center</Link>
        </li>
        <li>
          <Link href="/profile/address">Address</Link>
        </li>
        <li>
          <Link href="/profile/whishlist">Whishlist</Link>
        </li>
      </ul>
    </div>
  );
}