import React from 'react'
import EventCard from './EventCard.jsx'

export default function EventList({ events }) {
  if (events.length === 0) {
    return (
      <div className="card p-10 text-center text-neutral-400">
        No events match your filters. Try widening your search.
      </div>
    )
  }

  return (
    <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map(e => <EventCard key={e.id} event={e} />)}
    </section>
  )
}



