// app/components/admin/createProduct/clickToAdd/Questions.tsx
"use client";

import * as React from "react";
import { BsFillPatchMinusFill, BsFillPatchPlusFill } from "react-icons/bs";
import styles from "./styles.module.scss";

export type QA = { question: string; answer: string };

type Props<T extends { questions: QA[] }> = {
  questions: QA[];
  product: T;
  setProduct: React.Dispatch<React.SetStateAction<T>>;
};

export default function Questions<T extends { questions: QA[] }>({
  questions,
  setProduct,
}: Props<T>) {
  const addQuestion = (): void => {
    setProduct((prev) => ({
      ...prev,
      questions: [...prev.questions, { question: "", answer: "" }],
    }));
  };

  const removeQuestion = (index: number): void => {
    if (questions.length <= 1) {
      setProduct((prev) => ({ ...prev, questions: [] }));
      return;
    }

    setProduct((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const key = e.target.name as keyof QA;
    const value = e.target.value;

    setProduct((prev) => {
      const updated = prev.questions.slice();
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, questions: updated };
    });
  };

  return (
    <div style={{ width: "100%", marginBottom: "1.5rem" }}>
      <div
        className={styles.header}
        style={{ marginBottom: "0.75rem", fontSize: "1rem", fontWeight: 700 }}
      >
        Questions
      </div>

      {questions.length === 0 && (
        <button
          type="button"
          onClick={addQuestion}
          style={{
            width: "42px",
            height: "42px",
            border: "1px solid #bfdbfe",
            borderRadius: "10px",
            background: "#eff6ff",
            color: "#2563eb",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
          aria-label="Add question row"
        >
          <BsFillPatchPlusFill />
        </button>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        {questions.map((q, i) => (
          <div
            className={styles.clicktoadd}
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr)) auto auto",
              gap: "0.75rem",
              alignItems: "center",
              padding: "1rem",
              border: "1px solid #e5e7eb",
              borderRadius: "14px",
              background: "#fff",
            }}
          >
            <input
              type="text"
              name="question"
              placeholder="Question"
              value={q.question}
              onChange={(e) => handleChange(i, e)}
              style={{
                width: "100%",
                minHeight: "48px",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                padding: "0 14px",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
            <input
              type="text"
              name="answer"
              placeholder="Answer"
              value={q.answer}
              onChange={(e) => handleChange(i, e)}
              style={{
                width: "100%",
                minHeight: "48px",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                padding: "0 14px",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />

            <button
              type="button"
              onClick={() => removeQuestion(i)}
              aria-label="Remove question row"
              style={{
                width: "42px",
                height: "42px",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                background: "#fff1f2",
                color: "#dc2626",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <BsFillPatchMinusFill />
            </button>

            <button
              type="button"
              onClick={addQuestion}
              aria-label="Add question row"
              style={{
                width: "42px",
                height: "42px",
                border: "1px solid #bfdbfe",
                borderRadius: "10px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <BsFillPatchPlusFill />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}