// components/loaders/dotLoader/index.tsx
import styles from "./styles.module.scss";
import DotLoader from "react-spinners/DotLoader";

interface DotLoaderSpinnerProps {
  loading?: boolean;
}

export default function DotLoaderSpinner({ loading = false }: DotLoaderSpinnerProps) {
  if (!loading) return null;            // ⬅️ crucial: no overlay DOM when idle
  return (
    <div className={styles.loader}>
      <DotLoader color="#2f82ff" loading />
    </div>
  );
}