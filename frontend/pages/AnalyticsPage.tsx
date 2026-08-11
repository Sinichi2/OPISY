import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { api, ApiError } from "../api";
import { useLang } from "../lang";

interface DailySale { day: string; orders: number; revenue: number }
interface TopItem   { id: number; name: string; units: number; revenue: number }
interface WasteRow  { day: string; reason_code: string; quantity_wasted: number }
interface LowStock  { id: number; name: string; category: string | null; unit: string | null; quantity: number; low_stock_threshold: number }

function todayISO()  { return new Date().toISOString().slice(0, 10); }
function daysAgoISO(n: number) { return new Date(Date.now() - n * 86400_000).toISOString().slice(0, 10); }

export function AnalyticsPage() {
  const { t } = useLang();
  const [from, setFrom] = useState(daysAgoISO(30));
  const [to,   setTo]   = useState(todayISO());
  const [sales, setSales] = useState<{ daily: DailySale[]; top: TopItem[] } | null>(null);
  const [waste, setWaste] = useState<WasteRow[]>([]);
  const [low,   setLow]   = useState<LowStock[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api<{ daily: DailySale[]; top: TopItem[] }>(`/api/analytics/sales?from=${from}&to=${to}`),
      api<{ rows: WasteRow[] }>(`/api/analytics/waste?from=${from}&to=${to}`),
      api<LowStock[]>("/api/analytics/low-stock"),
    ])
      .then(([s, w, l]) => { setSales(s); setWaste(w.rows); setLow(l); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.key : "error_generic"))
      .finally(() => setLoading(false));
  }, [from, to]);

  // Waste: pivot rows into series per reason_code.
  const wasteByDay = new Map<string, Record<string, number>>();
  for (const r of waste) {
    if (!wasteByDay.has(r.day)) wasteByDay.set(r.day, { day: r.day } as any);
    wasteByDay.get(r.day)![r.reason_code] = r.quantity_wasted;
  }
  const wasteRows = [...wasteByDay.values()].map((r) => ({ ...r, day: r.day as any }));
  const reasons = Array.from(new Set(waste.map((w) => w.reason_code)));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 font-heading text-3xl text-brown">{t("nav_analytics")}</h1>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="rounded-button border border-brown/30 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="rounded-button border border-brown/30 px-3 py-2" />
        </label>
      </div>

      {loading && <p>{t("loading")}</p>}
      {error && <p className="text-danger">{t(error)}</p>}

      {sales && (
        <>
          <section className="mb-8 rounded-card bg-white p-4 shadow">
            <h2 className="mb-3 font-heading text-xl text-brown">Daily sales</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <LineChart data={sales.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="l" orientation="left" />
                  <YAxis yAxisId="r" orientation="right" />
                  <Tooltip /><Legend />
                  <Line yAxisId="l" type="monotone" dataKey="revenue" stroke="#8f7158" name="Revenue (₱)" />
                  <Line yAxisId="r" type="monotone" dataKey="orders"  stroke="#212529" name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="mb-8 rounded-card bg-white p-4 shadow">
            <h2 className="mb-3 font-heading text-xl text-brown">Top dishes</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart data={sales.top} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={140} />
                  <Tooltip />
                  <Bar dataKey="units" fill="#8f7158" name="Units sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      {reasons.length > 0 && (
        <section className="mb-8 rounded-card bg-white p-4 shadow">
          <h2 className="mb-3 font-heading text-xl text-brown">Waste by reason</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={wasteRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip /><Legend />
                {reasons.map((r, i) => (
                  <Bar key={r} dataKey={r} stackId="w" fill={["#b91c1c", "#f59e0b", "#8f7158"][i % 3]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {low.length > 0 && (
        <section className="mb-8 rounded-card bg-white p-4 shadow">
          <h2 className="mb-3 font-heading text-xl text-brown">Low-stock products</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {low.map((p) => (
              <li key={p.id} className="flex justify-between border-b border-brown/10 py-1">
                <span>{p.name} <span className="text-mid">({p.category ?? "—"})</span></span>
                <span className="font-mono text-danger">{p.quantity}/{p.low_stock_threshold} {p.unit ?? ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
