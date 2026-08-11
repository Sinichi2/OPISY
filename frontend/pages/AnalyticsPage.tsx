import { useEffect, useMemo, useState } from "react";
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

// Pull chart colors from the DESIGN.md-backed CSS vars so recharts never carries literal hex.
function useChartTheme() {
  const [t, set] = useState<{
    axis: string; grid: string; line: string;
    paper: string; ink: string; mid: string; muted: string;
    palette: string[];
  } | null>(null);
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const v = (n: string) => cs.getPropertyValue(n).trim();
    set({
      axis:   v("--color-hair-strong"),
      grid:   v("--color-hair"),
      line:   v("--color-hair-strong"),
      paper:  v("--color-paper"),
      ink:    v("--color-ink"),
      mid:    v("--color-mid"),
      muted:  v("--color-muted"),
      palette: [
        v("--color-brown-deep"),
        v("--color-brown"),
        v("--color-warn-fg"),
        v("--color-ok-fg"),
        v("--color-info-fg"),
        v("--color-danger"),
      ],
    });
  }, []);
  return t;
}

export function AnalyticsPage() {
  const { t } = useLang();
  const theme = useChartTheme();
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

  const wasteByDay = new Map<string, Record<string, number>>();
  for (const r of waste) {
    if (!wasteByDay.has(r.day)) wasteByDay.set(r.day, { day: r.day } as any);
    wasteByDay.get(r.day)![r.reason_code] = r.quantity_wasted;
  }
  const wasteRows = [...wasteByDay.values()].map((r) => ({ ...r, day: r.day as any }));
  const reasons = Array.from(new Set(waste.map((w) => w.reason_code)));

  const totalRevenue = sales?.daily.reduce((s, d) => s + d.revenue, 0) ?? 0;
  const totalOrders  = sales?.daily.reduce((s, d) => s + d.orders, 0) ?? 0;

  const chart = useMemo(() => {
    if (!theme) return null;
    return {
      axisTick: { fontSize: 11, fill: theme.muted, fontFamily: "JetBrains Mono, ui-monospace" },
      axisTickBody: { fontSize: 11, fill: theme.muted, fontFamily: "ElliotSans, sans-serif" },
      axisLine: { stroke: theme.axis },
      grid: theme.grid,
      tooltip: {
        background: theme.paper,
        border: `1px solid ${theme.line}`,
        borderRadius: 4,
        fontSize: 12,
        color: theme.ink,
      },
      legend: { fontSize: 12, color: theme.mid },
    };
  }, [theme]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 border-b border-hair pb-6">
        <h1 className="font-heading text-4xl text-brown-deep">{t("nav_analytics")}</h1>
        <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.14em] text-muted">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field w-40" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.14em] text-muted">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field w-40" />
          </label>
          <div className="ml-auto flex gap-8 text-sm text-mid">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Revenue</p>
              <p className="mt-1 font-mono text-xl text-brown-deep">₱{totalRevenue.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Orders</p>
              <p className="mt-1 font-mono text-xl text-brown-deep">{totalOrders}</p>
            </div>
          </div>
        </div>
      </header>

      {loading && <p className="text-mid">{t("loading")}</p>}
      {error && <p className="text-sm text-danger">{t(error)}</p>}

      {sales && chart && theme && (
        <div className="flex flex-col gap-16">
          <Panel title="Daily sales">
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <LineChart data={sales.daily} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={chart.grid} vertical={false} />
                  <XAxis dataKey="day" tick={chart.axisTick} axisLine={chart.axisLine} tickLine={false} />
                  <YAxis yAxisId="l" orientation="left"  tick={chart.axisTick} axisLine={chart.axisLine} tickLine={false} />
                  <YAxis yAxisId="r" orientation="right" tick={chart.axisTick} axisLine={chart.axisLine} tickLine={false} />
                  <Tooltip contentStyle={chart.tooltip} cursor={{ stroke: chart.grid }} />
                  <Legend wrapperStyle={chart.legend} />
                  <Line yAxisId="l" type="monotone" dataKey="revenue" stroke={theme.palette[0]} strokeWidth={1.5} dot={false} name="Revenue (₱)" />
                  <Line yAxisId="r" type="monotone" dataKey="orders"  stroke={theme.palette[1]} strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Top dishes">
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <BarChart data={sales.top} layout="vertical" margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={chart.grid} horizontal={false} />
                  <XAxis type="number" tick={chart.axisTick} axisLine={chart.axisLine} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={160}
                    tick={chart.axisTickBody} axisLine={chart.axisLine} tickLine={false} />
                  <Tooltip contentStyle={chart.tooltip} cursor={{ fill: chart.grid }} />
                  <Bar dataKey="units" fill={theme.palette[0]} name="Units sold" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      )}

      {reasons.length > 0 && chart && theme && (
        <div className="mt-16">
          <Panel title="Waste by reason">
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <BarChart data={wasteRows} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={chart.grid} vertical={false} />
                  <XAxis dataKey="day" tick={chart.axisTick} axisLine={chart.axisLine} tickLine={false} />
                  <YAxis tick={chart.axisTick} axisLine={chart.axisLine} tickLine={false} />
                  <Tooltip contentStyle={chart.tooltip} cursor={{ fill: chart.grid }} />
                  <Legend wrapperStyle={chart.legend} />
                  {reasons.map((r, i) => (
                    <Bar key={r} dataKey={r} stackId="w" fill={theme.palette[(i + 2) % theme.palette.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      )}

      {low.length > 0 && (
        <div className="mt-16">
          <Panel title="Low-stock products">
            <ul className="divide-y divide-hair border-t border-b border-hair">
              {low.map((p) => (
                <li key={p.id} className="flex items-baseline justify-between py-3 text-sm">
                  <span className="text-ink">
                    {p.name}
                    <span className="ml-3 text-xs text-muted">{p.category ?? "—"}</span>
                  </span>
                  <span className="font-mono text-danger">
                    {p.quantity}
                    <span className="mx-1 text-hair-strong">/</span>
                    {p.low_stock_threshold}
                    {p.unit && <span className="ml-1 text-muted">{p.unit}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-6 flex items-baseline gap-4 border-b border-hair pb-3">
        <span className="font-heading text-2xl text-brown-deep">{title}</span>
      </h2>
      {children}
    </section>
  );
}
