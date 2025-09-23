// Language context for EN/VI translation support - Updated for Vercel deployment
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import en from './en.json'
import vi from './vi.json'

const DICT = { en, vi }

const LangContext = createContext({ lang: 'en', setLang: () => {}, t: (k, v) => k })

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('suki_lang') || 'en')
  useEffect(() => { localStorage.setItem('suki_lang', lang) }, [lang])
  const t = useMemo(() => (key, vars = {}) => {
    let s = DICT[lang]?.[key] ?? DICT.en?.[key] ?? key
    if ((process.env.NODE_ENV !== 'production') && (s === key)) {
      // eslint-disable-next-line no-console
      console.warn(`[i18n] Missing key in ${lang}:`, key)
    }
    Object.entries(vars).forEach(([k, v]) => { s = s.replaceAll(`{${k}}`, String(v)) })
    return s
  }, [lang])
  const fmtDate = useMemo(() => (d, opts={ dateStyle:'medium', timeStyle:'short' }) => {
    try { return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', opts).format(new Date(d)) }
    catch { return d }
  }, [lang])
  const fmtNumber = useMemo(() => (n) => new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US').format(n), [lang])

  return <LangContext.Provider value={{ lang, setLang, t, fmtDate, fmtNumber }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)


