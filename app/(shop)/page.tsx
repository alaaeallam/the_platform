// app/(shop)/page.tsx
"use client";

import React from "react";
import Main from "@/components/home/main";
import styles from "../styles/Home.module.scss";
import FlashDeals from "@/components/home/flashDeals";
import Category from "@/components/home/category";
import { useMediaQuery } from "react-responsive";
import { women_dresses, women_shoes, women_accessories, women_swiper } from "@/data/home";
import ProductsSwiper from "@/components/productsSwiper";


export default function Home(): React.JSX.Element {
  const isMedium = useMediaQuery({ query: "(max-width:850px)" });
  const isMobile = useMediaQuery({ query: "(max-width:550px)" });

  return (
    <div className={styles.home}>
      <div className={styles.container}>
        <Main />
        <FlashDeals />
        <div className={styles.home__category}>
          <Category header="Dresses" products={women_dresses} background="#5a31f4" />
          {!isMedium && (
            <Category header="Shoes" products={women_shoes} background="#3c811f" />
          )}
          {isMobile && (
            <Category header="Shoes" products={women_shoes} background="#3c811f" />
          )}
          <Category header="Accessories" products={women_accessories} background="#000" />
        </div>
        <ProductsSwiper products={women_swiper} />
          {/* <div className={styles.products}>
            {products.map((product) => (
              <ProductCard product={product} key={product._id} />
            ))}
          </div> */}
      </div>
    </div>
  );
}