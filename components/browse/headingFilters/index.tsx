"use client";

import { useState } from "react";
import { Tooltip } from "@mui/material";
import { AiTwotoneStar } from "react-icons/ai";
import { IoIosArrowDown } from "react-icons/io";
import { BsCheckLg } from "react-icons/bs";
import styles from "./styles.module.scss";
import { useSearchParams } from "next/navigation";
import React from "react";
type ReplaceResult = { result: string; active: boolean };

type SortValue =
  | ""
  | "popular"
  | "newest"
  | "topSelling"
  | "topReviewed"
  | "priceLowToHigh"
  | "priceHighToLow";

interface HeadingFiltersProps {
  priceHandler: (value: string, type: "min" | "max") => void;
  multiPriceHandler: (min: number, max: number | "") => void;
  shippingHandler: (value: string) => void;
  replaceQuery: (queryName: "shipping" | "rating", value: string) => ReplaceResult;
  ratingHandler: (value: string) => void;
  sortHandler: (value: SortValue) => void;
}

const sortingOptions: { name: string; value: SortValue }[] = [
  { name: "Recommend", value: "" },
  { name: "Most Popular", value: "popular" },
  { name: "New Arrivals", value: "newest" },
  { name: "Top Selling", value: "topSelling" },
  { name: "Top Reviewed", value: "topReviewed" },
  { name: "Price (low to high)", value: "priceLowToHigh" }, // fixed typo
  { name: "Price (high to low)", value: "priceHighToLow" },
];

export default function HeadingFilters({
  priceHandler,
  multiPriceHandler,
  shippingHandler,
  replaceQuery,
  ratingHandler,
  sortHandler,
}: HeadingFiltersProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const [show, setShow] = useState<boolean>(false);

  // use shared replaceQuery with a stable string value ("0") to toggle shipping
  const checkShipping = replaceQuery("shipping", "0");
  const checkRating = replaceQuery("rating", "4");

  const sortQuery = (searchParams.get("sort") || "") as SortValue;

  const currentSort =
    sortingOptions.find((x) => x.value === sortQuery)?.name || "Recommend";

  return (
    <div className={styles.filters}>
      {/* Price inputs */}
      <div className={styles.filters__price}>
        <span>Price :</span>
        <input
          type="number"
          placeholder="min"
          min={0}
          onChange={(e) => priceHandler(e.target.value, "min")}
        />
        <input
          type="number"
          placeholder="max"
          min={0}
          onChange={(e) => priceHandler(e.target.value, "max")}
        />
      </div>

      {/* Quick price buckets */}
      <div className={styles.filers__priceBtns}>
        <Tooltip title={<h2>Check out products under 10$</h2>} placement="top" arrow onClick={() => multiPriceHandler(0, 10)}>
          <button className={styles.tooltip_btn}>
            <span style={{ height: "10%" }} />
          </button>
        </Tooltip>
        <Tooltip title={<h2>Check out products between 10$ and 50$</h2>} placement="top" arrow onClick={() => multiPriceHandler(10, 50)}>
          <button className={styles.tooltip_btn}>
            <span style={{ height: "25%" }} />
          </button>
        </Tooltip>
        <Tooltip title={<h2>Check out products between 50$ and 100$</h2>} placement="top" arrow onClick={() => multiPriceHandler(50, 100)}>
          <button className={styles.tooltip_btn}>
            <span style={{ height: "50%" }} />
          </button>
        </Tooltip>
        <Tooltip title={<h2>Check out products between 100$ and 500$</h2>} placement="top" arrow onClick={() => multiPriceHandler(100, 500)}>
          <button className={styles.tooltip_btn}>
            <span style={{ height: "75%" }} />
          </button>
        </Tooltip>
        <Tooltip title={<h2>Check out products for more than 500$</h2>} placement="top" arrow onClick={() => multiPriceHandler(500, "")}>
          <button className={styles.tooltip_btn}>
            <span style={{ height: "100%" }} />
          </button>
        </Tooltip>
      </div>

      {/* Free shipping toggle */}
      <div className={styles.filters__shipping} onClick={() => shippingHandler(checkShipping.result)}>
        <input type="checkbox" name="shipping" id="shipping" checked={Boolean(searchParams.get("shipping") === "0")} readOnly />
        <label htmlFor="shipping">Free Shipping</label>
      </div>

      {/* Rating 4+ toggle */}
      <div className={styles.filters__rating} onClick={() => ratingHandler(checkRating.result)}>
        <input type="checkbox" name="rating" id="rating" checked={Boolean(searchParams.get("rating") === "4")} readOnly />
        <label htmlFor="rating">
          <AiTwotoneStar />
          <AiTwotoneStar />
          <AiTwotoneStar />
          <AiTwotoneStar /> &amp; up
        </label>
      </div>

      {/* Sort menu */}
      <div className={styles.filters__sort}>
        <span>Sort by</span>
        <div
          className={styles.filters__sort_list}
          onMouseOver={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          <button type="button">
            {currentSort}
            <div style={{ transform: show ? "rotate(180deg)" : "rotate(0deg)" }}>
              <IoIosArrowDown />
            </div>
          </button>
          <ul style={{ transform: show ? "scale3d(1,1,1)" : "scale3d(1,0,1)" }}>
            {sortingOptions.map((option) => (
              <li key={option.value} onClick={() => sortHandler(option.value)}>
                <a>
                  {sortQuery === option.value ? <b>{option.name}</b> : option.name}{" "}
                  {sortQuery === option.value ? <BsCheckLg /> : null}
                  {sortQuery !== option.value ? (
                    <div className={styles.check}>
                      <BsCheckLg />
                    </div>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
