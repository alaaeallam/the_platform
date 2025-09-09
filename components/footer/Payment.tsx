import styles from "./styles.module.scss";
import Image from "next/image";
export default function Payment() {
  return (
    <div className={styles.footer__payment}>
      <h3>WE ACCPET</h3>
      <div className={styles.footer__flexwrap}>
        <Image src="../../../images/payment/visa.webp" alt="" />
        <Image src="../../../images/payment/mastercard.webp" alt="" />
        <Image src="../../../images/payment/paypal.webp" alt="" />
      </div>
    </div>
  );
}
