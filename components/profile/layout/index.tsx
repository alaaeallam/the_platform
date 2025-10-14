//app/components/profile/layout/index.tsx

import { ReactNode } from "react";
import type { Session } from "next-auth";
import styles from "./styles.module.scss";
import Head from "next/head";
import Header from "../../header";
import Sidebar from "../sidebar";

interface LayoutProps {
  user: Session["user"];
  tab: number;
  children?: ReactNode;
}

export default function Layout({ user, tab, children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <Head>
        <title>{user?.name ?? "Profile"}</title>
      </Head>
      <Header />
      <div className={styles.layout__container}>
        <Sidebar
          data={{
            image: user?.image ?? "",
            name: user?.name ?? "",
            tab,
          }}
        />
        <div className={styles.layout__content}>{children}</div>
      </div>
    </div>
  );
}
