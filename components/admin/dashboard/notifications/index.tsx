// components/admin/notifications/index.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IoNotificationsSharp } from "react-icons/io5";
import styles from "./styles.module.scss";
// Use your actual import path/alias:
import { notificationsData } from "@/data/notifications";

/* =========================
   Types
   ========================= */

interface NotificationItem {
  type: "order" | "account" | string;
  image: string;
  user: string;
  /** Some seeds store this as a string — allow both and coerce on render */
  total?: number | string;
  date?: string;
}

/* =========================
   Utils
   ========================= */

const toNumber = (v: number | string | undefined): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    // strip any non-numeric characters just in case
    const n = Number(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

/* =========================
   Component
   ========================= */

export default function Notifications(): React.JSX.Element {
  const [show, setShow] = useState<boolean>(false);

  // If your data module is JS, help TS understand its shape:
  const data = notificationsData as NotificationItem[];

  return (
    <div
      className={styles.dropdown}
      onMouseOver={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button
        type="button"
        className={styles.dropdown__svg}
        aria-haspopup="menu"
        aria-expanded={show}
        aria-label="Open notifications"
      >
        <IoNotificationsSharp />
      </button>

      <div
        className={`${styles.dropdown__content} ${show ? styles.active : ""} ${styles.scrollbar}`}
        role="menu"
      >
        <div className={styles.dropdown__content_notifications}>
          {data.map((n, i) => (
            <div
              key={i}
              className={styles.dropdown__content_notifications_notification}
            >
              <Image
                src={n.image || "/images/avatar.png"}
                alt={`${n.user}'s avatar`}
                width={40}
                height={40}
                className={styles.dropdown__avatar}
                priority
              />
              {n.type === "order" ? (
                <p>
                  <span>{n.user}</span> has created a new order, total of{" "}
                  {toNumber(n.total)} $
                </p>
              ) : (
                <p>
                  <span>{n.user}</span> new account created.
                </p>
              )}
            </div>
          ))}
        </div>

        <div className={styles.dropdown__content_footer}>
          <Link href="/admin/dashboard/notifications">See all notifications</Link>
        </div>
      </div>
    </div>
  );
}