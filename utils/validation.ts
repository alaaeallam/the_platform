// app/utils/validation.ts

/* =========================
   Types
   ========================= */

export interface ProductColor {
  color: string;
  image: string;
}

export interface ProductSize {
  size?: string;
  qty: string;
  price: string;
}

export interface ProductDetail {
  name: string;
  value: string;
}

export interface ProductQuestion {
  question: string;
  answer: string;
}

export interface ProductForValidation {
  color: ProductColor;
  sizes: ProductSize[];
  details: ProductDetail[];
  questions: ProductQuestion[];
  [key: string]: any; // allow dynamic fields like name, brand, etc.
}

export interface ValidationMessage {
  msg: string;
  type: "success" | "error";
}

/* =========================
   Helpers
   ========================= */

/**
 * Validate whether an email string is in a proper format.
 */
export const validateEmail = (email: string): boolean => {
  const regex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regex.test(email.trim());
};

/**
 * Validates the create product form before submitting.
 * Returns `"valid"` if all checks pass, or an array of validation messages otherwise.
 */
export const validateCreateProduct = (
  product: ProductForValidation,
  images: Array<{ url?: string }> | string[]
): "valid" | ValidationMessage[] => {
  const { sizes, details, questions, color } = product;
  const checks: ValidationMessage[] = [
    {
      msg: "Name, Description, and Brand added successfully.",
      type: "success",
    },
  ];

  /* ---------- Image validation ---------- */
  if (images.length < 3) {
    checks.push({
      msg: `Choose at least 3 images (${3 - images.length} remaining).`,
      type: "error",
    });
  } else {
    checks.push({
      msg: `${images.length} images chosen.`,
      type: "success",
    });
  }

  /* ---------- Color validation ---------- */
  if (!color?.color) {
    checks.push({ msg: "Choose a main product color.", type: "error" });
  } else {
    checks.push({ msg: "Product color has been chosen.", type: "success" });
  }

  if (!color?.image) {
    checks.push({ msg: "Choose a product style image.", type: "error" });
  } else {
    checks.push({
      msg: "Product style image has been chosen.",
      type: "success",
    });
  }

  /* ---------- Sizes validation ---------- */
  if (Array.isArray(sizes) && sizes.length > 0) {
    const invalidSize = sizes.find(
      (s) => !s.qty || !s.price || (!s.size && s.size !== "")
    );
    if (invalidSize) {
      checks.push({
        msg: "Please fill all information in sizes.",
        type: "error",
      });
    } else {
      checks.push({
        msg: "At least one size/qty/price added.",
        type: "success",
      });
    }
  }

  /* ---------- Details validation ---------- */
  if (Array.isArray(details) && details.length > 0) {
    const invalidDetail = details.find((d) => !d.name || !d.value);
    if (invalidDetail) {
      checks.push({
        msg: "Please fill all information in details.",
        type: "error",
      });
    } else {
      checks.push({ msg: "At least one detail added.", type: "success" });
    }
  }

  /* ---------- Questions validation ---------- */
  if (Array.isArray(questions) && questions.length > 0) {
    const invalidQuestion = questions.find(
      (q) => !q.question || !q.answer
    );
    if (invalidQuestion) {
      checks.push({
        msg: "Please fill all information in questions.",
        type: "error",
      });
    } else {
      checks.push({
        msg: "At least one question added.",
        type: "success",
      });
    }
  }

  /* ---------- Final check ---------- */
  const hasError = checks.some((c) => c.type === "error");
  return hasError ? checks : "valid";
};