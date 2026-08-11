// ponytail: duplicated from server/i18n.ts (same 12 keys) rather than sharing a
// module across the two tsconfig projects (app vs server) -- that cross-project
// import fights the bundler/composite setup for very little payoff at this size.
// Keep both files in sync by hand; promote to a shared package if it grows.
export const DEFAULT_LANG = "en";

export const STRINGS = {
  window_title: { en: "Panziann Inventory - Upload", ilo: "Panziann Imbentaryo - Iyapload" },
  heading: { en: "Upload Excel File", ilo: "Iyapload ti Excel" },
  subheading: { en: "Press the button, find the file.", ilo: "Pindutem ti buton, tapno mabiruk mo ta file." },
  choose_file: { en: "CHOOSE FILE", ilo: "PILIEN TI FILE" },
  loading: { en: "Loading...", ilo: "Ur-urayem..." },
  done: { en: "Done!", ilo: "Nalpasen!" },
  new_products: { en: "new products", ilo: "baro a produkto" },
  updated: { en: "updated", ilo: "na-update" },
  skipped: { en: "skipped", ilo: "nalabsan" },
  upload_failed: { en: "Upload failed.", ilo: "Saan a nag-upload." },
  no_products: {
    en: "No products found. The sheet needs a column named Product or Item.",
    ilo: "Awan nabirukan a produkto. Kasapulan ti kolum nga Product wenno Item.",
  },
} as const;

export type Lang = "en" | "ilo" | "tl";

/** Looks up text by key + language. Falls back to DEFAULT_LANG, then to the key itself. */
export function t(key: string, lang: string): string {
  const entry = (STRINGS as Record<string, Record<string, string>>)[key];
  if (!entry) return key;
  return entry[lang] ?? entry[DEFAULT_LANG] ?? key;
}
