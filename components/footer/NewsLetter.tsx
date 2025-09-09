'use client';
import Link from "next/link";
import { useState } from "react";
import styles from "./styles.module.scss";
import axios from "axios";

export default function NewsLetter() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const subscribe = async () => {
    setSuccess("");
    setError("");
    if (!email) return setError("Please enter your email.");

    try {
      setLoading(true);
      const { data } = await axios.post("/api/newsletter", { email });
      setSuccess(data?.message ?? "Subscribed successfully.");
      setEmail("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const apiMsg =
          (err.response?.data as { message?: string } | undefined)?.message ??
          err.message ??
          "An unexpected error occurred.";
        setError(apiMsg);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.footer__newsletter}>
      <h3>SIGN UP FOR OUR NEWSLETTER</h3>

      <div className={styles.footer__flex}>
        <input
          type="email"
          placeholder="Your Email Address"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          disabled={loading}
        />
        <button
          className={styles.btn_primary}
          disabled={loading}
          style={{ cursor: loading ? "not-allowed" : "pointer" }}
          onClick={subscribe}
        >
          {loading ? "SUBSCRIBING..." : "SUBSCRIBE"}
        </button>
      </div>

      {loading && <div>loading...</div>}
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <p>
        By clicking the SUBSCRIBE button, you are agreeing to{" "}
        <Link href="/privacy-cookie-policy">our Privacy &amp; Cookie Policy</Link>
      </p>
    </div>
  );
}