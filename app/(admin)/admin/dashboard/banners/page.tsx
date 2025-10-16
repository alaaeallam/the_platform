// app/admin/banners/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type BannerRow = {
  _id: string;
  placement: string;
  title?: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  ctaLabel?: string;
  ctaHref?: string;
  theme?: { bg?: string; fg?: string; align?: "left" | "center" | "right" };
  active: boolean;
  priority: number;
  locale?: string;
  startsAt?: string | null;
  endsAt?: string | null;
};

type Align = "left" | "center" | "right";
const isAlign = (v: string): v is Align => v === "left" || v === "center" || v === "right";

// Cloudinary client config (unsigned uploads)
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "";

async function uploadToCloudinary(file: File, folder = "banners"): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary env missing. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_PRESET."
    );
  }
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", folder);
  const res = await fetch(url, { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok || !json.secure_url) {
    throw new Error(json.error?.message || "Cloudinary upload failed");
  }
  return json.secure_url as string;
}

export default function AdminBannersPage() {
  const [rows, setRows] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const heroFileRef = useRef<HTMLInputElement | null>(null);
  const mobileFileRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<Partial<BannerRow>>({
    placement: "home-hero",
    image: "",
    mobileImage: "",
    title: "",
    subtitle: "",
    ctaLabel: "",
    ctaHref: "/browse",
    priority: 0,
    active: true,
    locale: "",
    theme: { align: "center", bg: "", fg: "" },
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await fetch("/api/admin/banners", { cache: "no-store" });
      setRows(await r.json());
      setLoading(false);
    })();
  }, []);

  const canSubmit = useMemo(
    () => Boolean(form.placement && form.image),
    [form.placement, form.image]
  );

  async function refresh() {
    const r2 = await fetch("/api/admin/banners", { cache: "no-store" });
    setRows(await r2.json());
  }

  async function createBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.ok) {
      await refresh();
      setForm((f) => ({
        ...f,
        image: "",
        mobileImage: "",
        title: "",
        subtitle: "",
        ctaLabel: "",
        ctaHref: "/browse",
        priority: 0,
        active: true,
        theme: { align: "center", bg: "", fg: "" },
      }));
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Create failed");
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/banners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    await refresh();
  }

  async function del(id: string) {
    if (!confirm("Delete this banner?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="banners-page">
      <style jsx global>{`
        .banners-page {
          --radius: 12px;
          --border: 1px solid #e5e7eb;
          --muted: #6b7280;
          --fg: #111827;
          --bg: #ffffff;
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px;
          color: var(--fg);
        }
        .banners-page .page-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: var(--border);
          margin-bottom: 20px;
        }
        .banners-page .page-header h1 {
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .banners-page .page-header .stats {
          font-size: 13px;
          color: var(--muted);
        }
        .banners-page .card {
          background: var(--bg);
          border: var(--border);
          border-radius: var(--radius);
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .banners-page .form-card {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          padding: 20px;
        }
        @media (min-width: 900px) {
          .banners-page .form-card {
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            padding: 24px;
          }
        }
        .banners-page .form-left {
          display: grid;
          gap: 16px;
        }
        .banners-page .section-title {
          font-size: 15px;
          font-weight: 600;
          color: #374151;
        }
        .banners-page .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .banners-page .grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }
        .banners-page label.field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .banners-page label.field > span {
          font-size: 12px;
          color: var(--muted);
          font-weight: 600;
        }
        .banners-page .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #f9fafb;
          padding: 10px 12px;
          font-size: 14px;
          color: var(--fg);
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .banners-page .input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
          background: #fff;
        }
        .banners-page .inline {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .banners-page .btn {
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          cursor: pointer;
          border: 1px solid #111827;
          background: #111827;
          color: #fff;
          transition: transform .06s ease, box-shadow .15s;
        }
        .banners-page .btn[disabled] {
          opacity: .6;
          cursor: not-allowed;
        }
        .banners-page .btn:active { transform: translateY(1px); }
        .banners-page .hint {
          font-size: 12px;
          color: var(--muted);
        }
        .banners-page .preview-card {
          padding: 14px;
        }
        .banners-page .preview-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .banners-page .badge {
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 600;
        }
        .banners-page .badge.active {
          color: #065f46;
          background: #d1fae5;
        }
        .banners-page .badge.inactive {
          color: #4b5563;
          background: #e5e7eb;
        }
        .banners-page .preview-media {
          position: relative;
          width: 100%;
          overflow: hidden;
          border-radius: 10px;
          background: #f3f4f6;
          aspect-ratio: 16/6;
        }
        .banners-page .preview-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .banners-page .list {
          margin-top: 8px;
          display: grid;
          gap: 18px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 900px) {
          .banners-page .list {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        .banners-page .item {
          overflow: hidden;
        }
        .banners-page .item .thumb {
          position: relative;
          height: 160px;
          overflow: hidden;
          border-bottom: var(--border);
        }
        .banners-page .item .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform .25s ease;
        }
        .banners-page .item:hover .thumb img { transform: scale(1.02); }
        .banners-page .item .thumb .labels {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 6px;
        }
        .banners-page .item .body {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
        }
        .banners-page .item .title {
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
        }
        .banners-page .item .meta {
          font-size: 12px;
          color: var(--muted);
          margin-top: 2px;
        }
        .banners-page .item .actions {
          display: flex;
          gap: 8px;
        }
        .banners-page .btn-light {
          background: #fff;
          color: #111827;
          border: 1px solid #d1d5db;
        }
        .banners-page .btn-danger {
          background: #fff;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }
      `}</style>

      <header className="page-header">
        <h1>Banners</h1>
        <span className="stats">
          {rows.length} total • {rows.filter((r) => r.active).length} active
        </span>
      </header>

      {/* Create + preview */}
      <form onSubmit={createBanner} className="card form-card">
        {/* Inputs */}
        <div className="form-left">
          <div className="section-title">Banner Details</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Placement" className="field">
              <input
                className="input"
                value={form.placement || ""}
                onChange={(e) => setForm({ ...form, placement: e.target.value })}
                placeholder="home-hero"
                required
              />
            </Field>
            <Field label="Locale (optional)" className="field">
              <input
                className="input"
                value={form.locale || ""}
                onChange={(e) => setForm({ ...form, locale: e.target.value })}
                placeholder="en"
              />
            </Field>
          </div>

          <div className="inline">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={!!form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active
            </label>
            <Field label="Priority" className="field w-40">
              <input
                type="number"
                className="input"
                value={Number(form.priority ?? 0)}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              />
            </Field>
          </div>

          <Field label="Image URL *" className="field">
            <input
              className="input"
              value={form.image || ""}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="/images/swiper/1.jpg or https://..."
              required
            />
          </Field>
          <div className="inline" style={{ gap: 8 }}>
            <input
              ref={heroFileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  setUploadingHero(true);
                  const url = await uploadToCloudinary(f, "banners/hero");
                  setForm((prev) => ({ ...prev, image: url }));
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : "Upload failed";
                  alert(msg);
                } finally {
                  setUploadingHero(false);
                  if (heroFileRef.current) heroFileRef.current.value = "";
                }
              }}
            />
            <button
              type="button"
              className="btn btn-light"
              disabled={uploadingHero}
              onClick={() => heroFileRef.current?.click()}
            >
              {uploadingHero ? "Uploading…" : "Upload to Cloudinary"}
            </button>
            {form.image && (
              <span className="hint">
                Saved: <a href={form.image} target="_blank" rel="noreferrer">{form.image}</a>
              </span>
            )}
          </div>

          <Field label="Mobile Image URL" className="field">
            <input
              className="input"
              value={form.mobileImage || ""}
              onChange={(e) => setForm({ ...form, mobileImage: e.target.value })}
              placeholder="/images/swiper/mobile-1.jpg"
            />
          </Field>
          <div className="inline" style={{ gap: 8 }}>
            <input
              ref={mobileFileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  setUploadingMobile(true);
                  const url = await uploadToCloudinary(f, "banners/mobile");
                  setForm((prev) => ({ ...prev, mobileImage: url }));
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : "Upload failed";
                  alert(msg);
                } finally {
                  setUploadingMobile(false);
                  if (mobileFileRef.current) mobileFileRef.current.value = "";
                }
              }}
            />
            <button
              type="button"
              className="btn btn-light"
              disabled={uploadingMobile}
              onClick={() => mobileFileRef.current?.click()}
            >
              {uploadingMobile ? "Uploading…" : "Upload mobile image"}
            </button>
            {form.mobileImage && (
              <span className="hint">
                Saved:{" "}
                <a href={form.mobileImage} target="_blank" rel="noreferrer">
                  {form.mobileImage}
                </a>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Title" className="field">
              <input
                className="input"
                value={form.title || ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Subtitle" className="field">
              <input
                className="input"
                value={form.subtitle || ""}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="CTA Label" className="field">
              <input
                className="input"
                value={form.ctaLabel || ""}
                onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
              />
            </Field>
            <Field label="CTA Href" className="field">
              <input
                className="input"
                value={form.ctaHref || ""}
                onChange={(e) => setForm({ ...form, ctaHref: e.target.value })}
                placeholder="/browse"
              />
            </Field>
            <Field label="Align" className="field">
              <select
                className="input"
                value={form.theme?.align || "center"}
                onChange={(e) => {
                  const v = e.target.value;
                  const align: Align = isAlign(v) ? v : "center";
                  setForm({
                    ...form,
                    theme: { ...form.theme, align },
                  });
                }}
              >
                <option value="left">left</option>
                <option value="center">center</option>
                <option value="right">right</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="theme.bg" className="field">
              <input
                className="input"
                value={form.theme?.bg || ""}
                onChange={(e) =>
                  setForm({ ...form, theme: { ...form.theme, bg: e.target.value } })
                }
              />
            </Field>
            <Field label="theme.fg" className="field">
              <input
                className="input"
                value={form.theme?.fg || ""}
                onChange={(e) =>
                  setForm({ ...form, theme: { ...form.theme, fg: e.target.value } })
                }
              />
            </Field>
          </div>

          <div className="inline" style={{ paddingTop: 4 }}>
            <button
              className="btn"
              disabled={!canSubmit || submitting}
              type="submit"
            >
              {submitting ? "Creating…" : "Create banner"}
            </button>
            <span className="hint">Creates + revalidates cache</span>
          </div>
        </div>

        {/* Preview */}
        <div className="card preview-card">
          <div className="preview-head">
            <div className="section-title">Live preview</div>
            <span className={`badge ${form.active ? "active" : "inactive"}`}>
              {form.active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="preview-media">
            {form.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image}
                alt="preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                Paste an image URL to preview
              </div>
            )}
            {form.image?.includes("res.cloudinary.com") && (
              <div style={{ position: "absolute", right: 8, bottom: 8 }} className="badge active">
                Cloudinary
              </div>
            )}
          </div>
          {(form.title || form.subtitle || form.ctaLabel) && (
            <div className="mt-3 rounded-lg border p-3">
              <div className="text-sm font-medium">Overlay (from DB fields)</div>
              <div className="text-xs text-gray-500">
                {form.title && <div className="truncate">Title: {form.title}</div>}
                {form.subtitle && <div className="truncate">Subtitle: {form.subtitle}</div>}
                {form.ctaLabel && (
                  <div className="truncate">
                    CTA: {form.ctaLabel} → <span className="text-blue-600">{form.ctaHref}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Existing list */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Existing</h2>
        {loading ? (
          <div className="list">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border p-6 text-center text-gray-500">
            No banners yet. Create your first one above.
          </div>
        ) : (
          <div className="list">
            {rows.map((r) => (
              <article
                key={r._id}
                className="card item"
              >
                <div className="thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.image}
                    alt={r.title || "banner"}
                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                  />
                  <div className="labels">
                    <span
                      className={`badge ${r.active ? "active" : "inactive"}`}
                    >
                      {r.active ? "active" : "inactive"}
                    </span>
                    <span className="badge">
                      {r.placement}
                    </span>
                  </div>
                </div>
                <div className="body">
                  <div>
                    <div className="title">
                      {r.title || "(no title)"}
                    </div>
                    <div className="meta">
                      priority {r.priority} • {r.locale || "default locale"}
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      className="btn btn-light"
                      onClick={() => toggleActive(r._id, !r.active)}
                      title={r.active ? "Deactivate" : "Activate"}
                    >
                      {r.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => del(r._id)}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/** ---------- Small UI helpers ---------- */
function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`field ${className || ""}`}>
      <span>{label}</span>
      {children}
      <style jsx global>{`
        .input {}
      `}</style>
    </label>
  );
}