// components/browse/BrowseClient.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@mui/material";

import styles from "@/app/styles/browse.module.scss";
import Header from "@/components/header";
import ProductCard from "@/components/productCard";
// Infer the prop type expected by ProductCard without re-declaring it
type ProductCardProps = React.ComponentProps<typeof ProductCard>;
type ProductForCard = ProductCardProps["product"];
import CategoryFilter from "@/components/browse/categoryFilter";
import SizesFilter from "@/components/browse/sizesFilter";
import ColorsFilter from "@/components/browse/colorsFilter";
import BrandsFilter from "@/components/browse/brandsFilter";
import StylesFilter from "@/components/browse/stylesFilter";
import PatternsFilter from "@/components/browse/patternsFilter";
import MaterialsFilter from "@/components/browse/materialsFilter";
import GenderFilter from "@/components/browse/genderFilter";
import HeadingFilters from "@/components/browse/headingFilters";

import type { CountryInfo } from "@/utils/countries";

type DeleteParam = Record<string, never>;

interface CategoryLite {
  _id: string;
  name: string;
}


export interface BrowseInitialPayload {
  categories: CategoryLite[];
  subCategories: unknown[]; // forwarded to CategoryFilter
  products: ProductForCard[];
  sizes: string[];
  colors: string[];
  brands: string[];
  stylesData: string[];
  patterns: string[];
  materials: string[];
  paginationCount: number;
  country: CountryInfo;
}

interface Props {
  initial: BrowseInitialPayload;
}

export default function BrowseClient({ initial }: Props): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // state for sticky layout
  const [scrollY, setScrollY] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const el = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    setHeight((headerRef.current?.offsetHeight || 0) + (el.current?.offsetHeight || 0));
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ------- helpers to update URL params -------
  const filter = (o: Partial<Record<string, string | number | DeleteParam>>) => {
    const sp = new URLSearchParams(searchParams?.toString());
    Object.entries(o).forEach(([k, v]) => {
      if (typeof v === "object") sp.delete(k);
      else sp.set(k, String(v));
    });
    router.push(`${pathname}?${sp.toString()}`);
  };

  const categoryHandler = (category: string) => filter({ category });
  const brandHandler = (brand: string) => filter({ brand });
  const styleHandler = (style: string) => filter({ style });
  const sizeHandler = (size: string) => filter({ size });
  const colorHandler = (color: string) => filter({ color });
  const patternHandler = (pattern: string) => filter({ pattern });
  const materialHandler = (material: string) => filter({ material });
  const genderHandler = (gender: string) => filter({ gender: gender === "Unisex" ? {} : gender });
  const priceHandler = (price: string, type: "min" | "max") => {
    const q = searchParams.get("price")?.split("_") || ["", ""];
    const [min, max] = q;
    const nv = type === "min" ? `${price}_${max}` : `${min}_${price}`;
    filter({ price: nv });
  };
  const multiPriceHandler = (min: number, max: number | "") => filter({ price: `${min}_${max}` });
  const shippingHandler = (shipping: string) => filter({ shipping });
  const ratingHandler = (rating: string) => filter({ rating });
  const sortHandler = (sort: string) => filter({ sort: sort === "" ? ({} as DeleteParam) : sort });
  const pageHandler = (_: unknown, page: number) => filter({ page });

  const replaceQuery = (queryName: string, value: string) => {
    const existed = searchParams.get(queryName) ?? "";
    const valueIdx = existed.indexOf(value);
    const underscoredIdx = existed.indexOf(`_${value}`);
    let result = "";
    if (existed) {
      if (existed === value) {
        result = ""; // remove param
      } else if (valueIdx !== -1) {
        if (underscoredIdx !== -1) result = existed.replace(`_${value}`, "");
        else if (valueIdx === 0) result = existed.replace(`${value}_`, "");
        else result = existed.replace(value, "");
      } else {
        result = `${existed}_${value}`;
      }
    } else {
      result = value;
    }
    return { result, active: Boolean(existed && valueIdx !== -1) };
  };

  // ------------------------ Render ------------------------
  // Safely compute a React key from whatever identifier the product exposes
  const getProductKey = (p: ProductForCard, idx: number): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyP = p as any;
    if (typeof anyP?._id !== "undefined" && anyP._id !== null) return String(anyP._id);
    if (typeof anyP?.id !== "undefined" && anyP.id !== null) return String(anyP.id);
    if (typeof anyP?.slug === "string" && anyP.slug) return anyP.slug;
    return String(idx);
  };

  return (
    <div className={styles.browse__container}>
      <div ref={headerRef}>
        <Header country={initial.country} />
      </div>

      <div ref={el}>
        <div className={styles.browse__path}>Home / Browse</div>
        <div className={styles.browse__tags}>
          {initial.categories.map((c) => (
            <Link href={"/browse?category=" + c._id} key={String(c._id)}>{c.name}</Link>
          ))}
        </div>
      </div>

      <div className={`${styles.browse__store} ${scrollY >= height ? styles.fixed : ""}`}>
        <div className={`${styles.browse__store_filters} ${styles.scrollbar}`}>
          <button
            className={styles.browse__clearBtn}
            onClick={() => router.push("/browse")}
          >
            {`Clear All (${Array.from(searchParams.keys()).length})`}
          </button>

          <CategoryFilter
            categories={initial.categories}
            subCategories={initial.subCategories}
            categoryHandler={categoryHandler}
            replaceQuery={replaceQuery}
          />
          <SizesFilter
            sizes={initial.sizes}
            sizeHandler={sizeHandler}
            replaceQuery={replaceQuery}
          />
          <ColorsFilter colors={initial.colors} colorHandler={colorHandler} replaceQuery={replaceQuery} />
          <BrandsFilter brands={initial.brands} brandHandler={brandHandler} replaceQuery={replaceQuery} />
          <StylesFilter data={initial.stylesData} styleHandler={styleHandler} replaceQuery={replaceQuery} />
          <PatternsFilter patterns={initial.patterns} patternHandler={patternHandler} replaceQuery={replaceQuery} />
          <MaterialsFilter materials={initial.materials} materialHandler={materialHandler} replaceQuery={replaceQuery} />
          <GenderFilter genderHandler={genderHandler} replaceQuery={replaceQuery} />
        </div>

        <div className={styles.browse__store_products_wrap}>
          <HeadingFilters
            priceHandler={priceHandler}
            multiPriceHandler={multiPriceHandler}
            shippingHandler={shippingHandler}
            ratingHandler={ratingHandler}
            replaceQuery={replaceQuery}
            sortHandler={sortHandler}
          />

          <div className={styles.browse__store_products}>
            {initial.products.map((product, idx) => (
              <ProductCard product={product} key={getProductKey(product, idx)} />
            ))}
          </div>

          <div className={styles.pagination}>
            <Pagination
              count={initial.paginationCount}
              defaultPage={Number(searchParams.get("page") || 1)}
              onChange={pageHandler}
              variant="outlined"
              color="primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
