// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store";

interface ProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider
      session={session ?? undefined}
      refetchOnWindowFocus
      refetchInterval={5 * 60}   // refresh JWT every 5 minutes in the background
      refetchWhenOffline={false}
    >
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          {children}
        </PersistGate>
      </Provider>
    </SessionProvider>
  );
}