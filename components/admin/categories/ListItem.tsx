// components/admin/categories/ListItem.tsx
"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { AiFillDelete, AiTwotoneEdit } from "react-icons/ai";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";
import type { CategoryVM } from "./types";
/* =========================
   Types
   ========================= */

interface ApiResponse {
  message: string;
  categories: CategoryVM[];
}

interface ListItemProps {
  category: CategoryVM;
  setCategories: React.Dispatch<React.SetStateAction<CategoryVM[]>>;
}

/* =========================
   Component
   ========================= */

export default function ListItem({
  category,
  setCategories,
}: ListItemProps): React.JSX.Element {
  const [open, setOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>("");

  const input = useRef<HTMLInputElement | null>(null);

  const handleRemove = async (id: string): Promise<void> => {
    try {
      const { data } = await axios.delete<ApiResponse>("/api/admin/categories", {
        data: { id },
      });
      setCategories(data.categories);
      toast.success(data.message);
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) && err.response?.data?.message) ||
        (err as Error).message ||
        "Failed to delete category.";
      toast.error(msg);
    }
  };

  const handleUpdate = async (id: string): Promise<void> => {
    try {
      const { data } = await axios.put<ApiResponse>("/api/admin/categories", {
        id,
        name,
      });
      setCategories(data.categories);
      setOpen(false);
      toast.success(data.message);
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) && err.response?.data?.message) ||
        (err as Error).message ||
        "Failed to update category.";
      toast.error(msg);
    }
  };

  return (
    <li className={styles.list__item}>
      <input
        className={open ? styles.open : ""}
        type="text"
        value={name || category.name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setName(e.target.value)
        }
        disabled={!open}
        ref={input}
        aria-label="Category name"
      />

      {open && (
        <div className={styles.list__item_expand}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => handleUpdate(category._id)}
          >
            Save
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => {
              setOpen(false);
              setName("");
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <div className={styles.list__item_actions}>
        {!open && (
          <AiTwotoneEdit
            role="button"
            aria-label="Edit category"
            onClick={() => {
              setOpen(true);
              input.current?.focus();
            }}
          />
        )}
        <AiFillDelete
          role="button"
          aria-label="Delete category"
          onClick={() => handleRemove(category._id)}
        />
      </div>
    </li>
  );
}