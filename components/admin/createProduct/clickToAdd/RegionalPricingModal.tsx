"use client";
import * as React from "react";
import type {
  SizeRow,
  CountryPriceRowUI,
  CountryGroupPriceRowUI,
} from "./Sizes";

// (optional) if you have a central list of groups, you can import it
// import { COUNTRY_GROUPS } from "@/utils/countryGroups";
//components/admin/createProduct/clickToAdd/RegionalPricingModal.tsx
type Props = {
  open: boolean;
  onClose: () => void;
  size: SizeRow;
  onChange: (next: Partial<SizeRow>) => void; // patch into current row
};

export default function RegionalPricingModal({ open, onClose, size, onChange }: Props) {
  const [tab, setTab] = React.useState<"country" | "group">("country");

  if (!open) return null;

  const setCountryRow = (i: number, patch: Partial<CountryPriceRowUI>) => {
    const rows = (size.countryPrices || []).map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange({ countryPrices: rows });
  };
  const addCountryRow = () =>
    onChange({ countryPrices: [...(size.countryPrices || []), { country: "", price: "" }] });
  const delCountryRow = (i: number) =>
    onChange({ countryPrices: (size.countryPrices || []).filter((_, idx) => idx !== i) });

  const setGroupRow = (i: number, patch: Partial<CountryGroupPriceRowUI>) => {
    const rows = (size.countryGroupPrices || []).map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange({ countryGroupPrices: rows });
  };
  const addGroupRow = () =>
    onChange({ countryGroupPrices: [...(size.countryGroupPrices || []), { groupCode: "", price: "" }] });
  const delGroupRow = (i: number) =>
    onChange({ countryGroupPrices: (size.countryGroupPrices || []).filter((_, idx) => idx !== i) });

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          minWidth: 640,
          maxWidth: "90vw",
          maxHeight: "80vh",
          overflow: "auto",
          padding: 16,
          borderRadius: 8,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: 0 }}>Regional pricing for size “{size.size ?? "No size"}”</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setTab("country")} aria-pressed={tab === "country"}>
              Per-Country
            </button>
            <button onClick={() => setTab("group")} aria-pressed={tab === "group"}>
              Per-Group
            </button>
          </div>
        </header>

        {tab === "country" ? (
          <section style={{ marginTop: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left">Country (ISO-2)</th>
                  <th align="left">Price</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(size.countryPrices || []).map((row, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        value={row.country}
                        onChange={(e) => setCountryRow(i, { country: e.target.value.toUpperCase() })}
                        placeholder="EG"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        value={row.price}
                        onChange={(e) => setCountryRow(i, { price: e.target.value })}
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <button onClick={() => delCountryRow(i)} aria-label="Remove country row">
                        −
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addCountryRow} style={{ marginTop: 8 }}>
              + Add Country
            </button>
          </section>
        ) : (
          <section style={{ marginTop: 16 }}>
            <p style={{ opacity: 0.7, marginTop: 0 }}>
              Note: <b>Group</b> price overrides per-country and base price.
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left">Group Code</th>
                  <th align="left">Price</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(size.countryGroupPrices || []).map((row, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        value={row.groupCode}
                        onChange={(e) => setGroupRow(i, { groupCode: e.target.value.toUpperCase() })}
                        placeholder="MENA"
                        list="group-codes"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        value={row.price}
                        onChange={(e) => setGroupRow(i, { price: e.target.value })}
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <button onClick={() => delGroupRow(i)} aria-label="Remove group row">
                        −
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Optional: provide a datalist if you have predefined groups */}
            <datalist id="group-codes">
              {/* Example:
              {Object.keys(COUNTRY_GROUPS).map(code => (
                <option key={code} value={code} />
              ))} */}
            </datalist>

            <button onClick={addGroupRow} style={{ marginTop: 8 }}>
              + Add Group
            </button>
          </section>
        )}

        <footer style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose}>Done</button>
        </footer>
      </div>
    </div>
  );
}