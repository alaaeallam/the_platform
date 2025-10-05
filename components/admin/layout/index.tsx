// components/admin/layout/index.tsx
"use client";

import { useEffect, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import { hideDialog } from "../../../store/DialogSlice";
import DialogModal from "../../dialogModal";
import Sidebar from "./sidebar";
import styles from "./styles.module.scss";

/* =========================
   Types
   ========================= */

// Define the part of the Redux state you need
interface ExpandSidebarState {
  expandSidebar: boolean;
}

// Full RootState shape for selector (adjust if needed)
interface RootState {
  expandSidebar: ExpandSidebarState;
}

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
  const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
  const showSidebar = useTypedSelector(
    (state) => state.expandSidebar.expandSidebar
  );

  useEffect(() => {
    dispatch(hideDialog());
  }, [dispatch]);

  return (
    <div className={styles.layout}>
      <DialogModal />
      <Sidebar />
      <div
        className={styles.layout__main}
        style={{ marginLeft: showSidebar ? "280px" : "80px" }}
      >
        {children}
      </div>
    </div>
  );
}