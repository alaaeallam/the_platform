

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { COUNTRIES } from "@/lib/countries";

type DeliveryRule = {
  _id: string;
  countryCode: string;
  countryName: string;
  fee: number;
  currency: string;
  freeShippingThreshold: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type DeliveryListResponse = {
  ok: boolean;
  rules?: DeliveryRule[];
  message?: string;
};

type DeliveryMutationResponse = {
  ok: boolean;
  rule?: DeliveryRule;
  message?: string;
};

type DeliveryFormState = {
  countryCode: string;
  countryName: string;
  fee: string;
  currency: string;
  freeShippingThreshold: string;
  estimatedDaysMin: string;
  estimatedDaysMax: string;
  isActive: boolean;
};

const emptyForm: DeliveryFormState = {
  countryCode: "",
  countryName: "",
  fee: "",
  currency: "USD",
  freeShippingThreshold: "",
  estimatedDaysMin: "1",
  estimatedDaysMax: "3",
  isActive: true,
};

function formatMoney(value: number | null | undefined, currency: string) {
  if (value === null || value === undefined) return "—";
  return `${value} ${currency}`;
}

function formatEta(min: number, max: number) {
  if (min === max) return `${min} day${min === 1 ? "" : "s"}`;
  return `${min}–${max} days`;
}

function normalizeFormForSubmit(form: DeliveryFormState) {
  return {
    countryCode: form.countryCode.trim().toUpperCase(),
    countryName: form.countryName.trim(),
    fee: form.fee.trim(),
    currency: "USD",
    freeShippingThreshold:
      form.freeShippingThreshold.trim() === ""
        ? null
        : form.freeShippingThreshold.trim(),
    estimatedDaysMin: form.estimatedDaysMin.trim(),
    estimatedDaysMax: form.estimatedDaysMax.trim(),
    isActive: form.isActive,
  };
}

function mapRuleToForm(rule: DeliveryRule): DeliveryFormState {
  return {
    countryCode: rule.countryCode ?? "",
    countryName: rule.countryName ?? "",
    fee: String(rule.fee ?? ""),
    currency: "USD",
    freeShippingThreshold:
      rule.freeShippingThreshold === null || rule.freeShippingThreshold === undefined
        ? ""
        : String(rule.freeShippingThreshold),
    estimatedDaysMin: String(rule.estimatedDaysMin ?? 1),
    estimatedDaysMax: String(rule.estimatedDaysMax ?? 3),
    isActive: Boolean(rule.isActive),
  };
}

export default function DeliveryAdminPage() {
  const [rules, setRules] = useState<DeliveryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [form, setForm] = useState<DeliveryFormState>(emptyForm);

  const isEditing = useMemo(() => Boolean(editingRuleId), [editingRuleId]);

  async function fetchRules() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/delivery", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await res.json()) as DeliveryListResponse;

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to load delivery rules");
      }

      setRules(Array.isArray(data.rules) ? data.rules : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load delivery rules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchRules();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingRuleId(null);
  }

  function openCreateForm() {
    setSuccess("");
    setError("");
    resetForm();
    setIsFormOpen(true);
  }

  function openEditForm(rule: DeliveryRule) {
    setSuccess("");
    setError("");
    setEditingRuleId(rule._id);
    setForm(mapRuleToForm(rule));
    setIsFormOpen(true);
  }

  function closeForm() {
    if (submitting) return;
    setIsFormOpen(false);
    resetForm();
  }

  function updateForm<K extends keyof DeliveryFormState>(key: K, value: DeliveryFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateForm() {
    const countryCode = form.countryCode.trim().toUpperCase();
    const countryName = form.countryName.trim();
    const selectedCountry = COUNTRIES.find((country) => country.code === countryCode);
    const fee = Number(form.fee);
    const estimatedDaysMin = Number(form.estimatedDaysMin);
    const estimatedDaysMax = Number(form.estimatedDaysMax);
    const freeShippingThreshold =
      form.freeShippingThreshold.trim() === ""
        ? null
        : Number(form.freeShippingThreshold);

    if (!countryCode) return "Country is required";
    if (!selectedCountry) return "Please select a valid country";
    if (!countryName) return "Country name is required";
    if (!Number.isFinite(fee) || fee < 0) return "Fee must be 0 or greater";
    if (!Number.isFinite(estimatedDaysMin) || estimatedDaysMin < 0) {
      return "Minimum estimated days must be 0 or greater";
    }
    if (!Number.isFinite(estimatedDaysMax) || estimatedDaysMax < 0) {
      return "Maximum estimated days must be 0 or greater";
    }
    if (estimatedDaysMax < estimatedDaysMin) {
      return "Maximum estimated days must be greater than or equal to minimum estimated days";
    }
    if (
      freeShippingThreshold !== null &&
      (!Number.isFinite(freeShippingThreshold) || freeShippingThreshold < 0)
    ) {
      return "Free shipping threshold must be empty or 0 or greater";
    }

    return "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setSuccess("");
      setError(validationMessage);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload = normalizeFormForSubmit(form);
      const url = isEditing
        ? `/api/admin/delivery/${editingRuleId}`
        : "/api/admin/delivery";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as DeliveryMutationResponse;

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to save delivery rule");
      }

      setSuccess(data.message || `Delivery rule ${isEditing ? "updated" : "created"} successfully`);
      setIsFormOpen(false);
      resetForm();
      await fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save delivery rule");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(rule: DeliveryRule) {
    const confirmed = window.confirm(
      `Delete the delivery rule for ${rule.countryName} (${rule.countryCode})?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(rule._id);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/admin/delivery/${rule._id}`, {
        method: "DELETE",
      });

      const data = (await res.json()) as { ok: boolean; message?: string };

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to delete delivery rule");
      }

      setSuccess(data.message || "Delivery rule deleted successfully");
      await fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete delivery rule");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Delivery</h1>
          <p style={styles.subtitle}>
            Manage country-based delivery fees, free shipping thresholds, and estimated delivery times.
          </p>
        </div>

        <button type="button" onClick={openCreateForm} style={styles.primaryButton}>
          Add Delivery Rule
        </button>
      </div>

      {error ? <div style={styles.errorBox}>{error}</div> : null}
      {success ? <div style={styles.successBox}>{success}</div> : null}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Delivery Rules</h2>
          <span style={styles.badge}>{rules.length} total</span>
        </div>

        {loading ? (
          <div style={styles.emptyState}>Loading delivery rules...</div>
        ) : rules.length === 0 ? (
          <div style={styles.emptyState}>
            No delivery rules found yet. Add your first country rule to start calculating delivery fees.
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Country</th>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Fee</th>
                  <th style={styles.th}>Free Shipping</th>
                  <th style={styles.th}>ETA</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule._id} style={!rule.isActive ? styles.inactiveRow : undefined}>
                    <td style={styles.td}>{rule.countryName}</td>
                    <td style={styles.td}>{rule.countryCode}</td>
                    <td style={styles.td}>{formatMoney(rule.fee, rule.currency)}</td>
                    <td style={styles.td}>
                      {rule.freeShippingThreshold === null
                        ? "—"
                        : formatMoney(rule.freeShippingThreshold, rule.currency)}
                    </td>
                    <td style={styles.td}>{formatEta(rule.estimatedDaysMin, rule.estimatedDaysMax)}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusPill,
                          ...(rule.isActive ? styles.statusActive : styles.statusInactive),
                        }}
                      >
                        {rule.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <div style={styles.actionsRow}>
                        <button
                          type="button"
                          style={styles.secondaryButton}
                          onClick={() => openEditForm(rule)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          style={styles.dangerButton}
                          onClick={() => void handleDelete(rule)}
                          disabled={deletingId === rule._id}
                        >
                          {deletingId === rule._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen ? (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>{isEditing ? "Edit Delivery Rule" : "Add Delivery Rule"}</h2>
                <p style={styles.modalSubtitle}>
                  {isEditing
                    ? "Update the delivery fee and threshold for this country."
                    : "Create a country-based delivery rule for checkout calculations."}
                </p>
              </div>
              <button type="button" onClick={closeForm} style={styles.closeButton}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                <label style={styles.label}>
                  <span style={styles.labelText}>Country Name</span>
                  <select
                    value={form.countryCode}
                    onChange={(e) => {
                      const selected = COUNTRIES.find((country) => country.code === e.target.value);
                      updateForm("countryCode", e.target.value);
                      updateForm("countryName", selected?.name ?? "");
                    }}
                    style={styles.input}
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={styles.label}>
                  <span style={styles.labelText}>Country Code</span>
                  <input
                    value={form.countryCode}
                    readOnly
                    disabled
                    placeholder="EG"
                    maxLength={2}
                    style={{
                      ...styles.input,
                      background: "#f8fafc",
                      color: "#64748b",
                      cursor: "not-allowed",
                    }}
                  />
                </label>

                <label style={styles.label}>
                  <span style={styles.labelText}>Delivery Fee</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.fee}
                    onChange={(e) => updateForm("fee", e.target.value)}
                    placeholder="80"
                    style={styles.input}
                  />
                </label>
                <label style={styles.label}>
                  <span style={styles.labelText}>Currency</span>
                  <input
                    value="USD"
                    readOnly
                    disabled
                    style={{
                      ...styles.input,
                      background: "#f8fafc",
                      color: "#64748b",
                      cursor: "not-allowed",
                    }}
                  />
                </label>


                <label style={styles.label}>
                  <span style={styles.labelText}>Free Shipping Threshold</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.freeShippingThreshold}
                    onChange={(e) => updateForm("freeShippingThreshold", e.target.value)}
                    placeholder="Leave blank to disable"
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  <span style={styles.labelText}>Estimated Days Min</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.estimatedDaysMin}
                    onChange={(e) => updateForm("estimatedDaysMin", e.target.value)}
                    placeholder="2"
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  <span style={styles.labelText}>Estimated Days Max</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.estimatedDaysMax}
                    onChange={(e) => updateForm("estimatedDaysMax", e.target.value)}
                    placeholder="4"
                    style={styles.input}
                  />
                </label>

                <label style={{ ...styles.label, justifyContent: "flex-end" }}>
                  <span style={styles.labelText}>Active</span>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => updateForm("isActive", e.target.checked)}
                    style={styles.checkbox}
                  />
                </label>
              </div>

              <div style={styles.formActions}>
                <button type="button" style={styles.secondaryButton} onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryButton} disabled={submitting}>
                  {submitting
                    ? isEditing
                      ? "Saving..."
                      : "Creating..."
                    : isEditing
                    ? "Save Changes"
                    : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 24,
    display: "grid",
    gap: 20,
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 700,
    lineHeight: 1.15,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    maxWidth: 760,
    lineHeight: 1.6,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 8px 30px rgba(15, 23, 42, 0.05)",
  },
  cardHeader: {
    padding: 20,
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    background: "#eff6ff",
    color: "#1d4ed8",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#64748b",
    padding: "14px 20px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  td: {
    padding: "16px 20px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "middle",
  },
  inactiveRow: {
    opacity: 0.68,
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
  },
  statusActive: {
    background: "#ecfdf5",
    color: "#047857",
  },
  statusInactive: {
    background: "#f1f5f9",
    color: "#475569",
  },
  actionsRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  primaryButton: {
    border: 0,
    borderRadius: 12,
    background: "#111827",
    color: "#ffffff",
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    background: "#ffffff",
    color: "#0f172a",
    padding: "10px 14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  dangerButton: {
    border: "1px solid #fecaca",
    borderRadius: 12,
    background: "#fef2f2",
    color: "#b91c1c",
    padding: "10px 14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  errorBox: {
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
  },
  successBox: {
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
  },
  emptyState: {
    padding: 32,
    color: "#64748b",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1000,
  },
  modal: {
    width: "100%",
    maxWidth: 820,
    background: "#ffffff",
    borderRadius: 20,
    border: "1px solid #e2e8f0",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.18)",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    padding: 20,
    borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
  },
  modalSubtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    lineHeight: 1.5,
  },
  closeButton: {
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    width: 38,
    height: 38,
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 16,
  },
  form: {
    padding: 20,
    display: "grid",
    gap: 20,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  label: {
    display: "grid",
    gap: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: 14,
    background: "#ffffff",
  },
  checkbox: {
    width: 18,
    height: 18,
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    flexWrap: "wrap",
  },
};