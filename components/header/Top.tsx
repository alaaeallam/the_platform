// components/header/Top.tsx
"use client";
import styles from "./styles.module.scss";
import { MdSecurity } from "react-icons/md";
import { BsSuitHeart } from "react-icons/bs";
import { RiAccountPinCircleLine, RiArrowDropDownFill } from "react-icons/ri";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import UserMenu from "./UserMenu";

export default function Top({ country }: { country?: { name: string; flag: string } }) {
  const { data: session } = useSession();
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.top}>
      <div className={styles.top__container}>
        <div />
        <ul className={styles.top__list}>
          <li className={styles.li}>
            {country?.flag && <Image src={country.flag} alt="" />}
            <span>{country?.name} / USD</span>
          </li>

          <li className={styles.li}><MdSecurity /><span>Buyer Protection</span></li>
          <li className={styles.li}><span>Customer Service</span></li>
          <li className={styles.li}><span>Help</span></li>

          <li className={styles.li}>
            <BsSuitHeart />
            <Link href="/profile/whishlist"><span>Whishlist</span></Link>
          </li>

          {/* Account dropdown trigger */}
          <li
            className={styles.li}
            onMouseOver={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
          >
            {session ? (
              <>
                <Image
                src={session.user?.image ?? "/avatar.jpg"}
                alt="user"
                width={32}
                height={32}
                className={styles.user__img}
                />
                <span>{session.user?.name ?? session.user?.email ?? "Account"}</span>
                <RiArrowDropDownFill />
              </>
            ) : (
              <>
                <RiAccountPinCircleLine />
                <span>My Account</span>
                <RiArrowDropDownFill />
              </>
            )}

            {visible && <UserMenu />}
          </li>
        </ul>
      </div>
    </div>
  );
}