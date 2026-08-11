/**
 * Transformation step: map whatever the staff called their columns onto the
 * fields the database stores, and turn text into numbers.
 *
 * ALIASES is the calibration knob. When a real Panziann workbook shows up with
 * a column this does not recognise, add the header to the list below -- that is
 * the only edit needed, no code change.
 */
export interface Product {
  name: string;
  category: string | null;
  unit: string | null;
  location: string | null;
  supplier: string | null;
  quantity: number | null;
  unitPrice: number | null;
}

// canonical field -> header spellings seen in the wild (English + Filipino)
const ALIASES: Record<string, string[]> = {
  name: ["name", "product", "product name", "item", "item name", "description",
    "pangalan", "produkto", "sangkap", "nagan"],
  category: ["category", "type", "group", "section", "kategorya", "uri"],
  unit: ["unit", "uom", "unit of measure", "measure", "packaging", "yunit"],
  location: ["location", "storage", "shelf", "lokasyon", "ayan"],
  supplier: ["supplier", "vendor", "supplier name", "provider", "sapplayer"],
  quantity: ["quantity", "qty", "stock", "on hand", "count", "beginning",
    "dami", "bilang", "stock on hand"],
  unit_price: ["unit price", "price", "cost", "unit cost", "srp", "amount",
    "presyo", "halaga"],
};

const LOOKUP = new Map<string, string>();
for (const [field, spellings] of Object.entries(ALIASES)) {
  for (const spelling of spellings) LOOKUP.set(spelling, field);
}

/** Lowercase, strip punctuation, collapse spaces: "Unit_Price (PHP)" -> "unit price". */
export function normalizeHeader(header: string): string {
  const noParens = header.toLowerCase().replace(/\(.*?\)/g, " ");
  return noParens.replace(/[^a-z0-9]+/g, " ").trim();
}

/** "PHP 1,250.50" -> 1250.5 ; junk -> null. */
export function toNumber(text: string | undefined): number | null {
  if (!text) return null;
  const stripped = text.replace(/[^0-9.-]/g, "");
  if (!stripped) return null;
  const n = Number(stripped);
  return Number.isNaN(n) ? null : n;
}

export interface TransformResult {
  products: Product[];
  skipped: number;
}

/** Returns the recognised products, and how many rows had no recognisable name. */
export function transform(rawRows: Record<string, string>[]): TransformResult {
  const products: Product[] = [];
  let skipped = 0;

  for (const raw of rawRows) {
    const fields: Record<string, string> = {};
    for (const [header, value] of Object.entries(raw)) {
      const field = LOOKUP.get(normalizeHeader(header));
      if (field && value) fields[field] = value;
    }
    if (!fields.name) {
      skipped++;
      continue;
    }
    products.push({
      name: fields.name,
      category: fields.category ?? null,
      unit: fields.unit ?? null,
      location: fields.location ?? null,
      supplier: fields.supplier ?? null,
      quantity: toNumber(fields.quantity),
      unitPrice: toNumber(fields.unit_price),
    });
  }
  return { products, skipped };
}
