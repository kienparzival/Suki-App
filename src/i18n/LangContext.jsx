import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const DICT = {
  en: {
    discoverH1: 'Discover Amazing Events',
    discoverSub: "Explore what's happening around you — concerts, meetups, workshops, and more.",
    seoPitch: 'Sự kiện ở Hà Nội • Hanoi events this week — concerts, meetups, workshops, nightlife, family activities and more curated on Suki.',
    seoPitch2: 'Khám phá hoạt động cuối tuần, vé và địa điểm hot quanh bạn.',
    resultsFound: '{n} Event{plural} Found',
    inCity: 'in {city}',
    categoryLabel: 'Category',
    allLocations: 'All locations',
    saved: 'Saved',
    discover: 'Discover',
    createEvent: 'Create an event',
    searchPlaceholder: 'Search events',
  },
  vi: {
    discoverH1: 'Khám phá sự kiện tuyệt vời',
    discoverSub: 'Khám phá các hoạt động quanh bạn — hoà nhạc, meetup, workshop và nhiều hơn nữa.',
    seoPitch: 'Sự kiện ở Hà Nội • Hanoi events this week — các buổi hoà nhạc, meetup, workshop, nightlife, hoạt động gia đình… được tuyển chọn trên Suki.',
    seoPitch2: 'Khám phá hoạt động cuối tuần, vé và địa điểm hot quanh bạn.',
    resultsFound: 'Tìm thấy {n} sự kiện',
    inCity: 'tại {city}',
    categoryLabel: 'Danh mục',
    allLocations: 'Tất cả địa điểm',
    saved: 'Đã lưu',
    discover: 'Khám phá',
    createEvent: 'Tạo sự kiện',
    searchPlaceholder: 'Tìm kiếm sự kiện',
  },
}

const LangContext = createContext({ lang: 'en', setLang: () => {}, t: (k, v) => k })

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('suki_lang') || 'en')
  useEffect(() => { localStorage.setItem('suki_lang', lang) }, [lang])
  const t = useMemo(() => (key, vars = {}) => {
    let s = DICT[lang]?.[key] ?? key
    Object.entries(vars).forEach(([k, v]) => { s = s.replaceAll(`{${k}}`, v) })
    return s
  }, [lang])
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)


