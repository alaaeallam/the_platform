"use client";

import { useState } from "react";
import styles from "../../app/styles/product.module.scss";
import MainSwiper from "@/components/productPage/mainSwiper"; // this file should start with "use client"
import Infos from "@/components/productPage/infos";
import type { ProductInfosVM } from "@/components/productPage/infos";

type Props = {
  viewModel: ProductInfosVM & { images: string[] };
};

export default function ProductDetailsClient({ viewModel }: Props) {
  const [activeImg, setActiveImg] = useState<string>("");

  return (
    <div className={styles.product__main}>
      <MainSwiper images={viewModel.images} activeImg={activeImg} />
      <Infos product={viewModel} setActiveImg={setActiveImg} />
    </div>
  );
}