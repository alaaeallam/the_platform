"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import type { CartProduct } from "@/types/cart";

import CartHeader from "@/components/cart/cartHeader";
import Product from "@/components/cart/product";
import Checkout from "@/components/cart/checkout";
import PaymentMethods from "@/components/cart/paymentMethods";
import ProductsSwiper from "@/components/productsSwiper";
import Empty from "@/components/cart/empty";
import { women_swiper } from "@/data/home";
import { saveCart } from "@/requests/user";

import styles from "@/app/styles/cart.module.scss";

interface CartState {
  cartItems: CartProduct[];
}
interface RootState {
  cart: CartState;
}

export default function CartPage(): React.JSX.Element {
  const router = useRouter();
  const { data: session } = useSession();
  const dispatch = useDispatch();

  // ✅ use the shared type here
  const [selected, setSelected] = useState<CartProduct[]>([]);

  const { cart } = useSelector((state: RootState) => state);

  const { shippingFee, subtotal, total } = useMemo(() => {
    const shipping = selected.reduce<number>(
      (acc, cur) => acc + Number(cur.shipping ?? 0),
      0
    );
    const sub = selected.reduce<number>(
      (acc, cur) => acc + Number(cur.price) * Number(cur.qty),
      0
    );
    return {
      shippingFee: Number(shipping.toFixed(2)),
      subtotal: Number(sub.toFixed(2)),
      total: Number((sub + shipping).toFixed(2)),
    };
  }, [selected]);

  useEffect(() => {
    if (!cart?.cartItems?.length) {
      setSelected([]);
      return;
    }
    setSelected((prev) =>
      prev.filter((s) => cart.cartItems.some((c) => c._uid === s._uid))
    );
  }, [cart?.cartItems]);

  const saveCartToDbHandler = async (): Promise<void> => {
    if (!selected.length) return;
    if (!session) {
      signIn();
      return;
    }
    try {
      await saveCart(selected);
      router.push("/checkout");
    } catch (e) {
      console.error("Failed to save cart:", e);
    }
  };

  const hasItems = Boolean(cart?.cartItems?.length);

  return (
    <div className={styles.cart}>
      {hasItems ? (
        <div className={styles.cart__container}>
          <CartHeader
            cartItems={cart.cartItems}
            selected={selected}
            setSelected={setSelected}
          />

          <div className={styles.cart__products}>
            {cart.cartItems.map((product) => (
              <Product
                key={product._uid}
                product={product}
                selected={selected}
                setSelected={setSelected}
              />
            ))}
          </div>

          <Checkout
            subtotal={subtotal}
            shippingFee={shippingFee}
            total={total}
            selected={selected}
            saveCartToDbHandler={saveCartToDbHandler}
          />

          <PaymentMethods />
        </div>
      ) : (
        <Empty />
      )}

      <ProductsSwiper products={women_swiper} />
    </div>
  );
}