import Main from "@/components/home/main";
import styles from "../styles/Home.module.scss";

export default function Home() {
  

  return (
    <>
      <div className={styles.home}>
        <div className={styles.container}>
          <Main />
        </div>
      </div>
    </>
  );
}