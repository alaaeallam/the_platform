// app/pay/[orderId]/page.tsx
import StripePayment from "@/components/stripePayment";

type Params = { orderId: string };

export default async function PayPage({ params }: { params: Promise<Params> }) {
  const { orderId } = await params;

  return (
    <div className="container">
      <h2>Complete your payment</h2>
      <StripePayment orderId={orderId} />
    </div>
  );
}