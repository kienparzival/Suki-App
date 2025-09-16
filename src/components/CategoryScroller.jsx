import React from 'react'
import { CATEGORY_ITEMS } from '../constants/categories'

export default function CategoryScroller({ selected, onChange }) {
  return (
    <div className="relative">
      <div className="pointer-events-none hidden sm:block absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none hidden sm:block absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent" />

      <div
        className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-4 px-4"
        role="tablist"
        aria-label="Browse by category"
      >
        {CATEGORY_ITEMS.map(({ key, label, Icon }) => {
          const active = selected === key || (selected === 'all' && key === 'all')
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(key)}
              className={`shrink-0 snap-start flex flex-col items-center justify-start min-w-[112px] sm:min-w-[124px] px-2 select-none focus:outline-none`}
            >
              <span
                className={`grid place-items-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border transition-colors ${
                  active ? 'bg-brand-50 border-brand-200' : 'bg-white border-blue-100'
                }`}
              >
                <Icon className={`h-7 w-7 sm:h-8 sm:w-8 ${active ? 'text-brand-600' : 'text-gray-700'}`} />
              </span>

              <span
                className={`mt-2 text-[13px] sm:text-sm font-medium text-center leading-snug whitespace-normal`}
                style={{ wordBreak: 'break-word' }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}


