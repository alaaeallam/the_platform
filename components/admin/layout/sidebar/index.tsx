// components/admin/layout/sidebar/index.tsx
"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";   // ✅ App Router
import { useSession } from "next-auth/react";

import { useAppDispatch, useAppSelector } from "@/store"; // ✅ typed hooks
import { toggleSidebar } from "@/store/ExpandSlice";

import styles from "./styles.module.scss";

// Icons
import {
  MdArrowForwardIos,
  MdCollections,
  MdOutlineCategory,
  MdSpaceDashboard,
} from "react-icons/md";
import { FcSalesPerformance } from "react-icons/fc";
import { IoListCircleSharp, IoNotificationsSharp } from "react-icons/io5";
import { ImUsers } from "react-icons/im";
import { AiFillMessage } from "react-icons/ai";
import { FaThList } from "react-icons/fa";
import { BsPatchPlus } from "react-icons/bs";
import {
  RiCoupon3Fill,
  RiLogoutCircleFill,
  RiSettingsLine,
} from "react-icons/ri";

export default function Sidebar(): React.JSX.Element {
  const pathname = usePathname(); // e.g. /admin/dashboard/orders
  const routeTail = useMemo(() => {
    const parts = (pathname || "").split("/admin/dashboard/")[1];
    return parts ?? undefined;
  }, [pathname]);

  const { data: session } = useSession();

  // ✅ Typed Redux hooks (from store/index.ts)
  const dispatch = useAppDispatch();
  const expand = useAppSelector((s) => s.expandSidebar.expandSidebar);

  const handleExpand = (): void => {
    dispatch(toggleSidebar());
  };

  const isActive = (path: string | undefined): boolean =>
    routeTail === path || (path === undefined && routeTail === undefined);

  const userImageSrc =
    (typeof session?.user?.image === "string" && session.user.image) ||
    "/images/avatar.png";

  return (
    <div className={`${styles.sidebar} ${expand ? styles.opened : ""}`}>
      <button
        type="button"
        className={styles.sidebar__toggle}
        onClick={handleExpand}
        aria-label={expand ? "Collapse sidebar" : "Expand sidebar"}
      >
        <div
          style={{
            transform: expand ? "rotate(180deg)" : "",
            transition: "all .2s",
          }}
        >
          <MdArrowForwardIos />
        </div>
      </button>

      <div className={styles.sidebar__container}>
        <div className={styles.sidebar__header} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className={styles.sidebar__user}>
          <Image
            src={userImageSrc}
            alt={session?.user?.name ?? "User"}
            width={48}
            height={48}
            className={styles.sidebar__avatar}
            priority
          />
          <div className={styles.show}>
            <span>Welcome back 👋</span>
            <span>{session?.user?.name ?? "Admin"}</span>
          </div>
        </div>

        <ul className={styles.sidebar__list}>
          <li className={isActive(undefined) ? styles.active : ""}>
            <Link href="/admin/dashboard">
              <MdSpaceDashboard />
              <span className={styles.show}>Dashboard</span>
            </Link>
          </li>

          <li className={isActive("sales") ? styles.active : ""}>
            <Link href="/admin/dashboard/sales">
              <FcSalesPerformance />
              <span className={styles.show}>Sales</span>
            </Link>
          </li>

          <li className={isActive("orders") ? styles.active : ""}>
            <Link href="/admin/dashboard/orders">
              <IoListCircleSharp />
              <span className={styles.show}>Orders</span>
            </Link>
          </li>

          <li className={isActive("users") ? styles.active : ""}>
          <Link href="/admin/dashboard/users">
              <ImUsers />
              <span className={styles.show}>Users</span>
            </Link>
          </li>

          <li className={isActive("messages") ? styles.active : ""}>
            <Link href="/admin/dashboard/messages">
              <AiFillMessage />
              <span className={styles.show}>Messages</span>
            </Link>
          </li>
        </ul>

        {/* Product dropdown */}
        <div className={styles.sidebar__dropdown}>
          <div className={styles.sidebar__dropdown_heading}>
            <div className={styles.show}>Product</div>
          </div>

          <ul className={styles.sidebar__list}>
            <li className={isActive("product/all") ? styles.active : ""}>
              <Link href="/admin/dashboard/products/all">
                <FaThList />
                <span className={styles.show}>All Products</span>
              </Link>
            </li>

            <li className={isActive("products/create") ? styles.active : ""}>
              <Link href="/admin/dashboard/products/create">
                <BsPatchPlus />
                <span className={styles.show}>Create Product</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Categories dropdown */}
        <div className={styles.sidebar__dropdown}>
          <div className={styles.sidebar__dropdown_heading}>
            <div className={styles.show}>Categories / Subs</div>
          </div>

          <ul className={styles.sidebar__list}>
            <li className={isActive("categories") ? styles.active : ""}>
              <Link href="/admin/dashboard/categories">
                <MdOutlineCategory />
                <span className={styles.show}>Categories</span>
              </Link>
            </li>

            <li className={isActive("subCategories") ? styles.active : ""}>
              <Link href="/admin/dashboard/subCategories">
                <div style={{ transform: "rotate(180deg)" }}>
                  <MdOutlineCategory />
                </div>
                <span className={styles.show}>Sub-Categories</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Coupons */}
        <div className={styles.sidebar__dropdown}>
          <div className={styles.sidebar__dropdown_heading}>
            <div className={styles.show}>Coupons</div>
          </div>

          <ul className={styles.sidebar__list}>
            <li className={isActive("coupons") ? styles.active : ""}>
              <Link href="/admin/dashboard/coupons">
                <RiCoupon3Fill />
                <span className={styles.show}>Coupons</span>
              </Link>
            </li>
          </ul>
        </div>
         {/* Banners */}
        <div className={styles.sidebar__dropdown}>
          <div className={styles.sidebar__dropdown_heading}>
            <div className={styles.show}>Banners</div>
          </div>

          <ul className={styles.sidebar__list}>
            <li className={isActive("banners") ? styles.active : ""}>
              <Link href="/admin/dashboard/banners">
                <MdCollections size={22} />
                <span className={styles.show}>Banners</span>
              </Link>
            </li>
          </ul>
        </div>
        {/* Footer nav icons */}
        <nav>
          <ul
            className={`${styles.sidebar__list} ${
              expand ? styles.nav_flex : ""
            }`}
          >
            <li>
              <Link href="#" aria-label="Settings">
                <RiSettingsLine />
              </Link>
            </li>
            <li>
              <Link href="#" aria-label="Notifications">
                <IoNotificationsSharp />
              </Link>
            </li>
            <li>
              <Link href="#" aria-label="Messages">
                <AiFillMessage />
              </Link>
            </li>
            <li>
              <Link href="#" aria-label="Logout">
                <RiLogoutCircleFill />
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}