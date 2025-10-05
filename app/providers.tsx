// app/providers.tsx
"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { Provider as ReduxProvider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type ProvidersProps = {
  children: React.ReactNode;
  /** Optional: pass when you use getServerSession in a server layout/page */
  session?: Session | null;
};

export function Providers({ children, session }: ProvidersProps): React.JSX.Element {
  return (
    <SessionProvider
      session={session ?? undefined}
      refetchOnWindowFocus
      refetchInterval={5 * 60} // refresh JWT every 5 minutes
      refetchWhenOffline={false}
    >
      <ReduxProvider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          {children}

          {/* Global toast container (mounted once) */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastStyle={{ zIndex: 10000 }} // keep above modals/headers
          />
        </PersistGate>
      </ReduxProvider>
    </SessionProvider>
  );
}