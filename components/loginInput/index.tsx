import styles from "./styles.module.scss";
import { BiUser } from "react-icons/bi";
import { SiMinutemailer } from "react-icons/si";
import { IoKeyOutline } from "react-icons/io5";
import { ErrorMessage, useField, type FieldHookConfig } from "formik";
import React, { InputHTMLAttributes } from "react";

type LoginInputProps =
  // Standard <input> props (except name; we'll take it from Formik config)
  Omit<InputHTMLAttributes<HTMLInputElement>, "name"> &
  // What Formik expects (name is required; type/value optional)
  FieldHookConfig<string> & {
    icon: "user" | "email" | "password";
    placeholder?: string;
  };

export default function LoginInput({
  icon,
  placeholder,
  ...props
}: LoginInputProps): React.JSX.Element {
  // props includes the Formik config such as `name`, `type`, `value` (if controlled)
  const [field, meta] = useField<string>(props);

  return (
    <div
      className={`${styles.input} ${
        meta.touched && meta.error ? styles.error : ""
      }`}
    >
      {icon === "user" ? (
        <BiUser />
      ) : icon === "email" ? (
        <SiMinutemailer />
      ) : icon === "password" ? (
        <IoKeyOutline />
      ) : null}

      <input
        // priority order: Formik field props, then caller overrides in `props`
        {...field}
        {...props}
        placeholder={placeholder}
      />

      {meta.touched && meta.error && (
        <div className={styles.error__popup}>
          <span />
          <ErrorMessage name={field.name} />
        </div>
      )}
    </div>
  );
}