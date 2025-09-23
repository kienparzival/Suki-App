import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import en from './en.json'
import vi from './vi.json'

const DICT = { en, vi }

const LangContext = createContext({ lang: 'en', setLang: () => {}, t: (k, v) => k })

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('suki_lang') || 'en')
  useEffect(() => { localStorage.setItem('suki_lang', lang) }, [lang])
  const t = useMemo(() => (key, vars = {}) => {
    let s = DICT[lang]?.[key] ?? key
    Object.entries(vars).forEach(([k, v]) => { s = s.replaceAll(`{${k}}`, v) })
    return s
  }, [lang])
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)


