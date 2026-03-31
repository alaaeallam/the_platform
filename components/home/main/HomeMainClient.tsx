"use client";

import styles from "./styles.module.scss";

import Offers from "./offers";
import Menu from "./Menu";
import User from "./User";
import Header from "./Header";

import "swiper/css";
import "swiper/css/effect-cards";

import React from "react";
import BannerFromApi from "@/components/banners/BannerFromApi";

type MenuCategory = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
};

export default function Main({
  categories,
}: {
  categories: MenuCategory[];
}): React.JSX.Element {
  return (
    <div className={styles.main}>
      <Header categories={categories}/>
      <Menu categories={categories} />
      <BannerFromApi placement="home-hero" locale="en" />
      <Offers />
      <User />
    </div>
  );
}