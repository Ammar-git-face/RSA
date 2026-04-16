"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { api, fmt } from "@/lib/api";

const TERMS   = ["First Term", "Second Term", "Third Term"];
const METHODS = ["Cash", "Transfer", "POS", "Cheque"];

const newLine = () => ({
  _key: Math.random().toString(36).slice(2),
  category: "",
  item: "",
  price: "",
  qty: 1,
  total: 0,
});

export default function CreateInvoicePage() {
  const router = useRouter();

  const [catalogue,    setCatalogue]    = useState([]);
  const [catLoading,   setCatLoading]   = useState(true);
  const [studentName,  setStudentName]  = useState("");
  const [term,         setTerm]         = useState("");
  const [paymentMethod,setPaymentMethod]= useState("Cash");
  const [lines,        setLines]        = useState([newLine()]);
  const [amountPaid,   setAmountPaid]   = useState("");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");

  // Group catalogue by category
  const grouped = catalogue.reduce((acc, entry) => {
    if (!acc[entry.category]) acc[entry.category] = [];
    acc[entry.category].push(entry);
    return acc;
  }, {});
  const categories = Object.keys(grouped);

  useEffect(() => {
    if (!sessionStorage.getItem("rsa_token")) { router.push("/"); return; }
    api.getCatalogue()
      .then((d) => {
        setCatalogue(d.catalogue || []);
        // Pre-fill first line with first category
        if (d.catalogue?.length) {
          const firstCat = d.catalogue[0].category;
          const firstItem = d.catalogue.find((c) => c.category === firstCat);
          setLines([{
            _key: Math.random().toString(36).slice(2),
            category: firstCat,
            item: firstItem?.item || "",
            price: firstItem?.price ?? "",
            qty: 1,
            total: firstItem?.price ?? 0,
          }]);
        }
      })
      .catch(console.error)
      .finally(() => setCatLoading(false));
  }, []);

  const totalAmount  = lines.reduce((s, l) => s + (Number(l.total) || 0), 0);
  const outstanding  = Math.max(0, totalAmount - (Number(amountPaid) || 0));

  const updateLine = useCallback((key, field, value) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l._key !== key) return l;
        const upd = { ...l, [field]: value };

        if (field === "category") {
          const items = grouped[value] || [];
          const first = items[0];
          upd.item  = first?.item || "";
          upd.price = first?.price ?? "";
          upd.qty   = 1;
          upd.total = (first?.price ?? 0) * 1;
        }

        if (field === "item") {
          const entry = (grouped[upd.category] || []).find((e) => e.item === value);
          upd.price = entry?.price ?? "";
          upd.qty   = 1;
          upd.total = (entry?.price ?? 0) * 1;
        }

        if (field === "price") {
          upd.total = (Number(value) || 0) * (Number(upd.qty) || 1);
        }

        if (field === "qty") {
          const q   = Math.max(1, Number(value) || 1);
          upd.qty   = q;
          upd.total = (Number(upd.price) || 0) * q;
        }

        return upd;
      })
    );
  }, [grouped]);

  const addLine    = () => setLines((p) => [...p, newLine()]);
  const removeLine = (key) => setLines((p) => p.filter((l) => l._key !== key));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!studentName.trim()) return setError("Student name is required.");
    if (!term)               return setError("Please select a term.");
    const bad = lines.find((l) => !l.item);
    if (bad)                 return setError("Please select an item for every line.");
    const noprice = lines.find((l) => !l.price && l.price !== 0);
    if (noprice)             return setError(`Please enter a price for "${noprice.item}".`);

    setSaving(true);
    try {
      const { invoice } = await api.createInvoice({
        studentName: studentName.trim(),
        term, paymentMethod,
        items: lines.map(({ category, item, price, qty, total }) => ({
          category, item,
          price: Number(price),
          qty:   Number(qty),
          total: Number(total),
        })),
        amountPaid: Number(amountPaid) || 0,
      });
      router.push(`/invoices/${invoice._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <style>{`
        .items-grid {
          display: grid;
          grid-template-columns: 1.5fr 1.5fr 1fr 70px 1fr 36px;
          gap: 0.5rem; align-items: center; margin-bottom: 0.6rem;
        }
        .items-hdr {
          display: grid;
          grid-template-columns: 1.5fr 1.5fr 1fr 70px 1fr 36px;
          gap: 0.5rem; margin-bottom: 0.45rem;
        }
        @media (max-width: 680px) {
          .items-grid {
            grid-template-columns: 1fr 1fr;
            padding: 0.9rem; margin-bottom: 0.75rem;
            background: #f8f9fc; border: 1px solid var(--border); border-radius: 10px;
          }
          .items-grid .c-full { grid-column: 1 / -1; }
          .items-hdr { display: none; }
        }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <h1 className="page-title">Create Invoice</h1>
          <p className="page-subtitle">Generate a new invoice for a student</p>
        </div>

        {catLoading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Loading catalogue…</div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Student Info */}
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.1rem" }}>
                Student Information
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: "1rem" }}>
                <div>
                  <label className="form-label">Student Name <span style={{ color: "var(--red)" }}>*</span></label>
                  <input className="form-input" placeholder="Enter student full name" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Term <span style={{ color: "var(--red)" }}>*</span></label>
                  <select className="form-select" value={term} onChange={(e) => setTerm(e.target.value)}>
                    <option value="">Select term</option>
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

            {/* Items */}
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Items</h2>
                <button type="button" onClick={addLine} className="btn btn-ghost btn-sm">+ Add Item</button>
              </div>

              <div className="items-hdr">
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
                  <div key={line._key} className="items-grid">
                    <div className="c-full">
                      <select className="form-select" value={line.category} onChange={(e) => updateLine(line._key, "category", e.target.value)}>
                        <option value="">Select category</option>
                        {categories.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="c-full">
                      <select className="form-select" value={line.item} onChange={(e) => updateLine(line._key, "item", e.target.value)} disabled={!line.category}>
                        <option value="">Select item</option>
                        {items.map((it) => <option key={it.item} value={it.item}>{it.item}</option>)}
                      </select>
                    </div>
                    <input type="number" className="form-input" placeholder="0" value={line.price}
                      readOnly={priceFixed} min={0}
                      onChange={(e) => updateLine(line._key, "price", e.target.value)}
                      style={priceFixed ? { background: "#f0f2f7", color: "var(--text-muted)", cursor: "default" } : {}} />
                    <input type="number" className="form-input" value={line.qty} min={1}
                      readOnly={qtyDisabled}
                      onChange={(e) => updateLine(line._key, "qty", e.target.value)}
                      style={qtyDisabled ? { background: "#f0f2f7", color: "var(--text-muted)", cursor: "default" } : {}} />
                    <div style={{ padding: "0.65rem 0.9rem", background: "#f8f9fc", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: "0.875rem", fontWeight: 700, color: "var(--navy)" }}>
                      {fmt(line.total)}
                    </div>
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

            {/* Payment Summary */}
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.1rem" }}>Payment Summary</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "1.25rem", alignItems: "end" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", fontWeight: 600, textTransform: "uppercase" }}>Total Amount</div>
                  <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--navy)" }}>{fmt(totalAmount)}</div>
                </div>
                <div>
                  <label className="form-label">Amount Paid (₦)</label>
                  <input type="number" className="form-input" placeholder="0" value={amountPaid} min={0} max={totalAmount}
                    onChange={(e) => setAmountPaid(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", fontWeight: 600, textTransform: "uppercase" }}>Outstanding</div>
                  <div style={{ fontSize: "1.7rem", fontWeight: 800, color: outstanding > 0 ? "var(--red)" : "var(--green)" }}>
                    {fmt(outstanding)}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div style={{ color: "var(--red)", fontSize: "0.85rem", marginBottom: "1rem", padding: "0.75rem 1rem", background: "var(--red-pale)", borderRadius: 10, border: "1px solid #f5c6c6" }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button type="submit" className="btn btn-primary" style={{ padding: "0.85rem 2rem", fontSize: "0.95rem" }} disabled={saving}>
                {saving ? <><span className="spinner" />&nbsp;Generating…</> : "Generate Invoice"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => router.back()} style={{ padding: "0.85rem 1.5rem" }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
