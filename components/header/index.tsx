// components/header/index.tsx
"use client";

import styles from "./styles.module.scss";
import Top from "./Top";
import Main from "./Main";
import Ad from "./Ad";

import type { CountryInfo } from "@/utils/countries";

type HeaderProps = {
  country?: CountryInfo; // <- new shape (code, name, flagEmoji, flagUrl)
};

export default function Header({ country }: HeaderProps) {
  return (
    <header className={styles.header}>
      <Ad />
      <Top country={country} />
      {/* Main is your search/logo row; keep as-is unless it needs country too */}
      <Main />
    </header>
  );
}