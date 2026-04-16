import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(145deg, #0a1628 0%, #0f2040 50%, #163060 100%)",
      flexDirection: "column", textAlign: "center", padding: "2rem",
    }}>
      <div style={{ width: 90, height: 90, position: "relative", margin: "0 auto 1.5rem", filter: "drop-shadow(0 4px 16px rgba(0,0,0,.4))" }}>
        <Image src="/logo.png" alt="RSA Logo" fill style={{ objectFit: "contain" }} />
      </div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "4rem", color: "#fff", marginBottom: "0.5rem", lineHeight: 1 }}>404</h1>
      <p style={{ fontSize: "1rem", color: "rgba(255,255,255,.6)", marginBottom: "2rem" }}>This page could not be found.</p>
      <Link href="/dashboard" style={{ padding: "0.75rem 2rem", background: "var(--gold)", color: "var(--navy)", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" }}>
        ← Back to Dashboard
      </Link>
    </div>
  );
}
