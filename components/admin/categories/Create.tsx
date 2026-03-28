// components/admin/categories/Create.tsx
"use client";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import { ChangeEvent, useState } from "react";
import { uploadImages } from "@/requests/upload";
import axios from "axios";
import { toast } from "react-toastify";
import type { CategoryVM } from "./types";
import AdminInput from "@/components/inputs/adminInput";
import styles from "./styles.module.scss";

/* ---------- Types ---------- */



interface CreateProps {
  setCategories: React.Dispatch<React.SetStateAction<CategoryVM[]>>;
}

interface FormValues {
  name: string;
  image?: string;
  iconKey: string;
}

interface CreateCategoryResponse {
  message: string;
  categories: CategoryVM[];
}

/* ---------- Validation ---------- */

const validationSchema = Yup.object({
  name: Yup.string()
    .required("Category name is required.")
    .min(2, "Category name must be between 2 and 30 characters.")
    .max(30, "Category name must be between 2 and 30 characters."),
  // .matches(/^[a-zA-Z\s]*$/, "Numbers and special characters are not allowed.")
});

/* ---------- Component ---------- */

export default function Create({ setCategories }: CreateProps): React.JSX.Element {
  const [name, setName] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string>("");
const [loading, setLoading] = useState<boolean>(false);
const [iconKey, setIconKey] = useState<string>("generic");

const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0] ?? null;
  setImageFile(file);
  if (!file) {
    setImagePreview("");
    return;
  }
  const url = URL.createObjectURL(file);
  setImagePreview(url);
};

  const submitHandler = async () => {
  try {
    setLoading(true);

    let image = "";
    if (imageFile) {
      const formData = new FormData();
      formData.append("path", "category images");
      formData.append("file", imageFile);
      const uploaded = (await uploadImages(formData)) as Array<string | { url?: string }>;
      const first = uploaded?.[0];
      image = typeof first === "string" ? first : first?.url ?? "";
    }

    const { data } = await axios.post<CreateCategoryResponse>(
      "/api/admin/categories",
      { name, image, iconKey }
    );
    setCategories(data.categories);
    setName("");
    setImageFile(null);
    setImagePreview("");
    setIconKey("generic");
    toast.success(data.message);
  } catch (err) {
    const message =
      (axios.isAxiosError(err) && err.response?.data?.message) ||
      (err as Error).message ||
      "Failed to create category.";
    toast.error(message);
  } finally {
    setLoading(false);
  }
};

  const initialValues: FormValues = { name, image: imagePreview, iconKey };

  return (
    <Formik<FormValues>
      enableReinitialize
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={submitHandler}
    >
      {() => (
        <Form>
          <div className={styles.header}>Create a Category</div>

          <AdminInput
            type="text"
            label="Name"
            name="name"
            placeholder="Category name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
          />
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            <label style={{ fontWeight: 600 }}>Icon</label>
            <select
              name="iconKey"
              value={iconKey}
              onChange={(e) => setIconKey(e.target.value)}
              style={{
                height: 42,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 12px",
                background: "#fff",
              }}
            >
              <option value="bag">Bag</option>
              <option value="clothes">Clothes</option>
              <option value="wall-art">Wall Art</option>
              <option value="caricature">Caricature</option>
              <option value="gift">Gift</option>
              <option value="kids">Kids</option>
              <option value="seasonal">Seasonal</option>
              <option value="ramadan">Ramadan</option>
              <option value="valentine">Valentine</option>
              <option value="summer">Summer</option>
              <option value="generic">Generic</option>
            </select>
          </div>
               <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
       <label style={{ fontWeight: 600 }}>Image</label>
       <input type="file" accept="image/*" onChange={handleImageChange} />
       {imagePreview ? (
         <img
           src={imagePreview}
           alt="Category preview"
           style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 10, border: "1px solid #e5e7eb" }}
         />
       ) : null}
     </div>
          <div className={styles.btnWrap}>
            <button type="submit" className={styles.btn}>
              <span>{loading ? "Saving..." : "Add Category"}</span>
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}