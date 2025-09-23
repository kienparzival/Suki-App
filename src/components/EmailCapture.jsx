import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { getFirstAttribution } from '../lib/utm.js'

export default function EmailCapture({ defaultCity = 'Hanoi' }) {
  const [email, setEmail] = useState('')
  const [city, setCity] = useState(defaultCity)
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    // store first-touch UTM once (ignore errors)
    const attrib = getFirstAttribution()
    ;(async () => {
      try {
        const { error } = await supabase.from('session_attributions').insert({
          utm_source: attrib.utm_source,
          utm_medium: attrib.utm_medium,
          utm_campaign: attrib.utm_campaign,
          utm_content: attrib.utm_content,
          utm_term: attrib.utm_term,
          referrer: attrib.referrer
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
    
    const { error } = await supabase.from('email_subscribers').insert({ 
      email: email.trim(), 
      city 
    })
    
    if (error) {
      setErr(error.message)
    } else {
      setOk(true)
      setEmail('')
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        required
        className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none"
        placeholder="Your email for the weekly digest"
        value={email} 
        onChange={e => setEmail(e.target.value)}
      />
      <select
        className="px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-indigo-500"
        value={city} 
        onChange={e => setCity(e.target.value)}
      >
        <option>Hanoi</option>
        <option>Ho Chi Minh City</option>
        <option>Da Nang</option>
        <option>All</option>
      </select>
      <button className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
        Subscribe
      </button>
      {ok && <span className="text-emerald-600">Subscribed! 🎉</span>}
      {err && <span className="text-red-600">{err}</span>}
    </form>
  )
}
