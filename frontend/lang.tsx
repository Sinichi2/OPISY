import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { t, type Lang } from "./i18n";

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<LangState | null>(null);
const STORAGE = "opisy_lang";

function initialLang(): Lang {
  const saved = localStorage.getItem(STORAGE) as Lang | null;
  if (saved === "en" || saved === "ilo" || saved === "tl") return saved;
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith("tl") || nav.startsWith("fil")) return "tl";
  if (nav.startsWith("ilo")) return "ilo";
  return "en";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    localStorage.setItem(STORAGE, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const value: LangState = {
    lang,
    setLang: setLangState,
    t: (key) => t(key, lang),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLang outside LangProvider");
  return v;
}

export const LANG_LABELS: Record<Lang, string> = {
  en: "English", ilo: "Ilokano", tl: "Tagalog",
};
