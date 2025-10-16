"use client";

//app/components/home/main/HomeMainClient.tsx

// Styles & Components
import styles from "./styles.module.scss";

import Offers from "./offers";
import Menu from "./Menu";
import User from "./User";
import Header from "./Header";


// Swiper

import "swiper/css";
import "swiper/css/effect-cards";

import React from "react";

import BannerFromApi from "@/components/banners/BannerFromApi";


export default function Main(): React.JSX.Element {

  return (
    <div className={styles.main}>
      <Header />
      <Menu />
        {/* <MainSwiper /> */}
        <BannerFromApi placement="home-hero" locale="en" />
      <Offers />
      <User />
    </div>
  );
}