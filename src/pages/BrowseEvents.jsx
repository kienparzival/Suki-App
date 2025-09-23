import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation } from '../context/LocationContext.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import FilterBar from '../components/FilterBar.jsx'
import EventList from '../components/EventList.jsx'
import { supabase } from '../lib/supabase.js'
import { useLang } from '../i18n/LangContext.jsx'

export default function BrowseEvents() {
  const { userLocation, setUserLocation } = useLocation()
  const { t } = useLang()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all')
  const [userCity, setUserCity] = useState('All locations')

  // Keep userCity label in sync with LocationContext
  useEffect(() => {
    setUserCity(userLocation?.city || 'All locations')
  }, [userLocation])

  // Ensure a sensible default the first time we land here
  useEffect(() => {
    if (!userLocation) {
      setUserLocation({ lat: null, lng: null, city: 'All locations', mode: 'all' })
      setUserCity('All locations')
    }
  }, [userLocation, setUserLocation])

  // Fetch events using the SAME contract as the home/Discover page
  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      let lat = null
      let lng = null
      let onlineOnly = false

      if (typeof userLocation?.lat === 'number' && typeof userLocation?.lng === 'number') {
        lat = userLocation.lat
        lng = userLocation.lng
      }
      if (userLocation?.mode === 'online' || userLocation?.city === 'Online Events') {
        onlineOnly = true
      }

      const { data, error } = await supabase.rpc('events_explore', {
        p_lat: lat,
        p_lng: lng,
        p_radius_km: (lat != null && lng != null) ? 50 : null, // radius only when we have coords
        p_start_from: new Date().toISOString(),
        p_q: searchTerm || null,
        p_category: selectedCategory === 'all' ? null : selectedCategory,
        p_price_min: null,
        p_price_max: null,
        p_online_only: onlineOnly,
      })

      if (error) {
        console.error('events_explore RPC error', error)
        setEvents([])
        return
      }

      const transformed = (data || []).map(ev => ({
        id: ev.id,
        title: ev.title,
        description: ev.description,
        category: ev.category,
        start_at: ev.start_at,
        end_at: ev.end_at,
        venue: {
          name: ev.venue_name || 'TBD',
          latitude: ev.venue_latitude,
          longitude: ev.venue_longitude,
          address: ev.venue_address,
        },
        venue_id: ev.venue_id,
        cover_url: ev.cover_url || '',
        status: ev.status,
        creator_id: ev.creator_id,
        external_ticket_url: ev.external_ticket_url || null,
        distance_m: ev.distance_m || null,
      }))
      setEvents(transformed)
    } catch (e) {
      console.error('Error loading events:', e)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [userLocation?.lat, userLocation?.lng, userLocation?.mode, userLocation?.city, selectedCategory, searchTerm])

  useEffect(() => {
    loadEvents()
    // re-fetch when tab becomes visible (keeps it fresh)
    const onVis = () => { if (!document.hidden) loadEvents() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [loadEvents])

  // SAME onLocationChange handler as the Discover page
  const handleLocationChange = async (loc) => {
    // Shapes from FilterBar:
    // - Current: { mode:'current', city:'Current Location', lat, lng }
    // - Preset/manual: { mode:'preset'|'manual', city:'Hanoi', lat, lng }
    // - Online: { mode:'online', city:'Online Events' }
    // - All: { mode:'all', city:'All locations', lat:null, lng:null } or null

    if (loc?.mode === 'online' || loc?.city === 'Online Events') {
      setUserLocation({ lat: null, lng: null, city: 'Online Events', mode: 'online' })
      setUserCity('Online Events')
      return
    }

    // Coordinates already provided → use them
    if (typeof loc?.lat === 'number' && typeof loc?.lng === 'number') {
      setUserLocation({ lat: loc.lat, lng: loc.lng, city: loc.city || 'Current Location', mode: loc.mode || 'current' })
      setUserCity(loc.city || 'Current Location')
      return
    }

    // Ask browser for current location if requested
    if (loc?.mode === 'current' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            city: loc.city || 'Current Location',
            mode: 'current',
          })
          setUserCity(loc.city || 'Current Location')
        },
        () => {
          // permission denied / failure → fall back to All
          setUserLocation({ lat: null, lng: null, city: 'All locations', mode: 'all' })
          setUserCity('All locations')
        }
      )
      return
    }

    // Default to All locations
    setUserLocation({ lat: null, lng: null, city: 'All locations', mode: 'all' })
    setUserCity('All locations')
  }

  // Local time filter (identical to home)
  const filtered = useMemo(() => {
    return events.filter(event => {
      if (selectedTimeFilter === 'all') return true

      const eventDate = new Date(event.start_at)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

      if (selectedTimeFilter === 'today') {
        return eventDate >= today && eventDate < tomorrow
      }
      if (selectedTimeFilter === 'weekend') {
        const currentDay = today.getDay()
        let startOfWeekend, endOfWeekend
        if (currentDay === 6) { // Sat
          startOfWeekend = new Date(today)
          endOfWeekend = new Date(today); endOfWeekend.setDate(endOfWeekend.getDate() + 2)
        } else if (currentDay === 0) { // Sun
          startOfWeekend = new Date(today); startOfWeekend.setDate(startOfWeekend.getDate() - 1)
          endOfWeekend = new Date(today); endOfWeekend.setDate(endOfWeekend.getDate() + 1)
        } else {
          const daysUntilSat = (6 - currentDay + 7) % 7
          startOfWeekend = new Date(today); startOfWeekend.setDate(startOfWeekend.getDate() + daysUntilSat)
          endOfWeekend = new Date(startOfWeekend); endOfWeekend.setDate(endOfWeekend.getDate() + 2)
        }
        return eventDate >= startOfWeekend && eventDate < endOfWeekend
      }
      return true
    })
  }, [events, selectedTimeFilter])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white overflow-x-hidden">
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('browse.title')}</h1>
          <p className="text-lg text-gray-600">{t('discoverSub')}</p>
        </div>
        
        <div className="mb-8">
          <FilterBar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            browsingLocation={userCity || 'All locations'}
            onLocationChange={handleLocationChange}
            selectedTimeFilter={selectedTimeFilter}
            onTimeFilterChange={setSelectedTimeFilter}
          />
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('resultsFound', { n: filtered.length, plural: filtered.length !== 1 ? 's' : '' })}
            </h2>
            {userCity && userCity !== 'All locations' && (
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{t('inCity', { city: userCity })}</div>
            )}
          </div>
          <EventList events={filtered} />
        </div>
      </div>
      <Footer />
    </div>
  )
}