"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { api, fmt, fmtShort } from "@/lib/api";

function RevenueChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!data?.length) return;
    import("chart.js/auto").then(({ default: Chart }) => {
      if (chartRef.current) chartRef.current.destroy();
      const ctx = canvasRef.current.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 0, 250);
      grad.addColorStop(0, "rgba(15,31,61,.15)");
      grad.addColorStop(1, "rgba(15,31,61,.01)");

      chartRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: data.map((d) => d.date),
          datasets: [{
            data: data.map((d) => d.amount),
            borderColor: "#0f1f3d",
            borderWidth: 2.5,
            backgroundColor: grad,
            fill: true,
            tension: 0.42,
            pointRadius: 5,
            pointBackgroundColor: "#fff",
            pointBorderColor: "#0f1f3d",
            pointBorderWidth: 2.5,
            pointHoverRadius: 7,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#0f1f3d",
              titleColor: "rgba(255,255,255,.6)",
              bodyColor: "#fff",
              padding: 10,
              cornerRadius: 8,
              callbacks: { label: (c) => " " + fmt(c.parsed.y) },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 }, color: "#9ca3af" },
            },
            y: {
              grid: { color: "rgba(0,0,0,.04)", drawBorder: false },
              ticks: {
                font: { size: 11 }, color: "#9ca3af",
                callback: (v) => v >= 1000 ? `₦${(v/1000).toFixed(0)}k` : `₦${v}`,
              },
              border: { display: false },
            },
          },
        },
      });
    });
    return () => chartRef.current?.destroy();
  }, [data]);

  return <canvas ref={canvasRef} />;
}

const STATS_CONFIG = [
  { key: "totalRevenue",        label: "Total Revenue",          icon: "₦", bg: "#e8f0fe", color: "#1a73e8" },
  { key: "schoolFeesCollected", label: "School Fees Collected",  icon: "📚", bg: "#e6f4ea", color: "#2e8b57" },
  { key: "productsSold",        label: "Products Sold",          icon: "🛒", bg: "#fff0e6", color: "#c05000" },
  { key: "externalExams",       label: "External Exams",         icon: "🎓", bg: "#fef7e0", color: "#b06000" },
  { key: "outstanding",         label: "Outstanding",            icon: "⚠", bg: "#fdeaea", color: "#e05252" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("rsa_token")) { router.push("/"); return; }
    api.getDashboard()
      .then((d) => setStats(d.stats))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of payments and invoices</p>
        </div>
        <Link href="/create-invoice" className="btn btn-primary">+ New Invoice</Link>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "5rem", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏳</div>
          Loading dashboard…
        </div>
      ) : error ? (
        <div style={{ padding: "2rem", background: "var(--red-pale)", borderRadius: 12, color: "var(--red)", textAlign: "center" }}>
          ⚠ {error} — <button onClick={() => window.location.reload()} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", textDecoration: "underline" }}>Retry</button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "0.9rem", marginBottom: "1.5rem" }}>
            {STATS_CONFIG.map(({ key, label, icon, bg, color }) => (
              <div key={key} className="stat-card animate-fadeUp">
                <div className="stat-icon" style={{ background: bg, color }}>{icon}</div>
                <div>
                  <div className="stat-label">{label}</div>
                  <div className="stat-value" style={key === "outstanding" ? { color: "var(--red)" } : {}}>
                    {fmt(stats?.[key] || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="card" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--navy)" }}>Revenue Over Time</h2>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Cumulative</span>
            </div>
            <div style={{ height: 230 }}>
              {stats?.chartData?.length > 0
                ? <RevenueChart data={stats.chartData} />
                : <p style={{ color: "var(--text-muted)", textAlign: "center", paddingTop: "5rem" }}>No revenue data yet</p>
              }
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="card">
            <div style={{
              padding: "0.9rem 1.25rem",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--navy)" }}>Recent Invoices</h2>
              <Link href="/invoices" style={{ fontSize: "0.8rem", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Student Name</th>
                    <th>Date</th>
                    <th style={{ textAlign: "right" }}>Amount Paid</th>
                    <th style={{ textAlign: "right" }}>Outstanding</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentInvoices || []).map((inv) => (
                    <tr key={inv._id}>
                      <td>
                        <Link href={`/invoices/${inv._id}`} className="inv-link">{inv.invoiceNo}</Link>
                      </td>
                      <td style={{ fontWeight: 500 }}>{inv.studentName}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{fmtShort(inv.date)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(inv.amountPaid)}</td>
                      <td style={{ textAlign: "right" }}>
                        {inv.outstanding > 0
                          ? <span className="badge badge-red">{fmt(inv.outstanding)}</span>
                          : <span className="badge badge-green">Paid</span>
                        }
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                          <Link href={`/invoices/${inv._id}`} className="btn btn-ghost btn-sm">View</Link>
                          <Link href={`/invoices/${inv._id}?print=1`} className="btn btn-ghost btn-sm">Print</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!stats?.recentInvoices?.length) && (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No invoices yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
