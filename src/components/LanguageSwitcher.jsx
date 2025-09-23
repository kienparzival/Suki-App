import { useLang } from '../i18n/LangContext.jsx'

export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang } = useLang()
  const btn = 'px-3 py-1.5 text-sm font-semibold rounded-full transition focus:outline-none focus:ring-2 focus:ring-offset-2'
  return (
    <div className={`inline-flex items-center gap-1 rounded-full bg-white/70 backdrop-blur p-1 ${className}`}>
      <button onClick={() => setLang('en')} className={`${btn} ${lang==='en' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>EN</button>
      <button onClick={() => setLang('vi')} className={`${btn} ${lang==='vi' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>VI</button>
    </div>
  )
}


