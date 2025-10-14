// app/components/admin/createProduct/clickToAdd/Questions.tsx
"use client";

import * as React from "react";
import { BsFillPatchMinusFill, BsFillPatchPlusFill } from "react-icons/bs";
import styles from "./styles.module.scss";

/* ---------- Types ---------- */

export type QA = { question: string; answer: string };

type Props<T extends { questions: QA[] }> = {
  questions: QA[];
  product: T;
  setProduct: React.Dispatch<React.SetStateAction<T>>;
};

/* ---------- Component (generic over T) ---------- */

export default function Questions<T extends { questions: QA[] }>({
  questions,
  setProduct,
}: Props<T>) {
  const addQuestion = () => {
    setProduct(prev => ({
      ...prev,
      questions: [...prev.questions, { question: "", answer: "" }],
    }));
  };

  const removeQuestion = (index: number) => {
    setProduct(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const key = e.target.name as keyof QA; // "question" | "answer"
    const value = e.target.value;

    setProduct(prev => {
      const updated = prev.questions.slice();
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, questions: updated };
    });
  };

  return (
    <div>
      <div className={styles.header}>Questions</div>

      {questions.length === 0 && (
        <BsFillPatchPlusFill className={styles.svg} onClick={addQuestion} />
      )}

      {questions.map((q, i) => (
        <div className={styles.clicktoadd} key={i}>
          <input
            type="text"
            name="question"
            placeholder="Question"
            value={q.question}
            onChange={(e) => handleChange(i, e)}
          />
          <input
            type="text"
            name="answer"
            placeholder="Answer"
            value={q.answer}
            onChange={(e) => handleChange(i, e)}
          />
          <BsFillPatchMinusFill onClick={() => removeQuestion(i)} />
          <BsFillPatchPlusFill onClick={addQuestion} />
        </div>
      ))}
    </div>
  );
}