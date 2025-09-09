// app/login/page.tsx
"use client";

import styles from "../styles/signin.module.scss";
import Link from "next/link";
import { BiLeftArrowAlt } from "react-icons/bi";
import { Formik, Form } from "formik";
import { FcGoogle } from "react-icons/fc";
import * as Yup from "yup";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import axios from "axios";

import LoginInput from "@/components/loginInput";
import CircledIconBtn from "@/components/buttons/circledIconBtn";
import DotLoaderSpinner from "@/components/loaders/dotLoader";

type Values = {
  login_email: string;
  login_password: string;
  name: string;
  email: string;
  password: string;
  conf_password: string;
  success: string;
  error: string;
  login_error: string;
};

const initialValues: Values = {
  login_email: "",
  login_password: "",
  name: "",
  email: "",
  password: "",
  conf_password: "",
  success: "",
  error: "",
  login_error: "",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const oauthError = searchParams.get("error"); // e.g. OAuthAccountNotLinked, AccessDenied, etc.

  const [googleLoading, setGoogleLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<Values>(initialValues);

  const {
    login_email,
    login_password,
    name,
    email,
    password,
    conf_password,
    success,
    error,
    login_error,
  } = user;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const loginValidation = Yup.object({
    login_email: Yup.string()
      .required("Email address is required.")
      .email("Please enter a valid email address."),
    login_password: Yup.string().required("Please enter a password"),
  });

  const registerValidation = Yup.object({
    name: Yup.string()
      .required("What's your name ?")
      .min(2, "Name must be between 2 and 40 characters.")
      .max(40, "Name must be between 2 and 40 characters.")
      // Allow all letters (incl. Arabic) plus spaces and common punctuation.
      .matches(/^[\p{L}][\p{L}\s'.-]*$/u, "Please enter a valid name."),
    email: Yup.string().required("Email is required").email("Enter a valid email address."),
    password: Yup.string()
      .required("Enter a combination of at least six numbers, letters and punctuation marks.")
      .min(6, "Password must be at least 6 characters.")
      .max(36, "Password can't be more than 36 characters"),
    conf_password: Yup.string()
      .required("Confirm your password.")
      .oneOf([Yup.ref("password")], "Passwords must match."),
  });

  const signUpHandler = async () => {
  try {
    setLoading(true);
    const { data } = await axios.post("/api/auth/register", { name, email, password });
    setUser((prev) => ({ ...prev, error: "", success: data?.message ?? "Account created." }));

    // Auto-login after signup
    const res = await signIn("credentials", { redirect: false, email, password });
    if (res?.error) {
      setUser((prev) => ({ ...prev, login_error: res.error || "Login failed after signup" }));
    } else {
      router.push("/");
    }
  } catch (err: unknown) {
    const msg =
      axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message ?? err.message ?? "An error occurred."
        : err instanceof Error
        ? err.message
        : "An error occurred.";
    setUser((prev) => ({ ...prev, success: "", error: msg }));
  } finally {
    setLoading(false);
  }
};
  const signInHandler = async () => {
    setLoading(true);
    const res = await signIn("credentials", {
      email: login_email,
      password: login_password,
      redirect: false, // handle redirect manually
    });
    setLoading(false);

    if (res?.error) {
      setUser((prev) => ({ ...prev, login_error: res.error || "Invalid credentials" }));
    } else {
      router.push(callbackUrl);
    }
  };

  // Google sign-in handler (let NextAuth redirect immediately)
  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    // No await; NextAuth will redirect. If it fails, it returns here with ?error=...
    void signIn("google", { callbackUrl });
  };

  return (
    <>
      {(loading || googleLoading) && <DotLoaderSpinner loading />}
      <div className={styles.login}>
        <div className={styles.login__container}>
          <div className={styles.login__header}>
            <div className={styles.back__svg}>
              <BiLeftArrowAlt />
            </div>
            <span>
              We&apos;d be happy to have you! <Link href="/">Go Store</Link>
            </span>
          </div>

          {/* --- Sign in --- */}
          <div className={styles.login__form}>
            <h1>Sign in</h1>
            <p>Get access to one of the best E-shopping services in the world.</p>

            {/* Show OAuth errors returned by NextAuth */}
            {oauthError && (
              <div className={styles.error} style={{ marginBottom: 12 }}>
                {oauthError === "OAuthAccountNotLinked"
                  ? "This email is already used with a different sign-in method. Please use the same method you used before."
                  : "Sign-in failed. Please try again."}
              </div>
            )}

            {/* Social/OAuth */}
            <div className={styles.socials} style={{ marginTop: 12, marginBottom: 12 }}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className={styles.googleBtn}
                disabled={googleLoading || loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  width: "100%",
                  height: "44px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  fontWeight: 600,
                  cursor: (googleLoading || loading) ? "not-allowed" : "pointer",
                }}
              >
                <FcGoogle size={22} />
                {googleLoading ? "Signing in…" : "Continue with Google"}
              </button>

              {/* separator */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, marginBottom: 12 }}>
                <span style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                <span style={{ fontSize: 12, color: "#6b7280" }}>or</span>
                <span style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
              </div>
            </div>

            <Formik
              enableReinitialize
              initialValues={{ login_email, login_password }}
              validationSchema={loginValidation}
              onSubmit={signInHandler}
            >
              {() => (
                <Form>
                  <LoginInput
                    type="email"
                    name="login_email"
                    icon="email"
                    placeholder="Email Address"
                    onChange={handleChange}
                  />
                  <LoginInput
                    type="password"
                    name="login_password"
                    icon="password"
                    placeholder="Password"
                    onChange={handleChange}
                  />
                  <CircledIconBtn type="submit" text="Sign in" />
                  {login_error && <span className={styles.error}>{login_error}</span>}
                  <div className={styles.forgot}>
                    <Link href="/auth/forgot">Forgot password ?</Link>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>

        {/* --- Sign up --- */}
        <div className={styles.login__container}>
          <div className={styles.login__form}>
            <h1>Sign up</h1>
            <p>Get access to one of the best E-shopping services in the world.</p>
                        {/* Social/OAuth for sign up */}
            <div className={styles.socials} style={{ marginTop: 12, marginBottom: 12 }}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className={styles.googleBtn}
                disabled={googleLoading || loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  width: "100%",
                  height: "44px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  fontWeight: 600,
                  cursor: (googleLoading || loading) ? "not-allowed" : "pointer",
                }}
              >
                <FcGoogle size={22} />
                {googleLoading ? "Signing up…" : "Continue with Google"}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, marginBottom: 12 }}>
                <span style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                <span style={{ fontSize: 12, color: "#6b7280" }}>or</span>
                <span style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
              </div>
            </div>

            <Formik
              enableReinitialize
              initialValues={{ name, email, password, conf_password }}
              validationSchema={registerValidation}
              onSubmit={signUpHandler}
            >
              {() => (
                <Form>
                  <LoginInput type="text" name="name" icon="user" placeholder="Full Name" onChange={handleChange} />
                  <LoginInput type="email" name="email" icon="email" placeholder="Email Address" onChange={handleChange} />
                  <LoginInput type="password" name="password" icon="password" placeholder="Password" onChange={handleChange} />
                  <LoginInput type="password" name="conf_password" icon="password" placeholder="Re-Type Password" onChange={handleChange} />
                  <CircledIconBtn type="submit" text="Sign up" />
                </Form>
              )}
            </Formik>

            {success && <span className={styles.success}>{success}</span>}
            {error && <span className={styles.error}>{error}</span>}
          </div>
        </div>
      </div>
    </>
  );
}