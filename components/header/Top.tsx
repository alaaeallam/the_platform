"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SessionProvider, useSession } from "next-auth/react";
import { COUNTRIES } from "@/lib/countries";
import styles from "./styles.module.scss";

import { MdSecurity } from "react-icons/md";
import { BsSuitHeart } from "react-icons/bs";
import { RiAccountPinCircleLine, RiArrowDropDownFill } from "react-icons/ri";

import UserMenu from "./UserMenu";

export type CountryInfo = {
  code: string;
  name: string;
  flagEmoji: string;
  flagUrl: string;
};

const COUNTRY_COOKIE = "country";

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";

  const prefix = `${name}=`;
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }

  return "";
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

function countryCodeToFlagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function buildCountryInfoFromCode(code: string): CountryInfo | undefined {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalizedCode)) return undefined;

  const matched = COUNTRIES.find((country) => country.code === normalizedCode);

  return {
    code: normalizedCode,
    name: matched?.name || normalizedCode,
    flagEmoji: countryCodeToFlagEmoji(normalizedCode),
    flagUrl: `https://flagcdn.com/w40/${normalizedCode.toLowerCase()}.png`,
  };
}

type TopProps = {
  country?: CountryInfo;
  currency?: string;
};

function TopContent({ country, currency = "USD" }: TopProps) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [useEmojiFlag, setUseEmojiFlag] = useState(false);
  const [cookieCountry, setCookieCountry] = useState<CountryInfo | undefined>(undefined);

  const accountLabel = useMemo(
    () => session?.user?.name || session?.user?.email || "My Account",
    [session]
  );

  useEffect(() => {
    const cookieCode = getCookie(COUNTRY_COOKIE);
    const parsed = buildCountryInfoFromCode(cookieCode);
    if (parsed) setCookieCountry(parsed);
  }, []);

  useEffect(() => {
    if (!country?.code) return;

    const normalizedCode = String(country.code).trim().toUpperCase();
    const currentCookie = getCookie(COUNTRY_COOKIE).trim().toUpperCase();

    if (currentCookie !== normalizedCode) {
      setCookie(COUNTRY_COOKIE, normalizedCode);
    }

    setCookieCountry(buildCountryInfoFromCode(normalizedCode) || country);
  }, [country]);

  const displayCountry = useMemo(() => cookieCountry || country, [cookieCountry, country]);

  return (
    <div className={styles.top}>
      <div className={styles.top__container}>
        <div />

        <ul className={styles.top__list}>
          <li className={styles.li} aria-label="Country and currency">
            {displayCountry ? (
              <>
                {!useEmojiFlag ? (
                  <Image
                    src={displayCountry.flagUrl}
                    alt={`${displayCountry.name} flag`}
                    width={18}
                    height={18}
                    unoptimized
                    onError={() => setUseEmojiFlag(true)}
                    style={{ borderRadius: 2, marginRight: 6 }}
                  />
                ) : (
                  <span style={{ marginRight: 6, fontSize: "1.05rem" }}>
                    {displayCountry.flagEmoji}
                  </span>
                )}
                <span>
                  {displayCountry.name} / {currency}
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

export default function Top(props: TopProps) {
  return (
    <SessionProvider>
      <TopContent {...props} />
    </SessionProvider>
  );
}