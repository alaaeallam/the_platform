"use client";

import * as React from "react";
import { BsFillPatchMinusFill, BsFillPatchPlusFill } from "react-icons/bs";
import { sizesList } from "../../../../data/sizes";
import styles from "./styles.module.scss";
import RegionalPricingModal from "./RegionalPricingModal";

/* ---------- Types (string state for inputs, same as your current) ---------- */

export type CountryPriceRowUI = { country: string; price: string };            // "EG", "12"
export type CountryGroupPriceRowUI = { groupCode: string; price: string };     // "MENA", "10"

export type SizeRow = {
  /** leave empty string when product has no size */
  size?: string;
  /** keep as string because <input type="number" /> yields string values */
  qty: string;

  /** renamed from price -> basePrice to match your schema */
  basePrice: string;

  /** per-size discount (optional) */
  discount?: string;

  /** regional pricing */
  countryPrices: CountryPriceRowUI[];
  countryGroupPrices: CountryGroupPriceRowUI[];
};

export type ProductWithSizes = {
  sizes: SizeRow[];
  // Add other parent fields if needed
};

type Props = {
  sizes: SizeRow[];
  product: ProductWithSizes;
  setProduct: React.Dispatch<React.SetStateAction<ProductWithSizes>>;
};

/* ---------- Component ---------- */

const Sizes: React.FC<Props> = ({ sizes, setProduct }) => {
  const [noSize, setNoSize] = React.useState<boolean>(false);

  // controls the modal for a specific size row
  const [pricingOpenIndex, setPricingOpenIndex] = React.useState<number | null>(null);

  /** unified change for text/number/select inputs */
  const handleSizeField = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setProduct((prev) => {
      const updated = [...prev.sizes];
      updated[index] = { ...updated[index], [name]: value } as SizeRow;
      return { ...prev, sizes: updated };
    });
  };

  const handleRemove = (index: number): void => {
    if (sizes.length > 1) {
      setProduct((prev) => ({
        ...prev,
        sizes: prev.sizes.filter((_, i) => i !== index),
      }));
    }
  };

  const toggleNoSize = (): void => {
    setProduct((prev) => ({
      ...prev,
      sizes: prev.sizes.map((row) =>
        noSize
          ? // turning sizes back on → restore "size" field (keep existing if any)
            { ...row, size: row.size ?? "" }
          : // turning sizes off → drop size value
            (({ size, ...rest }) => rest)(row) as SizeRow
      ),
    }));
    setNoSize((s) => !s);
  };

  const addRow = (): void => {
    setProduct((prev) => ({
      ...prev,
      sizes: [
        ...prev.sizes,
        {
          size: "",
          qty: "",
          basePrice: "",
          discount: "",
          countryPrices: [],
          countryGroupPrices: [],
        }, // size is ignored when noSize === true
      ],
    }));
  };

  /** open regional pricing editor for a given row */
  const openPricing = (i: number) => setPricingOpenIndex(i);
  const closePricing = () => setPricingOpenIndex(null);

  /** update a whole size row (used by modal) */
  const patchSizeRow = (i: number, patch: Partial<SizeRow>) => {
    setProduct((prev) => {
      const updated = [...prev.sizes];
      updated[i] = { ...updated[i], ...patch } as SizeRow;
      return { ...prev, sizes: updated };
    });
  };

  return (
    <div>
      <div className={styles.header}>Sizes / Quantity / Pricing</div>

      <button type="button" className={styles.click_btn} onClick={toggleNoSize}>
        {noSize ? "Click if product has size" : "Click if product has no size"}
      </button>

      {sizes.map((row, i) => (
        <div className={styles.clicktoadd} key={i}>
          {/* Size selector (hidden when noSize) */}
          {!noSize && (
            <select
              name="size"
              value={row.size ?? ""}
              onChange={(e) => handleSizeField(i, e)}
            >
              <option value="">Select a size</option>
              {sizesList.map((size) => (
                <option value={size} key={size}>
                  {size}
                </option>
              ))}
            </select>
          )}

          {/* Qty */}
          <input
            type="number"
            name="qty"
            placeholder={noSize ? "Product Quantity" : "Size Quantity"}
            min={0}
            value={row.qty}
            onChange={(e) => handleSizeField(i, e)}
          />

          {/* Base price (renamed from price) */}
          <input
            type="number"
            name="basePrice"
            placeholder={noSize ? "Product Base Price" : "Size Base Price"}
            min={0}
            value={row.basePrice}
            onChange={(e) => handleSizeField(i, e)}
          />

          {/* Optional size discount (overrides subProduct discount) */}
          <input
            type="number"
            name="discount"
            placeholder="Size Discount %"
            min={0}
            max={100}
            value={row.discount ?? ""}
            onChange={(e) => handleSizeField(i, e)}
          />

          {/* Regional pricing button shows counts */}
          <button
            type="button"
            className={styles.click_btn}
            onClick={() => openPricing(i)}
            title="Per-country and per-group pricing"
          >
            Regional prices ({(row.countryGroupPrices?.length ?? 0) + (row.countryPrices?.length ?? 0)})
          </button>

          {!noSize && (
            <>
              <BsFillPatchMinusFill onClick={() => handleRemove(i)} />
              <BsFillPatchPlusFill onClick={addRow} />
            </>
          )}
        </div>
      ))}

      {/* Modal for current size row */}
      {pricingOpenIndex != null && (
        <RegionalPricingModal
          open
          onClose={closePricing}
          size={sizes[pricingOpenIndex]}
          onChange={(next) => patchSizeRow(pricingOpenIndex, next)}
        />
      )}
    </div>
  );
};

export default Sizes;

/* ---------- Helper: convert to schema shape on submit ---------- */
/** Call this before POSTing to API to get numbers instead of strings. */
export function normalizeSizesForPayload(uiSizes: SizeRow[]) {
  return uiSizes.map((s) => ({
    size: s.size, // omit if you're in noSize mode
    qty: Number(s.qty || 0),
    basePrice: Number(s.basePrice || 0),
    discount: s.discount === "" || s.discount == null ? undefined : Number(s.discount),
    countryPrices: (s.countryPrices || [])
      .filter((r) => r.country && r.price !== "")
      .map((r) => ({ country: r.country.toUpperCase(), price: Number(r.price) })),
    countryGroupPrices: (s.countryGroupPrices || [])
      .filter((r) => r.groupCode && r.price !== "")
      .map((r) => ({ groupCode: r.groupCode.toUpperCase(), price: Number(r.price) })),
  }));
}