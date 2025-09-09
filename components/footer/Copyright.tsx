import Link from "next/link";
import styles from "./styles.module.scss";
import { IoLocationSharp } from "react-icons/io5";

type Country = { name: string; code: string };

const items = [
  { name: "Privacy Center",          link: "/privacy-center" },
  { name: "Privacy & Cookie Policy", link: "/privacy-cookie-policy" },
  { name: "Manage Cookies",          link: "/manage-cookies" },
  { name: "Terms & Conditions",      link: "/terms" },
  { name: "Copyright Notice",        link: "/copyright" },
];

export default function Copyright({ country }: { country: Country }) {
  const year = new Date().getFullYear();

  return (
    <div className={styles.footer__copyright}>
      <section>©{year} Silhouett Egypt. All Rights Reserved.</section>

      <section>
        <ul>
          {items.map((item, idx) => (
            <li key={item.name || idx}>
              {item.link ? (
                <Link href={item.link}>{item.name}</Link>
              ) : (
                <span>{item.name}</span>
              )}
            </li>
          ))}

          <li key="country">
            {/* no href -> use span to avoid invalid <a> */}
            <span>
              <IoLocationSharp /> {country?.name}
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}