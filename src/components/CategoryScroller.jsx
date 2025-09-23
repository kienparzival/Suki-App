import React, { useEffect, useRef, useState } from 'react'
import { CATEGORY_ITEMS } from '../constants/categories'
import { useLang } from '../i18n/LangContext.jsx'

export default function CategoryScroller({ selected, onChange }) {
  const { t } = useLang()
  const scrollerRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  // Keep arrow enable/disable in sync
  const updateArrows = () => {
    const el = scrollerRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 0)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    // 1) Windows-friendly: convert vertical wheel → horizontal scroll
    const onWheel = (e) => {
      // If user is actually scrolling vertically inside children, don't hijack.
      const mostlyVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX)
      if (mostlyVertical && el.scrollWidth > el.clientWidth) {
        el.scrollLeft += e.deltaY
        e.preventDefault() // IMPORTANT: allow horizontal scroll with mouse wheel
        updateArrows()
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })

    // 2) Keep arrow state fresh
    el.addEventListener('scroll', updateArrows, { passive: true })
    updateArrows()

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('scroll', updateArrows)
    }
  }, [])

  return (
    <div className="relative">
      {/* left arrow */}
      <button
        type="button"
        aria-label="Scroll categories left"
        onClick={() => { scrollerRef.current?.scrollBy({ left: -240, behavior: 'smooth' }); }}
        disabled={!canLeft}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center
                   h-9 w-9 rounded-full shadow bg-white/90 hover:bg-white disabled:opacity-40"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      <div
        ref={scrollerRef}
        className="horizontal-scroll relative mx-10 sm:mx-12 flex gap-7 lg:gap-8 overflow-x-auto overscroll-x-contain
                   whitespace-nowrap scroll-smooth scrollbar-thin snap-x snap-mandatory pb-2"
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
                {t(`categories.${key.toLowerCase()}`) || label}
              </span>
            </button>
          )
        })}
      </div>

      {/* right arrow */}
      <button
        type="button"
        aria-label="Scroll categories right"
        onClick={() => { scrollerRef.current?.scrollBy({ left: 240, behavior: 'smooth' }); }}
        disabled={!canRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center
                   h-9 w-9 rounded-full shadow bg-white/90 hover:bg-white disabled:opacity-40"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  )
}


