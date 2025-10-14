// components/admin/dashboard/dropdown/index.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./styles.module.scss";

// Icons
import {
  MdOutlineCategory,
  MdSpaceDashboard,
} from "react-icons/md";
import { FcSalesPerformance } from "react-icons/fc";
import { IoListCircleSharp, IoNotificationsSharp } from "react-icons/io5";
import { ImUsers } from "react-icons/im";
import { AiFillMessage } from "react-icons/ai";
import { FaRegUserCircle, FaThList } from "react-icons/fa";
import { BsPatchPlus } from "react-icons/bs";
import {
  RiCoupon3Fill,
  RiLogoutCircleFill,
  RiSettingsLine,
} from "react-icons/ri";
import { VscHome } from "react-icons/vsc";

/* =========================
   Types
   ========================= */

interface DropdownProps {
  /** URL for the user avatar (optional). */
  userImage?: string | null;
}

/* =========================
   Component
   ========================= */

export default function Dropdown({ userImage }: DropdownProps): React.JSX.Element {
  const [show, setShow] = useState<boolean>(false);

  const avatarSrc =
    (typeof userImage === "string" && userImage) || "/images/avatar.png";

  return (
    <div
      className={styles.dropdown}
      onMouseOver={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button
        type="button"
        className={styles.dropdown__toggle}
        aria-haspopup="menu"
        aria-expanded={show}
        aria-label="Open admin quick menu"
      >
        <Image
          src={avatarSrc}
          alt="User avatar"
          width={40}
          height={40}
          className={styles.dropdown__avatar}
          priority
        />
      </button>

      <div
        className={`${styles.dropdown__content} ${show ? styles.active : ""}`}
        role="menu"
      >
        {/* Quick links (icons) */}
        <div className={styles.dropdown__content_icons}>
          <div className={styles.dropdown__content_icons_icon}>
            <Link href="/admin/dashboard" aria-label="Dashboard">
              <MdSpaceDashboard />
            </Link>
          </div>
          <div className={styles.dropdown__content_icons_icon}>
            <Link href="/admin/dashboard/sales" aria-label="Sales">
              <FcSalesPerformance />
            </Link>
          </div>
          <div className={styles.dropdown__content_icons_icon}>
            <Link href="/admin/dashboard/orders" aria-label="Orders">
              <IoListCircleSharp />
            </Link>
          </div>
          <div className={styles.dropdown__content_icons_icon}>
            <Link href="/admin/dashboard/users" aria-label="Users">
              <ImUsers />
            </Link>
          </div>
          <div className={styles.dropdown__content_icons_icon}>
            <Link href="/admin/dashboard/messages" aria-label="Messages">
              <AiFillMessage />
            </Link>
          </div>
          <div className={styles.dropdown__content_icons_icon}>
            <Link href="/admin/dashboard/product/all" aria-label="All Products">
              <FaThList />
            </Link>
          </div>
          <div className={styles.dropdown__content_icons_icon}>
            <Link href="/admin/dashboard/products/create" aria-label="Create Product">
              <BsPatchPlus />
            </Link>
          </div>
          <div className={styles.dropdown__content_icons_icon}>
            <Link href="/admin/dashboard/categories" aria-label="Categories">
              <MdOutlineCategory />
            </Link>
          </div>
          <div
            className={styles.dropdown__content_icons_icon}
            style={{ transform: "rotate(180deg)" }}
          >
            <Link href="/admin/dashboard/subCategories" aria-label="Sub-Categories">
              <MdOutlineCategory />
            </Link>
          </div>
          <div className={styles.dropdown__content_icons_icon}>
            <Link href="/admin/dashboard/coupons" aria-label="Coupons">
              <RiCoupon3Fill />
            </Link>
          </div>
        </div>

        {/* Secondary items */}
        <div className={styles.dropdown__content_items}>
          <div className={styles.dropdown__content_items_item}>
            <Link href="/" aria-label="Home">
              <VscHome />
            </Link>
          </div>
          <div className={styles.dropdown__content_items_item}>
            <Link href="/" aria-label="Profile">
              <FaRegUserCircle />
            </Link>
          </div>
          <div className={styles.dropdown__content_items_item}>
            <Link href="/" aria-label="Notifications">
              <IoNotificationsSharp />
            </Link>
          </div>
          <div className={styles.dropdown__content_items_item}>
            <Link href="/" aria-label="Settings">
              <RiSettingsLine />
            </Link>
          </div>
        </div>

        {/* Logout */}
        <div className={styles.dropdown__logout}>
          <button
            type="button"
            onClick={() => signOut()}
            aria-label="Logout"
            className={styles.logoutBtn}
          >
            <RiLogoutCircleFill />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}