// components/profile/security/SecurityClient.tsx
"use client";

import React, { useState } from "react";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import axios, { AxiosError } from "axios";
import CircledIconBtn from "@/components/buttons/circledIconBtn";
import LoginInput from "@/components/inputs/loginInput";
import styles from "@/app/styles/profile.module.scss";

interface PasswordFormValues {
  current_password: string;
  password: string;
  conf_password: string;
}

const validationSchema = Yup.object({
  current_password: Yup.string()
    .required(
      "Enter a combination of at least six numbers, letters and punctuation marks (such as ! and &)."
    )
    .min(6, "Password must be at least 6 characters.")
    .max(36, "Password can't be more than 36 characters."),
  password: Yup.string()
    .required(
      "Enter a combination of at least six numbers, letters and punctuation marks (such as ! and &)."
    )
    .min(6, "Password must be at least 6 characters.")
    .max(36, "Password can't be more than 36 characters."),
  conf_password: Yup.string()
    .required("Confirm your password.")
    .oneOf([Yup.ref("password")], "Passwords must match."),
});

export default function SecurityClient(): React.JSX.Element {
  const [current_password, setCurrent_password] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [conf_password, setConf_password] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  const changePasswordHandler = async (): Promise<void> => {
    try {
      const { data } = await axios.put<{ message: string }>(
        "/api/user/changePassword",
        {
          current_password,
          password,
        }
      );
      setError("");
      setSuccess(data.message);
    } catch (err: unknown) {
      setSuccess("");
      const axiosErr = err as AxiosError<{ message?: string }>;
      const message =
        axiosErr.response?.data?.message ?? "Failed to change password.";
      setError(message);
    }
  };

  const initialValues: PasswordFormValues = {
    current_password,
    password,
    conf_password,
  };

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={changePasswordHandler}
    >
      {() => (
        <Form>
          <LoginInput
            type="password"
            name="current_password"
            icon="password"
            placeholder="Current Password"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCurrent_password(e.target.value)
            }
          />
          <LoginInput
            type="password"
            name="password"
            icon="password"
            placeholder="New Password"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
          />
          <LoginInput
            type="password"
            name="conf_password"
            icon="password"
            placeholder="Confirm Password"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConf_password(e.target.value)
            }
          />

          <CircledIconBtn type="submit" text="Change" />

          <br />
          {error && <span className={styles.error}>{error}</span>}
          {success && <span className={styles.success}>{success}</span>}
        </Form>
      )}
    </Formik>
  );
}