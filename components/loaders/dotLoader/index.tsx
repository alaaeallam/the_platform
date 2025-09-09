import styles from "./styles.module.scss";
import DotLoader from "react-spinners/DotLoader";
interface DotLoaderSpinnerProps {
  loading: boolean;
}

export default function DotLoaderSpinner({ loading }: DotLoaderSpinnerProps) {
  return (
    <div className={styles.loader}>
      <DotLoader color="#2f82ff" loading={loading} />
    </div>
  );
}
