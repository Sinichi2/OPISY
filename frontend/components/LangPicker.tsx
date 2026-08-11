import { useEffect, useRef, useState } from "react";
import { LANG_LABELS, useLang } from "../lang";
import type { Lang } from "../i18n";
import { IconGlobe, IconChevron, IconCheck } from "./Icon";

const CODES: Lang[] = ["en", "ilo", "tl"];

export function LangPicker() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="change language"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-button px-2 py-1.5 text-xs uppercase tracking-[0.14em] text-mid transition-colors hover:text-brown-deep"
      >
        <IconGlobe size={16} />
        <span className="font-mono">{lang}</span>
        <IconChevron size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 min-w-[180px] border border-hair bg-paper py-1"
        >
          {CODES.map((c) => {
            const active = lang === c;
            return (
              <button
                key={c}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => { setLang(c); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-4 px-4 py-2 text-left text-sm transition-colors ${
                  active ? "text-brown-deep" : "text-ink hover:bg-ivory/60"
                }`}
              >
                <span className="flex items-baseline gap-3">
                  <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted">{c}</span>
                  <span>{LANG_LABELS[c]}</span>
                </span>
                {active && <IconCheck size={14} className="text-brown-deep" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
