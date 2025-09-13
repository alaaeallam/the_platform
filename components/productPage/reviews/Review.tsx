"use client";

import { Rating } from "@mui/material";
import { AiOutlineLike } from "react-icons/ai";
import styles from "./styles.module.scss";

/* ---------- Types ---------- */
export interface ReviewVM {
  _id?: string;
  rating: number;
  review: string;
  fit?: string;
  size?: string;
  style?: { image?: string };
  images: Array<{ url: string }>;
  likes?: { likes: number };
  updatedAt?: string;
  reviewBy: { name: string; image?: string };
}

export interface ReviewProps {
  review: ReviewVM;
}

/* ---------- Component ---------- */
export default function Review({ review }: ReviewProps): React.JSX.Element {
  const { name, image } = review.reviewBy;

  const maskedName =
    name && name.length > 1
      ? `${name.slice(0, 1)}***${name.slice(-1)}`
      : name ?? "User";

  return (
    <div className={styles.review}>
      <div className={styles.flex}>
        <div className={styles.review__user}>
          <h4>{maskedName}</h4>
          {image && <img src={image} alt={`${maskedName} avatar`} />}
        </div>

        <div className={styles.review__review}>
          <Rating
            name="half-rating-read"
            value={review.rating}
            precision={0.5}
            readOnly
            sx={{ color: "#facf19" }}
          />
          <p>{review.review}</p>

          <p className={styles.flex} style={{ gap: 8 }}>
            <span>
              <b>Overall Fit:</b> {review.fit ?? "-"}
            </span>
            <span>
              <b>Size:</b> {review.size ?? "-"}
            </span>
            {review.style?.image && (
              <span className={styles.flex}>
                <img
                  src={review.style.image}
                  alt="Selected style"
                  className={styles.review__img}
                />
              </span>
            )}
          </p>
        </div>
      </div>

      <div className={styles.flex}>
        <div className={styles.review__images}>
          {review.images?.length > 0 &&
            review.images.map((img, i) =>
              img?.url ? (
                <img src={img.url} alt={`review image ${i + 1}`} key={`img-${i}`} />
              ) : null
            )}
        </div>

        <div className={styles.review__extra}>
          <div className={styles.review__extra_likes} title="Helpful">
            {review.likes?.likes ?? 0}
            <AiOutlineLike />
          </div>
          <div className={styles.review__extra_date}>
            {review.updatedAt?.slice(0, 10) ?? ""}
          </div>
        </div>
      </div>
    </div>
  );
}