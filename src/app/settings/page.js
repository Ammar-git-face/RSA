"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";

const PRODUCT_ITEMS = ["Caps", "Cardigan", "Book", "Uniform"];
const EXAM_ITEMS    = ["NECO", "NABTEB", "WAEC"];

export default function SettingsPage() {
  const router = useRouter();
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [activeTab,   setActiveTab]   = useState("school");
  const [toast,       setToast]       = useState("");

  // School info
  const [school, setSchool] = useState({ schoolName: "", address: "", phone: "", email: "", invoicePrefix: "RSA" });

  // Catalogue prices (editable subset)
  const [prices, setPrices] = useState({});

  // Admin
  const [adminName,     setAdminName]     = useState("");
  const [adminEmail,    setAdminEmail]    = useState("");
  const [currentPw,     setCurrentPw]     = useState("");
  const [newPw,         setNewPw]         = useState("");
  const [confirmPw,     setConfirmPw]     = useState("");
  const [pwError,       setPwError]       = useState("");
  const [adminSaving,   setAdminSaving]   = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("rsa_token")) { router.push("/"); return; }

    Promise.all([api.getSettings(), api.getMe()])
      .then(([settData, meData]) => {
        const s = settData.settings;
        setSchool({
          schoolName:    s.schoolName    || "",
          address:       s.address       || "",
          phone:         s.phone         || "",
          email:         s.email         || "",
          invoicePrefix: s.invoicePrefix || "RSA",
        });
        // Extract price map from catalogue
        const pm = {};
        (s.catalogue || []).forEach((e) => { if (e.price !== null) pm[e.item] = e.price; });
        setPrices(pm);

        const u = meData.user;
        setAdminName(u.name || "");
        setAdminEmail(u.email || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const saveSchool = async () => {
    setSaving(true);
    try {
      // Build updated catalogue with new prices
      const catRes = await api.getCatalogue();
      const catalogue = catRes.catalogue.map((e) =>
        prices[e.item] !== undefined ? { ...e, price: prices[e.item] } : e
      );
      await api.updateSettings({ ...school, catalogue });
      flash("School information & prices saved!");
    } catch (e) { flash("Error: " + e.message); }
    finally { setSaving(false); }
  };

  const saveAdmin = async () => {
    setPwError("");
    if (newPw && newPw !== confirmPw) return setPwError("Passwords do not match.");
    if (newPw && newPw.length < 6)   return setPwError("Password must be at least 6 characters.");

    setAdminSaving(true);
    try {
      const payload = {};
      if (adminName)  payload.name  = adminName;
      if (adminEmail) payload.email = adminEmail;
      if (newPw) { payload.currentPassword = currentPw; payload.newPassword = newPw; }
      await api.updateAdmin(payload);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      flash("Admin credentials updated!");
    } catch (e) { setPwError(e.message); }
    finally { setAdminSaving(false); }
  };

  const TABS = [
    { id: "school",  label: "🏫 School Info" },
    { id: "prices",  label: "₦ Price List" },
    { id: "admin",   label: "🔐 Admin" },
  ];

  if (loading) return <AppLayout><div style={{ textAlign: "center", padding: "5rem", color: "var(--text-muted)" }}>Loading settings…</div></AppLayout>;

  return (
    <AppLayout>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage school information, pricing, and admin account</p>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ position: "fixed", top: 68, right: 20, zIndex: 999, background: "var(--green)", color: "#fff", padding: "0.75rem 1.25rem", borderRadius: 10, fontWeight: 600, fontSize: "0.875rem", boxShadow: "0 4px 20px rgba(0,0,0,.2)", animation: "fadeUp 0.3s ease" }}>
            ✓ {toast}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.25rem", background: "#e8eaf0", padding: "0.3rem", borderRadius: 10 }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, padding: "0.55rem 0.5rem", border: "none", borderRadius: 8, cursor: "pointer",
              fontFamily: "inherit", fontSize: "0.82rem", fontWeight: 600, transition: "all 0.2s",
              background: activeTab === t.id ? "#fff" : "transparent",
              color: activeTab === t.id ? "var(--navy)" : "var(--text-muted)",
              boxShadow: activeTab === t.id ? "0 1px 6px rgba(0,0,0,.08)" : "none",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── School Info Tab ── */}
        {activeTab === "school" && (
          <div className="card animate-fadeUp" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem" }}>School Information</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
              This information appears on all generated receipts.
            </p>
            <div style={{ display: "grid", gap: "1rem" }}>
              {[
                { key: "schoolName",    label: "School Name",     placeholder: "Royal Science Academy" },
                { key: "address",       label: "Address",          placeholder: "123 Academy Road, Lagos, Nigeria" },
                { key: "phone",         label: "Phone Number",     placeholder: "+234 800 123 4567" },
                { key: "email",         label: "Email Address",    placeholder: "info@royalscience.edu.ng" },
                { key: "invoicePrefix", label: "Invoice Prefix",   placeholder: "RSA" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="form-label">{label}</label>
                  <input className="form-input" placeholder={placeholder} value={school[key] || ""}
                    onChange={(e) => setSchool((p) => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <button onClick={saveSchool} className="btn btn-primary" style={{ padding: "0.75rem 2rem" }} disabled={saving}>
                {saving ? <><span className="spinner" />&nbsp;Saving…</> : "💾 Save School Info"}
              </button>
            </div>
          </div>
        )}

        {/* ── Prices Tab ── */}
        {activeTab === "prices" && (
          <div className="card animate-fadeUp" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem" }}>Price List</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              Fixed prices for products and external exams. School Fees are entered manually per invoice.
            </p>
            {[
              { label: "Products",       items: PRODUCT_ITEMS },
              { label: "External Exams", items: EXAM_ITEMS },
            ].map((group) => (
              <div key={group.label} style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem", paddingBottom: "0.4rem", borderBottom: "1px solid var(--border)" }}>
                  {group.label}
                </div>
                <div style={{ display: "grid", gap: "0.65rem" }}>
                  {group.items.map((item) => (
                    <div key={item} style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: "0.75rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{item}</span>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, pointerEvents: "none" }}>₦</span>
                        <input type="number" min={0} className="form-input" style={{ paddingLeft: "1.8rem" }}
                          value={prices[item] ?? ""}
                          onChange={(e) => setPrices((p) => ({ ...p, [item]: Number(e.target.value) }))} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={saveSchool} className="btn btn-primary" style={{ padding: "0.75rem 2rem" }} disabled={saving}>
              {saving ? <><span className="spinner" />&nbsp;Saving…</> : "💾 Save Price List"}
            </button>
          </div>
        )}

        {/* ── Admin Tab ── */}
        {activeTab === "admin" && (
          <div className="card animate-fadeUp" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem" }}>Admin Account</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              Update your display name, email, and password. Changes take effect immediately.
            </p>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label className="form-label">Display Name</label>
                <input className="form-input" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
              </div>
              <div style={{ paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Change Password</div>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <div>
                    <label className="form-label">Current Password</label>
                    <input type="password" className="form-input" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">New Password</label>
                    <input type="password" className="form-input" placeholder="At least 6 characters" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Confirm New Password</label>
                    <input type="password" className="form-input" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                  </div>
                </div>
              </div>
              {pwError && <p style={{ color: "var(--red)", fontSize: "0.82rem", padding: "0.6rem 0.9rem", background: "var(--red-pale)", borderRadius: 8 }}>⚠ {pwError}</p>}
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <button onClick={saveAdmin} className="btn btn-primary" style={{ padding: "0.75rem 2rem" }} disabled={adminSaving}>
                {adminSaving ? <><span className="spinner" />&nbsp;Updating…</> : "🔐 Update Account"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
