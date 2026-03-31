// components/admin/orders/table.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "react-toastify";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import styles from "./styles.module.scss";
import type { AdminOrderVM } from "@/types/admin/orders";
/* ---------- Types ---------- */

export type OrderStatus =
  | "Not Processed"
  | "Processing"
  | "Dispatched"
  | "Cancelled"
  | "Completed";

export type PaymentMethod = "paypal" | "credit_card" | "cod" | string;

export interface AdminUserVM {
  _id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  /** Some legacy data might use `id` instead of `_id` */
  id?: string;
}

export interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  phoneNumber?: string;
}

export interface OrderLineItem {
  _id: string;
  image?: string;
  name?: string;
  size?: string | number;
  qty?: number;
  price?: number;
}



/* ---------- Helpers ---------- */

const PAYMENT_LABEL: Record<string, string> = {
  paypal: "Paypal",
  credit_card: "Credit Card",
  stripe: "Credit Card",
  visa: "Credit Card",
  mastercard: "Credit Card",
  amex: "Credit Card",
  cod: "Cash On Delivery",
  cash: "Cash On Delivery",
};

function formatPaymentLabel(method: string | null | undefined): string {
  if (!method) return "-";
  const key = String(method).toLowerCase();
  // show mapped label, otherwise show the raw key uppercased
  return PAYMENT_LABEL[key] ?? key.toUpperCase();
}
/* ---------- Row ---------- */

type RowProps = { row: AdminOrderVM };

function Row({ row }: RowProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  const [status, setStatus] = React.useState<OrderStatus>(
    (row.status as OrderStatus) ?? "Not Processed"
  );
  const [isSavingStatus, setIsSavingStatus] = React.useState(false);

  const userId = row.user?._id ?? row.user?.id ?? "";
  const verifiedIcon = "/images/verified.png";
  const unverifiedIcon = "/images/unverified.png";

  const shippingName = [
    row.shippingAddress?.firstName,
    row.shippingAddress?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const shippingLines = [
    row.shippingAddress?.address1,
    row.shippingAddress?.address2,
    [row.shippingAddress?.state, row.shippingAddress?.city]
      .filter(Boolean)
      .join(", "),
    row.shippingAddress?.country,
    row.shippingAddress?.zipCode,
    row.shippingAddress?.phoneNumber,
  ].filter((value): value is string => Boolean(value && value.trim()));

  const statusChipColor:
    | "default"
    | "warning"
    | "info"
    | "success"
    | "error" =
    status === "Not Processed"
      ? "warning"
      : status === "Processing"
      ? "info"
      : status === "Dispatched"
      ? "info"
      : status === "Cancelled"
      ? "error"
      : status === "Completed"
      ? "success"
      : "default";

  React.useEffect(() => {
    setStatus((row.status as OrderStatus) ?? "Not Processed");
  }, [row.status]);

  async function handleStatusChange(event: SelectChangeEvent<OrderStatus>) {
    const nextStatus = event.target.value as OrderStatus;
    const previousStatus = status;

    setStatus(nextStatus);
    setIsSavingStatus(true);

    try {
      const response = await fetch(`/api/admin/orders/${row._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string; status?: OrderStatus }
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update order status.");
      }

      setStatus((data?.status as OrderStatus) ?? nextStatus);
      toast.success("Order status updated successfully.");
    } catch (error) {
      setStatus(previousStatus);
      toast.error(
        error instanceof Error ? error.message : "Failed to update order status."
      );
    } finally {
      setIsSavingStatus(false);
    }
  }

  return (
    <React.Fragment>
      <TableRow
        hover
        sx={{
          "& > *": { borderBottom: open ? "none" : undefined },
          backgroundColor: open ? "rgba(59, 130, 246, 0.03)" : "transparent",
          transition: "background-color 0.2s ease",
        }}
      >
        <TableCell sx={{ width: 56 }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen((v) => !v)}
            sx={{
              border: "1px solid",
              borderColor: open ? "primary.main" : "divider",
              backgroundColor: open ? "rgba(59, 130, 246, 0.08)" : "transparent",
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        <TableCell component="th" scope="row" sx={{ minWidth: 220 }}>
          <Tooltip title={row._id}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                fontFamily: "monospace",
                whiteSpace: "nowrap",
              }}
            >
              {row._id}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell sx={{ minWidth: 180 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: "nowrap" }}>
            {formatPaymentLabel(row.paymentMethod)}
          </Typography>
        </TableCell>

        <TableCell sx={{ minWidth: 110 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {row.isPaid ? (
              <Image
                src={verifiedIcon}
                alt="Paid"
                width={18}
                height={18}
                sizes="18px"
                className={styles.ver}
              />
            ) : (
              <Image
                src={unverifiedIcon}
                alt="Unpaid"
                width={18}
                height={18}
                sizes="18px"
                className={styles.ver}
              />
            )}
            <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
              {row.isPaid ? "Paid" : "Unpaid"}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell sx={{ minWidth: 190 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label={status}
              color={statusChipColor}
              variant={status === "Completed" ? "filled" : "outlined"}
              sx={{ fontWeight: 600 }}
            />
            {isSavingStatus ? <CircularProgress size={16} /> : null}
          </Stack>
        </TableCell>

        <TableCell sx={{ minWidth: 140 }}>
          {row.couponCode ? (
            <Chip size="small" label={row.couponCode} variant="outlined" sx={{ fontWeight: 600 }} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {row.couponApplied ? "Applied" : "-"}
            </Typography>
          )}
        </TableCell>

        <TableCell align="right" sx={{ minWidth: 120 }}>
          <Typography variant="body1" sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>
            {typeof row.total === "number" ? `${row.total}$` : "-"}
          </Typography>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell
          style={{ paddingBottom: 0, paddingTop: 0, borderBottom: open ? "none" : undefined }}
          colSpan={7}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box
              sx={{
                mx: 1,
                mb: 2,
                mt: 0.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                overflow: "hidden",
                backgroundColor: "background.paper",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  alignItems: { xs: "flex-start", md: "center" },
                  justifyContent: "space-between",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 1,
                  background:
                    "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 100%)",
                }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Order details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Review customer info, update order status, and inspect purchased items.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Chip
                    size="small"
                    label={`Items: ${row.products?.length ?? 0}`}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`Total: ${typeof row.total === "number" ? `${row.total}$` : "-"}`}
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
              </Box>

              <Divider />

              <Box
                sx={{
                  p: 2,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: "minmax(320px, 380px) 1fr" },
                  gap: 2,
                }}
              >
                <Stack spacing={2}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2, boxShadow: "none" }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                      Order status
                    </Typography>

                    <FormControl fullWidth size="small" disabled={isSavingStatus}>
                      <Select<OrderStatus>
                        value={status}
                        onChange={handleStatusChange}
                        displayEmpty
                      >
                        <MenuItem value="Not Processed">Not Processed</MenuItem>
                        <MenuItem value="Processing">Processing</MenuItem>
                        <MenuItem value="Dispatched">Dispatched</MenuItem>
                        <MenuItem value="Cancelled">Cancelled</MenuItem>
                        <MenuItem value="Completed">Completed</MenuItem>
                      </Select>
                    </FormControl>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                      <Chip
                        size="small"
                        label={status}
                        color={statusChipColor}
                        variant={status === "Completed" ? "filled" : "outlined"}
                        sx={{ fontWeight: 600 }}
                      />
                      {isSavingStatus ? (
                        <Typography variant="caption" color="text.secondary">
                          Saving...
                        </Typography>
                      ) : null}
                    </Stack>
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2, boxShadow: "none" }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                      Shipping address
                    </Typography>

                    {shippingName ? (
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        {shippingName}
                      </Typography>
                    ) : null}

                    {shippingLines.length ? (
                      <Stack spacing={0.5}>
                        {shippingLines.map((line, index) => (
                          <Typography
                            key={`${row._id}-shipping-${index}`}
                            variant="body2"
                            color="text.secondary"
                          >
                            {line}
                          </Typography>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No shipping information available.
                      </Typography>
                    )}
                  </Paper>
                </Stack>

                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    boxShadow: "none",
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Order items
                    </Typography>
                  </Box>

                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small" aria-label="order items">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: 72 }}>Item</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell align="left">Size</TableCell>
                          <TableCell align="left">Qty</TableCell>
                          <TableCell align="left">Price</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(row.products ?? []).map((p) => (
                          <TableRow key={p._id} hover>
                            <TableCell component="th" scope="row">
                              {p.image ? (
                                <Image
                                  src={p.image}
                                  alt={p.name ?? "Product image"}
                                  width={56}
                                  height={56}
                                  sizes="56px"
                                  className={styles.table__productImg}
                                />
                              ) : (
                                <span className={styles.table__productImg_placeholder} />
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {p.name ?? "-"}
                              </Typography>
                            </TableCell>
                            <TableCell align="left">
                              {p.size !== undefined ? String(p.size) : "-"}
                            </TableCell>
                            <TableCell align="left">x{p.qty ?? 0}</TableCell>
                            <TableCell align="left">
                              {typeof p.price === "number" ? `${p.price}$` : "-"}
                            </TableCell>
                          </TableRow>
                        ))}

                        <TableRow>
                          <TableCell colSpan={3} />
                          <TableCell align="left" sx={{ fontWeight: 700 }}>
                            Total
                          </TableCell>
                          <TableCell align="left" sx={{ fontWeight: 800, fontSize: 16 }}>
                            {typeof row.total === "number" ? `${row.total}$` : "-"}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

/* ---------- Table (root) ---------- */

type CollapsibleTableProps = {
  rows: AdminOrderVM[];
};

export  function CollapsibleTable({
  rows,
}: CollapsibleTableProps): React.JSX.Element {
    const [statusFilter, setStatusFilter] = React.useState<"all" | OrderStatus>("all");
  const [paidFilter, setPaidFilter] = React.useState<"all" | "paid" | "unpaid">("all");
  const [couponFilter, setCouponFilter] = React.useState<"all" | "applied" | "none">("all");

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : (row.status ?? "Not Processed") === statusFilter;

      const matchesPaid =
        paidFilter === "all"
          ? true
          : paidFilter === "paid"
          ? row.isPaid === true
          : row.isPaid === false;

      const hasCoupon = Boolean(row.couponCode || row.couponApplied);
      const matchesCoupon =
        couponFilter === "all"
          ? true
          : couponFilter === "applied"
          ? hasCoupon
          : !hasCoupon;

      return matchesStatus && matchesPaid && matchesCoupon;
    });
  }, [rows, statusFilter, paidFilter, couponFilter]);
  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 3,
        overflowX: "auto",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
      }}
    >
           <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Typography
          sx={{ flex: "1 1 100%", fontWeight: 700 }}
          variant="h5"
          id="tableTitle"
          component="div"
        >
          Orders
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track payments, coupon usage, order status, and purchased items.
        </Typography>

        <Box
          sx={{
            mt: 2,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(180px, 1fr))",
              lg: "repeat(4, minmax(180px, 1fr))",
            },
            gap: 1.5,
            alignItems: "end",
          }}
        >
          <FormControl fullWidth size="small">
            <InputLabel id="orders-status-filter-label">Status</InputLabel>
            <Select
              labelId="orders-status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | OrderStatus)
              }
            >
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="Not Processed">Not Processed</MenuItem>
              <MenuItem value="Processing">Processing</MenuItem>
              <MenuItem value="Dispatched">Dispatched</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel id="orders-paid-filter-label">Payment</InputLabel>
            <Select
              labelId="orders-paid-filter-label"
              value={paidFilter}
              label="Payment"
              onChange={(event) =>
                setPaidFilter(event.target.value as "all" | "paid" | "unpaid")
              }
            >
              <MenuItem value="all">All payments</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="unpaid">Unpaid</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel id="orders-coupon-filter-label">Coupon</InputLabel>
            <Select
              labelId="orders-coupon-filter-label"
              value={couponFilter}
              label="Coupon"
              onChange={(event) =>
                setCouponFilter(event.target.value as "all" | "applied" | "none")
              }
            >
              <MenuItem value="all">All orders</MenuItem>
              <MenuItem value="applied">Coupon applied</MenuItem>
              <MenuItem value="none">No coupon</MenuItem>
            </Select>
          </FormControl>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip size="small" label={`Total: ${rows.length}`} variant="outlined" />
            <Chip
              size="small"
              label={`Shown: ${filteredRows.length}`}
              sx={{ fontWeight: 700 }}
            />
          </Stack>
        </Box>
      </Box>

      <Table
        aria-label="collapsible table"
        className={styles.table}
        sx={{ minWidth: 980, "& th": { whiteSpace: "nowrap" } }}
      >
        <TableHead>
          <TableRow
            sx={{
              "& th": {
                fontWeight: 700,
                fontSize: 14,
                color: "common.white",
                backgroundColor: "#3b82f6",
                py: 1.75,
              },
            }}
          >
            <TableCell sx={{ width: 56 }} />
            <TableCell>Order</TableCell>
            <TableCell>Payment Method</TableCell>
            <TableCell>Paid</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Coupon</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
                <TableBody>
          {filteredRows.length ? (
            filteredRows.map((row) => <Row key={row._id} row={row} />)
          ) : (
            <TableRow>
              <TableCell colSpan={7} sx={{ py: 5, textAlign: "center" }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  No orders match the selected filters.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Try changing the status, payment, or coupon filters.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}