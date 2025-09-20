"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
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
  // const dispatch = useAppDispatch();

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
  const items = cart?.cartItems ?? [];
  if (!items.length) {
    setSelected([]);
    return;
  }

  setSelected((prev) => {
    // 1) first load: select all
    if (!prev.length) return items;

    // 2) keep previous selections, auto-add any new items
    const prevIds = new Set(prev.map((p) => p._uid));
    const merged = [...prev];

    for (const it of items) {
      if (!prevIds.has(it._uid)) merged.push(it);
    }

    // 3) remove selections that no longer exist
    return merged.filter((p) => items.some((c) => c._uid === p._uid));
  });
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