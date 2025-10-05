"use client";

import * as React from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";

import AdminInput from "@/components/inputs/adminInput";
import SingularSelect from "@/components/selects/SingularSelect";
import styles from "./styles.module.scss";
import type { CategoryVM, SubCategoryVM, SubCategoryServer } from "./types";
import { toClient } from "./types";

type Props = {
  categories: CategoryVM[];
  setSubCategories: React.Dispatch<React.SetStateAction<SubCategoryVM[]>>;
};

type CreateResponse = {
  message: string;
  subCategories: SubCategoryServer[];
};

const validationSchema = Yup.object({
  name: Yup.string()
    .required("Sub-category name is required.")
    .min(2, "Sub-category name must be between 2 and 30 characters.")
    .max(30, "Sub-category name must be between 2 and 30 characters."),
  parent: Yup.string().required("Please choose a parent category."),
});

export default function Create({ categories, setSubCategories }: Props) {
  const [name, setName] = React.useState("");
  const [parent, setParent] = React.useState("");

  const handleSubmit = async (): Promise<void> => {
    try {
      const { data } = await axios.post<CreateResponse>("/api/admin/sub-categories", {
        name,
        parent,
      });
      setSubCategories(data.subCategories.map(toClient));
      setName("");
      setParent("");
      toast.success(data.message);
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) && err.response?.data?.message) ||
        (err as Error).message ||
        "Failed to create sub-category.";
      toast.error(msg);
    }
  };

  return (
    <Formik
      enableReinitialize
      initialValues={{ name, parent }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {() => (
        <Form>
          <div className={styles.header}>Create a Sub-Category</div>

          <AdminInput
            type="text"
            label="Name"
            name="name"
            placeholder="Sub-category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <SingularSelect
            name="parent"
            value={parent}
            data={categories}
            placeholder="Select Category"
            handleChange={(value: string) => setParent(value)}
          />

          <div className={styles.btnWrap}>
            <button type="submit" className={styles.btn}>
              <span>Add Sub-Category</span>
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}