

import Copyright from "./Copyright";
import Links from "./Links";
import NewsLetter from "./NewsLetter";
import Payment from "./Payment";
import Socials from "./Socials";
import styles from "./styles.module.scss";

// Define or import the Country type above the component
type Country = {
  // Add the properties relevant to your Country type
  name: string;
  code: string;
};

export default function Footer({ country }: { country: Country }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footer__container}>
        <Links />
       <Socials/>
       <NewsLetter />
       <Payment />
       <Copyright country={country} />
      </div>
    </footer>
  )
}
