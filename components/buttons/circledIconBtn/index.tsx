import { BiRightArrowAlt } from "react-icons/bi";
import styles from "./styles.module.scss";
type CircledIconBtnProps = {
  type?: "button" | "submit" | "reset";
  text: string;
  icon?: React.ReactNode;
};

export default function CircledIconBtn({ type = "button", text }: CircledIconBtnProps) {
  return (
    <button className={styles.button} type={type}>
      {text}
      <div className={styles.svg__wrap}>
        <BiRightArrowAlt />
      </div>
    </button>
  );
}
