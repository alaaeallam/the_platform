// components/productPage/reviews/AddReview.tsx
"use client";

import { useEffect, useState } from "react";
import Rating from "@mui/material/Rating";
import axios from "axios";
import { useDispatch } from "react-redux";
import { ClipLoader } from "react-spinners";

import Images from "./Images";
import Select from "./Select";
import styles from "./styles.module.scss";

import { hideDialog, showDialog } from "@/store/DialogSlice";
import DialogModal from "@/components/dialogModal";
import dataURItoBlob from "@/utils/dataURItoBlob";
import { uploadImages } from "@/requests/upload";
import { ReviewVM } from "./Review";

/* ---------- Types ---------- */

type MsgType = "error" | "success";

interface DialogMsg {
  msg: string;
  type: MsgType;
}

interface SizeVM {
  size: string;
}

interface ColorVM {
  color?: string;
  image?: string;
}

interface AddReviewProps {
 product: {
    _id: string;
    allSizes: { size: string }[];
    colors?: { color?: string; image?: string }[];
  };
  /** React state setter coming from parent <Reviews /> */
  setReviews: React.Dispatch<React.SetStateAction<ReviewVM[]>>;
}

/* ---------- Constants ---------- */

const FITS = ["Small", "True to size", "Large"] as const;

/* ---------- Component ---------- */

export default function AddReview({ product, setReviews }: AddReviewProps) {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);

  const [size, setSize] = useState<string>("");
  const [style, setStyle] = useState<string>("");
  const [fit, setFit] = useState<string>("");
  const [review, setReview] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [images, setImages] = useState<string[]>([]); // dataURIs from <Images />

  useEffect(() => {
    dispatch(hideDialog());
  }, [dispatch]);

  const handleSubmit = async () => {
    setLoading(true);

    const msgs: DialogMsg[] = [];
    if (!size) msgs.push({ msg: "Please select a size!", type: "error" });
    if (!style) msgs.push({ msg: "Please select a style!", type: "error" });
    if (!fit) msgs.push({ msg: "Please select how it fits!", type: "error" });
    if (!review.trim()) msgs.push({ msg: "Please add a review!", type: "error" });
    if (!rating) msgs.push({ msg: "Please select a rating!", type: "error" });

    if (msgs.length) {
      dispatch(
        showDialog({
          header: "Adding review error!",
          msgs,
        })
      );
      setLoading(false);
      return;
    }

    try {
      // Upload images if present
      let uploadedImages: string[] = [];
      if (images.length) {
        const blobs = images.map((uri) => dataURItoBlob(uri));
        const formData = new FormData();
        formData.append("path", "reviews images");
        blobs.forEach((b) => formData.append("file", b));
        uploadedImages = await uploadImages(formData);
      }

      // Submit review
      const { data } = await axios.put(`/api/product/${product._id}/review`, {
        size,
        style,
        fit,
        rating,
        review,
        images: uploadedImages,
      });

      setReviews(data.reviews as ReviewVM[]);

      // Reset form
      setStyle("");
      setSize("");
      setFit("");
      setImages([]);
      setRating(0);
      setReview("");
    } catch (err: unknown) {
      dispatch(
        showDialog({
          header: "Review submission failed",
          msgs: [
            {
              msg:
                (err as { response?: { data?: { message?: string } } })?.response
                  ?.data?.message ?? "Something went wrong. Please try again.",
              type: "error",
            },
          ],
        })
      );
    } finally {
      setLoading(false);
    }
  };

  // Derive simple string arrays for the Selects
  const sizeOptions = product.allSizes.map((s) => s.size);
  const colorOptions = (product.colors ?? [])
    .map((c) => c.color ?? "")
    .filter(Boolean);

  return (
    <div className={styles.reviews__add}>
      <DialogModal />

      <div className={styles.reviews__add_wrap}>
        <div className={styles.flex} style={{ gap: 10 }}>
          <Select
            property={size}
            text="Size"
            data={sizeOptions.filter((x) => x !== size)}
            handleChange={setSize}
          />
          <Select
            property={style}
            text="Style"
            data={colorOptions.filter((x) => x !== style)}
            handleChange={setStyle}
          />
          <Select
            property={fit}
            text="How does it fit"
            data={FITS.filter((x) => x !== fit)}
            handleChange={setFit}
          />
        </div>

        <Images images={images} setImages={setImages} />

        <textarea
          name="review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Write your review here"
        />

        <Rating
          name="review-rating"
          value={rating}
          onChange={(_e, val) => setRating(val ?? 0)}
          precision={0.5}
          sx={{ color: "#FACF19", fontSize: "3rem" }}
        />

        <button
          className={`${styles.login_btn} ${loading ? styles.disabled : ""}`}
          onClick={handleSubmit}
          disabled={loading}
        >
          Submit Review {loading && <ClipLoader loading={loading} color="#fff" size={18} />}
        </button>
      </div>
    </div>
  );
}