import React from 'react'
import { PAYMENTS_ENABLED } from '../config/payments'
import { CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatBangkokLabel } from '../helpers/time'

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop'

export default function EventCard({ event }) {
  const dateFmt = formatBangkokLabel(event.start_at, { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  const teaser = (event.description || '').slice(0, 160)

  return (
    <article className="card overflow-hidden hover:border-neutral-300 transition">
      <Link to={`/events/${event.id}`} className="block">
        <div className="aspect-[16/9] bg-neutral-100">
        {event.cover_url
            ? <img
                src={event.cover_url}
                alt={event.title}
                loading="lazy"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget
                  if (!img.dataset.fallback) {
                    img.dataset.fallback = '1'
                    img.src = FALLBACK_COVER
                  }
                }}
              />
            : <div className="w-full h-full grid place-items-center text-neutral-400">No image</div>
        }
      </div>
      </Link>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          {/* Category chips */}
          {Array.isArray(event.categories) && event.categories.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {event.categories.slice(0, 2).map(c => (
                <span key={c} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                  {c}
                </span>
              ))}
              {event.categories.length > 2 && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                  +{event.categories.length - 2}
                </span>
              )}
            </div>
          ) : (
            event.category && <span className="badge">{event.category}</span>
          )}
          {event.distance_m != null && <span className="badge">{(event.distance_m/1000).toFixed(1)} km</span>}
          {/* Ticketing removed; optional external badge */}
        </div>
        <Link to={`/events/${event.id}`} className="block">
          <h3 className="text-lg font-semibold text-neutral-900" data-no-translate>{event.title}</h3>
          <p className="text-sm text-neutral-600 line-clamp-2" data-no-translate>{teaser}{(event.description || '').length > 160 ? '…' : ''}</p>
          <div className="flex items-center gap-4 text-sm text-neutral-700">
          <div className="flex items-center gap-1"><CalendarDays className="size-4" /> {dateFmt}</div>
          <div className="flex items-start gap-1">
            <MapPin className="size-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium" data-no-translate>{event.venue?.name || 'TBA'}</div>
              {event.venue?.address && (
                <div className="text-xs text-neutral-500 mt-0.5">{event.venue.address}</div>
              )}
            </div>
          </div>
        </div>
        </Link>
      </div>

    </article>
  )
}
