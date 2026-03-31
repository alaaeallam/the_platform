import Link from "next/link";
import styles from "./styles.module.scss";

interface CategoryItem {
  _id: string;
  name: string;
  slug?: string;
}

interface HeaderProps {
  categories: CategoryItem[];
}

export default function Header({ categories }: HeaderProps) {
  return (
    <div className={styles.header}>
      <ul>
        {categories.slice(0, 4).map((c) => {
          const slug = c.slug || c.name.toLowerCase().replace(/\s+/g, "-");
          return (
            <li key={c._id}>
              <Link href={`/browse?category=${encodeURIComponent(slug)}`}>
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
