"use client";

import { useState, useEffect } from "react";
import styles from "./styles.module.scss";
import { compareArrays } from "@/utils/arrays_utils";
import type { CartProduct } from "@/types/cart";

interface CartHeaderProps {
  cartItems: CartProduct[];
  selected: CartProduct[];
  setSelected: React.Dispatch<React.SetStateAction<CartProduct[]>>;
}

const CartHeader: React.FC<CartHeaderProps> = ({
  cartItems,
  selected,
  setSelected,
}) => {
  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    setActive(compareArrays(cartItems, selected));
  }, [cartItems, selected]);

  const handleSelect = (): void => {
    if (selected.length !== cartItems.length) {
      setSelected(cartItems);
    } else {
      setSelected([]);
    }
  };

  return (
    <div className={`${styles.cart__header} ${styles.card}`}>
      <h1>Item Summary ({cartItems.length})</h1>
      <div
        className={styles.flex}
        onClick={handleSelect}
        role="button"
        aria-pressed={active}
        tabIndex={0}
      >
        <div className={`${styles.checkbox} ${active ? styles.active : ""}`} />
        <span>Select all items</span>
      </div>
    </div>
  );
};

export default CartHeader;