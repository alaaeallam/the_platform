"use client";

import styles from "../../../styles/forgot.module.scss";

import { BiLeftArrowAlt } from "react-icons/bi";
import CircledIconBtn from "@/components/buttons/circledIconBtn";
import LoginInput from "@/components/loginInput";
import DotLoaderSpinner from "@/components/loaders/dotLoader";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import Link from "next/link";

export default function ResetPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<"checking" | "ok" | "bad">("checking");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/auth/reset/${token}`);
        setStatus(r.ok ? "ok" : "bad");
      } catch {
        setStatus("bad");
      }
    })();
  }, [token]);

  const schema = Yup.object({
    password: Yup.string()
      .required("Please enter a new password.")
      .min(6, "Password must be at least 6 characters.")
      .max(36, "Password can't be more than 36 characters"),
    confirm: Yup.string()
      .required("Please confirm your password.")
      .oneOf([Yup.ref("password")], "Passwords must match"),
  });

  const submitHandler = async (password: string) => {
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/auth/reset/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (res.ok) {
      setMsg({ type: "success", text: "Password updated. You can sign in now." });
      setTimeout(() => router.push("/login"), 1200);
    } else {
      setMsg({ type: "error", text: data?.message || "Something went wrong." });
    }
  };

  return (
    <>
      {(loading || status === "checking") && <DotLoaderSpinner loading />}


      <div className={styles.forgot}>
        <div>
          <div className={styles.forgot__header}>
            <div className={styles.back__svg}>
              <BiLeftArrowAlt />
            </div>
            <span>
              {status === "bad" ? (
                <>
                  Reset link is invalid or expired.{" "}
                  <Link href="/auth/forgot">Request a new link</Link>
                </>
              ) : (
                <>
                  Set a new password •{" "}
                  <Link href="/login">Back to login</Link>
                </>
              )}
            </span>
          </div>

          {status === "ok" && (
            <Formik
              initialValues={{ password: "", confirm: "" }}
              validationSchema={schema}
              onSubmit={({ password }) => submitHandler(password)}
            >
              {({ values, handleChange, touched, errors }) => (
                <Form>
                  <LoginInput
                    type="password"
                    name="password"
                    icon="password"
                    placeholder="New password"
                    value={values.password}
                    onChange={handleChange}
                  />
                  {touched.password && errors.password && (
                    <span className={styles.error}>{errors.password}</span>
                  )}

                  <LoginInput
                    type="password"
                    name="confirm"
                    icon="password"
                    placeholder="Confirm password"
                    value={values.confirm}
                    onChange={handleChange}
                  />
                  {touched.confirm && errors.confirm && (
                    <span className={styles.error}>{errors.confirm}</span>
                  )}

                  <CircledIconBtn type="submit" text="Update password" />

                  {msg && (
                    <div style={{ marginTop: 10 }}>
                      {msg.type === "success" ? (
                        <span className={styles.success}>{msg.text}</span>
                      ) : (
                        <span className={styles.error}>{msg.text}</span>
                      )}
                    </div>
                  )}
                </Form>
              )}
            </Formik>
          )}

          {status === "bad" && (
            <div style={{ marginTop: 12 }}>
              <span className={styles.error}>
                The link is no longer valid. Please request a new one from the{" "}
                <Link href="/auth/forgot">Forgot Password</Link> page.
              </span>
            </div>
          )}
        </div>
      </div>


    </>
  );
}