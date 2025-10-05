// app/(shop)/head.tsx
export default function Head() {
  return (
    <>
      {/* Stripe preload for faster card element load */}
      <link rel="dns-prefetch" href="https://js.stripe.com" />
      <link rel="preconnect" href="https://js.stripe.com" crossOrigin="" />

      <link rel="dns-prefetch" href="https://m.stripe.network" />
      <link rel="preconnect" href="https://m.stripe.network" crossOrigin="" />
    </>
  );
}