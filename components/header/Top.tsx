// components/header/Top.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import styles from "./styles.module.scss";

import { MdSecurity } from "react-icons/md";
import { BsSuitHeart } from "react-icons/bs";
import { RiAccountPinCircleLine, RiArrowDropDownFill } from "react-icons/ri";

import UserMenu from "./UserMenu";

// Keep in sync with utils/countries
export type CountryInfo = {
  code: string;       // e.g. "EG"
  name: string;       // e.g. "Egypt"
  flagEmoji: string;  // 🇪🇬
  flagUrl: string;    // https CDN url
};

type TopProps = {
  country?: CountryInfo;
  currency?: string; // default "USD"
};

export default function Top({ country, currency = "USD" }: TopProps) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [useEmojiFlag, setUseEmojiFlag] = useState(false);

  const accountLabel = useMemo(
    () => session?.user?.name || session?.user?.email || "My Account",
    [session]
  );

  return (
    <div className={styles.top}>
      <div className={styles.top__container}>
        <div />

        <ul className={styles.top__list}>
          {/* Country / Currency */}
          <li className={styles.li} aria-label="Country and currency">
            {country ? (
              <>
                {!useEmojiFlag ? (
                  <Image
                    src={country.flagUrl}
                    alt={`${country.name} flag`}
                    width={18}
                    height={18}
                    unoptimized
                    onError={() => setUseEmojiFlag(true)}
                    style={{ borderRadius: 2, marginRight: 6 }}
                  />
                ) : (
                  <span style={{ marginRight: 6, fontSize: "1.05rem" }}>
                    {country.flagEmoji}
                  </span>
                )}
                <span>
                  {country.name} / {currency}
                </span>
              </>
            ) : (
              <span>{currency}</span>
            )}
          </li>

          <li className={styles.li}>
            <MdSecurity />
            <span>Buyer Protection</span>
          </li>

          <li className={styles.li}>
            <span>Customer Service</span>
          </li>

          <li className={styles.li}>
            <span>Help</span>
          </li>

          <li className={styles.li}>
            <BsSuitHeart />
            <Link href="/profile/wishlist">
              <span>Wishlist</span>
            </Link>
          </li>

          {/* Account dropdown */}
          <li
            className={styles.li}
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
            onFocus={() => setMenuOpen(true)}
            onBlur={() => setMenuOpen(false)}
          >
            {session ? (
              <>
                <Image
                  src={session.user?.image ?? "/avatar.jpg"}
                  alt="User avatar"
                  width={32}
                  height={32}
                  className={styles.user__img}
                />
                <span>{accountLabel}</span>
                <RiArrowDropDownFill />
              </>
            ) : (
              <>
                <RiAccountPinCircleLine />
                <span>My Account</span>
                <RiArrowDropDownFill />
              </>
            )}

            {menuOpen && <UserMenu />}
          </li>
        </ul>
      </div>
    </div>
  );
}