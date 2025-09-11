import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocation } from '../context/LocationContext.jsx'
import Header from '../components/Header.jsx'
import { supabase } from '../lib/supabase.js'
import { parseFromGMT7, formatDateTimeGMT7 } from '../lib/timezone'
import { Link } from 'react-router-dom'
import { Heart, Share2 } from 'lucide-react'
import '../styles.css'

const STORAGE_KEY = 'suki_saved_events'

function loadSavedIds() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

export default function SavedPage() {
  const { user } = useAuth()
  const [savedIds, setSavedIds] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSavedIds(loadSavedIds())
  }, [])

  // Load events from Supabase
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*, venue:venues(*)')
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
            min_price: event.min_price || 0,
            max_price: event.max_price || 0,
            cover_url: event.cover_url || '',
            status: event.status,
            creator_id: event.creator_id
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
  }, [])

  const savedEvents = useMemo(() => {
    const idSet = new Set(savedIds)
    return events.filter(e => idSet.has(e.id))
  }, [savedIds, events])

  const remove = (id) => {
    const next = savedIds.filter(sid => sid !== id)
    setSavedIds(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchTerm="" setSearchTerm={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
            <p className="text-gray-600">You need to sign in to view saved events.</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchTerm="" setSearchTerm={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header searchTerm="" setSearchTerm={() => {}} />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Likes</h1>
        </div>
        
        {savedEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No saved events yet</h2>
            <p className="text-gray-600 mb-6">Tap the heart on any event to save it for later.</p>
            <Link to="/" className="btn btn-primary">Discover Events</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {savedEvents.map(e => {
              const startDate = parseFromGMT7(e.start_at)
              const dateStr = formatDateTimeGMT7(e.start_at, { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })
              const timeStr = formatDateTimeGMT7(e.start_at, { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })
              
              const shareEvent = async () => {
                const url = `${window.location.origin}/events/${e.id}`
                try {
                  if (navigator.share) {
                    await navigator.share({ title: e.title, text: 'Check out this event on Suki', url })
                  } else {
                    await navigator.clipboard.writeText(url)
                    alert('Link copied to clipboard')
                  }
                } catch {}
              }

              return (
                <div key={e.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex gap-6">
                    {/* Event Details */}
                    <div className="flex-1">
                      <div className="mb-2">
                        <Link to={`/events/${e.id}`} className="text-xl font-semibold text-gray-900 hover:text-gray-700">
                          {e.title}
                        </Link>
                      </div>
                      <div className="text-sm text-orange-600 mb-1">
                        {dateStr}, {timeStr}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {e.venue?.name || 'TBD'}
                        {e.venue?.address && `, ${e.venue.address}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {e.min_price === 0 ? 'Free' : `From ${(e.min_price/1000).toFixed(0)}k VND`}
                      </div>
                    </div>
                    
                    {/* Event Image and Buttons */}
                    <div className="flex-shrink-0">
                      <Link to={`/events/${e.id}`} className="block w-48 h-32 bg-gray-100 rounded-lg overflow-hidden mb-4 hover:opacity-90 transition-opacity">
                        {e.cover_url ? (
                          <img src={e.cover_url} alt={e.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </Link>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button 
                          className="w-10 h-10 bg-white border border-red-300 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                          onClick={() => remove(e.id)}
                          title="Remove from saved"
                        >
                          <Heart className="w-5 h-5 text-red-500 fill-current" />
                        </button>
                        <button 
                          className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                          onClick={shareEvent}
                          title="Share event"
                        >
                          <Share2 className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 