import React, { useEffect, useRef, useState } from 'react'

const isNum = (x) => typeof x === 'number' && !Number.isNaN(x)

export default function PlaceSearch({ onPlaceSelect, placeholder = "Tìm địa điểm (VN)..." }) {
  const [term, setTerm] = useState('')
  const [sugs, setSugs] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  const fetchSugs = async (q) => {
    const key = import.meta.env.VITE_GEOAPIFY_API_KEY
    if (!key) { console.warn('Missing VITE_GEOAPIFY_API_KEY'); return }
    setLoading(true)
    try {
      // VN-only, Vietnamese labels, up to 8 results
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(q)}&filter=countrycode:vn&lang=vi&limit=8&apiKey=${key}`
      const r = await fetch(url)
      if (!r.ok) throw new Error('Geoapify failed')
      const json = await r.json()
      const items = (json.features || []).map(f => {
        const p = f.properties || {}
        
        // Build detailed address from components
        const addressParts = []
        if (p.house_number) addressParts.push(p.house_number)
        if (p.street) addressParts.push(p.street)
        if (p.suburb) addressParts.push(p.suburb)
        if (p.district) addressParts.push(p.district)
        if (p.city) addressParts.push(p.city)
        if (p.state) addressParts.push(p.state)
        if (p.country) addressParts.push(p.country)
        
        const fullAddress = addressParts.join(', ')
        
        return {
          id: f.properties.place_id || `${p.lat},${p.lon}`,
          title: p.name || p.street || p.formatted || p.address_line1 || p.city || p.county || 'Địa điểm',
          subtitle: fullAddress || p.formatted || [p.address_line1, p.address_line2].filter(Boolean).join(', '),
          lat: Number(p.lat),
          lng: Number(p.lon),
          fullAddress: fullAddress || p.formatted || p.address_line1 || p.address_line2 || '',
        }
      }).filter(it => isNum(it.lat) && isNum(it.lng))
      setSugs(items)
      setOpen(true)
    } catch (e) {
      console.warn(e)
      setSugs([])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const onChange = (e) => {
    const v = e.target.value
    setTerm(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (v.trim().length < 3) { setSugs([]); setOpen(false); return }
    debounceRef.current = setTimeout(() => fetchSugs(v.trim()), 250)
  }

  const pick = (s) => {
    if (!isNum(s.lat) || !isNum(s.lng)) return
    onPlaceSelect({
      name: s.title,
      address: s.fullAddress || s.subtitle,
      coordinates: [s.lat, s.lng],
    })
    // Show the place name + comma + complete address in the search input
    const fullAddress = s.fullAddress || s.subtitle || ''
    const displayText = fullAddress ? `${s.title}, ${fullAddress}` : s.title
    setTerm(displayText)
    setOpen(false)
  }

  return (
    <div className="relative" style={{ zIndex: 1000 }}>
      <input
        ref={inputRef}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
        placeholder={placeholder}
        value={term}
        onChange={onChange}
        onFocus={() => sugs.length && setOpen(true)}
      />
      {open && (
        <div 
          className="absolute bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-auto w-full"
          style={{ 
            zIndex: 99999,
            top: '100%',
            left: 0,
            marginTop: '4px'
          }}
        >
          {loading && <div className="p-2 text-sm text-gray-500">Đang tìm…</div>}
          {!loading && sugs.length === 0 && <div className="p-2 text-sm text-gray-500">Không có gợi ý</div>}
          {sugs.map(s => (
            <button key={s.id} className="w-full text-left p-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0" onClick={() => pick(s)}>
              <div className="font-medium text-gray-900">{s.title}</div>
              {s.subtitle && <div className="text-xs text-gray-500">{s.subtitle}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}