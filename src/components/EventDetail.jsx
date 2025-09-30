import React, { useState } from 'react'
import { X, CalendarDays, MapPin, Users, Ticket, DollarSign, ExternalLink } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { formatBangkokLabel } from '../helpers/time'

function formatVND(n) {
  return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}

export default function EventDetail({ event, remaining, onClose }) {
  const [qty, setQty] = useState(1)
  const [purchased, setPurchased] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)

  // Debug logging
  console.log('EventDetail - Received event:', event)
  

  const start = new Date(event.start_at)
  const end = new Date(event.end_at || event.start_at)

  // Mock purchase logic removed - now handled by BuyButton component

  const mapsHref = event.venue?.lat && event.venue?.lng
    ? `https://www.google.com/maps/search/?api=1&query=${event.venue.lat},${event.venue.lng}`
    : null

  const remainingText = typeof event.remaining === 'number' ? `${Math.max(0, event.remaining)} left` : null

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-3xl card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-white">
          <h2 className="text-xl font-semibold" data-no-translate>{event.title}</h2>
          <button className="btn btn-ghost" onClick={onClose}><X className="size-5"/></button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          <div className="p-4 grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="aspect-video bg-neutral-100 rounded-xl overflow-hidden">
              {event.cover_url
                ? <img src={event.cover_url} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
                : <div className="w-full h-full grid place-items-center text-neutral-500">No image</div>
              }
            </div>
            <div className="text-sm text-neutral-700 leading-relaxed break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }} data-no-translate>
              {(event.description || '').slice(0, 240)}{(event.description || '').length > 240 ? '…' : ''}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-neutral-700"><CalendarDays className="size-4" /> {formatBangkokLabel(event.start_at)} – {formatBangkokLabel(event.end_at || event.start_at, { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="flex items-center gap-2 text-neutral-700"><MapPin className="size-4" /> {event.venue?.name} {mapsHref && (
                <a className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700" href={mapsHref} target="_blank" rel="noreferrer">
                  Open in Maps <ExternalLink className="size-3"/>
                </a>
              )}</div>
              <div className="flex items-center gap-2 text-neutral-700"><Users className="size-4" /> Capacity: {(() => {
                // Calculate total capacity from tiers data if available, otherwise use event.capacity
                if (event.tiers && event.tiers.length > 0) {
                  const totalCapacity = event.tiers.reduce((sum, tier) => sum + (tier.quota || 0), 0)
                  return totalCapacity > 0 ? totalCapacity : event.capacity
                }
                return event.capacity
              })()} {remainingText && <span className="badge ml-2">{remainingText}</span>}</div>
              
            </div>

            {!purchased ? (
              <div className="space-y-3">
                {/* Ticketing removed */}
              </div>
            ) : (
              <div className="card p-4 text-center">
                <p className="mb-2 font-medium text-neutral-800">Ticket saved to <span className="underline">My Tickets</span>.</p>
                <div className="inline-block bg-white p-2 rounded"><QRCodeCanvas value={"suki://" + event.id} size={120} /></div>
                <p className="text-sm text-neutral-500 mt-2">Go to My Tickets to view your QR offline.</p>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
