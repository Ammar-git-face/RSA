"use client";
import { useEffect, useState, Suspense ,use} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { api, fmt, fmtDate } from "@/lib/api";

// ── Receipt — pure display, no layout wrappers ────────────────────────────────
export function Receipt({ inv, school }) {
  const sName  = school?.schoolName || "Royal Science Academy";
  const sAddr  = school?.address    || "123 Academy Road, Lagos, Nigeria";
  const sPhone = school?.phone      || "+234 800 123 4567";
  const sEmail = school?.email      || "info@royalscience.edu.ng";

  return (
    <div
      id="receipt-area"
      style={{
        background: "#fff",
        border: "1px solid #dde1ea",
        borderRadius: 16,
        maxWidth: 700,
        margin: "0 auto",
        padding: "2.75rem 2.5rem",
        boxShadow: "0 4px 32px rgba(15,31,61,.1)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}
    >
      {/* Watermark */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%) rotate(14deg)",
        opacity: 0.055,
        width: 340, height: 340,
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 0,
      }}>
        {/* FIX 1: changed style string to JSX object */}
        <img src="/logo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>

      {/* All content sits above watermark */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* School Header */}
        <div style={{
          textAlign: "center",
          paddingBottom: "1.5rem",
          marginBottom: "1.5rem",
          borderBottom: "2px solid #f0f2f7",
        }}>
          <div style={{
            width: 80, height: 80,
            margin: "0 auto 0.85rem",
            position: "relative",
            filter: "drop-shadow(0 2px 8px rgba(24, 22, 22, 0.21))",
          }}>
            <Image src="/logo.png" alt="RSA Logo" fill style={{ objectFit: "contain" }} priority />
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.45rem", color: "#0f1f3d",
            marginBottom: "0.3rem", fontWeight: 700,
          }}>{sName}</h1>
          <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.2rem" }}>{sAddr}</p>
          <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.9rem" }}>
            Tel: {sPhone}&nbsp;|&nbsp;Email: {sEmail}
          </p>
          <div style={{
            display: "inline-block",
            padding: "0.3rem 1.4rem",
            border: "1.5px solid #0f1f3d",
            borderRadius: 99,
            fontSize: "0.68rem", fontWeight: 700,
            color: "#0f1f3d",
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>Official Payment Receipt</div>
        </div>

        {/* Meta */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "0.85rem 2rem",
          marginBottom: "1.75rem",
        }}>
          {[
            ["Student Name",   inv.studentName],
            ["Invoice No.",    inv.invoiceNo],
            ["Term",           inv.term],
            ["Date",           fmtDate(inv.date)],
            ["Payment Method", inv.paymentMethod],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: "0.67rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>{k}</div>
              <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#1a1a2e" }}>{v || "—"}</div>
            </div>
          ))}
        </div>

        {/* Items Table */}
        <div style={{ border: "1px solid #e2e5ed", borderRadius: 10, overflow: "hidden", marginBottom: "1.75rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#f4f6fb" }}>
                {[["Item","left"],["Category","left"],["Qty","center"],["Unit Price","right"],["Total","right"]].map(([h, a]) => (
                  <th key={h} style={{
                    padding: "0.7rem 1rem", textAlign: a,
                    fontSize: "0.68rem", fontWeight: 700, color: "#6b7280",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    borderBottom: "1px solid #e2e5ed",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(inv.items || []).map((item, i) => (
                <tr key={i} style={{ borderBottom: i < inv.items.length - 1 ? "1px solid #f0f2f7" : "none" }}>
                  <td style={{ padding: "0.8rem 1rem", fontWeight: 600 }}>{item.item}</td>
                  <td style={{ padding: "0.8rem 1rem", color: "#6b7280", fontSize: "0.8rem" }}>{item.category}</td>
                  <td style={{ padding: "0.8rem 1rem", textAlign: "center", color: "#6b7280" }}>{item.qty > 1 ? item.qty : "—"}</td>
                  <td style={{ padding: "0.8rem 1rem", textAlign: "right" }}>{fmt(item.price)}</td>
                  <td style={{ padding: "0.8rem 1rem", textAlign: "right", fontWeight: 700 }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", alignItems: "flex-end", marginBottom: "2rem" }}>
          {[
            { label: "Total Amount:", value: fmt(inv.totalAmount), extra: {} },
            { label: "Amount Paid:",  value: fmt(inv.amountPaid),  extra: { color: "#2e8b57", fontWeight: 700 } },
          ].map((r) => (
            <div key={r.label} style={{ display: "flex", gap: "3rem", alignItems: "center", minWidth: 280 }}>
              <span style={{ flex: 1, fontSize: "0.875rem", color: "#6b7280" }}>{r.label}</span>
              <span style={{ fontWeight: 600, textAlign: "right", ...r.extra }}>{r.value}</span>
            </div>
          ))}
          <div style={{ width: 280, height: 1, background: "#e2e5ed" }} />
          <div style={{ display: "flex", gap: "3rem", alignItems: "center", minWidth: 280 }}>
            <span style={{ flex: 1, fontSize: "0.95rem", fontWeight: 700 }}>Outstanding:</span>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: inv.outstanding > 0 ? "#e05252" : "#2e8b57" }}>
              {fmt(inv.outstanding)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #f0f2f7", paddingTop: "1rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.25rem" }}>Thank you for your payment</p>
          <p style={{ fontSize: "0.7rem", color: "#c0c8d8", fontStyle: "italic" }}>
            This is a computer-generated receipt and does not require a signature
          </p>
        </div>

      </div>
    </div>
  );
}

// ── Print helper — opens a clean print window ─────────────────────────────────
function printReceipt(inv, school) {
  const sName  = school?.schoolName || "Royal Science Academy";
  const sAddr  = school?.address    || "Na Mnazon Allah Street Ring Road jos Plateau state";
  const sPhone = school?.phone      || "+234 8032128515";
  const sEmail = school?.email      || "info@royalscience.edu.ng";

  const rows = (inv.items || []).map((item) => `
    <tr>
      <td>${item.item}</td>
      <td style="color:#6b7280;font-size:0.8rem">${item.category}</td>
      <td style="text-align:center;color:#6b7280">${item.qty > 1 ? item.qty : "—"}</td>
      <td style="text-align:right">₦${Number(item.price).toLocaleString("en-NG")}</td>
      <td style="text-align:right;font-weight:700">₦${Number(item.total).toLocaleString("en-NG")}</td>
    </tr>`).join("");

  const fmtN  = (n) => "₦" + Number(n || 0).toLocaleString("en-NG");
  const fmtDt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" }) : "—";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Receipt — ${inv.invoiceNo}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: #fff; padding: 2cm 1.5cm; color: #1a1a2e; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { text-align: center; border-bottom: 2px solid #f0f2f7; padding-bottom: 1.2rem; margin-bottom: 1.4rem; }
    .logo { width: 72px; height: 72px; border-radius: 50%; display: block; margin: 0 auto 0.7rem; }
    h1 { font-family: 'Playfair Display', serif; font-size: 1.35rem; color: #0f1f3d; margin-bottom: 0.25rem; }
    .meta-info { font-size: 0.78rem; color: #6b7280; margin-bottom: 0.15rem; }
    .badge { display: inline-block; padding: 0.25rem 1.1rem; border: 1.5px solid #0f1f3d; border-radius: 99px; font-size: 0.65rem; font-weight: 700; color: #0f1f3d; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.6rem; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 2rem; margin-bottom: 1.5rem; }
    .meta-grid .label { font-size: 0.65rem; color: #9ca3af; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.15rem; }
    .meta-grid .value { font-size: 0.88rem; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid #e2e5ed; border-radius: 8px; overflow: hidden; }
    thead tr { background: #f4f6fb !important; }
    th { padding: 0.6rem 0.9rem; text-align: left; font-size: 0.65rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e5ed; }
    th.right, td.right { text-align: right; }
    th.center, td.center { text-align: center; }
    tbody tr { border-bottom: 1px solid #f0f2f7; }
    tbody tr:last-child { border-bottom: none; }
    td { padding: 0.7rem 0.9rem; }
    .totals { display: flex; flex-direction: column; align-items: flex-end; gap: 0.45rem; margin-bottom: 1.5rem; }
    .total-row { display: flex; gap: 2.5rem; min-width: 260px; }
    .total-row .tl { flex: 1; font-size: 0.85rem; color: #6b7280; }
    .total-row .tv { font-weight: 600; text-align: right; }
    .divider { width: 260px; height: 1px; background: #e2e5ed; margin: 0.2rem 0; align-self: flex-end; }
    .grand-row { display: flex; gap: 2.5rem; min-width: 260px; }
    .grand-row .tl { flex: 1; font-size: 0.92rem; font-weight: 700; }
    .grand-row .tv { font-size: 1rem; font-weight: 800; text-align: right; }
    .footer { border-top: 1px solid #f0f2f7; padding-top: 0.9rem; text-align: center; }
    .footer p { font-size: 0.75rem; color: #6b7280; margin-bottom: 0.2rem; }
    .footer .sub { font-size: 0.68rem; color: #c0c8d8; font-style: italic; }
    @media print {
      body { padding: 1cm; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>

  <!-- FIX 2: watermark added to print window, position:fixed so it centers on the printed page -->
  <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-14deg);opacity:0.055;width:340px;height:340px;pointer-events:none;z-index:0;">
    <img src="${window.location.origin}/logo.png" alt="" style="width:100%;height:100%;object-fit:contain;"/>
  </div>

  <!-- FIX 2: all content wrapped in z-index:1 so it sits above the watermark -->
  <div style="position:relative;z-index:1;">

    <div class="header">
      <img class="logo" src="${window.location.origin}/logo.png" alt="RSA Logo"/>
      <h1>${sName}</h1>
      <p class="meta-info">${sAddr}</p>
      <p class="meta-info">Tel: ${sPhone} &nbsp;|&nbsp; Email: ${sEmail}</p>
      <div class="badge">Official Payment Receipt</div>
    </div>

    <div class="meta-grid">
      <div><div class="label">Student Name</div><div class="value">${inv.studentName}</div></div>
      <div><div class="label">Invoice No.</div><div class="value">${inv.invoiceNo}</div></div>
      <div><div class="label">Term</div><div class="value">${inv.term}</div></div>
      <div><div class="label">Date</div><div class="value">${fmtDt(inv.date)}</div></div>
      <div><div class="label">Payment Method</div><div class="value">${inv.paymentMethod}</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Category</th>
          <th class="center">Qty</th>
          <th class="right">Unit Price</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span class="tl">Total Amount:</span>
        <span class="tv">${fmtN(inv.totalAmount)}</span>
      </div>
      <div class="total-row">
        <span class="tl">Amount Paid:</span>
        <span class="tv" style="color:#2e8b57">${fmtN(inv.amountPaid)}</span>
      </div>
      <div class="divider"></div>
      <div class="grand-row">
        <span class="tl">Outstanding:</span>
        <span class="tv" style="color:${inv.outstanding > 0 ? "#e05252" : "#2e8b57"}">${fmtN(inv.outstanding)}</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for your payment</p>
      <p class="sub">This is a computer-generated receipt and does not require a signature</p>
    </div>

  </div>

  <script>
    window.onload = function() {
      // Small delay so logo loads
      setTimeout(function() { window.print(); }, 600);
    };
  </script>
</body>
</html>`;

const win = window.open("", "_blank", "width=800,height=900");

if (!win) {
  alert("Popup blocked! Please allow popups for this site.");
  return;
}

win.document.write(html);
win.document.close();
}

// ── Inner component ───────────────────────────────────────────────────────────
function InvoiceDetailInner({ params }) {
  // FIX: params is a Promise in Next.js 16 — must be unwrapped with React.use()
  // before accessing any property, otherwise throws sync-dynamic-apis error
  const resolvedParams = use(params);

  const [inv,     setInv]     = useState(null);
  const [school,  setSchool]  = useState(null);
  const [loading, setLoading] = useState(true);
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!sessionStorage.getItem("rsa_token")) { router.push("/"); return; }

    Promise.all([
      // FIX: use resolvedParams.id instead of params.id
      api.getInvoice(resolvedParams.id),
      api.getSettings().catch(() => ({ settings: null })),
    ]).then(([invData, settData]) => {
      setInv(invData.invoice);
      setSchool(settData.settings);
      if (searchParams.get("print") === "1") {
        setTimeout(() => printReceipt(invData.invoice, settData.settings), 800);
      }
    })
    .catch(() => router.push("/invoices"))
    .finally(() => setLoading(false));
  // FIX: depend on resolvedParams.id instead of params.id
  }, [resolvedParams.id]);

  if (loading) return (
    <AppLayout>
      <div style={{ textAlign: "center", padding: "5rem", color: "var(--text-muted)" }}>
        Loading invoice…
      </div>
    </AppLayout>
  );

  if (!inv) return null;

  return (
    <AppLayout>
      {/* ── Action bar ── */}
      <div style={{
        marginBottom: "1.25rem",
        display: "flex", alignItems: "center",
        gap: "0.6rem", flexWrap: "wrap",
      }}>
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm"
          style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
        >
          ← Back
        </button>

        {/* Print button */}
        <button
          onClick={() => printReceipt(inv, school)}
          className="btn btn-primary btn-sm"
          style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
        >
          🖨 Print Receipt
        </button>

        <Link href={`/invoices/${inv._id}/edit`} className="btn btn-ghost btn-sm">
          ✏ Edit
        </Link>

        <Link href="/create-invoice" className="btn btn-gold btn-sm">
          + New Invoice
        </Link>

        <div style={{ marginLeft: "auto" }}>
          <span
            className={`badge ${inv.outstanding > 0 ? "badge-red" : "badge-green"}`}
            style={{ fontSize: "0.82rem", padding: "0.35rem 0.9rem" }}
          >
            {inv.outstanding > 0
              ? `⚠ Outstanding: ${fmt(inv.outstanding)}`
              : "✓ Fully Paid"}
          </span>
        </div>
      </div>

      {/* ── Receipt (screen view) ── */}
      <div className="animate-fadeUp">
        <Receipt inv={inv} school={school} />
      </div>
    </AppLayout>
  );
}

export default function InvoiceDetailPage({ params }) {
  return (
    <Suspense fallback={
      <AppLayout>
        <div style={{ textAlign: "center", padding: "5rem", color: "var(--text-muted)" }}>
          Loading…
        </div>
      </AppLayout>
    }>
      <InvoiceDetailInner params={params} />
    </Suspense>
  );
}