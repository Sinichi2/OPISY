import { useEffect, useState, type FormEvent } from "react";
import { toDataURL as qrDataUrl } from "qrcode";
import { api, apiJson, ApiError } from "../api";
import { useLang } from "../lang";
import { IconPlus, IconPrinter } from "../components/Icon";

interface LocationRow { id: number; name: string }
interface TableRow { id: number; label: string; location_id: number | null; location_name: string | null }
interface PrintCard { label: string; location: string | null; dataUrl: string }

export function TablesPage() {
  const { t } = useLang();
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [qrThumbs, setQrThumbs] = useState<Record<number, string>>({});
  const [printCard, setPrintCard] = useState<PrintCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [locName, setLocName] = useState("");
  const [tableLabel, setTableLabel] = useState("");
  const [tableLoc, setTableLoc] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [l, tb] = await Promise.all([
        api<LocationRow[]>("/api/locations"),
        api<TableRow[]>("/api/tables"),
      ]);
      setLocations(l); setTables(tb); setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.key : "error_generic");
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  // Thumbnails regenerate client-side straight from the table list — no
  // server endpoint to keep in sync, no per-row loading state to manage.
  useEffect(() => {
    let cancelled = false;
    Promise.all(tables.map(async (tbl) => {
      const dataUrl = await qrDataUrl(`${window.location.origin}/?t=${tbl.id}`, { margin: 1, width: 160 });
      return [tbl.id, dataUrl] as const;
    })).then((pairs) => { if (!cancelled) setQrThumbs(Object.fromEntries(pairs)); });
    return () => { cancelled = true; };
  }, [tables]);

  // Print only the QR card: the card renders `print:flex` (hidden on
  // screen), the rest of the page renders `print:hidden`.
  useEffect(() => {
    if (!printCard) return;
    const id = requestAnimationFrame(() => window.print());
    return () => cancelAnimationFrame(id);
  }, [printCard]);
  useEffect(() => {
    const clear = () => setPrintCard(null);
    window.addEventListener("afterprint", clear);
    return () => window.removeEventListener("afterprint", clear);
  }, []);

  async function addLocation(e: FormEvent) {
    e.preventDefault();
    const name = locName.trim();
    if (!name) return;
    setBusy(true);
    try { await apiJson("/api/locations", { name }); setLocName(""); await load(); }
    catch (e) { setError(e instanceof ApiError ? e.key : "error_generic"); }
    finally { setBusy(false); }
  }

  async function delLocation(l: LocationRow) {
    if (!confirm(`${t("confirm_delete")} ${l.name}`)) return;
    try { await api(`/api/locations/${l.id}`, { method: "DELETE" }); await load(); }
    catch (e) { setError(e instanceof ApiError ? e.key : "error_generic"); }
  }

  async function addTable(e: FormEvent) {
    e.preventDefault();
    const label = tableLabel.trim();
    if (!label) return;
    setBusy(true);
    try {
      await apiJson("/api/tables", { label, location_id: tableLoc ? Number(tableLoc) : null });
      setTableLabel(""); setTableLoc(""); await load();
    } catch (e) { setError(e instanceof ApiError ? e.key : "error_generic"); }
    finally { setBusy(false); }
  }

  async function delTable(tbl: TableRow) {
    if (!confirm(`${t("confirm_delete")} ${tbl.label}`)) return;
    try { await api(`/api/tables/${tbl.id}`, { method: "DELETE" }); await load(); }
    catch (e) { setError(e instanceof ApiError ? e.key : "error_generic"); }
  }

  async function printTable(tbl: TableRow) {
    const dataUrl = await qrDataUrl(`${window.location.origin}/?t=${tbl.id}`, { margin: 2, width: 480 });
    setPrintCard({ label: tbl.label, location: tbl.location_name, dataUrl });
  }

  return (
    <>
      <main className="mx-auto max-w-5xl px-6 py-12 print:hidden">
        <header className="mb-10 border-b border-hair pb-6">
          <h1 className="font-heading text-4xl text-brown-deep">{t("nav_tables")}</h1>
          <p className="mt-3 text-sm text-mid">
            <span className="font-mono text-ink">{tables.length}</span> tables
          </p>
        </header>

        {error && <p className="mb-6 text-sm text-danger">{t(error)}</p>}

        {loading ? (
          <p className="text-mid">{t("loading")}</p>
        ) : (
          <div className="grid gap-16 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
            <section>
              <h2 className="mb-4 text-xs uppercase tracking-[0.18em] text-muted">{t("locations")}</h2>
              <ul className="mb-5 flex flex-col divide-y divide-hair border-t border-b border-hair">
                {locations.map((l) => (
                  <li key={l.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-ink">{l.name}</span>
                    <button onClick={() => delLocation(l)} className="btn-quiet hover:!text-danger">
                      {t("delete")}
                    </button>
                  </li>
                ))}
                {locations.length === 0 && (
                  <li className="py-6 text-center text-sm text-muted">{t("no_location")}</li>
                )}
              </ul>
              <form onSubmit={addLocation} className="flex gap-2">
                <input
                  value={locName} onChange={(e) => setLocName(e.target.value)}
                  aria-label={t("locations")} className="field"
                />
                <button type="submit" disabled={busy || !locName.trim()} className="btn-ghost shrink-0" aria-label={t("add_location")}>
                  <IconPlus size={12} />
                </button>
              </form>
            </section>

            <section>
              <h2 className="mb-4 text-xs uppercase tracking-[0.18em] text-muted">{t("nav_tables")}</h2>

              <form onSubmit={addTable} className="mb-6 flex flex-wrap items-end gap-4 border-b border-hair pb-6">
                <label className="flex min-w-[10rem] flex-1 flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.14em] text-muted">{t("table_label")}</span>
                  <input value={tableLabel} onChange={(e) => setTableLabel(e.target.value)} className="field" />
                </label>
                <label className="flex min-w-[10rem] flex-1 flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.14em] text-muted">{t("location")}</span>
                  <select value={tableLoc} onChange={(e) => setTableLoc(e.target.value)} className="field">
                    <option value="">{t("no_location")}</option>
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </label>
                <button type="submit" disabled={busy || !tableLabel.trim()} className="btn-primary">
                  <IconPlus size={14} />
                  {t("add_table")}
                </button>
              </form>

              {tables.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">{t("tables_empty")}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-hair border-t border-b border-hair">
                  {tables.map((tbl) => (
                    <li key={tbl.id} className="flex items-center gap-4 py-3">
                      {qrThumbs[tbl.id]
                        ? <img src={qrThumbs[tbl.id]} alt="" className="h-12 w-12 border border-hair bg-white" />
                        : <div className="h-12 w-12 shrink-0 border border-dashed border-hair-strong" />}
                      <div className="flex-1">
                        <p className="text-sm text-ink">{tbl.label}</p>
                        <p className="text-xs text-muted">{tbl.location_name ?? t("no_location")}</p>
                      </div>
                      <button onClick={() => printTable(tbl)} className="btn-quiet">
                        <IconPrinter size={12} />
                        {t("print_qr")}
                      </button>
                      <button onClick={() => delTable(tbl)} className="btn-quiet hover:!text-danger">
                        {t("delete")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>

      {printCard && (
        <div className="hidden print:flex print:min-h-screen print:flex-col print:items-center print:justify-center print:gap-6">
          <img src={printCard.dataUrl} alt="" className="h-72 w-72" />
          <p className="font-heading text-3xl text-brown-deep">{printCard.label}</p>
          {printCard.location && <p className="text-lg text-mid">{printCard.location}</p>}
        </div>
      )}
    </>
  );
}
