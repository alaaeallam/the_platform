import Main from "@/components/home/main";
import styles from "../styles/Home.module.scss";
import FlashDeals from "@/components/home/flashDeals";

export default function Home() {
  

  return (
    <>
      <div className={styles.home}>
        <div className={styles.container}>
          <Main />
          <FlashDeals />
           <div className={styles.home__category}></div>
           
        </div>
      </div>
    </>
  );
}