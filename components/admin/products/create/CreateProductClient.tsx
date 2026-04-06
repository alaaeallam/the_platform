"use client";
///components/admin/products/create/CreateProductClient.tsx
import * as React from "react";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";

import styles from "@/app/styles/products.module.scss";

import { normalizeSizesForPayload } from "@/components/admin/createProduct/clickToAdd/Sizes";

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

type Option = { _id: string; name: string };

type UploadedImageLike = { url: string; [k: string]: unknown };

type CountryPriceRowUI = { country: string; price: string };
type CountryGroupPriceRowUI = { groupCode: string; price: string };

type SizeRow = {
  size?: string;
  qty: string;
  basePrice: string;
  discount?: string;
  countryPrices: CountryPriceRowUI[];
  countryGroupPrices: CountryGroupPriceRowUI[];
};

type DetailRow = { name: string; value: string };
type QA = { question: string; answer: string };
type ColorState = { color: string; image: string };
type MarketingTagValue =
  | "FLASH_SALE"
  | "NEW_ARRIVAL"
  | "BLACK_FRIDAY"
  | "BEST_SELLER"
  | "LIMITED";

type MarketingTagDraft = {
  tag: MarketingTagValue | "";
  isActive: boolean;
  startAt: string;
  endAt: string;
  badgeText: string;
  priority: string;
};

export type ProductDraft = {
  name: string;
  description: string;
  brand: string;
  sku: string;
  discount: number;
  images: UploadedImageLike[];
  description_images: UploadedImageLike[] | string;
  parent: string;
  category: string;
  subCategories: string[];
  color: ColorState;
  sizes: SizeRow[];
  details: DetailRow[];
  questions: QA[];
  tags: string[];
  marketingTags: MarketingTagDraft[];
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
  sizes: [
    {
      size: "",
      qty: "",
      basePrice: "",
      discount: "",
      countryPrices: [],
      countryGroupPrices: [],
    },
  ],
  details: [{ name: "", value: "" }],
  questions: [{ question: "", answer: "" }],
  tags: [],
  marketingTags: [],
  shippingFee: "",
};

/* ---------- Props ---------- */

type Props = {
  parents: ParentVM[];
  categories: CategoryVM[];
  mode?: "create" | "edit";
  productId?: string;
  initialProduct?: ProductDraft;
};

const SingularSelect = dynamic(() => import("@/components/selects/SingularSelect"));
const MultipleSelect = dynamic(() => import("@/components/selects/MultipleSelect"));
const AdminInput = dynamic(() => import("@/components/inputs/adminInput"));
const DialogModal = dynamic(() => import("@/components/dialogModal"), { ssr: false });
const Images = dynamic(() => import("@/components/admin/createProduct/images"));
const Colors = dynamic(() => import("@/components/admin/createProduct/colors"));
const Style = dynamic(() => import("@/components/admin/createProduct/style"));
const Sizes = dynamic(() => import("@/components/admin/createProduct/clickToAdd/Sizes"));
const Details = dynamic(() => import("@/components/admin/createProduct/clickToAdd/Details"));
const Questions = dynamic(() => import("@/components/admin/createProduct/clickToAdd/Questions"));

const isRemoteUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const CreateProductClient: React.FC<Props> = ({
  parents,
  categories,
  mode = "create",
  productId,
  initialProduct,
}) => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [product, setProduct] = useState<ProductDraft>(initialProduct ?? initialState);
  const [tagsInput, setTagsInput] = useState<string>(
    (initialProduct?.tags ?? []).join(", ")
  );

  const [images, setImages] = useState<string[]>([]);
  const [subs, setSubs] = useState<Option[]>([]);
  const [colorImage, setColorImage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  /* ---------- Effects ---------- */

  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
      setImages(
        Array.isArray(initialProduct.images)
          ? initialProduct.images
              .map((img) => (typeof img === "string" ? img : img?.url ?? ""))
              .filter(Boolean)
          : []
      );
      setColorImage(initialProduct.color?.image ?? "");
      setTagsInput((initialProduct.tags ?? []).join(", "));
    }
  }, [initialProduct]);

  useEffect(() => {
    async function getParentData() {
      const id = product.parent?.trim();
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) return;

      try {
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

  const handleTagsChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (e) => {
    const value = e.target.value;
    setTagsInput(value);

    const normalizedTags = [
      ...new Set(
        value
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean)
      ),
    ];

    setProduct((prev) => ({ ...prev, tags: normalizedTags }));
  };
    const addMarketingTag = () => {
    setProduct((prev) => ({
      ...prev,
      marketingTags: [
        ...(prev.marketingTags ?? []),
        {
          tag: "",
          isActive: true,
          startAt: "",
          endAt: "",
          badgeText: "",
          priority: "",
        },
      ],
    }));
  };

  const removeMarketingTag = (index: number) => {
    setProduct((prev) => ({
      ...prev,
      marketingTags: prev.marketingTags.filter((_, i) => i !== index),
    }));
  };

  const updateMarketingTag = (
    index: number,
    field: keyof MarketingTagDraft,
    value: string | boolean
  ) => {
    setProduct((prev) => ({
      ...prev,
      marketingTags: prev.marketingTags.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      ),
    }));
  };

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
    const toValidate: ProductForValidation = {
      color: product.color,
      sizes: product.sizes.map((s) => ({
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
    
    const existingImageUrls = images.filter(isRemoteUrl);
    const newImageInputs = images.filter((img) => !isRemoteUrl(img));

    let imageUrls: string[] = [...existingImageUrls];
    if (newImageInputs.length) {
      const blobs = newImageInputs.map((img) => dataURItoBlob(img));
      const formData = new FormData();
      formData.append("path", "product images");
      blobs.forEach((file) => formData.append("file", file));

      const res = (await uploadImages(formData)) as Array<string | { url?: string }>;
      const uploadedUrls = res
        .map((r) => (typeof r === "string" ? r : r?.url ?? ""))
        .filter((u): u is string => !!u);

      imageUrls = [...existingImageUrls, ...uploadedUrls];
    }

    let styleImg = product.color.image || "";
    if (product.color.image && !isRemoteUrl(product.color.image)) {
      const styleBlob = dataURItoBlob(product.color.image);
      const fd = new FormData();
      fd.append("path", "product style images");
      fd.append("file", styleBlob);

      const res = (await uploadImages(fd)) as Array<string | { url?: string }>;
      const first = res?.[0];
      styleImg = typeof first === "string" ? first : first?.url ?? "";
    }

    try {
      const normalizedSizes = normalizeSizesForPayload(product.sizes);
      const appendMode = !!product.parent?.trim();

      const subFields = {
        sku: product.sku,
        color: { image: styleImg, color: product.color.color },
        images: imageUrls,
        sizes: normalizedSizes,
        discount: Number(product.discount || 0),
      };

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
            tags: product.tags,
             marketingTags: (product.marketingTags ?? [])
            .filter((row) => row.tag)
            .map((row) => ({
              tag: row.tag,
              isActive: row.isActive,
              startAt: row.startAt ? row.startAt : undefined,
              endAt: row.endAt ? row.endAt : undefined,
              badgeText: row.badgeText.trim() || undefined,
              priority: row.priority ? Number(row.priority) : 0,
            })),
            shipping: Number(product.shippingFee || 0),
            ...subFields,
          };

      const endpoint =
        mode === "edit" && productId
          ? `/api/admin/products/${productId}`
          : "/api/admin/products";

      const response =
        mode === "edit" && productId
          ? await axios.patch<{ message?: string; productId?: string }>(endpoint, payload)
          : await axios.post<{ message?: string; productId?: string }>(endpoint, payload);

      const data = response.data;
      toast.success(
        data?.message ??
          (mode === "edit"
            ? "Product updated successfully."
            : appendMode
            ? "Sub-product added."
            : "Product created.")
      );

      if (mode === "edit") {
        router.push("/admin/dashboard/products/all");
        router.refresh();
        return;
      }
    } catch (err: unknown) {
      let msg = mode === "edit" ? "Failed to update product." : "Failed to create product.";
      if (axios.isAxiosError(err)) {
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
        tags: tagsInput,
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
            setImages={setImages}
            setColorImage={setColorImage}
          />

          <div className={styles.flex}>
            {product.color.image && (
              <Image
                src={product.color.image}
                alt="Selected style"
                width={80}
                height={80}
                sizes="80px"
                className={styles.image_span}
              />
            )}
            {product.color.color && (
              <span
                className={styles.color_span}
                style={{ background: product.color.color }}
              />
            )}
          </div>

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
            label="Tags"
            name="tags"
            placeholder="black, oversized, cotton, streetwear"
            value={tagsInput}
            onChange={handleTagsChange}
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
                    <div className={styles.header}>Marketing Tags</div>

          <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
            {(product.marketingTags ?? []).map((row, index) => (
              <div
                key={`marketing-tag-${index}`}
                style={{
                  display: "grid",
                  gap: 12,
                  padding: 16,
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 12,
                  }}
                >
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                      Tag
                    </label>
                    <select
                      value={row.tag}
                      onChange={(e) =>
                        updateMarketingTag(index, "tag", e.target.value)
                      }
                      style={{
                        width: "100%",
                        height: 44,
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        padding: "0 12px",
                      }}
                    >
                      <option value="">Select tag</option>
                      <option value="FLASH_SALE">FLASH_SALE</option>
                      <option value="NEW_ARRIVAL">NEW_ARRIVAL</option>
                      <option value="BLACK_FRIDAY">BLACK_FRIDAY</option>
                      <option value="BEST_SELLER">BEST_SELLER</option>
                      <option value="LIMITED">LIMITED</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                      Active
                    </label>
                    <select
                      value={row.isActive ? "true" : "false"}
                      onChange={(e) =>
                        updateMarketingTag(index, "isActive", e.target.value === "true")
                      }
                      style={{
                        width: "100%",
                        height: 44,
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        padding: "0 12px",
                      }}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>

                  <AdminInput
                    type="datetime-local"
                    label="Start At"
                    name={`marketing-start-${index}`}
                    value={row.startAt}
                    onChange={(e) =>
                      updateMarketingTag(index, "startAt", e.target.value)
                    }
                  />

                  <AdminInput
                    type="datetime-local"
                    label="End At"
                    name={`marketing-end-${index}`}
                    value={row.endAt}
                    onChange={(e) =>
                      updateMarketingTag(index, "endAt", e.target.value)
                    }
                  />

                  <AdminInput
                    type="text"
                    label="Badge Text"
                    name={`marketing-badge-${index}`}
                    placeholder="Flash Sale"
                    value={row.badgeText}
                    onChange={(e) =>
                      updateMarketingTag(index, "badgeText", e.target.value)
                    }
                  />

                  <AdminInput
                    type="number"
                    label="Priority"
                    name={`marketing-priority-${index}`}
                    placeholder="10"
                    value={row.priority}
                    onChange={(e) =>
                      updateMarketingTag(index, "priority", e.target.value)
                    }
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => removeMarketingTag(index)}
                    style={{
                      height: 40,
                      padding: "0 14px",
                      borderRadius: 10,
                      border: "1px solid #ef4444",
                      background: "#fff",
                      color: "#ef4444",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Remove Tag
                  </button>
                </div>
              </div>
            ))}

            <div>
              <button
                type="button"
                onClick={addMarketingTag}
                style={{
                  height: 42,
                  padding: "0 16px",
                  borderRadius: 10,
                  border: "1px solid #111827",
                  background: "#111827",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Add Marketing Tag
              </button>
            </div>
          </div>
          <button
            className={`${styles.btn} ${styles.btn__primary} ${styles.submit_btn}`}
            type="submit"
            disabled={loading}
          >
            {loading
              ? mode === "edit"
                ? "Updating..."
                : "Creating..."
              : mode === "edit"
              ? "Update Product"
              : "Create Product"}
          </button>

          <DialogModal />
        </Form>
      )}
    </Formik>
  );
};

export default CreateProductClient;