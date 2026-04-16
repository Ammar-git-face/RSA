"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [show, setShow]         = useState(false);
  const router = useRouter();

  // If already logged in, skip to dashboard
  useEffect(() => {
    if (sessionStorage.getItem("rsa_token")) router.replace("/dashboard");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(email, password);
      if (data?.success && data?.token) {
        sessionStorage.setItem("rsa_token", data.token);
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(145deg, #0a1628 0%, #0f2040 40%, #163060 100%)",
      padding: "1rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background pattern */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }} />

      <div
        className="animate-fadeUp"
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "2.75rem 2.25rem 2rem",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 25px 80px rgba(0,0,0,.4)",
          position: "relative",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{
            width: 84, height: 84, margin: "0 auto 0.9rem",
            position: "relative",
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,.2))",
          }}>
            <Image
              src="/logo.png"
              alt="Royal Science Academy"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.45rem", color: "var(--navy)",
            marginBottom: "0.2rem", fontWeight: 700,
          }}>
            Royal Science Academy
          </h1>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Invoice System — Admin Login
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "1rem" }}>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@royalscience.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={show ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: "2.8rem" }}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                style={{
                  position: "absolute", right: "0.75rem", top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", cursor: "pointer", fontSize: "0.85rem",
                  color: "var(--text-muted)",
                }}
              >{show ? "🙈" : "👁"}</button>
            </div>
          </div>

          {error && (
            <p style={{
              color: "var(--red)", fontSize: "0.82rem",
              marginBottom: "0.9rem",
              display: "flex", alignItems: "center", gap: "0.4rem",
            }}>
              ⚠ {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.9rem", fontSize: "0.95rem", marginTop: "0.25rem" }}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" /> Signing in…</>
              : <>🔒 Login</>
            }
          </button>
        </form>

        <p style={{
          textAlign: "center", marginTop: "1.75rem",
          fontSize: "0.72rem", color: "var(--text-muted)",
        }}>
          © {new Date().getFullYear()} Royal Science Academy, Jos. All rights reserved.
        </p>
      </div>
    </div>
  );
}
