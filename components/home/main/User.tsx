"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Image from "next/image";
import styles from "./styles.module.scss";

import { IoSettingsOutline } from "react-icons/io5";
import { HiOutlineClipboardList } from "react-icons/hi";
import { BsHeart } from "react-icons/bs";
import { AiOutlineMessage } from "react-icons/ai";

import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";

import { userSwiperArray } from "@/data/home";

type SwiperItem = { image: string; href?: string };

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dmhcnhtng/image/upload/v1664642478/992490_b0iqzq.png";

export default function User(): React.ReactElement {
  const { data: session, status } = useSession();

  const avatarSrc = session?.user?.image ?? DEFAULT_AVATAR;
  const displayName = session?.user?.name ?? "Guest";
  const slides: SwiperItem[] = userSwiperArray as SwiperItem[];

  return (
    <div className={styles.user}>
      {/* Header */}
      <Image
        src="/images/userHeader.jpg"
        alt="Header background"
        width={600}
        height={100}
        className={styles.user__header}
        priority
      />

      <div className={styles.user__container}>
        {/* Loading state */}
        {status === "loading" ? (
          <div className={styles.user__infos}>
            <div className={styles.skeletonAvatar} />
            <div className={styles.skeletonName} />
          </div>
        ) : session ? (
          // Logged-in state
          <div className={styles.user__infos}>
            <Image
              src={avatarSrc}
              alt="User avatar"
              width={48}
              height={48}
              className={styles.avatar}
            />
            <h4>{displayName}</h4>
          </div>
        ) : (
          // Guest state
          <div className={styles.user__infos}>
            <Image
              src={DEFAULT_AVATAR}
              alt="Default avatar"
              width={48}
              height={48}
              className={styles.avatar}
            />
            <div className={styles.user__infos_btns}>
              <Link href="/login" className={styles.btnPrimary}>
                Register
              </Link>
              <Link href="/login" className={styles.btnGhost}>
                Login
              </Link>
            </div>
          </div>
        )}

        {/* Links */}
        <ul className={styles.user__links}>
          <li>
            <Link href="/profile" aria-label="Profile" className={styles.iconLink}>
              <IoSettingsOutline />
            </Link>
          </li>
          <li>
            <Link href="#" aria-label="Orders" className={styles.iconLink}>
              <HiOutlineClipboardList />
            </Link>
          </li>
          <li>
            <Link href="#" aria-label="Messages" className={styles.iconLink}>
              <AiOutlineMessage />
            </Link>
          </li>
          <li>
            <Link href="#" aria-label="Wishlist" className={styles.iconLink}>
              <BsHeart />
            </Link>
          </li>
        </ul>

        {/* Swiper */}
        <div className={styles.user__swiper}>
          <Image
            src="https://assets.stickpng.com/images/5a5a6d2414d8c4188e0b088d.png"
            alt="New badge"
            width={50}
            height={50}
            className={styles.new}
          />

          <Swiper
            effect="cards"
            grabCursor
            navigation
            modules={[EffectCards, Navigation]}
            className="user__swiper"
            style={{ maxWidth: "180px", height: "240px", marginTop: "1rem" }}
          >
            {slides.map((item) => (
              <SwiperSlide key={item.image}>
                <Link href={item.href ?? "#"} aria-label="Swiper item">
                  <Image
                    src={item.image}
                    alt="Swiper item"
                    width={180}
                    height={240}
                    style={{ objectFit: "cover" }}
                  />
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Footer */}
      <Image
        src="/images/userHeader.jpg"
        alt="Footer background"
        width={600}
        height={100}
        className={styles.user__footer}
        priority
      />
    </div>
  );
}