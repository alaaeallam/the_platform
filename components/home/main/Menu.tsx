"use client";

import React from "react";
import styles from "./styles.module.scss";
import Link from "next/link";


// Icons
import {
  GiShoppingBag,
  GiClothes,
  GiPaintBrush,
  GiDiamondRing,
} from "react-icons/gi";
import { FaChild, FaHeart } from "react-icons/fa";
import { BiGift } from "react-icons/bi";
import { BsSun } from "react-icons/bs";
import { MdCelebration, MdOutlineCategory } from "react-icons/md";

// Types
type MenuCategory = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  iconKey?: string;
};

function normalizeIconKey(key?: string): string {
  const normalized = (key ?? "generic").trim().toLowerCase();

  switch (normalized) {
    case "bags":
      return "bag";
    case "clothing":
      return "clothes";
    case "kids-wall-art":
      return "kids";
    case "cards":
      return "gift";
    default:
      return normalized || "generic";
  }
}

function getCategoryIconByKey(key?: string): React.ReactElement {
  switch (normalizeIconKey(key)) {
    case "bag":
      return <GiShoppingBag />;
    case "clothes":
      return <GiClothes />;
    case "wall-art":
    case "caricature":
      return <GiPaintBrush />;
    case "gift":
      return <BiGift />;
    case "kids":
      return <FaChild />;
    case "seasonal":
      return <MdCelebration />;
    case "ramadan":
      return <GiDiamondRing />;
    case "valentine":
      return <FaHeart />;
    case "summer":
      return <BsSun />;
    case "generic":
    default:
      return <MdOutlineCategory />;
  }
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
            <MdOutlineCategory />
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
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    width={20}
                    height={20}
                    style={{
                      width: 20,
                      height: 20,
                      objectFit: "cover",
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  getCategoryIconByKey(item.iconKey)
                )}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </ul>
    </div>
  );
}