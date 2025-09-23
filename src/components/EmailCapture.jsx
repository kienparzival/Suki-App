import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { getFirstAttribution } from '../lib/utm.js'
import { posthog } from '../lib/analytics.js'

export default function EmailCapture() {
  const [email, setEmail] = useState('')
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // best-effort store first-touch attribution server-side
    const a = getFirstAttribution()
    ;(async () => {
      try {
        const { error } = await supabase.from('session_attributions').insert({
          utm_source: a.utm_source,
          utm_medium: a.utm_medium,
          utm_campaign: a.utm_campaign,
          utm_content: a.utm_content,
          utm_term: a.utm_term,
          referrer: a.referrer
        })
        if (error) {
          console.log('Attribution tracking error (ignored):', error)
        }
      } catch (e) {
        console.log('Attribution tracking error (ignored):', e)
      }
    })()
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setOk(false)
    setLoading(true)
    const clean = email.trim().toLowerCase()
    if (!clean) { 
      setErr('Please enter your email.')
      setLoading(false)
      return 
    }

    const { error } = await supabase.from('email_subscribers').insert({ 
      email: clean, 
      city: null 
    })
    setLoading(false)
    if (error) {
      setErr(error.message)
      return
    }
    setOk(true)
    setEmail('')
    // analytics
    posthog.capture('subscribe_email', { 
      email_domain: clean.split('@')[1] || '' 
    })
  }

  return (
    <div className="relative">
      {/* gradient ring */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 rounded-2xl blur opacity-30" aria-hidden />
      <div className="relative rounded-2xl bg-white/70 backdrop-blur px-6 py-6 sm:px-8 sm:py-8 shadow-lg">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
          Get the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500">Suki Weekly</span>
        </h3>
        <p className="mt-1.5 text-sm text-slate-600">
          A short Friday email with the best events in Hà Nội. No spam. Unsubscribe anytime.
        </p>

        {!ok ? (
          <form onSubmit={onSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
            <label htmlFor="email-capture" className="sr-only">Email address</label>
            <input
              id="email-capture"
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-slate-900 placeholder-slate-400 bg-white"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold shadow hover:brightness-110 disabled:opacity-60"
            >
              {loading ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        ) : (
          <div className="mt-4 inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
              <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z"/>
            </svg>
            Subscribed! We'll send your first digest this Friday.
          </div>
        )}

        <p className="mt-3 text-xs text-slate-500">
          By subscribing, you agree to receive the weekly digest from Suki. We never share your email.
        </p>
      </div>
    </div>
  )
}
