"use client";

import styles from "./styles.module.scss";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TbEdit } from "react-icons/tb";
import { AiOutlineEye } from "react-icons/ai";
import { RiDeleteBin2Line } from "react-icons/ri";
import { toast } from "react-toastify";

export type ImageLike =
  | string
  | { url?: string | null; [k: string]: unknown };

export type SubProduct = {
  images?: ImageLike[] | null;
  [k: string]: unknown;
};

export type ProductCardProduct = {
  _id: string;
  name: string;
  slug: string;
  category?: { name?: string | null } | string | null;
  subProducts: SubProduct[];
};

type Props = {
  product: ProductCardProduct;
};

function firstImageUrl(p: SubProduct): string | null {
  if (!p?.images || !Array.isArray(p.images) || p.images.length === 0) {
    return null;
  }

  const first = p.images[0];
  if (typeof first === "string") return first || null;
  if (first && typeof first === "object" && typeof first.url === "string") {
    return first.url || null;
  }

  return null;
}

export default function ProductCard({ product }: Props) {
  const router = useRouter();

  const catName =
    typeof product.category === "string"
      ? product.category
      : product.category?.name ?? "";

  const styleCount = product.subProducts.length;

  function handleDelete() {
    toast.info(
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 600 }}>Delete product?</div>
        <div style={{ fontSize: 14 }}>
          Delete &quot;{product.name}&quot;? This cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => toast.dismiss()}
            style={{
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              toast.dismiss();
              void confirmDelete();
            }}
            style={{
              background: "#dc2626",
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  }

  async function confirmDelete() {
    try {
      const res = await fetch(`/api/admin/products/${product._id}`, {
        method: "DELETE",
      });

      const data = (await res.json().catch(() => ({}))) as { message?: string };

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete product.");
      }

      toast.success(data.message || "Product deleted successfully.");
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete product.";
      toast.error(msg);
    }
  }

  return (
    <section className={styles.product}>
      <div className={styles.product__top}>
        <div className={styles.product__meta}>
          {catName ? (
            <span className={styles.product__categoryBadge}>{catName}</span>
          ) : null}
          <h2 className={styles.product__name}>{product.name}</h2>
        </div>

        <div className={styles.product__summary}>
          <span className={styles.product__count}>
            {styleCount} {styleCount === 1 ? "style" : "styles"}
          </span>
        </div>
      </div>

      {styleCount === 0 ? (
        <div className={styles.product__empty}>
          No product styles/images added yet.
        </div>
      ) : (
        <div className={styles.product__grid}>
          {product.subProducts.map((sp, i) => {
            const img = firstImageUrl(sp);

            return (
              <article className={styles.product__item} key={`${product._id}-${i}`}>
                <div className={styles.product__itemMedia}>
                  {img ? (
                    <Image
                      src={img}
                      alt={`${product.name} style ${i + 1}`}
                      width={480}
                      height={480}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className={styles.product__image}
                      unoptimized
                      priority={false}
                    />
                  ) : (
                    <div className={styles.product__placeholder}>No image</div>
                  )}

                  <div className={styles.product__styleTag}>Style {i + 1}</div>
                </div>

                <div className={styles.product__itemFooter}>
                  <div className={styles.product__itemInfo}>
                    <div className={styles.product__itemTitle}>{product.name}</div>
                    <div className={styles.product__itemSubtitle}>
                      Preview, edit, or remove this style
                    </div>
                  </div>

                  <div className={styles.product__actions}>
                    <Link
                      href={`/admin/dashboard/products/edit/${product._id}`}
                      title="Edit"
                      className={styles.product__actionBtn}
                    >
                      <TbEdit />
                    </Link>

                    <Link
                      href={`/products/${product.slug}?style=${i}`}
                      title="View"
                      className={styles.product__actionBtn}
                    >
                      <AiOutlineEye />
                    </Link>

                    <button
                      type="button"
                      onClick={handleDelete}
                      title="Delete"
                      className={`${styles.product__actionBtn} ${styles.product__actionBtnDanger}`}
                    >
                      <RiDeleteBin2Line />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}