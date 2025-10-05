// components/admin/categories/Create.tsx
"use client";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
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

  const submitHandler = async () => {
    try {
      const { data } = await axios.post<CreateCategoryResponse>(
        "/api/admin/categories",
        { name }
      );
      setCategories(data.categories);
      setName("");
      toast.success(data.message);
    } catch (err) {
      const message =
        (axios.isAxiosError(err) && err.response?.data?.message) ||
        (err as Error).message ||
        "Failed to create category.";
      toast.error(message);
    }
  };

  const initialValues: FormValues = { name };

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

          <div className={styles.btnWrap}>
            <button type="submit" className={styles.btn}>
              <span>Add Category</span>
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}