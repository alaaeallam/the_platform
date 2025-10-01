import { PaymentMethod } from "@/types/checkout";

/**
 * Interface representing a payment method's information.
 */
export interface PaymentMethodInfo {
  /** Display name of the payment method */
  name: string;
  /** Unique identifier for the payment method */
  id: PaymentMethod;
  /** Description of the payment method */
  description: string;
  /** List of associated image identifiers */
  images: string[];
}

export const paymentMethods: PaymentMethodInfo[] = [
  {
    name: "Paypal",
    id: "paypal",
    description:
      "If you don't have a PayPal account, you can also pay via PayPal with your credit card or bank debit card. Payment can be submitted in any currency!",
    images: [],
  },
  {
    name: "Credit Card",
    id: "visa",
    description: "",
    images: [
      "visa",
      "mastercard",
      "paypal",
      "maestro",
      "american_express",
      "cb",
      "jcb",
    ],
  },
  {
    name: "Cash",
    id: "cash",
    description: "Pay with cash upon delivery or in person.",
    images: [],
  },
];
