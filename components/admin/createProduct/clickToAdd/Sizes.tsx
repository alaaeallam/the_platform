"use client";

import * as React from "react";
import { BsFillPatchMinusFill, BsFillPatchPlusFill } from "react-icons/bs";
import { sizesList } from "../../../../data/sizes";
import styles from "./styles.module.scss";
import RegionalPricingModal from "./RegionalPricingModal";

export type CountryPriceRowUI = { country: string; price: string };
export type CountryGroupPriceRowUI = { groupCode: string; price: string };

export type SizeRow = {
  size?: string;
  qty: string;
  basePrice: string;
  discount?: string;
  countryPrices: CountryPriceRowUI[];
  countryGroupPrices: CountryGroupPriceRowUI[];
};

export type ProductWithSizes = {
  sizes: SizeRow[];
};

type Props = {
  sizes: SizeRow[];
  product: ProductWithSizes;
  setProduct: React.Dispatch<React.SetStateAction<ProductWithSizes>>;
};

const Sizes: React.FC<Props> = ({ sizes, setProduct }) => {
  const [noSize, setNoSize] = React.useState<boolean>(false);
  const [pricingOpenIndex, setPricingOpenIndex] = React.useState<number | null>(null);

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
          ? { ...row, size: row.size ?? "" }
          : (({ size, ...rest }) => rest)(row) as SizeRow
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
        },
      ],
    }));
  };

  const openPricing = (i: number) => setPricingOpenIndex(i);
  const closePricing = () => setPricingOpenIndex(null);

  const patchSizeRow = (i: number, patch: Partial<SizeRow>) => {
    setProduct((prev) => {
      const updated = [...prev.sizes];
      updated[i] = { ...updated[i], ...patch } as SizeRow;
      return { ...prev, sizes: updated };
    });
  };

  return (
    <div style={{ width: "100%", marginBottom: "1.5rem" }}>
      <div
        className={styles.header}
        style={{ marginBottom: "0.75rem", fontSize: "1rem", fontWeight: 700 }}
      >
        Sizes / Quantity / Pricing
      </div>

      <button
        type="button"
        className={styles.click_btn}
        onClick={toggleNoSize}
        style={{ marginBottom: "1rem" }}
      >
        {noSize ? "Click if product has size" : "Click if product has no size"}
      </button>

      <div style={{ display: "grid", gap: "1rem" }}>
        {sizes.map((row, i) => (
          <div
            className={styles.clicktoadd}
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: noSize
                ? "repeat(auto-fit, minmax(180px, 1fr)) auto auto auto"
                : "repeat(auto-fit, minmax(160px, 1fr)) auto auto auto",
              gap: "0.75rem",
              alignItems: "center",
              padding: "1rem",
              border: "1px solid #e5e7eb",
              borderRadius: "14px",
              background: "#fff",
            }}
          >
            {!noSize && (
              <select
                name="size"
                value={row.size ?? ""}
                onChange={(e) => handleSizeField(i, e)}
                style={{
                  width: "100%",
                  minHeight: "48px",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  padding: "0 14px",
                  background: "#fff",
                }}
              >
                <option value="">Select a size</option>
                {sizesList.map((size) => (
                  <option value={size} key={size}>
                    {size}
                  </option>
                ))}
              </select>
            )}

            <input
              type="number"
              name="qty"
              placeholder={noSize ? "Product Quantity" : "Size Quantity"}
              min={0}
              value={row.qty}
              onChange={(e) => handleSizeField(i, e)}
              style={{
                width: "100%",
                minHeight: "48px",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                padding: "0 14px",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />

            <input
              type="number"
              name="basePrice"
              placeholder={noSize ? "Product Base Price" : "Size Base Price"}
              min={0}
              value={row.basePrice}
              onChange={(e) => handleSizeField(i, e)}
              style={{
                width: "100%",
                minHeight: "48px",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                padding: "0 14px",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />

            <input
              type="number"
              name="discount"
              placeholder="Size Discount %"
              min={0}
              max={100}
              value={row.discount ?? ""}
              onChange={(e) => handleSizeField(i, e)}
              style={{
                width: "100%",
                minHeight: "48px",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                padding: "0 14px",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />

            <button
              type="button"
              className={styles.click_btn}
              onClick={() => openPricing(i)}
              title="Per-country and per-group pricing"
              style={{ minHeight: "48px", whiteSpace: "nowrap" }}
            >
              Regional prices ({(row.countryGroupPrices?.length ?? 0) + (row.countryPrices?.length ?? 0)})
            </button>

            {!noSize && (
              <button
                type="button"
                onClick={() => handleRemove(i)}
                aria-label="Remove size row"
                style={{
                  width: "42px",
                  height: "42px",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  background: "#fff1f2",
                  color: "#dc2626",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <BsFillPatchMinusFill />
              </button>
            )}

            <button
              type="button"
              onClick={addRow}
              aria-label="Add size row"
              style={{
                width: "42px",
                height: "42px",
                border: "1px solid #bfdbfe",
                borderRadius: "10px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <BsFillPatchPlusFill />
            </button>
          </div>
        ))}
      </div>

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

export function normalizeSizesForPayload(uiSizes: SizeRow[]) {
  return uiSizes.map((s) => ({
    size: s.size,
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