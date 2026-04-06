// components/admin/layout/index.tsx
"use client";

import { useEffect, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import { hideDialog } from "../../../store/DialogSlice";
import DialogModal from "../../dialogModal";
import Sidebar from "./sidebar";
import styles from "./styles.module.scss";
import { store } from "@/store";

/* =========================
   Types
   ========================= */

// Define the part of the Redux state you need
interface ExpandSidebarState {
  expandSidebar: boolean;
}

// Full RootState shape for selector (adjust if needed)
export type RootState = ReturnType<typeof store.getState>;  

// Props for Layout
interface LayoutProps {
  children: ReactNode;
}

/* =========================
   Component
   ========================= */

export default function Layout({ children }: LayoutProps) {
  const dispatch = useDispatch();

  // Strongly typed selector
  const showSidebar = useSelector(
  (state: RootState) => state.expandSidebar.expandSidebar
);
 

  useEffect(() => {
    dispatch(hideDialog());
  }, [dispatch]);

  return (
    <div className={styles.layout}>
      <DialogModal />
      <Sidebar />
      <div
        className={`${styles.layout__main} ${showSidebar ? styles.expanded : styles.collapsed}`}
      >
        {children}
      </div>
    </div>
  );
}