"use client";

import { useState } from "react";
import Image from "next/image"; // ✅ use Next.js Image
import { IoArrowDown } from "react-icons/io5";
import styles from "./styles.module.scss";

/* ---------- Types ---------- */
export interface RatingOption { text: string; value: number | ""; }
export interface SizeOption { size: string; }
export interface StyleOption { color?: string; image?: string; }
export interface OrderOption { text: string; value: string; }

type RatingProps = {
  text: "Rating"; property: number | ""; data: RatingOption[];
  handleChange: (val: number | "") => void;
};
type SizeProps = {
  text: "Size"; property: string; data: SizeOption[];
  handleChange: (val: string) => void;
};
type StyleProps = {
  text: "Style"; property: StyleOption | null; data: StyleOption[];
  handleChange: (val: StyleOption | null) => void;
};
type OrderProps = {
  text: "Order"; property: string; data: OrderOption[];
  handleChange: (val: string) => void;
};

export type TableSelectProps = RatingProps | SizeProps | StyleProps | OrderProps;

/* ---------- Component ---------- */
export default function TableSelect(props: TableSelectProps): React.JSX.Element {
  const [visible, setVisible] = useState(false);

  switch (props.text) {
    case "Rating": {
      const { property, data, handleChange } = props;
      return (
        <div className={styles.select}>
          Rating:
          <div
            className={styles.select__header}
            onMouseOver={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
          >
            <span className={`${styles.flex} ${styles.select__header_wrap}`} style={{ padding: "0 5px" }}>
              {property || "Select Rating"} <IoArrowDown />
            </span>
            {visible && (
              <ul
                className={styles.select__header_menu}
                onMouseOver={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
              >
                {data.map((item, i) => (
                  <li key={i} onClick={() => handleChange(item.value)}>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }

    case "Size": {
      const { property, data, handleChange } = props;
      return (
        <div className={styles.select}>
          Size:
          <div
            className={styles.select__header}
            onMouseOver={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
          >
            <span className={`${styles.flex} ${styles.select__header_wrap}`} style={{ padding: "0 5px" }}>
              {property || "Select Size"} <IoArrowDown />
            </span>
            {visible && (
              <ul
                className={styles.select__header_menu}
                onMouseOver={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
              >
                {data.map((item, i) => (
                  <li key={i} onClick={() => handleChange(item.size)}>
                    <span>{item.size}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }

    case "Style": {
      const { property, data, handleChange } = props;
      const bg = property?.color || undefined;

      return (
        <div className={styles.select}>
          Style:
          <div
            className={styles.select__header}
            onMouseOver={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            style={{ background: bg }}
          >
            <span className={`${styles.flex} ${styles.select__header_wrap}`} style={{ padding: "0 5px" }}>
              {property?.image ? (
                <Image
                  src={property.image}
                  alt="Selected style"
                  width={20}
                  height={20}
                  sizes="20px"
                />
              ) : (
                "Select Style"
              )}
              <IoArrowDown />
            </span>

            {visible && (
              <ul
                className={styles.select__header_menu}
                onMouseOver={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
              >
                {data.map((item, i) => (
                  <li
                    key={i}
                    onClick={() => handleChange(item)}
                    style={{ backgroundColor: item.color }}
                  >
                    <span>
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt="Style option"
                          width={20}
                          height={20}
                          sizes="20px"
                        />
                      ) : (
                        "All Styles"
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }

    case "Order": {
      const { property, data, handleChange } = props;
      return (
        <div className={styles.select}>
          Order:
          <div
            className={styles.select__header}
            onMouseOver={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
          >
            <span className={`${styles.flex} ${styles.select__header_wrap}`} style={{ padding: "0 5px" }}>
              {property || "Select Order"} <IoArrowDown />
            </span>
            {visible && (
              <ul
                className={styles.select__header_menu}
                onMouseOver={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                style={{ width: "200px" }}
              >
                {data.map((item, i) => (
                  <li key={i} style={{ width: "200px" }} onClick={() => handleChange(item.value)}>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }
  }
}