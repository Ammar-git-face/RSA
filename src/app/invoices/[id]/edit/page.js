"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { api, fmt } from "@/lib/api";

const TERMS   = ["First Term", "Second Term", "Third Term"];
const METHODS = ["Cash", "Transfer", "POS", "Cheque"];

export default function EditInvoicePage({ params }) {
  const router = useRouter();
  const [catalogue, setCatalogue] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");

  const [studentName,   setStudentName]   = useState("");
  const [term,          setTerm]          = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [lines,         setLines]         = useState([]);
  const [amountPaid,    setAmountPaid]    = useState("");

  const grouped = catalogue.reduce((acc, e) => {
    if (!acc[e.category]) acc[e.category] = [];
    acc[e.category].push(e);
    return acc;
  }, {});

  useEffect(() => {
    if (!localStorage.getItem("rsa_token")) { router.push("/"); return; }
    Promise.all([api.getInvoice(params.id), api.getCatalogue()])
      .then(([invData, catData]) => {
        const inv = invData.invoice;
        setCatalogue(catData.catalogue || []);
        setInvoiceNo(inv.invoiceNo);
        setStudentName(inv.studentName);
        setTerm(inv.term);
        setPaymentMethod(inv.paymentMethod || "Cash");
        setAmountPaid(String(inv.amountPaid));
        setLines(inv.items.map((it) => ({ ...it, _key: Math.random().toString(36).slice(2) })));
      })
      .catch(() => router.push("/invoices"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const totalAmount = lines.reduce((s, l) => s + (Number(l.total) || 0), 0);
  const outstanding = Math.max(0, totalAmount - (Number(amountPaid) || 0));

  const updateLine = useCallback((key, field, value) => {
    setLines((prev) => prev.map((l) => {
      if (l._key !== key) return l;
      const upd = { ...l, [field]: value };
      if (field === "category") {
        const items = grouped[value] || [];
        const first = items[0];
        upd.item = first?.item || ""; upd.price = first?.price ?? ""; upd.qty = 1; upd.total = (first?.price ?? 0);
      }
      if (field === "item") {
        const entry = (grouped[upd.category] || []).find((e) => e.item === value);
        upd.price = entry?.price ?? ""; upd.qty = 1; upd.total = (entry?.price ?? 0);
      }
      if (field === "price") upd.total = (Number(value) || 0) * (Number(upd.qty) || 1);
      if (field === "qty")   { const q = Math.max(1, Number(value) || 1); upd.qty = q; upd.total = (Number(upd.price) || 0) * q; }
      return upd;
    }));
  }, [grouped]);

  const addLine    = () => setLines((p) => [...p, { _key: Math.random().toString(36).slice(2), category: "", item: "", price: "", qty: 1, total: 0 }]);
  const removeLine = (key) => setLines((p) => p.filter((l) => l._key !== key));

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    if (!studentName.trim()) return setError("Student name is required.");
    if (!term) return setError("Please select a term.");
    if (lines.some((l) => !l.item)) return setError("Please select an item for every line.");

    setSaving(true);
    try {
      await api.updateInvoice(params.id, {
        studentName: studentName.trim(), term, paymentMethod,
        items: lines.map(({ category, item, price, qty, total }) => ({ category, item, price: Number(price), qty: Number(qty), total: Number(total) })),
        amountPaid: Number(amountPaid) || 0,
      });
      router.push(`/invoices/${params.id}`);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <AppLayout><div style={{ textAlign: "center", padding: "5rem", color: "var(--text-muted)" }}>Loading…</div></AppLayout>;

  const categories = Object.keys(grouped);

  return (
    <AppLayout>
      <style>{`
        .edit-grid { display: grid; grid-template-columns: 1.5fr 1.5fr 1fr 70px 1fr 36px; gap: 0.5rem; align-items: center; margin-bottom: 0.6rem; }
        .edit-hdr  { display: grid; grid-template-columns: 1.5fr 1.5fr 1fr 70px 1fr 36px; gap: 0.5rem; margin-bottom: 0.45rem; }
        @media (max-width: 680px) {
          .edit-grid { grid-template-columns: 1fr 1fr; padding: 0.9rem; margin-bottom: 0.75rem; background: #f8f9fc; border: 1px solid var(--border); border-radius: 10px; }
          .edit-grid .c-full { grid-column: 1 / -1; }
          .edit-hdr { display: none; }
        }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 className="page-title">Edit Invoice</h1>
            <p className="page-subtitle">{invoiceNo}</p>
          </div>
          <Link href={`/invoices/${params.id}`} className="btn btn-ghost btn-sm">← Cancel</Link>
        </div>

        <form onSubmit={handleSave}>
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.1rem" }}>Student Information</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: "1rem" }}>
              <div>
                <label className="form-label">Student Name <span style={{ color: "var(--red)" }}>*</span></label>
                <input className="form-input" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Term <span style={{ color: "var(--red)" }}>*</span></label>
                <select className="form-select" value={term} onChange={(e) => setTerm(e.target.value)}>
                  {TERMS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Items</h2>
              <button type="button" onClick={addLine} className="btn btn-ghost btn-sm">+ Add Item</button>
            </div>
            <div className="edit-hdr">
              {["Category", "Item", "Price (₦)", "Qty", "Total", ""].map((h, i) => (
                <span key={i} style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</span>
              ))}
            </div>
            {lines.map((line) => {
              const items = grouped[line.category] || [];
              const entry = items.find((e) => e.item === line.item);
              const priceFixed  = entry?.price !== null && entry?.price !== undefined;
              const qtyDisabled = line.category === "School Fees";
              return (
                <div key={line._key} className="edit-grid">
                  <div className="c-full">
                    <select className="form-select" value={line.category} onChange={(e) => updateLine(line._key, "category", e.target.value)}>
                      <option value="">Category</option>
                      {categories.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="c-full">
                    <select className="form-select" value={line.item} onChange={(e) => updateLine(line._key, "item", e.target.value)} disabled={!line.category}>
                      <option value="">Item</option>
                      {items.map((it) => <option key={it.item} value={it.item}>{it.item}</option>)}
                    </select>
                  </div>
                  <input type="number" className="form-input" value={line.price} readOnly={priceFixed} min={0}
                    onChange={(e) => updateLine(line._key, "price", e.target.value)}
                    style={priceFixed ? { background: "#f0f2f7", color: "var(--text-muted)", cursor: "default" } : {}} />
                  <input type="number" className="form-input" value={line.qty} min={1} readOnly={qtyDisabled}
                    onChange={(e) => updateLine(line._key, "qty", e.target.value)}
                    style={qtyDisabled ? { background: "#f0f2f7", color: "var(--text-muted)", cursor: "default" } : {}} />
                  <div style={{ padding: "0.65rem 0.9rem", background: "#f8f9fc", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: "0.875rem", fontWeight: 700, color: "var(--navy)" }}>{fmt(line.total)}</div>
                  <button type="button" onClick={() => removeLine(line._key)} disabled={lines.length === 1}
                    style={{ width: 34, height: 34, border: "1.5px solid var(--border)", borderRadius: 8, background: "none", cursor: lines.length === 1 ? "not-allowed" : "pointer", color: lines.length === 1 ? "#ccc" : "var(--red)", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginRight: "1rem" }}>Subtotal</span>
              <span style={{ fontWeight: 700, color: "var(--navy)" }}>{fmt(totalAmount)}</span>
            </div>
          </div>

          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.1rem" }}>Payment Summary</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "1.25rem", alignItems: "end" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", fontWeight: 600, textTransform: "uppercase" }}>Total Amount</div>
                <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--navy)" }}>{fmt(totalAmount)}</div>
              </div>
              <div>
                <label className="form-label">Amount Paid (₦)</label>
                <input type="number" className="form-input" value={amountPaid} min={0} max={totalAmount} onChange={(e) => setAmountPaid(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", fontWeight: 600, textTransform: "uppercase" }}>Outstanding</div>
                <div style={{ fontSize: "1.7rem", fontWeight: 800, color: outstanding > 0 ? "var(--red)" : "var(--green)" }}>{fmt(outstanding)}</div>
              </div>
            </div>
          </div>

          {error && <div style={{ color: "var(--red)", fontSize: "0.85rem", marginBottom: "1rem", padding: "0.75rem 1rem", background: "var(--red-pale)", borderRadius: 10 }}>⚠ {error}</div>}

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button type="submit" className="btn btn-primary" style={{ padding: "0.85rem 2rem", fontSize: "0.95rem" }} disabled={saving}>
              {saving ? <><span className="spinner" />&nbsp;Saving…</> : "💾 Save Changes"}
            </button>
            <Link href={`/invoices/${params.id}`} className="btn btn-ghost" style={{ padding: "0.85rem 1.5rem" }}>Cancel</Link>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
