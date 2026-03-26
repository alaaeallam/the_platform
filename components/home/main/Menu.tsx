"use client";

import React from "react";
import styles from "./styles.module.scss";
import Link from "next/link";


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
type MenuCategory = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
};

// Icon mapping for cleaner JSX
function getCategoryIcon(name: string): React.ReactElement {
  const value = name.toLowerCase();

  if (value.includes("women") || value.includes("dress")) return <GiLargeDress />;
  if (value.includes("men") || value.includes("fashion") || value.includes("cloth")) return <GiClothes />;
  if (value.includes("electronic") || value.includes("audio")) return <GiHeadphones />;
  if (value.includes("watch")) return <GiWatch />;
  if (value.includes("home") || value.includes("appliance")) return <HiOutlineHome />;
  if (value.includes("beauty") || value.includes("health")) return <GiHealthCapsule />;
  if (value.includes("shoe") || value.includes("sneaker") || value.includes("heel")) return <GiBallerinaShoes />;
  if (value.includes("accessor") || value.includes("jewel")) return <GiBigDiamondRing />;
  if (value.includes("sport")) return <GiSportMedal />;
  if (value.includes("kid") || value.includes("bab")) return <FaBaby />;
  if (value.includes("movie") || value.includes("television") || value.includes("tv")) return <BiCameraMovie />;
  if (value.includes("gaming") || value.includes("video game") || value.includes("game")) return <MdOutlineSportsEsports />;
  if (value.includes("phone") || value.includes("telecommunication") || value.includes("mobile")) return <BsPhoneVibrate />;
  if (value.includes("toy") || value.includes("hobbies")) return <MdOutlineSmartToy />;
  if (value.includes("gift") || value.includes("craft")) return <BiGift />;
  if (value.includes("machinery")) return <Gi3dHammer />;
  if (value.includes("security") || value.includes("safety")) return <AiOutlineSecurityScan />;

  return <BiCategory />;
}
export default function Menu({
  categories,
}: {
  categories: MenuCategory[];
}): React.ReactElement {
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
                    {categories.map((item) => (
            <li key={item._id}>
              <Link
                href={item.slug ? `/browse?category=${item.slug}` : "/browse"}
                className={styles.menu__link}
              >
                {getCategoryIcon(item.name)}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </ul>
    </div>
  );
}