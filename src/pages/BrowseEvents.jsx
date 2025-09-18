import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import Header from '../components/Header.jsx'
import SearchBar from '../components/SearchBar.jsx'
import FilterBar from '../components/FilterBar.jsx'
import EventList from '../components/EventList.jsx'
import { supabase } from '../lib/supabase.js'
import '../styles.css'

function BrowseEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [userCity, setUserCity] = useState('')

  // Load events from Supabase
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            venue:venues(*),
            
          `)
          .eq('status', 'published')
          .order('start_at', { ascending: true })

        if (error) {
          console.error('Error loading events:', error)
          setEvents([])
        } else {
          // Transform Supabase data to match expected format
          const transformedEvents = (data || []).map(event => ({
            id: event.id,
            title: event.title,
            description: event.description,
            category: event.category,
            start_at: event.start_at,
            end_at: event.end_at,
            venue: event.venue || { name: 'TBD' },
            capacity: event.capacity || 0,
            
            cover_url: event.cover_url || '',
            status: event.status,
            creator_id: event.creator_id,
            
          }))
          setEvents(transformedEvents)
        }
      } catch (error) {
        console.error('Error loading events:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    loadEvents()

    // Listen for events updates
    const handleEventsUpdate = () => {
      console.log('Events update event received, reloading events...')
      loadEvents()
    }

    window.addEventListener('suki:events_updated', handleEventsUpdate)
    
    return () => {
      window.removeEventListener('suki:events_updated', handleEventsUpdate)
    }
  }, [])

  // Get user's city for location filtering
  useEffect(() => {
    if (user?.user_metadata?.city) {
      setUserCity(user.user_metadata.city)
    }
  }, [user])

  // Filter events based on search, category, and location
  const filtered = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory
      
      const matchesLocation = selectedLocation === 'all' || 
                             (selectedLocation === 'nearby' && userCity && event.venue?.name?.toLowerCase().includes(userCity.toLowerCase())) ||
                             (selectedLocation === 'online' && event.venue?.name === 'Online') ||
                             (selectedLocation === 'venue' && event.venue?.name !== 'Online' && event.venue?.name !== 'To be announced')
      
      return matchesSearch && matchesCategory && matchesLocation
    })
  }, [events, searchTerm, selectedCategory, selectedLocation, userCity])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
            <p className="text-gray-600">You need to be signed in to browse events.</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Browse Events</h1>
          <p className="text-lg text-gray-600">Discover and explore events from around the world</p>
        </div>
        
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <FilterBar 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
        />
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {filtered.length} Event{filtered.length !== 1 ? 's' : ''} Found
          </h2>
          <EventList events={filtered} />
        </div>
      </div>
    </div>
  )
}

export default BrowseEvents
