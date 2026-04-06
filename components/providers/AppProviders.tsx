// components/providers/AppProviders.tsx
"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { Provider as ReduxProvider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ToastContainer } from "react-toastify";
import { store, makePersistor } from "@/store";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const persistor = React.useMemo(() => makePersistor(), []);

  return (
    <SessionProvider refetchOnWindowFocus refetchInterval={5 * 60} refetchWhenOffline={false}>
      <ReduxProvider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastStyle={{ zIndex: 10000 }}
          />
        </PersistGate>
      </ReduxProvider>
    </SessionProvider>
  );
}