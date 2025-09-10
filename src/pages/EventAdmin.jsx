import React, { useEffect, useState } from 'react'
import catalog from '../data/events.json'

function loadOrgEvents() {
  try { return JSON.parse(localStorage.getItem('suki_org_events') || '[]') } catch { return [] }
}
function saveOrgEvents(events) {
  localStorage.setItem('suki_org_events', JSON.stringify(events))
}

export default function EventAdminPage() {
  const [rows, setRows] = useState([])

  useEffect(() => {
    const org = loadOrgEvents()
    const merged = [
      ...catalog.map(e => ({ id: e.id, title: e.title, capacity: e.capacity, available: true, fromCatalog: true })),
      ...org.map(e => ({ id: e.id, title: e.title, capacity: e.capacity, available: true, fromCatalog: false })),
    ]
    setRows(merged)
  }, [])

  const toggleAvailable = (id) => {
    setRows(rs => rs.map(r => r.id === id ? { ...r, available: !r.available } : r))
  }

  return (
    <div className="container mt-6 space-y-4">
      <h1 className="text-2xl font-semibold">Events Admin</h1>
      <div className="card p-4 space-y-2">
        {rows.map(r => (
          <div key={r.id} className="flex items-center gap-3 border-b border-neutral-800/60 py-2 last:border-none">
            <div className="flex-1">
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-neutral-400">Capacity {r.capacity}</div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={r.available} onChange={() => toggleAvailable(r.id)} />
              Available
            </label>
          </div>
        ))}
      </div>
    </div>
  )
} 