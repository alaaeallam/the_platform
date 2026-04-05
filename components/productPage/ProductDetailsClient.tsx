"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import styles from "../../app/styles/product.module.scss";
import MainSwiper from "@/components/productPage/mainSwiper"; // this file should start with "use client"
import Infos from "@/components/productPage/infos";
import type { ProductInfosVM } from "@/components/productPage/infos";
import type { ProductReviewsVM } from "@/components/productPage/reviews";

type Props = { viewModel: ProductInfosVM & { images: string[] } };

const Reviews = dynamic(() => import("./reviews"), {
  ssr: false,
});

export default function ProductDetailsClient({ viewModel }: Props): React.JSX.Element {
  const [activeImg, setActiveImg] = useState<string>("");
  const reviewsVM: ProductReviewsVM = useMemo(
    () => ({
      _id: viewModel._id,
      rating: viewModel.rating ?? 0,
      reviews: [],
      ratings: [
        { percentage: 0 },
        { percentage: 0 },
        { percentage: 0 },
        { percentage: 0 },
        { percentage: 0 },
      ],
      allSizes: (viewModel.sizes ?? []).map((s) => ({ size: s.size })),
      colors: (viewModel.colors ?? []).map((c) => ({ color: c.color, image: c.image })),
    }),
    [viewModel._id, viewModel.rating, viewModel.sizes, viewModel.colors]
  );
  return (
    <div>
    <div className={styles.product__main}>
      <MainSwiper images={viewModel.images} activeImg={activeImg} />
      <Infos product={viewModel} setActiveImg={setActiveImg} />
    </div>
     <Reviews product={reviewsVM} />
     </div>
  );
}