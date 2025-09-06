
import Link from "next/link";
import styles from "./styles.module.scss";


type UserMenuProps = {
  LoggedIn: boolean;
};

export default function UserMenu({ LoggedIn }: UserMenuProps) {
  return (
    <div className={styles.menu}>
      <h4>Welcome to Shoppay !</h4>
      {LoggedIn ? <div className={styles.flex}>
        <img
          src="https://avatars.githubusercontent.com/u/9919?s=280&v=4"
          alt="user"
          className={styles.menu__img}
        />
        <div className={styles.col}>
            <span>Welcome Back,</span>
            <h3>Alaa Allam</h3>
            <span>Sign Out</span>
        </div>
        </div> : 
        <div className={styles.flex}>
        <button className={styles.btn_primary}>Register</button>
        <button className={styles.btn_outlined}>
            Login
          </button>
        </div>
      }
      <ul>
        <li>
          <Link href="/profile">Account</Link>
        </li>
        <li>
          <Link href="/profile/orders">My Orders</Link>
        </li>
        <li>
          <Link href="/profile/messages">Message Center</Link>
        </li>
        <li>
          <Link href="/profile/address">Address</Link>
        </li>
        <li>
          <Link href="/profile/whishlist">Whishlist</Link>
        </li>
      </ul>
    </div>
  );
}
