"use client";

import React from "react";
import styles from "./styles.module.scss";
import Link from "next/link";
import { menuArray } from "@/data/home";

// Icons
import {
  GiLargeDress,
  GiClothes,
  Gi3dHammer,
  GiWatch,
  GiBallerinaShoes,
  GiHeadphones,
  GiHealthCapsule,
  GiSportMedal,
  GiBigDiamondRing,
} from "react-icons/gi";
import { MdOutlineSportsEsports, MdOutlineSmartToy } from "react-icons/md";
import { BiCameraMovie, BiGift, BiCategory } from "react-icons/bi";
import { FaBaby } from "react-icons/fa";
import { HiOutlineHome } from "react-icons/hi";
import { AiOutlineSecurityScan } from "react-icons/ai";
import { BsPhoneVibrate } from "react-icons/bs";

// Types
interface MenuItem {
  name: string;
  link: string;
}

// Icon mapping for cleaner JSX
const iconMap: Record<number, React.ReactElement> = {
  0: <GiLargeDress />,
  1: <GiClothes />,
  2: <GiHeadphones />,
  3: <GiWatch />,
  4: <HiOutlineHome />,
  5: <GiHealthCapsule />,
  6: <GiBallerinaShoes />,
  7: <GiBigDiamondRing />,
  8: <GiSportMedal />,
  9: <FaBaby />,
  10: <BiCameraMovie />,
  11: <MdOutlineSportsEsports />,
  12: <BsPhoneVibrate />,
  13: <MdOutlineSmartToy />,
  14: <BiGift />,
  15: <Gi3dHammer />,
  16: <AiOutlineSecurityScan />,
};

export default function Menu(): React.ReactElement {
  return (
    <div className={styles.menu}>
      <ul>
        <li>
          <span className={styles.menu__header}>
            <BiCategory />
            <b>Categories</b>
          </span>
        </li>
        <ul className={styles.menu__list}>
          {menuArray.map((item: MenuItem, i: number) => (
            <li key={i}>
              <Link href={item.link} className={styles.menu__link}>
                {iconMap[i] ?? null}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </ul>
    </div>
  );
}