"use client";

import { useState } from "react";
import styles from "./styles.module.scss";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { HiMinusSm, HiPlusSm } from "react-icons/hi";
import slugify from "slugify";
import { useSearchParams } from "next/navigation";
import React from "react";
interface LinkItem {
  name: string;
  link: string;
  filter?: string;
}

interface SidebarItem {
  heading: string;
  links: LinkItem[];
}

interface ItemProps {
  item: SidebarItem;
  visible: boolean;
  index: number | string;
}

export default function Item({ item, visible, index }: ItemProps): React.JSX.Element {
  const [show, setShow] = useState<boolean>(visible);
  const searchParams = useSearchParams();
  const q = searchParams?.get("q") ?? "";

  return (
    <li>
      {item.heading === "Sign out" ? (
        <b onClick={() => signOut()}>Sign out</b>
      ) : (
        <b onClick={() => setShow((prev: boolean) => !prev)}>
          {item.heading} {show ? <HiMinusSm /> : <HiPlusSm />}
        </b>
      )}

      {show && (
        <ul>
          {item.links.map((link: LinkItem, i: number) => {
            const slug = slugify(link.name, { lower: true });
            const isOrder = link.link.startsWith("/profile/orders");
            const activeLeft = q.split("__")[0] || "";
            const isActive = isOrder ? activeLeft === slug : q === slug;

            const href = isOrder
              ? `${link.link}?tab=${index}&q=${slug}__${link.filter ?? ""}`
              : `${link.link}?tab=${index}&q=${slug}`;

            return (
              <li key={`${slug}-${i}`} className={isActive ? styles.active : ""}>
                <Link href={href}>{link.name}</Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
