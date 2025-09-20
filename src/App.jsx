import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import { useLocation } from './context/LocationContext.jsx'
import Header from './components/Header.jsx'
import FilterBar from './components/FilterBar.jsx'
import EventList from './components/EventList.jsx'
import { supabase } from './lib/supabase.js'
import './styles.css'

function App() {
  const { user } = useAuth()
  const { userLocation, setUserLocation } = useLocation()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [userCity, setUserCity] = useState('')
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all')

  // Preset cities for easy location selection
  const PRESET_CITIES = {
    hanoi: { lat: 21.0285, lng: 105.8542 },
    hcmc: { lat: 10.776889, lng: 106.700806 },
    danang: { lat: 16.0471, lng: 108.2062 },
  }

  const setCity = (key) => {
    const c = PRESET_CITIES[key]
    if (!c) return
    setUserLocation({ lat: c.lat, lng: c.lng })
    loadEvents()
  }

  // Define loadEvents function first so it can be used by useEffect and refresh button
  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      // Handle location parameters properly
      let lat = null
      let lng = null
      let onlineOnly = false
      
      // If user has set a specific location (not "All locations")
      if (userLocation?.lat && userLocation?.lng) {
        lat = userLocation.lat
        lng = userLocation.lng
      }
      
      // Check if user wants online events only
      if (userLocation?.mode === 'online' || userLocation?.city === 'Online Events') {
        onlineOnly = true
      }

      console.log('Loading events with params:', { lat, lng, onlineOnly, searchTerm, selectedCategory })

      const { data, error } = await supabase.rpc('events_explore', {
        p_lat: lat,
        p_lng: lng,
        p_radius_km: lat && lng ? 50 : null, // Only set radius if we have coordinates
        p_start_from: new Date().toISOString(),
        p_q: searchTerm || null,
        p_category: selectedCategory === 'all' ? null : selectedCategory,
        p_price_min: null,
        p_price_max: null,
        p_online_only: onlineOnly
      });

      if (error) {
        console.error('events_explore RPC error', error);
        setEvents([]);
        return;
      }
      

      // Ticketing removed; skip tier inventory
      
      // Transform RPC data to match expected format
        const transformedEvents = (data || []).map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          category: event.category,
          start_at: event.start_at,
          end_at: event.end_at,
        venue: {
          name: event.venue_name || 'TBD',
          latitude: event.venue_latitude,
          longitude: event.venue_longitude,
          address: event.venue_address
        },
        venue_id: event.venue_id, // <-- add this
          capacity: event.capacity || 0,
          cover_url: event.cover_url || '',
          status: event.status,
          creator_id: event.creator_id,
        external_ticket_url: event.external_ticket_url || null,
        distance_m: event.distance_m // Include distance for display
        }))
        setEvents(transformedEvents)
    } catch (error) {
      console.error('Error loading events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [userLocation?.lat, userLocation?.lng, userLocation?.mode, userLocation?.city, selectedCategory, searchTerm])

  // Load events from Supabase
  useEffect(() => {
    loadEvents()

    // Listen for events updates
    const handleEventsUpdate = () => {
      console.log('Events update event received, reloading events...')
      loadEvents()
    }

    // Listen for account switches
    const handleAccountSwitch = () => {
      console.log('Account switch detected, reloading events...')
      loadEvents()
    }

    window.addEventListener('suki:events_updated', handleEventsUpdate)
    window.addEventListener('suki:account_switched', handleAccountSwitch)
    
    return () => {
      window.removeEventListener('suki:events_updated', handleEventsUpdate)
      window.removeEventListener('suki:account_switched', handleAccountSwitch)
    }
  }, [loadEvents])


  // Force refresh when page becomes visible (catches missed real-time updates)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadEvents()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadEvents])

  // Get user's city for location filtering
  useEffect(() => {
    if (user?.user_metadata?.city) {
      const city = user.user_metadata.city
      setUserCity(city)
    }
  }, [user])

  // Update userCity when userLocation changes (for location filtering)
  useEffect(() => {
    setUserCity(userLocation?.city || 'All locations')
  }, [userLocation])

  // Initialize user location to "All locations" if not set
  useEffect(() => {
    if (!userLocation) {
      setUserLocation({ lat: null, lng: null, city: 'All locations', mode: 'all' })
      setUserCity('All locations')
    }
  }, [userLocation])

  // Filter events based on time (location, search, and category are now handled by the database)
  const filtered = useMemo(() => {
    const filteredEvents = events.filter(event => {
        // Time filtering based on selectedTimeFilter
        let matchesTime = true
      if (selectedTimeFilter !== 'all') {
        const eventDate = new Date(event.start_at)
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        if (selectedTimeFilter === 'today') {
          matchesTime = eventDate >= today && eventDate < tomorrow
        } else if (selectedTimeFilter === 'weekend') {
          // Get current day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
          const currentDay = today.getDay()
          
          let startOfWeekend, endOfWeekend
          
          if (currentDay === 0) { // Sunday
            // If today is Sunday, weekend is Saturday (yesterday) to Sunday (today)
            startOfWeekend = new Date(today)
            startOfWeekend.setDate(startOfWeekend.getDate() - 1) // Saturday
            endOfWeekend = new Date(today)
            endOfWeekend.setDate(endOfWeekend.getDate() + 1) // Monday (end of Sunday)
          } else if (currentDay === 6) { // Saturday
            // If today is Saturday, weekend is Saturday (today) to Sunday (tomorrow)
            startOfWeekend = new Date(today)
            endOfWeekend = new Date(today)
            endOfWeekend.setDate(endOfWeekend.getDate() + 2) // Monday (end of Sunday)
          } else {
            // For Monday-Friday, weekend is the upcoming Saturday-Sunday
            const daysUntilSaturday = (6 - currentDay + 7) % 7
            startOfWeekend = new Date(today)
            startOfWeekend.setDate(startOfWeekend.getDate() + daysUntilSaturday)
            endOfWeekend = new Date(startOfWeekend)
            endOfWeekend.setDate(endOfWeekend.getDate() + 2) // Monday (end of Sunday)
          }
          
          matchesTime = eventDate >= startOfWeekend && eventDate < endOfWeekend
        }
      }
      
      return matchesTime
    })
    
    return filteredEvents
  }, [events, selectedTimeFilter])

  if (loading) {
  return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
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
              <Header 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-16">
          <div className="text-center relative">
            {/* Background decorative elements */}
            <div className="absolute inset-0 -z-10 hidden sm:block">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-brand-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-blue-100/30 to-cyan-100/30 rounded-full blur-2xl"></div>
              <div className="absolute top-1/2 left-0 w-48 h-48 bg-gradient-to-r from-pink-100/30 to-rose-100/30 rounded-full blur-xl"></div>
            </div>
            
            {/* Main heading with enhanced styling */}
            <h1 
              className="text-3xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-gray-900 via-brand-600 to-purple-700 bg-clip-text text-transparent mb-6 sm:mb-8 leading-[1.15] inline-block pb-0.5"
            >
              Discover Amazing Events
            </h1>
            
            {/* Subtitle with modern typography */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mx-auto max-w-3xl mb-10 sm:mb-12 leading-relaxed font-light">
              Find and join events that match your interests, happening 
              <span className="text-brand-600 font-semibold"> near you </span> 
              or 
              <span className="text-purple-600 font-semibold"> online</span>
            </p>
            
            {/* Decorative line */}
            <div className="w-24 h-1 bg-gradient-to-r from-brand-500 to-purple-500 mx-auto rounded-full my-8"></div>
          </div>
        </div>
        
        <div className="mb-12">
          <FilterBar 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            browsingLocation={userCity || 'All locations'}
            onLocationChange={async (loc) => {
              console.log('Location change requested:', loc)
              
              // Expected shapes from FilterBar:
              // - Current location: { mode: 'current', city: 'Current Location', lat, lng }
              // - Preset/clicked on map: { mode: 'preset'|'manual', city: 'Hanoi', lat, lng }
              // - Online: { mode: 'online', city: 'Online Events' }
              // - All locations: null or { mode: 'all', city: 'All locations' }

              if (loc?.mode === 'online' || loc?.city === 'Online Events') {
                setUserLocation({ lat: null, lng: null, city: 'Online Events', mode: 'online' })
                setUserCity('Online Events')
                return
              }

              // If coords already provided, use them
              if (typeof loc?.lat === 'number' && typeof loc?.lng === 'number') {
                setUserLocation({ lat: loc.lat, lng: loc.lng, city: loc.city || 'Current Location', mode: 'current' })
                setUserCity(loc.city || 'Current Location')
                return
              }

              // Fallback: try browser geolocation
              if (loc?.mode === 'current' && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setUserLocation({
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude,
                      city: loc.city || 'Current Location',
                      mode: 'current'
                    })
                    setUserCity(loc.city || 'Current Location')
                  },
                  () => {
                    // permission denied or error → no geofilter
                    setUserLocation({ lat: null, lng: null, city: 'All locations', mode: 'all' })
                    setUserCity('All locations')
                  }
                )
              }
            }}
            selectedTimeFilter={selectedTimeFilter}
            onTimeFilterChange={setSelectedTimeFilter}
          />
        </div>
        
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
            {filtered.length} Event{filtered.length !== 1 ? 's' : ''} Found
          </h2>
            {userCity && userCity !== 'All locations' && (
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                in {userCity}
              </div>
            )}
          </div>
        <EventList events={filtered} />
        </div>
      </div>
    </div>
  )
}

export default App
