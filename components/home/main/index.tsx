"use client";



// Styles & Components
import styles from "./styles.module.scss";
import MainSwiper from "./swiper";
import Offers from "./offers";
import Menu from "./Menu";
import User from "./User";
import Header from "./Header";


// Swiper

import "swiper/css";
import "swiper/css/effect-cards";

import React from "react";

export default function Main(): React.JSX.Element {

  return (
    <div className={styles.main}>
      <Header />
      <Menu />
      <MainSwiper />
      <Offers />
      <User />
    </div>
  );
}