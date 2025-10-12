// app/(admin)/admin/dashboard/DashboardClient.tsx
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import styles from "@/app/styles/dashboard.module.scss";
import Dropdown from "@/components/admin/dashboard/dropdown";
import Notifications from "@/components/admin/dashboard/notifications";

import { TbUsers } from "react-icons/tb";
import { SlHandbag, SlEye } from "react-icons/sl";
import { SiProducthunt } from "react-icons/si";
import { GiTakeMyMoney } from "react-icons/gi";

export type ObjectIdLike = string;
export type OrderStatus = "Not Processed" | "Processing" | "Dispatched" | "Cancelled" | "Completed";

export interface UserVM {
  _id: ObjectIdLike;
  name: string;
  email: string;
  image?: string;
}
export interface OrderVM {
  _id: ObjectIdLike;
  total: number;
  isPaid: boolean;
  status: OrderStatus;
  user: { _id: ObjectIdLike; name: string };
}
export interface ProductVM {
  _id: ObjectIdLike;
}

export interface DashboardProps {
  users: UserVM[];
  orders: OrderVM[];
  products: ProductVM[];
}

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

export default function DashboardClient({ users, orders, products }: DashboardProps) {
  const { data: session } = useSession();
  const totalEarnings = orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  const unpaid = orders.filter((o) => !o.isPaid).reduce((acc, o) => acc + (Number(o.total) || 0), 0);

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.header__search}>
          <label htmlFor="admin-search">
            <input id="admin-search" type="text" placeholder="Search here..." />
          </label>
        </div>
        <div className={styles.header__right}>
          <Dropdown userImage={session?.user?.image ?? undefined} />
          <Notifications />
        </div>
      </div>

      {/* Cards */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.card__icon}><TbUsers /></div>
          <div className={styles.card__infos}><h4>+{users.length}</h4><span>Users</span></div>
        </div>

        <div className={styles.card}>
          <div className={styles.card__icon}><SlHandbag /></div>
          <div className={styles.card__infos}><h4>+{orders.length}</h4><span>Orders</span></div>
        </div>

        <div className={styles.card}>
          <div className={styles.card__icon}><SiProducthunt /></div>
          <div className={styles.card__infos}><h4>+{products.length}</h4><span>Products</span></div>
        </div>

        <div className={styles.card}>
          <div className={styles.card__icon}><GiTakeMyMoney /></div>
          <div className={styles.card__infos}>
            <h4>{currency(totalEarnings)}</h4>
            <h5>-{currency(unpaid)} Unpaid yet.</h5>
            <span>Total Earnings</span>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className={styles.data}>
        <div className={styles.orders}>
          <div className={styles.heading}>
            <h2>Recent Orders</h2>
            <Link href="/admin/dashboard/orders">View All</Link>
          </div>
          <table>
            <thead>
              <tr><th>Name</th><th>Total</th><th>Payment</th><th>Status</th><th>View</th></tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order.user?.name ?? "—"}</td>
                  <td>{currency(order.total)}</td>
                  <td>
                    <img
                      src={order.isPaid ? "/images/verified.webp" : "/images/unverified1.png"}
                      alt={order.isPaid ? "Paid" : "Unpaid"}
                      width={18} height={18}
                    />
                  </td>
                  <td>
                    <div className={`${styles.status} ${
                      order.status === "Not Processed" ? styles.not_processed :
                      order.status === "Processing"    ? styles.processing :
                      order.status === "Dispatched"    ? styles.dispatched :
                      order.status === "Cancelled"     ? styles.cancelled :
                      order.status === "Completed"     ? styles.completed : ""
                    }`}>
                      {order.status}
                    </div>
                  </td>
                  <td>
                    <Link href={`/order/${order._id}`} aria-label="View order"><SlEye /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.users}>
          <div className={styles.heading}>
            <h2>Recent Users</h2>
            <Link href="/admin/dashboard/users">View All</Link>
          </div>
          <table>
            <thead><tr><th>User</th><th>Details</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td className={styles.user}>
                    <div className={styles.user__img}>
                      <img src={u.image || "/images/avatar.png"} alt={u.name} width={36} height={36} />
                    </div>
                  </td>
                  <td>
                    <h4>{u.name}</h4>
                    <span>{u.email}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}