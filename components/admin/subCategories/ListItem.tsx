"use client";

import * as React from "react";
import axios from "axios";
import { AiFillDelete, AiTwotoneEdit } from "react-icons/ai";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";
import type { CategoryVM, SubCategoryVM, SubCategoryServer } from "./types";
import { toClient } from "./types";

interface ApiListResponse {
  message: string;
  subCategories: SubCategoryServer[];
}

interface Props {
  categories: CategoryVM[];
  subCategory: SubCategoryVM; // parent is string id
  setSubCategories: React.Dispatch<React.SetStateAction<SubCategoryVM[]>>;
}

export default function ListItem({
  categories,
  subCategory,
  setSubCategories,
}: Props): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [parent, setParent] = React.useState<string>("");

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleRemove = async (id: string): Promise<void> => {
    try {
      const { data } = await axios.delete<ApiListResponse>("/api/admin/sub-categories", {
        data: { id },
      });
      setSubCategories(data.subCategories.map(toClient));
      toast.success(data.message);
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) && err.response?.data?.message) ||
        (err as Error).message ||
        "Failed to delete sub-category.";
      toast.error(msg);
    }
  };

  const handleUpdate = async (id: string): Promise<void> => {
    try {
      const payload = {
        id,
        name: name || subCategory.name,
        parent: parent || subCategory.parent, // both string ids
      };
      const { data } = await axios.put<ApiListResponse>("/api/admin/sub-categories", payload);
      setSubCategories(data.subCategories.map(toClient));
      setOpen(false);
      toast.success(data.message);
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) && err.response?.data?.message) ||
        (err as Error).message ||
        "Failed to update sub-category.";
      toast.error(msg);
    }
  };

  return (
    <li className={styles.list__item}>
      <input
        className={open ? styles.open : ""}
        type="text"
        value={name || subCategory.name}
        onChange={(e) => setName(e.target.value)}
        disabled={!open}
        ref={inputRef}
      />

      {open && (
        <div className={styles.list__item_expand}>
          <select
            name="parent"
            value={parent || subCategory.parent}
            onChange={(e) => setParent(e.target.value)}
            disabled={!open}
            className={styles.select}
          >
            {categories.map((c) => (
              <option value={c._id} key={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <button className={styles.btn} onClick={() => handleUpdate(subCategory._id)}>
            Save
          </button>
          <button
            className={styles.btn}
            onClick={() => {
              setOpen(false);
              setName("");
              setParent("");
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <div className={styles.list__item_actions}>
        {!open && (
          <AiTwotoneEdit
            onClick={() => {
              setOpen(true);
              inputRef.current?.focus();
            }}
          />
        )}
        <AiFillDelete onClick={() => handleRemove(subCategory._id)} />
      </div>
    </li>
  );
}