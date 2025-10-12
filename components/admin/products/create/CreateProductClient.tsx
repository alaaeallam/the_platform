"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";

import styles from "@/app/styles/products.module.scss";

import SingularSelect from "@/components/selects/SingularSelect";
import MultipleSelect from "@/components/selects/MultipleSelect";
import AdminInput from "@/components/inputs/adminInput";
import DialogModal from "@/components/dialogModal";
import Images from "@/components/admin/createProduct/images";
import Colors from "@/components/admin/createProduct/colors";
import Style from "@/components/admin/createProduct/style";
import Sizes from "@/components/admin/createProduct/clickToAdd/Sizes";
import { normalizeSizesForPayload } from "@/components/admin/createProduct/clickToAdd/Sizes";
import Details from "@/components/admin/createProduct/clickToAdd/Details";
import Questions from "@/components/admin/createProduct/clickToAdd/Questions";

import { showDialog } from "@/store/DialogSlice";
import {
  validateCreateProduct,
  type ProductForValidation,
} from "@/utils/validation";
import dataURItoBlob from "@/utils/dataURItoBlob";
import { uploadImages } from "@/requests/upload";

import type {
  ParentVM,
  CategoryVM,
} from "@/app/(admin)/admin/dashboard/products/create/page";

/* ---------- Local types ---------- */

type Option = { _id: string; name: string }; // what the selects want

type UploadedImageLike = { url: string; [k: string]: unknown };

type CountryPriceRowUI = { country: string; price: string };
type CountryGroupPriceRowUI = { groupCode: string; price: string };

type SizeRow = {
  /** leave empty string when product has no size */
  size?: string;
  /** keep as string because <input type="number" /> yields string values */
  qty: string;

  /** renamed from price -> basePrice to match schema */
  basePrice: string;

  /** per-size discount (optional, overrides subProduct discount) */
  discount?: string;

  /** regional pricing arrays */
  countryPrices: CountryPriceRowUI[];
  countryGroupPrices: CountryGroupPriceRowUI[];
};
type DetailRow = { name: string; value: string };
type QA = { question: string; answer: string };

type ColorState = { color: string; image: string };

export type ProductDraft = {
  name: string;
  description: string;
  brand: string;
  sku: string;
  discount: number;
  images: UploadedImageLike[]; // normalized urls sent to API
  description_images: UploadedImageLike[] | string;
  parent: string;
  category: string;
  subCategories: string[];
  color: ColorState;
  sizes: SizeRow[];
  details: DetailRow[];
  questions: QA[];
  shippingFee: string | number | "";
};

/* ---------- Initial State ---------- */

const initialState: ProductDraft = {
  name: "",
  description: "",
  brand: "",
  sku: "",
  discount: 0,
  images: [],
  description_images: [],
  parent: "",
  category: "",
  subCategories: [],
  color: { color: "", image: "" },
  sizes: [{
    size: "",
    qty: "",
    basePrice: "",
    discount: "",
    countryPrices: [],
    countryGroupPrices: [],
  }],
  details: [{ name: "", value: "" }],
  questions: [{ question: "", answer: "" }],
  shippingFee: "",
};

/* ---------- Props ---------- */

type Props = {
  parents: ParentVM[];
  categories: CategoryVM[];
};

const CreateProductClient: React.FC<Props> = ({ parents, categories }) => {
  const [product, setProduct] = useState<ProductDraft>(initialState);

  // dataURLs picked in the UI (must be non-undefined for the Images prop types)
  const [images, setImages] = useState<string[]>([]);
  const [descriptionImages, setDescriptionImages] = useState<string[]>([]);

  // options for sub-categories (normalize to {_id, name})
  const [subs, setSubs] = useState<Option[]>([]);

  const [colorImage, setColorImage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const dispatch = useDispatch();

  /* ---------- Effects ---------- */

useEffect(() => {
  async function getParentData() {
    const id = product.parent?.trim();
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) return; // only fetch if valid ObjectId

    try {
      // app/api/products/route.ts is non-dynamic → pass ?id=
      const { data } = await axios.get("/api/products", { params: { id } });
      if (data) {
        setProduct((prev) => ({
          ...prev,
          name: data.name ?? "",
          description: data.description ?? "",
          brand: data.brand ?? "",
          category: data.category ?? "",
          subCategories: Array.isArray(data.subCategories) ? data.subCategories : [],
          questions: [],
          details: [],
        }));
      }
    } catch (e) {
      console.error("Failed to load parent product", e);
    }
  }
  getParentData();
}, [product.parent]);

  useEffect(() => {
    async function getSubs() {
      if (!product.category) {
        setSubs([]);
        return;
      }
      const { data } = await axios.get<Array<{ _id: string; name?: string }>>(
        "/api/admin/sub-categories",
        { params: { category: product.category } }
      );
      // normalize name to string
      setSubs((data ?? []).map((d) => ({ _id: d._id, name: d.name ?? "" })));
    }
    getSubs();
  }, [product.category]);

  /* ---------- Handlers ---------- */

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (e) => {
    const { value, name } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  // for SingularSelect which expects (value: string) => void
  const setField = (name: keyof ProductDraft) => (value: string) =>
    setProduct((prev) => ({ ...prev, [name]: value }));

  const validationSchema = Yup.object({
    name: Yup.string()
      .required("Please add a name")
      .min(10, "Product name must bewteen 10 and 300 characters.")
      .max(300, "Product name must bewteen 10 and 300 characters."),
    brand: Yup.string().required("Please add a brand"),
    category: Yup.string().required("Please select a category."),
    sku: Yup.string().required("Please add a sku/number"),
    color: Yup.string().optional(),
    description: Yup.string().required("Please add a description"),
  });

  const createProduct = async () => {
    // exact validator shape
    const toValidate: ProductForValidation = {
      color: product.color,
      sizes: product.sizes.map((s) => ({
        // validator expects price, not basePrice
        size: s.size ?? "",
        qty: s.qty,
        price: s.basePrice,
      })),
      details: product.details,
      questions: product.questions,
    };

    const verdict = validateCreateProduct(toValidate, images);
    if (verdict === "valid") {
      await createProductHandler();
    } else {
      dispatch(showDialog({ header: "Please follow our instructions.", msgs: verdict }));
    }
  };

const createProductHandler = async () => {
  setLoading(true);

  // 1) Upload carousel images and return URLs only
  let imageUrls: string[] = [];
  if (images.length) {
    const blobs = images.map((img) => dataURItoBlob(img));
    const formData = new FormData();
    formData.append("path", "product images");
    blobs.forEach((file) => formData.append("file", file));

    const res = (await uploadImages(formData)) as Array<string | { url?: string }>;
    imageUrls = res
      .map((r) => (typeof r === "string" ? r : r?.url ?? ""))
      .filter((u): u is string => !!u);
  }

  // 2) Upload style image (optional) → URL
  let styleImg = "";
  if (product.color.image) {
    const styleBlob = dataURItoBlob(product.color.image);
    const fd = new FormData();
    fd.append("path", "product style images");
    fd.append("file", styleBlob);

    const res = (await uploadImages(fd)) as Array<string | { url?: string }>;
    const first = res?.[0];
    styleImg = typeof first === "string" ? first : first?.url ?? "";
  }

  try {
    // 3) Normalize sizes to numbers / uppercase codes
    const normalizedSizes = normalizeSizesForPayload(product.sizes);

    // 4) Build payload that matches the Zod union:
    const appendMode = !!product.parent?.trim();

    // Sub-product fields (common)
    const subFields = {
      sku: product.sku,
      color: { image: styleImg, color: product.color.color },
      images: imageUrls,            // <-- string[]
      sizes: normalizedSizes,
      discount: Number(product.discount || 0),
      // description_images: []      // (optional, not required by your Zod schema)
    };

    // New product OR append to parent
    const payload = appendMode
      ? {
          parent: product.parent.trim(),
          ...subFields,
        }
      : {
          name: product.name,
          description: product.description,
          brand: product.brand,
          details: (product.details || []).filter((d) => d.name || d.value),
          questions: (product.questions || []).filter((q) => q.question || q.answer),
          category: product.category,
          subCategories: product.subCategories,
          shipping: Number(product.shippingFee || 0),
          ...subFields,
        };

    // 5) POST
    const { data } = await axios.post<{ message?: string; productId?: string }>(
      "/api/admin/products",
      payload
    );

    toast.success(data?.message ?? (appendMode ? "Sub-product added." : "Product created."));
  } catch (err: unknown) {
    let msg = "Failed to create product.";
    if (axios.isAxiosError(err)) {
      // If Zod threw, server sends { message: "Invalid input", issues: [...] }
      const data = err.response?.data as unknown;
      const serverMsg =
        data && typeof data === "object" && "message" in data
          ? String((data as { message?: unknown }).message ?? "")
          : "";
      if (serverMsg) msg = serverMsg;
    } else if (err instanceof Error) {
      msg = err.message || msg;
    }
    toast.error(msg);
  } finally {
    setLoading(false);
  }
};

  /* ---------- Render ---------- */

  // normalize parents/categories to Option[]
  const parentOptions: Option[] = parents.map((p) => ({
    _id: p._id,
    name: p.name ?? "",
  }));
  const categoryOptions: Option[] = categories.map((c) => ({
    _id: c._id,
    name: c.name ?? "",
  }));

  return (
    <Formik
      enableReinitialize
      initialValues={{
        name: product.name,
        brand: product.brand,
        description: product.description,
        category: product.category,
        subCategories: product.subCategories,
        parent: product.parent,
        sku: product.sku,
        discount: product.discount,
        color: product.color.color,
        imageInputFile: "",
        styleInput: "",
      }}
      validationSchema={validationSchema}
      onSubmit={createProduct}
    >
      {() => (
        <Form>
          <Images
            name="imageInputFile"
            header="Product Carousel Images"
            text="Add images"
            images={images}
            setImages={setImages} // setter type now matches because images is string[]
            setColorImage={setColorImage}
          />

          <div className={styles.flex}>
            {product.color.image && (
              <img
                src={product.color.image}
                className={styles.image_span}
                alt="Selected style"
              />
            )}
            {product.color.color && (
              <span
                className={styles.color_span}
                style={{ background: product.color.color }}
              />
            )}
          </div>

          {/* If your child components still have stricter ProductShape types,
              pass the setter as any (or update those components to be generic). */}
    <Colors
      name="color"
      product={product}
      setProduct={setProduct as React.Dispatch<React.SetStateAction<unknown>>}
      colorImage={colorImage}
    />
    <Style
      name="styleInput"
      product={product}
      setProduct={setProduct as React.Dispatch<React.SetStateAction<unknown>>}
      colorImage={colorImage}
    />

          <SingularSelect
            name="parent"
            value={product.parent}
            placeholder="Parent product"
            data={parentOptions}
            header="Add to an existing product"
            handleChange={setField("parent")}
          />

          <SingularSelect
            name="category"
            value={product.category}
            placeholder="Category"
            data={categoryOptions}
            header="Select a Category"
            handleChange={setField("category")}
            disabled={!!product.parent}
          />

          {product.category && (
            <MultipleSelect
              value={product.subCategories}
              data={subs}
              header="Select SubCategories"
              name="subCategories"
              disabled={!!product.parent}
              // MUI-style signature: (event) => void
              handleChange={(event: { target: { value: unknown } }) => {
                const value = event.target.value as string[];
                setProduct((prev) => ({ ...prev, subCategories: value }));
              }}
            />
          )}

          <div className={styles.header}>Basic Infos</div>

          <AdminInput
            type="text"
            label="Name"
            name="name"
            placeholder="Product name"
            onChange={handleChange}
          />
          <AdminInput
            type="text"
            label="Description"
            name="description"
            placeholder="Product description"
            onChange={handleChange}
          />
          <AdminInput
            type="text"
            label="Brand"
            name="brand"
            placeholder="Product brand"
            onChange={handleChange}
          />
          <AdminInput
            type="text"
            label="Sku"
            name="sku"
            placeholder="Product sku/ number"
            onChange={handleChange}
          />
          <AdminInput
            type="text"
            label="Discount"
            name="discount"
            placeholder="Product discount"
            onChange={handleChange}
          />

    <Sizes
      sizes={product.sizes}
      product={product}
      setProduct={setProduct as React.Dispatch<React.SetStateAction<unknown>>}
    />
    <Details
      details={product.details}
      product={product}
      setProduct={setProduct as React.Dispatch<React.SetStateAction<unknown>>}
    />
    <Questions
      questions={product.questions}
      product={product}
      setProduct={setProduct as React.Dispatch<React.SetStateAction<unknown>>}
    />

          {/* Description images (optional)
          <Images
            name="imageDescInputFile"
            header="Product Description Images"
            text="Add images"
            images={descriptionImages}
            setImages={setDescriptionImages}
            setColorImage={setColorImage}
          />
          */}

          <button
            className={`${styles.btn} ${styles.btn__primary} ${styles.submit_btn}`}
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Product"}
          </button>

          <DialogModal />
        </Form>
      )}
    </Formik>
  );
};

export default CreateProductClient;