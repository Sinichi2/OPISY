export const DEFAULT_LANG = "en";

export const STRINGS = {
  window_title: { en: "Pan - Inventory Management System", ilo: "Panziann Imbentaryo - Iyapload", "tl": "Panziann Inventory: I-upload"},
  heading: { en: "Upload current Inventory ", ilo: "Iyapload ti Excel", "tl": "I-upload ti kasalukuyang Imbentaryo" },
  subheading: { en: "Press to upload", ilo: "Pindutem ti buton", "tl": "I-click para i-upload" },
  // choose_file: { en: "CHOOSE FILE", ilo: "PILIEN TI FILE", "tl": "PILIA AN FILE" },
  loading: { en: "Loading...", ilo: "Ur-urayem...", "tl": "Naglo-load..." },
  done: { en: "Done!", ilo: "Nalpasen!", "tl": "Tapos na!" },
  new_products: { en: "new products", ilo: "baro a produkto", "tl": "mga bagong produkto" },
  updated: { en: "updated", ilo: "na-update", "tl": "na-update" },
  skipped: { en: "skipped", ilo: "nalabsan" },
  upload_failed: { en: "Upload failed.", ilo: "Saan a nag-upload." },
  no_products: {
    en: "No products found. The sheet needs a column named Product or Item.",
    ilo: "Awan nabirukan a produkto. Kasapulan ti kolum nga Product wenno Item.",
  },
} as const;

export type Lang = "en" | "ilo" | "tl";

export function t(key: string, lang: string): string {
  const entry = (STRINGS as Record<string, Record<string, string>>)[key];
  if (!entry) return key;
  return entry[lang] ?? entry[DEFAULT_LANG] ?? key;
}
