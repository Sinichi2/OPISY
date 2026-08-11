import * as XLSX from "xlsx";

/**
 * Extraction step: pull raw rows out of a staff-supplied Excel workbook.
 *
 * Nothing is cleaned here. Every sheet is read, every row comes back as a
 * {header: value} record of strings, exactly as it was typed.
 */
export function readRows(fileBytes: ArrayBuffer): Record<string, string>[] {
  const workbook = XLSX.read(fileBytes, { type: "array" });
  const rows: Record<string, string>[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]!;
    const grid: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });

    let header: string[] | null = null;
    for (const rawCells of grid) {
      const cells = rawCells.map((c) => String(c ?? "").trim());

      if (header === null) {
        // ponytail: header = first row with 2+ filled cells. Covers the
        // title/logo rows real sheets have on top. If a sheet ever needs
        // an explicit header row number, pass it in per sheet.
        if (cells.filter(Boolean).length >= 2) {
          header = cells;
        }
        continue;
      }
      if (cells.some(Boolean)) {
        const row: Record<string, string> = {};
        header.forEach((h, i) => (row[h] = cells[i] ?? ""));
        rows.push(row);
      }
    }
  }
  return rows;
}
