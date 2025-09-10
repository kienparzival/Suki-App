import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Header from '../components/Header.jsx'

const STORAGE_EVENTS = 'suki_org_events'

function loadOrgEvents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_EVENTS) || '[]') } catch { return [] }
}
function saveOrgEvents(events) {
  localStorage.setItem(STORAGE_EVENTS, JSON.stringify(events))
}

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => { setEvents(loadOrgEvents()) }, [])

  const totals = useMemo(() => {
    const sold = events.reduce((s, e) => s + (e.sold || 0), 0)
    const capacity = events.reduce((s, e) => s + (e.capacity || 0), 0)
    return { sold, capacity, remaining: Math.max(capacity - sold, 0) }
  }, [events])

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (ev) => { setEditing(ev); setModalOpen(true) }

  const remove = (id) => {
    const next = events.filter(e => e.id !== id)
    setEvents(next); saveOrgEvents(next)
  }

  const upsert = (payload) => {
    let next
    if (editing) {
      next = events.map(e => e.id === editing.id ? { ...editing, ...payload } : e)
    } else {
      next = [{ id: crypto.randomUUID(), sold: 0, ...payload }, ...events]
    }
    setEvents(next); saveOrgEvents(next); setModalOpen(false)
  }

  return (
    <div className="min-h-screen">
      <Header userLocation={{city:'HCMC',lat:10.7769,lng:106.7009}} setUserLocation={()=>{}} />
      <div className="container mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Organizer Dashboard</h1>
          <button className="btn btn-primary" onClick={openCreate}><Plus className="size-4 mr-1"/> Create event</button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(ev => (
            <article key={ev.id} className="card p-4 space-y-2">
              <h3 className="font-semibold">{ev.title}</h3>
              <p className="text-sm text-neutral-400">{new Date(ev.start_at).toLocaleString()} @ {ev.venue?.name}</p>
              <div className="text-sm">Sold {ev.sold || 0} / {ev.capacity || 0}</div>
              <div className="flex gap-2 pt-2">
                <button className="btn btn-ghost" onClick={() => openEdit(ev)}><Pencil className="size-4 mr-1"/> Edit</button>
                <button className="btn btn-ghost" onClick={() => remove(ev.id)}><Trash2 className="size-4 mr-1"/> Delete</button>
              </div>
            </article>
          ))}
        </div>

        <div className="card p-4">
          <div className="flex gap-6 text-sm">
            <div>Sold: <span className="font-medium">{totals.sold}</span></div>
            <div>Remaining: <span className="font-medium">{totals.remaining}</span></div>
            <div>Capacity: <span className="font-medium">{totals.capacity}</span></div>
          </div>
        </div>

        {modalOpen && (
          <EventEditor initial={editing} onClose={() => setModalOpen(false)} onSave={upsert} />
        )}
      </div>
    </div>
  )
}

function EventEditor({ initial, onClose, onSave }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [startAt, setStartAt] = useState(initial?.start_at ? initial.start_at.slice(0,16) : '')
  const [endAt, setEndAt] = useState(initial?.end_at ? initial.end_at.slice(0,16) : '')
  const [venueName, setVenueName] = useState(initial?.venue?.name || '')
  const [capacity, setCapacity] = useState(initial?.capacity || 0)
  const [minPrice, setMinPrice] = useState(initial?.min_price || 0)
  const [maxPrice, setMaxPrice] = useState(initial?.max_price || 0)

  const handleSave = () => {
    onSave({
      title,
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      venue: { name: venueName },
      capacity: Number(capacity || 0),
      min_price: Number(minPrice || 0),
      max_price: Number(maxPrice || 0),
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-xl card p-4 space-y-3">
        <h2 className="text-lg font-semibold">{initial ? 'Edit' : 'Create'} event</h2>
        <input className="input" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-neutral-400">Start</label>
            <input type="datetime-local" className="input w-full" value={startAt} onChange={e => setStartAt(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-neutral-400">End</label>
            <input type="datetime-local" className="input w-full" value={endAt} onChange={e => setEndAt(e.target.value)} />
          </div>
        </div>
        <input className="input" placeholder="Venue name" value={venueName} onChange={e => setVenueName(e.target.value)} />
        <div className="grid md:grid-cols-3 gap-3">
          <input className="input" type="number" placeholder="Capacity" value={capacity} onChange={e => setCapacity(e.target.value)} />
          <input className="input" type="number" placeholder="Min price" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
          <input className="input" type="number" placeholder="Max price" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
} 