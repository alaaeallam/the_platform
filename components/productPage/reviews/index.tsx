// components/productPage/reviews/index.tsx
"use client";

import { useState } from "react";
import Rating from "@mui/material/Rating";
import { useSession, signIn } from "next-auth/react";
import React from "react";
import AddReview from "./AddReview";
import Table from "./Table";
import styles from "./styles.module.scss";
import type { ReviewVM } from "./Review";

/* ---------- Types used by this component ---------- */

export interface HistogramBin {
  /** 0–100 percentage of reviews at this star (already calculated upstream). */
  percentage: number;
}

export interface ProductReviewsVM {
  /** Needed by AddReview when submitting to `/api/product/:id/review` */
  _id: string;

  /** Average rating for the product (0–5, steps of 0.5). */
  rating: number;

  /** Reviews shown in the table — shape matches <Review />. */
  reviews: ReviewVM[];

  /** Histogram rows ordered 5★ → 1★ (length 5). */
  ratings: HistogramBin[];

  /** Size options offered in the AddReview select. */
  allSizes: Array<{ size: string }>;

  /** Optional color/style options for AddReview. */
  colors?: Array<{ color?: string; image?: string }>;
}

interface ReviewsProps {
  product: ProductReviewsVM;
}

/* ---------- Component ---------- */

export default function Reviews({ product }: ReviewsProps): React.JSX.Element {
  const { data: session } = useSession();

  // Local state for table rendering & live updates from AddReview
  const [reviews, setReviews] = useState<ReviewVM[]>(product.reviews);

  return (
    <div className={styles.reviews}>
      <div className={styles.reviews__container}>
        <h1>Customer Reviews ({product.reviews.length})</h1>

        {/* Overview */}
        <div className={styles.reviews__stats}>
          <div className={styles.reviews__stats_overview}>
            <span>Average Rating</span>
            <div className={styles.reviews__stats_overview_rating}>
              <Rating
                name="product-average-rating"
                value={product.rating}
                precision={0.5}
                readOnly
                sx={{ color: "#FACF19" }}
              />
              <span>
                {product.rating === 0 ? "No review yet." : product.rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Histogram 5★ → 1★ */}
          <div className={styles.reviews__stats_reviews}>
            {product.ratings.map((bin, i) => {
              const starValue = 5 - i; // 5,4,3,2,1
              return (
                <div className={styles.reviews__stats_reviews_review} key={starValue}>
                  <Rating
                    name={`star-row-${starValue}`}
                    value={starValue}
                    readOnly
                    sx={{ color: "#FACF19" }}
                  />
                  <div className={styles.bar} aria-label={`${bin.percentage}%`}>
                    <div
                      className={styles.bar__inner}
                      style={{ width: `${bin.percentage}%` }}
                    />
                  </div>
                  <span>{bin.percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add review or prompt to sign in */}
        {session ? (
          <AddReview product={product} setReviews={setReviews} />
        ) : (
          <button onClick={() => signIn()} className={styles.login_btn}>
            Login to add review
          </button>
        )}

        {/* Reviews table */}
        <Table reviews={reviews} allSizes={product.allSizes} colors={product.colors ?? []} />
      </div>
    </div>
  );
}