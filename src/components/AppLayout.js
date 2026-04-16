"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const NAV = [
  { href: "/dashboard",       label: "Dashboard",      icon: "⊞" },
  { href: "/create-invoice",  label: "Create Invoice",  icon: "✦" },
  { href: "/invoices",        label: "Invoices",        icon: "☰" },
  { href: "/settings",        label: "Settings",        icon: "⚙" },
];

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem("rsa_token");
    router.push("/");
  };

  const showSidebar = !isMobile || sidebarOpen;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,.5)",
            zIndex: 99, backdropFilter: "blur(3px)",
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className="sidebar"
        style={{ transform: showSidebar ? "translateX(0)" : "translateX(-230px)" }}
      >
        {/* Brand */}
        <div style={{
          padding: "1.1rem 1rem 1rem",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          display: "flex", alignItems: "center", gap: "0.75rem",
        }}>
          <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
            <Image
              src="/logo.png"
              alt="RSA Logo"
              fill
              style={{ objectFit: "contain", borderRadius: "50%" }}
              priority
            />
          </div>
          <div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "0.88rem", color: "#fff", lineHeight: 1.2, fontWeight: 600,
            }}>Royal Science</div>
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,.4)" }}>Academy</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "1rem 0.65rem", flex: 1 }}>
          <div style={{
            fontSize: "0.62rem", fontWeight: 700,
            color: "rgba(255,255,255,.3)", textTransform: "uppercase",
            letterSpacing: "0.1em", padding: "0 0.5rem 0.6rem",
          }}>Menu</div>

          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: "0.65rem",
                  padding: "0.68rem 0.8rem", borderRadius: 8, marginBottom: "0.15rem",
                  textDecoration: "none", fontSize: "0.875rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--gold-light)" : "rgba(255,255,255,.6)",
                  background: active ? "rgba(201,168,76,.14)" : "transparent",
                  borderLeft: active ? "3px solid var(--gold)" : "3px solid transparent",
                  transition: "all 0.18s",
                }}
              >
                <span style={{ fontSize: "1rem", flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "0.75rem 0.65rem", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", padding: "0.65rem 0.8rem",
              background: "rgba(224,82,82,.1)", color: "#f09898",
              border: "none", borderRadius: 8, fontFamily: "inherit",
              fontSize: "0.82rem", fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.5rem",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(224,82,82,.22)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(224,82,82,.1)"}
          >
            ⇥ Logout
          </button>
        </div>
      </aside>

      {/* ── Topbar ── */}
      <header
        className="topbar no-print"
        style={{ left: !isMobile ? "var(--sidebar-w)" : 0 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Hamburger (mobile) */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle menu"
              style={{
                width: 36, height: 36, border: "none", background: "none",
                cursor: "pointer", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 5, borderRadius: 6, padding: 0,
              }}
            >
              {[0,1,2].map((i) => (
                <span key={i} style={{
                  display: "block", width: 18, height: 2,
                  background: "var(--navy)", borderRadius: 2,
                  transition: "all .25s",
                  transform: sidebarOpen
                    ? i === 0 ? "rotate(45deg) translateY(7px)"
                    : i === 2 ? "rotate(-45deg) translateY(-7px)"
                    : "scaleX(0)"
                    : "none",
                }} />
              ))}
            </button>
          )}
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--navy)" }}>Royal Science Academy</strong>
            {" "}— Invoice System
          </div>
        </div>

        <Link href="/create-invoice" className="btn btn-primary btn-sm no-print">
          + New Invoice
        </Link>
      </header>

      {/* ── Page content ── */}
      <main
        className="main-content"
        style={{ marginLeft: !isMobile ? "var(--sidebar-w)" : 0 }}
      >
        <div style={{ padding: "1.5rem" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
