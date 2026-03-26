// components/admin/categories/ListItem.tsx
"use client";

import { ChangeEvent, useRef, useState } from "react";
import axios from "axios";
import { uploadImages } from "@/requests/upload";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(category.image ?? "");
  const [saving, setSaving] = useState<boolean>(false);
  const input = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0] ?? null;
  setImageFile(file);
  if (!file) {
    setImagePreview(category.image ?? "");
    return;
  }
  const url = URL.createObjectURL(file);
  setImagePreview(url);
};

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
    setSaving(true);

    let image = category.image ?? "";
    if (imageFile) {
      const formData = new FormData();
      formData.append("path", "category images");
      formData.append("file", imageFile);
      const uploaded = (await uploadImages(formData)) as Array<string | { url?: string }>;
      const first = uploaded?.[0];
      image = typeof first === "string" ? first : first?.url ?? "";
    }

    const { data } = await axios.put<ApiResponse>("/api/admin/categories", {
      id,
      name: name || category.name,
      image,
    });
    setCategories(data.categories);
    setOpen(false);
    setName("");
    setImageFile(null);
    toast.success(data.message);
  } catch (err) {
    const msg =
      (axios.isAxiosError(err) && err.response?.data?.message) ||
      (err as Error).message ||
      "Failed to update category.";
    toast.error(msg);
  } finally {
    setSaving(false);
  }
};

  return (
    <li className={styles.list__item}>
       <div style={{ display: "grid", gap: 8, alignItems: "start" }}>
   {imagePreview ? (
     <img
       src={imagePreview}
       alt={category.name}
       style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, border: "1px solid #e5e7eb" }}
     />
   ) : (
     <div
       style={{
         width: 56,
         height: 56,
         display: "grid",
         placeItems: "center",
         border: "1px dashed #d1d5db",
         borderRadius: 10,
         fontSize: 11,
         color: "#6b7280",
       }}
     >
       No image
     </div>
   )}
   {open ? (
     <input type="file" accept="image/*" onChange={handleImageChange} />
   ) : null}
 </div>
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
            {saving ? "Saving..." : "Save"}
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