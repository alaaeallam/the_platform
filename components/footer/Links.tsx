import Link from "next/link";
import Image from "next/image"; // optional but recommended
import styles from "./styles.module.scss";

const sections = [
  {
    heading: "SHOPPAY",
    links: [
      { name: "About us", link: "/about" },
      { name: "Contact us", link: "/contact" },
      { name: "Social Responsibility", link: "/social" },
      // remove empty items or give them a proper name/link
    ],
  },
  {
    heading: "HELP & SUPPORT",
    links: [
      { name: "Shipping Info", link: "/shipping" },
      { name: "Returns", link: "/returns" },
      { name: "How To Order", link: "/how-to-order" },
      { name: "How To Track", link: "/track" },
      { name: "Size Guide", link: "/size-guide" },
    ],
  },
  {
    heading: "Customer service",
    links: [
      { name: "Customer service", link: "/customer-service" },
      { name: "Terms and Conditions", link: "/terms" },
      { name: "Consumers (Transactions)", link: "/consumers" },
      { name: "Take our feedback survey", link: "/survey" },
    ],
  },
];

export default function Links() {
  return (
    <div className={styles.footer__links}>
      {sections.map((section, i) => (
        <ul key={section.heading || i}>
          <li>
            {i === 0 ? (
              // put silhouett.jpg in /public and use an absolute path
              <Image
                src="/silhouett.jpg"
                alt="Silhouett"
                width={120}
                height={32}
                className={styles.logo}
                priority
              />
            ) : (
              <b>{section.heading}</b>
            )}
          </li>

          {section.links
            .filter((item) => item.name) // skip empty items
            .map((item, j) => (
              <li key={`${section.heading}-${j}`}>
                {item.link ? (
                  <Link href={item.link}>{item.name}</Link>
                ) : (
                  <span>{item.name}</span>
                )}
              </li>
            ))}
        </ul>
      ))}
    </div>
  );
}