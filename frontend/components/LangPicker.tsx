import { LANG_LABELS, useLang } from "../lang";
import type { Lang } from "../i18n";

const CODES: Lang[] = ["en", "ilo", "tl"];

export function LangPicker() {
  const { lang, setLang } = useLang();
  return (
    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em]">
      {CODES.map((c, i) => (
        <span key={c} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="text-hair-strong">·</span>}
          <button
            onClick={() => setLang(c)}
            title={LANG_LABELS[c]}
            aria-pressed={lang === c}
            className={`transition-colors ${
              lang === c ? "text-brown-deep" : "text-muted hover:text-brown-deep"
            }`}
          >
            {c}
          </button>
        </span>
      ))}
    </div>
  );
}
