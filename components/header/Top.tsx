"use client";
import styles from "./styles.module.scss";
import { MdSecurity } from "react-icons/md";
import { BsSuitHeart } from "react-icons/bs";
import { RiAccountPinCircleLine, RiArrowDropDownFill } from "react-icons/ri";
import Link from "next/link";
import { useState } from "react";
import UserMenu from "./UserMenu";

type Country = { name: string; flag: string };

export default function Top({ country }: { country: Country }) {
  const [loggedIn] = useState(true);
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.top}>
      <div className={styles.top__container}>
        <div />
        <ul className={styles.top__list}>
          <li className={styles.li}>
            {/* Flag can be emoji or URL; render smartly */}
            {country.flag?.startsWith("http") ? (
              <img src={country.flag} alt={country.name} />
            ) : (
              <span>{country.flag}</span>
            )}
            <span>{country.name} / USD</span>
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
            <Link href="/profile/whishlist">Whishlist</Link>
          </li>

          {/* Account dropdown – avoid <li> inside <li> */}
          <li
            className={styles.li}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
          >
            <div className={styles.accountTrigger}>
              {loggedIn ? (
                <>
                  <img
                    src="https://avatars.githubusercontent.com/u/9919?s=280&v=4"
                    alt="user"
                    className={styles.user__img}
                  />
                  <span>Alaa Allam</span>
                  <RiArrowDropDownFill />
                </>
              ) : (
                <>
                  <RiAccountPinCircleLine />
                  <span>My Account</span>
                  <RiArrowDropDownFill />
                </>
              )}
            </div>

            {visible && <UserMenu loggedIn={loggedIn} />}
          </li>
        </ul>
      </div>
    </div>
  );
}