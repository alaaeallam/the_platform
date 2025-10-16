// app/(shop)/page.tsx

import HomePageClient from "./HomePageClient"; // client wrapper

export default function Page() {
  return (
    <>
      {/* Dynamic banner from DB (server + cache) */}
      
      {/* rest of the homepage that needs hooks/effects */}
      <HomePageClient />
    </>
  );
}