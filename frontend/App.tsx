import { useEffect, useRef, useState } from 'react'
import { t, type Lang } from './i18n'

type Result =
  | { ok: true; inserted: number; updated: number; skipped: number }
  | { ok: false; errorKey: string }

function App() {
  const [lang, setLang] = useState<Lang>('en')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = t('window_title', lang)
  }, [lang])

  async function upload(file: File) {
    setLoading(true)
    setResult(null)
    const body = new FormData()
    body.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body })
      const data = await res.json()
      setResult(res.ok ? { ok: true, ...data } : { ok: false, errorKey: data.error })
    } catch {
      setResult({ ok: false, errorKey: 'upload_failed' })
    } finally {
      setLoading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-8 bg-white px-6 text-center dark:bg-neutral-900">
      <div className="absolute top-4 right-4 flex gap-2">
        {(['en', 'ilo'] as const).map((code) => (
          <button
            key={code}
            onClick={() => setLang(code)}
            className={`rounded px-3 py-1 text-sm font-semibold uppercase ${
              lang === code
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
            }`}
          >
            {code}
          </button>
        ))}
      </div>

      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{t('heading', lang)}</h1>
        <p className="mt-2 text-lg text-neutral-500 dark:text-neutral-400">{t('subheading', lang)}</p>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept=".xlsx,.xlsm"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <button
        onClick={() => fileInput.current?.click()}
        disabled={loading}
        className="rounded-xl bg-green-700 px-10 py-6 text-2xl font-bold text-white shadow-lg hover:bg-green-800 disabled:opacity-50"
      >
        {loading ? t('loading', lang) : t('choose_file', lang)}
      </button>

      {result && (
        <p
          className={`text-lg font-medium whitespace-pre-line ${
            result.ok ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {result.ok
            ? `${t('done', lang)}\n${result.inserted} ${t('new_products', lang)}\n${result.updated} ${t('updated', lang)}\n${result.skipped} ${t('skipped', lang)}`
            : `${t('upload_failed', lang)}\n${t(result.errorKey, lang)}`}
        </p>
      )}
    </div>
  )
}

export default App
