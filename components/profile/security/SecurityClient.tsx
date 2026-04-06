"use client";

import { useState } from "react";
import CircledIconBtn from "@/components/buttons/circledIconBtn";
import LoginInput from "@/components/inputs/loginInput";
import styles from "@/app/styles/profile.module.scss";

type PasswordFormValues = {
  current_password: string;
  password: string;
  conf_password: string;
};

const initialValues: PasswordFormValues = {
  current_password: "",
  password: "",
  conf_password: "",
};

function validate(values: PasswordFormValues): string {
  if (!values.current_password || values.current_password.length < 6) {
    return "Current password must be at least 6 characters.";
  }
  if (values.current_password.length > 36) {
    return "Current password can't be more than 36 characters.";
  }
  if (!values.password || values.password.length < 6) {
    return "New password must be at least 6 characters.";
  }
  if (values.password.length > 36) {
    return "New password can't be more than 36 characters.";
  }
  if (!values.conf_password) {
    return "Confirm your password.";
  }
  if (values.password !== values.conf_password) {
    return "Passwords must match.";
  }
  return "";
}

export default function SecurityClient(): React.JSX.Element {
  const [form, setForm] = useState<PasswordFormValues>(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess("");

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/user/changePassword", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: form.current_password,
          password: form.password,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { message?: string };

      if (!res.ok) {
        throw new Error(data.message || "Failed to change password.");
      }

      setSuccess(data.message || "Password changed successfully.");
      setForm(initialValues);
    } catch (err: unknown) {
      setSuccess("");
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <LoginInput
        type="password"
        name="current_password"
        icon="password"
        placeholder="Current Password"
        value={form.current_password}
        onChange={onChange}
      />
      <LoginInput
        type="password"
        name="password"
        icon="password"
        placeholder="New Password"
        value={form.password}
        onChange={onChange}
      />
      <LoginInput
        type="password"
        name="conf_password"
        icon="password"
        placeholder="Confirm Password"
        value={form.conf_password}
        onChange={onChange}
      />

      <CircledIconBtn type="submit" text={submitting ? "Changing..." : "Change"} />

      <br />
      {error && <span className={styles.error}>{error}</span>}
      {success && <span className={styles.success}>{success}</span>}
    </form>
  );
}