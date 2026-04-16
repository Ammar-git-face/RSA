"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { api, fmt, fmtShort } from "@/lib/api";

const TERMS = ["First Term", "Second Term", "Third Term"];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [term,     setTerm]     = useState("");
  const [deleting, setDeleting] = useState(null);
  const router = useRouter();

  const load = useCallback(async (q = {}) => {
    setLoading(true);
    try {
      const params = {};
      if (q.search) params.search = q.search;
      if (q.term)   params.term   = q.term;
      const d = await api.getInvoices(params);
      setInvoices(d.invoices || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem("rsa_token")) { router.push("/"); return; }
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load({ search, term }), 350);
    return () => clearTimeout(t);
  }, [search, term]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.deleteInvoice(id);
      setInvoices((p) => p.filter((i) => i._id !== id));
      setTotal((t) => t - 1);
    } catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  return (
    <AppLayout>
      <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">All generated invoices ({total})</p>
        </div>
        <Link href="/create-invoice" className="btn btn-primary">+ New Invoice</Link>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          className="form-input"
          style={{ maxWidth: 320 }}
          placeholder="🔍 Search student or invoice no…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-select"
          style={{ maxWidth: 180 }}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        >
          <option value="">All Terms</option>
          {TERMS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Loading invoices…
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            {search || term ? "No invoices match your filters." : "No invoices yet — create one!"}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Student</th>
                  <th>Term</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th style={{ textAlign: "right" }}>Paid</th>
                  <th style={{ textAlign: "right" }}>Outstanding</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td>
                      <Link href={`/invoices/${inv._id}`} className="inv-link">
                        {inv.invoiceNo}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 500 }}>{inv.studentName}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{inv.term}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{fmtShort(inv.date)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(inv.totalAmount)}</td>
                    <td style={{ textAlign: "right" }}>{fmt(inv.amountPaid)}</td>
                    <td style={{ textAlign: "right" }}>
                      {inv.outstanding > 0
                        ? <span className="badge badge-red">{fmt(inv.outstanding)}</span>
                        : <span className="badge badge-green">Paid</span>
                      }
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        <Link href={`/invoices/${inv._id}`} className="btn btn-ghost btn-sm">
                          View
                        </Link>
                        {/* Print opens detail page with ?print=1 which auto-triggers printReceipt */}
                        <Link href={`/invoices/${inv._id}?print=1`} className="btn btn-ghost btn-sm">
                          🖨 Print
                        </Link>
                        <Link href={`/invoices/${inv._id}/edit`} className="btn btn-ghost btn-sm">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(inv._id)}
                          className="btn btn-danger btn-sm"
                          disabled={deleting === inv._id}
                        >
                          {deleting === inv._id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
        Showing {invoices.length} of {total} invoice{total !== 1 ? "s" : ""}
      </p>
    </AppLayout>
  );
}
