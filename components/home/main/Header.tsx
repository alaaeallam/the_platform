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
      <ul className={styles.nav}>
        {categories.slice(0, 6).map((c) => {
          const slug = c.slug || c.name.toLowerCase().replace(/\s+/g, "-");
          const href = `/browse?category=${encodeURIComponent(slug)}`;

          return (
            <li key={c._id} className={styles.navItem}>
              <Link href={href}>{c.name}</Link>

              <div className={styles.megaMenu}>
                <div className={styles.megaContent}>
                  <h4>{c.name}</h4>
                  <ul>
                    <li>
                      <Link href={href}>View All</Link>
                    </li>
                    <li>
                      <Link href={`${href}&sort=newest`}>New Arrivals</Link>
                    </li>
                    <li>
                      <Link href={`${href}&sort=topSelling`}>Best Sellers</Link>
                    </li>
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
