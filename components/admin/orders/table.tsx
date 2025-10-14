// components/admin/orders/table.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
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

  const userId = row.user?._id ?? row.user?.id ?? "";
  const verifiedIcon = "/images/verified.png";
  const unverifiedIcon = "/images/unverified.png";

  const statusClass =
    row.status === "Not Processed"
      ? styles.not_processed
      : row.status === "Processing"
      ? styles.processing
      : row.status === "Dispatched"
      ? styles.dispatched
      : row.status === "Cancelled"
      ? styles.cancelled
      : row.status === "Completed"
      ? styles.completed
      : "";

  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        <TableCell component="th" scope="row">
          {row._id}
        </TableCell>

        <TableCell align="right">
          {formatPaymentLabel(row.paymentMethod)}
        </TableCell>

        <TableCell align="right">
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
        </TableCell>

        <TableCell align="right">
          <span className={statusClass}>{row.status ?? "-"}</span>
        </TableCell>

        <TableCell align="right">{row.couponCode ?? (row.couponApplied ? "YES" : "-")}</TableCell>

        <TableCell align="right">
          <b>{typeof row.total === "number" ? `${row.total}$` : "-"}</b>
        </TableCell>
      </TableRow>

      {/* Order for (user & shipping) */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Order for
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Shipping Information</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow key={userId}>
                    <TableCell component="th" scope="row">
                      {row.user?.image ? (
                        <Image
                          src={row.user.image}
                          alt={`${row.user?.name ?? "User"} avatar`}
                          width={40}
                          height={40}
                          sizes="40px"
                          className={styles.table__img}
                        />
                      ) : (
                        <span className={styles.table__img_placeholder} />
                      )}
                    </TableCell>
                    <TableCell>{row.user?.name ?? "-"}</TableCell>
                    <TableCell align="left">{row.user?.email ?? "-"}</TableCell>
                    <TableCell align="right">
                      {row.shippingAddress?.firstName ?? ""}{" "}
                      {row.shippingAddress?.lastName ?? ""} <br />
                      {row.shippingAddress?.address1 ?? ""} <br />
                      {row.shippingAddress?.address2 ?? ""} <br />
                      {row.shippingAddress?.state ?? ""},{" "}
                      {row.shippingAddress?.city ?? ""} <br />
                      {row.shippingAddress?.country ?? ""} <br />
                      {row.shippingAddress?.zipCode ?? ""} <br />
                      {row.shippingAddress?.phoneNumber ?? ""} <br />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      {/* Order items */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Order items
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(row.products ?? []).map((p) => (
                    <TableRow key={p._id}>
                      <TableCell component="th" scope="row">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.name ?? "Product image"}
                            width={48}
                            height={48}
                            sizes="48px"
                            className={styles.table__productImg}
                          />
                        ) : (
                          <span className={styles.table__productImg_placeholder} />
                        )}
                      </TableCell>
                      <TableCell>{p.name ?? "-"}</TableCell>
                      <TableCell align="left">
                        {p.size !== undefined ? String(p.size) : "-"}
                      </TableCell>
                      <TableCell align="left">x{p.qty ?? 0}</TableCell>
                      <TableCell align="left">
                        {typeof p.price === "number" ? `${p.price}$` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableRow key={`total-${row._id}`}>
                    <TableCell component="th" scope="row" align="left">
                      TOTAL
                    </TableCell>
                    <TableCell />
                    <TableCell align="left" />
                    <TableCell align="left" />
                    <TableCell align="left" style={{ padding: "20px 0 20px 18px" }}>
                      <b style={{ fontSize: "20px" }}>
                        {typeof row.total === "number" ? `${row.total}$` : "-"}
                      </b>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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
  return (
    <TableContainer component={Paper}>
      <Typography sx={{ flex: "1 1 100%" }} variant="h6" paddingX="5px" id="tableTitle" component="div">
        Orders
      </Typography>

      <Table aria-label="collapsible table" className={styles.table}>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Order</TableCell>
            <TableCell align="right">Payment Method</TableCell>
            <TableCell align="right">Paid</TableCell>
            <TableCell align="right">Status</TableCell>
            <TableCell align="right">Coupon</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <Row key={row._id} row={row} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}