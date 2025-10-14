"use client";

import React from "react";
import Image from "next/image";
import { sidebarData } from "../../../data/profile";
import Item from "./Item";
import styles from "./styles.module.scss";

interface LinkItem {
  name: string;
  link: string;
  filter?: string;
}

interface SidebarDataItem {
  heading: string;
  links: LinkItem[];
}

interface SidebarProps {
  data: {
    image?: string;
    name?: string;
    tab?: number | string;
  };
}

export default function Sidebar({ data }: SidebarProps): React.JSX.Element {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebar__container}>
        {data.image && (
          <Image
            src={data.image}
            alt={data.name ?? "User"}
            width={80}
            height={80}
            className={styles.sidebar__image}
          />
        )}
        <span className={styles.sidebar__name}>{data.name}</span>
        <ul>
          {(sidebarData as SidebarDataItem[]).map((item, i) => (
            <Item
              key={i}
              item={item}
              visible={String(data.tab) === i.toString()}
              index={i.toString()}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
