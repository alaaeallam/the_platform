// app/admin/dashboard/sales/page.tsx
import Link from "next/link";
import type { CSSProperties } from "react";
import { connectDb } from "@/utils/db";
import Order from "@/models/Order";

type RangeKey = "all" | "7d" | "30d" | "90d" | "365d";

type SearchParamsInput =
  | { range?: string }
  | Promise<{ range?: string }>
  | undefined;

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: "all", label: "All Time" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "365d", label: "12 Months" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(value?: Date | string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getCustomerName(order: any) {
  const first = order?.shippingAddress?.firstName?.trim?.() || "";
  const last = order?.shippingAddress?.lastName?.trim?.() || "";
  const full = `${first} ${last}`.trim();
  return full || "Guest";
}

function normalizeRange(value?: string): RangeKey {
  if (value === "7d" || value === "30d" || value === "90d" || value === "365d") {
    return value;
  }
  return "all";
}

function getRangeStartDate(range: RangeKey) {
  if (range === "all") return null;

  const now = new Date();
  const start = new Date(now);

  if (range === "7d") start.setDate(now.getDate() - 6);
  if (range === "30d") start.setDate(now.getDate() - 29);
  if (range === "90d") start.setDate(now.getDate() - 89);
  if (range === "365d") start.setDate(now.getDate() - 364);

  start.setHours(0, 0, 0, 0);
  return start;
}

function getGranularity(range: RangeKey) {
  return range === "7d" || range === "30d" ? "day" : "month";
}

function formatTrendLabel(label: string, granularity: "day" | "month") {
  if (granularity === "day") {
    const [year, month, day] = label.split("-");
    if (!year || !month || !day) return label;

    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
    }).format(new Date(Number(year), Number(month) - 1, Number(day)));
  }

  const [year, month] = label.split("-");
  if (!year || !month) return label;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
  }).format(new Date(Number(year), Number(month) - 1, 1));
}

function buildTrendBars(rows: Array<{ label: string; revenue: number; orders: number }>) {
  const maxRevenue = Math.max(...rows.map((row) => row.revenue), 1);

  return rows.map((row) => ({
    ...row,
    heightPercent: Math.max(8, Math.round((row.revenue / maxRevenue) * 100)),
  }));
}

function getTrendPointsLabel(count: number, granularity: "day" | "month") {
  if (granularity === "day") {
    return count === 1 ? "Last 1 day" : `Last ${count} days`;
  }

  return count === 1 ? "Last 1 month" : `Last ${count} months`;
}

function getRangeSubtitle(range: RangeKey) {
  const found = RANGE_OPTIONS.find((item) => item.key === range);
  return found?.label || "All Time";
}

function getFilterChipStyle(isActive: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
    border: isActive ? "1px solid #2563eb" : "1px solid #dbe3ee",
    background: isActive ? "#2563eb" : "#ffffff",
    color: isActive ? "#ffffff" : "#334155",
    boxShadow: isActive ? "0 10px 20px rgba(37, 99, 235, 0.18)" : "none",
    transition: "all 0.2s ease",
  };
}

export const dynamic = "force-dynamic";

type SalesPageProps = {
  searchParams?: SearchParamsInput;
};

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const range = normalizeRange(resolvedSearchParams?.range);
  const startDate = getRangeStartDate(range);
  const granularity = getGranularity(range);

  await connectDb();

  const matchStage = startDate
    ? {
        createdAt: {
          $gte: startDate,
        },
      }
    : {};

  const trendGroupStage: Record<string, unknown> =
    granularity === "day"
      ? {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: { $ifNull: ["$total", 0] } },
          orders: { $sum: 1 },
        }
      : {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: { $ifNull: ["$total", 0] } },
          orders: { $sum: 1 },
        };

  const trendSortStage: Record<string, 1 | -1> =
    granularity === "day"
      ? { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
      : { "_id.year": 1, "_id.month": 1 };

  const [statsRes, statusRows, topProducts, recentOrders, trendRows] = await Promise.all([
    Order.aggregate([
      ...(startDate ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ["$total", 0] } },
          ordersCount: { $sum: 1 },
          avgOrderValue: { $avg: { $ifNull: ["$total", 0] } },
          paidOrders: {
            $sum: { $cond: [{ $eq: ["$isPaid", true] }, 1, 0] },
          },
        },
      },
    ]),
    Order.aggregate([
      ...(startDate ? [{ $match: matchStage }] : []),
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      ...(startDate ? [{ $match: matchStage }] : []),
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          name: { $first: "$products.name" },
          image: { $first: "$products.image" },
          unitsSold: { $sum: { $ifNull: ["$products.qty", 1] } },
          revenue: {
            $sum: {
              $multiply: [
                { $ifNull: ["$products.price", 0] },
                { $ifNull: ["$products.qty", 1] },
              ],
            },
          },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]),
    Order.find(matchStage)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Order.aggregate([
      ...(startDate ? [{ $match: matchStage }] : []),
      {
        $group: trendGroupStage as any,
      },
      { $sort: trendSortStage },
    ]),
  ]);

  const stats = statsRes?.[0] || {
    totalRevenue: 0,
    ordersCount: 0,
    avgOrderValue: 0,
    paidOrders: 0,
  };

  const statusMap: Record<string, number> = {};
  for (const s of statusRows || []) {
    statusMap[s._id || "Unknown"] = s.count || 0;
  }

  const kpis = [
    { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), hint: getRangeSubtitle(range) },
    { label: "Orders", value: String(stats.ordersCount), hint: "Total orders" },
    { label: "Average Order Value", value: formatCurrency(stats.avgOrderValue), hint: "Revenue / orders" },
    { label: "Paid Orders", value: String(stats.paidOrders), hint: "isPaid = true" },
  ];

  const cardStyle: CSSProperties = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  };

  const statuses = [
    "Not Processed",
    "Processing",
    "Dispatched",
    "Completed",
    "Cancelled",
  ];

  const trendData = buildTrendBars(
    (trendRows || []).slice(-8).map((row: any) => ({
      label:
        granularity === "day"
          ? `${row._id.year}-${String(row._id.month).padStart(2, "0")}-${String(row._id.day).padStart(2, "0")}`
          : `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
      revenue: row.revenue || 0,
      orders: row.orders || 0,
    }))
  );

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 36, lineHeight: 1.1, fontWeight: 800, color: "#0f172a" }}>Sales Dashboard</h1>
          <p style={{ margin: "10px 0 0", fontSize: 15, color: "#475569" }}>
            Revenue, order performance, top products, and sales trends in one place.
          </p>
        </div>

        <div style={{ ...cardStyle, minWidth: 220, padding: "14px 18px" }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Current Range</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{getRangeSubtitle(range)}</div>
        </div>
      </div>

      <section style={{ ...cardStyle, padding: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
        {RANGE_OPTIONS.map((option) => {
          const href = option.key === "all" ? "/admin/dashboard/sales" : `/admin/dashboard/sales?range=${option.key}`;

          return (
            <Link key={option.key} href={href} style={getFilterChipStyle(option.key === range)}>
              {option.label}
            </Link>
          );
        })}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {kpis.map((item) => (
          <div key={item.label} style={cardStyle}>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>{item.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", lineHeight: 1, marginBottom: 10 }}>{item.value}</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>{item.hint}</div>
          </div>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(320px, 1fr)", gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Sales Trend</h2>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>
                {granularity === "day" ? "Daily revenue trend based on filtered order data." : "Monthly revenue trend based on filtered order data."}
              </p>
            </div>
          </div>
          <div
            style={{
              height: 320,
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                {getTrendPointsLabel(trendData.length || 0, granularity)}
              </div>
              <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 700 }}>
                Peak: {formatCurrency(Math.max(...trendData.map((item) => item.revenue), 0))}
              </div>
            </div>

            {trendData.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  borderRadius: 12,
                  border: "1px dashed #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  fontSize: 14,
                }}
              >
                No sales trend data available for this range yet.
              </div>
            ) : trendData.length === 1 ? (
              <div
                style={{
                  flex: 1,
                  borderRadius: 12,
                  border: "1px solid #dbeafe",
                  background: "linear-gradient(180deg, rgba(96,165,250,0.10) 0%, rgba(255,255,255,1) 100%)",
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.2fr) minmax(220px, 0.8fr)",
                  gap: 18,
                  padding: 20,
                  alignItems: "stretch",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>
                      Period
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
                      {formatTrendLabel(trendData[0].label, granularity)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>
                      Revenue
                    </div>
                    <div style={{ fontSize: 36, lineHeight: 1, fontWeight: 900, color: "#2563eb" }}>
                      {formatCurrency(trendData[0].revenue)}
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    Only one aggregated period is available for this range, so a summary view is shown instead of a bar comparison.
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 12,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>
                      Orders
                    </div>
                    <div style={{ fontSize: 30, lineHeight: 1, fontWeight: 900, color: "#0f172a" }}>
                      {trendData[0].orders}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>
                      Average per order
                    </div>
                    <div style={{ fontSize: 22, lineHeight: 1.1, fontWeight: 800, color: "#0f172a" }}>
                      {formatCurrency(trendData[0].orders > 0 ? trendData[0].revenue / trendData[0].orders : 0)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${trendData.length}, minmax(0, 1fr))`, gap: 12, alignItems: "end" }}>
                {trendData.map((item) => (
                  <div key={item.label} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "end", gap: 10 }}>
                    <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 700, textAlign: "center" }}>
                      {formatCurrency(item.revenue)}
                    </div>
                    <div
                      title={`${formatTrendLabel(item.label, granularity)} | Revenue: ${formatCurrency(item.revenue)} | Orders: ${item.orders}`}
                      style={{
                        height: `${item.heightPercent}%`,
                        minHeight: 24,
                        borderRadius: 12,
                        background: "linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)",
                        boxShadow: "0 10px 20px rgba(37, 99, 235, 0.18)",
                      }}
                    />
                    <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", fontWeight: 600 }}>
                      {formatTrendLabel(item.label, granularity)}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
                      {item.orders} orders
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Order Status</h2>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>Breakdown by processing state.</p>
          </div>

          {statuses.map((status) => (
            <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 14, color: "#334155", fontWeight: 600 }}>{status}</span>
              <span style={{ fontSize: 14, color: "#0f172a", fontWeight: 800 }}>{statusMap[status] ?? 0}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <div style={cardStyle}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Top Products</h2>
          <p style={{ margin: "6px 0 18px", fontSize: 14, color: "#64748b" }}>Best-selling items.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {topProducts.map((p: any) => (
              <div key={String(p._id)} style={{ display: "grid", gridTemplateColumns: "48px 1fr auto", gap: 12, alignItems: "center", padding: 12, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                {p.image ? (
                  <img src={p.image} alt={p.name || "Product"} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 10 }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: "#e2e8f0" }} />
                )}
                <div>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Units: {p.unitsSold}</div>
                </div>
                <div style={{ fontWeight: 800 }}>{formatCurrency(p.revenue)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Recent Orders</h2>
          <p style={{ margin: "6px 0 18px", fontSize: 14, color: "#64748b" }}>Latest activity.</p>

          <table style={{ width: "100%" }}>
            <thead>
              <tr>
                {["Order", "Customer", "Status", "Payment", "Total", "Date"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: 12, color: "#64748b", paddingBottom: 12 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o: any) => (
                <tr key={String(o._id)}>
                  <td style={{ padding: "10px 0", borderTop: "1px solid #f1f5f9" }}>#{String(o._id).slice(-6)}</td>
                  <td style={{ padding: "10px 0", borderTop: "1px solid #f1f5f9" }}>{getCustomerName(o)}</td>
                  <td style={{ padding: "10px 0", borderTop: "1px solid #f1f5f9" }}>{o.status}</td>
                  <td style={{ padding: "10px 0", borderTop: "1px solid #f1f5f9" }}>{o.paymentMethod}</td>
                  <td style={{ padding: "10px 0", borderTop: "1px solid #f1f5f9", fontWeight: 700 }}>{formatCurrency(o.total)}</td>
                  <td style={{ padding: "10px 0", borderTop: "1px solid #f1f5f9" }}>{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
