"use client";

import styles from "./styles.module.scss";
import Top from "./Top";
import Main from "./Main";
import Ad from "./Ad";

type Country = { name: string; flag: string };

export default function Header({ country }: { country: Country }) {
  return (
    <header className={styles.header}>
      <Ad />
      {/* Top needs country */}
      <Top country={country} />
      {/* Main is your search/logo row */}
      <Main />
    </header>
  );
}