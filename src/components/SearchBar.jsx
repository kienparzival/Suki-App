import React from 'react'

export default function SearchBar({ query, setQuery }) {
  return (
    <div className="flex items-center gap-2 w-full md:max-w-md">
      <div className="flex-1">
        <input
          type="text"
          className="input w-full"
          placeholder="Search events, artists, venues…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
    </div>
  )
}
