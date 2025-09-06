'use client';
import styles from "./styles.module.scss";
import { MdSecurity } from "react-icons/md";
import { BsSuitHeart } from "react-icons/bs";
import { RiAccountPinCircleLine, RiArrowDropDownFill } from "react-icons/ri";
import Link from "next/link";
import { useState } from "react";
import UserMenu from "./UserMenu";
// import UserMenu from "./UserMenu";
// import { useSession } from "next-auth/react";
export default function Top() {
const [LoggedIn, setLoggedIn] = useState(true);
const [visible, setVisible] = useState(false);
  return (
    <div className={styles.top}>
      <div className={styles.top__container}>
        <div></div>
        <ul className={styles.top__list}>
          <li className={styles.li}>
            <img src="https://www.sis.gov.eg/Content/Upload/slider/520161814523505.jpg" alt="" />
            <span>Egypt / USD</span>
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
            <Link href="/profile/whishlist">
              <span>Whishlist</span>
            </Link>
          </li>
          <li className={styles.li}
          onMouseOver={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
          >
            {LoggedIn ? (
            <li className={styles.li}>
              <img
                src="https://avatars.githubusercontent.com/u/9919?s=280&v=4"
                alt="user"
                className={styles.user__img}
              />
                <span>Alaa Allam</span>
              <RiArrowDropDownFill />
            </li>
          ) : (
            <li className={styles.li}>
              <RiAccountPinCircleLine />
              <span>My Account</span>
              <RiArrowDropDownFill />
              {/* {visible && <UserMenu />} */}
            </li>
          )}
         {
            visible && <UserMenu LoggedIn={LoggedIn} />
         }
          
          </li>
        </ul>
      </div>
    </div>
  );
}
