import React, { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
// Internal purchase modal removed
import { supabase } from '../lib/supabase.js'
import { formatBangkokLabel } from '../helpers/time'
import { Share2, MapPin, Calendar, Clock, Users, ChevronDown, ChevronUp, Heart } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import DescriptionBlock from '../components/DescriptionBlock.jsx'
import '../styles.css'
import { PAYMENTS_ENABLED } from '../config/payments'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Helper function to fetch venue coordinates from PostGIS location
async function fetchVenueCoords(venueId) {
  try {
    const { data, error } = await supabase.rpc('get_venue_coordinates', { venue_id: venueId })
    if (error) {
      console.error('RPC get_venue_coordinates error:', error)
      return { lat: null, lng: null }
    }
    const row = data?.[0]
    const lat = typeof row?.latitude === 'number' ? row.latitude : null
    const lng = typeof row?.longitude === 'number' ? row.longitude : null
    return { lat, lng }
  } catch (e) {
    console.error('RPC get_venue_coordinates threw:', e)
    return { lat: null, lng: null }
  }
}

function loadTickets() {
  try { return JSON.parse(localStorage.getItem('suki_tickets') || '[]') } catch { return [] }
}

const STORAGE_KEY = 'suki_saved_events'

function loadSavedIds() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

export default function EventPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [openBuy, setOpenBuy] = useState(false)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [remaining, setRemaining] = useState(0)
  const [showMap, setShowMap] = useState(false)
  const [savedIds, setSavedIds] = useState(() => loadSavedIds())

  const isSaved = useMemo(() => event && savedIds.includes(event.id), [savedIds, event])

  const toggleSave = () => {
    if (!event) return
    
    const next = isSaved ? savedIds.filter(id => id !== event.id) : [event.id, ...savedIds]
    setSavedIds(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  // Load event from Supabase
  const loadEvent = async () => {
    setLoading(true)
    try {
      // First, let's try to get the event with venue data
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(
            id,
            name,
            address,
            location
          )
        `)
        .eq('id', id)
        .eq('status', 'published')
        .single()

      if (eventError) {
        console.error('Error loading event:', eventError)
        setEvent(null)
        return
      }

      // Ensure we have plain lat/lng for the map
      let venueWithCoords = eventData.venue || { name: 'TBD' }

      // Some selects might try to read venue.latitude/longitude (they don't exist as columns), so use RPC:
      if (venueWithCoords?.id) {
        const { lat, lng } = await fetchVenueCoords(venueWithCoords.id)
        venueWithCoords = {
          ...venueWithCoords,
          latitude: lat,
          longitude: lng,
        }
        console.log('Fetched venue coordinates:', { lat, lng })
      }

      const data = { ...eventData, venue: venueWithCoords }

      if (data) {
        // Ticketing removed; no tier inventory
        const tiersWithSoldCounts = []

        // Debug venue data
        console.log('Venue data from database:', data.venue)
        


        // Transform Supabase data to match expected format
        const transformedEvent = {
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          start_at: data.start_at,
          end_at: data.end_at,
          venue: venueWithCoords,
          capacity: data.capacity || 0,
          min_price: data.min_price || 0,
          max_price: data.max_price || 0,
          cover_url: data.cover_url || '',
          status: data.status,
          creator_id: data.creator_id,
          admission: data.admission || 'ticketed',
          external_ticket_url: data.external_ticket_url || null,
          external_ticket_instructions: data.external_ticket_instructions || null,
          organizer: { name: 'Organizer' }, // Default organizer info
          tiers: tiersWithSoldCounts
        }
        
        console.log('Transformed event venue:', transformedEvent.venue)
        
        setEvent(transformedEvent)
        
        // Calculate remaining tickets - use the remaining count from tier_inventory RPC
        // For free events, this will be the event capacity minus sold tickets
        // For tiered events, this will be the sum of remaining from all tiers
        if (tiersWithSoldCounts.length > 0) {
          const totalRemaining = tiersWithSoldCounts.reduce((sum, tier) => sum + (Number(tier.remaining) || 0), 0)
          setRemaining(totalRemaining)
        } else {
          // Fallback to event capacity if no tiers data
          setRemaining(data.capacity || 0)
        }
      } else {
        setEvent(null)
      }
    } catch (error) {
      console.error('Error loading event:', error)
      setEvent(null)
    } finally {
      setLoading(false)
    }
  }

  // Load event when component mounts or id changes
  useEffect(() => {
    if (id) {
      loadEvent()
    }
  }, [id])

  // Listen for account switches to refresh event data
  useEffect(() => {
    const handleAccountSwitch = () => {
      console.log('Account switch detected in EventPage, reloading event...')
      if (id) {
        loadEvent()
      }
    }

    window.addEventListener('suki:account_switched', handleAccountSwitch)
    
    return () => {
      window.removeEventListener('suki:account_switched', handleAccountSwitch)
    }
  }, [id])

  // Listen for events updates to refresh ticket inventory
  useEffect(() => {
    const handleEventsUpdate = () => {
      if (id) {
        loadEvent()
      }
    }

    window.addEventListener('suki:events_updated', handleEventsUpdate)
    
    return () => {
      window.removeEventListener('suki:events_updated', handleEventsUpdate)
    }
  }, [id])

  // Ticketing removed → no realtime subscription to tickets

  // Helper: linkify + preserve newlines for instructions
  const renderInstructions = (text = '') => {
    const url = /(https?:\/\/[^\s)]+)([)\]]?)/gi
    const html = text
      .replace(url, '<a href="$1" target="_blank" rel="noopener">$1</a>$2')
      .replace(/\n/g, '<br/>')
    return <div className="prose [&_a]:underline" dangerouslySetInnerHTML={{ __html: html }} />
  }

  // Force refresh when page becomes visible (catches missed real-time updates)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && id) {
        loadEvent()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [id])

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

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
            <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
          </div>
        </div>
      </div>
    )
  }

  // Format dates using Asia/Bangkok timezone
  const dateFmt = formatBangkokLabel(event.start_at)
  const start = new Date(event.start_at)
  const end = new Date(event.end_at || event.start_at)
  const durationHours = Math.max(1, Math.round((end - start) / (1000*60*60)))
  const isOnline = (event.venue?.name || '').toLowerCase().includes('online')
  const isOpen = event.admission === 'open'

  const share = async () => {
    const url = `${window.location.origin}/events/${event.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: 'Check out this event on Suki', url })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Link copied to clipboard')
      }
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white overflow-x-hidden">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Event Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            {/* Category chips */}
            {Array.isArray(event.categories) && event.categories.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {event.categories.map(c => (
                  <span key={c} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              event.category && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {event.category}
                </span>
              )
            )}
            <span>•</span>
            <span>{event.status}</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight break-anywhere">
            {event.title}
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Hosted by {event.organizer?.name || 'Organizer'}
          </p>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>{dateFmt}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>{durationHours} hour{durationHours !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5" />
              {!isOpen && <span>{remaining} available</span>}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* External ticket CTA (top) */}
            {event?.external_ticket_url ? (
              <a href={event.external_ticket_url} target="_blank" rel="noopener" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Get tickets on organizer site</a>
            ) : null}
            <button
              className={`px-6 py-3 border rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isSaved 
                  ? 'border-red-300 text-red-600 bg-red-50 hover:bg-red-100' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={toggleSave}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Saved' : 'Save Event'}
            </button>
            <button 
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              onClick={share}
            >
              <Share2 className="w-4 h-4" />
              Share Event
            </button>
          </div>
        </div>

        {/* Event Image */}
        <div className="mb-8">
          <div className="aspect-[16/9] bg-gray-100 rounded-2xl overflow-hidden">
            {event.cover_url ? (
              <img src={event.cover_url} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-gray-400">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-lg">No image available</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tickets section (only if something was provided) */}
            {(event.external_ticket_url || event.external_ticket_instructions) && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">How to get tickets</h2>
                {event.external_ticket_url && (
                  <div className="mb-3">
                    <a
                      href={event.external_ticket_url}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Get tickets on organizer site
                    </a>
                  </div>
                )}
                {event.external_ticket_instructions && renderInstructions(event.external_ticket_instructions)}
              </section>
            )}

            {/* About Section */}
            <section className="prose prose-sm sm:prose max-w-none prose-a:underline prose-a:text-blue-600 break-anywhere">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this event</h2>
              <DescriptionBlock text={event.description} />
            </section>

            {/* Event Details */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Details</h2>
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                    <div className="font-medium text-gray-900">Date & Time</div>
                    <div className="text-gray-600">{dateFmt}</div>
              </div>
            </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Duration</div>
                    <div className="text-gray-600">{durationHours} hour{durationHours !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Capacity</div>
                    <div className="text-gray-600">{event.capacity || 'Unlimited'}</div>
                  </div>
                </div>
              </div>
                </section>

            {/* Location Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Location</h2>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="w-6 h-6 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {event.venue?.name || (isOnline ? 'Online Event' : 'TBA')}
                      </h3>
                      {event.venue?.address && (
                        <p className="text-gray-600 mb-3">
                          {event.venue.address}
                        </p>
                      )}
                      {!isOnline && event.venue?.name && (
                        <button 
                          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 transition-colors"
                          onClick={() => setShowMap(!showMap)}
                        >
                          {showMap ? 'Hide directions' : 'Get directions'}
                          {showMap ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Map Section */}
                  {showMap && !isOnline && event.venue?.name && (
                    <div className="mt-4">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        {(() => {
                          console.log('Map check - venue:', event.venue)
                          console.log('Map check - latitude:', event.venue?.latitude)
                          console.log('Map check - longitude:', event.venue?.longitude)
                          return event.venue?.latitude && event.venue?.longitude
                        })() ? (
                          <MapContainer
                            center={[event.venue.latitude, event.venue.longitude]}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                            className="rounded-lg"
                          >
                            <TileLayer
                              url={`https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> | &copy; <a href="https://www.maptiler.com/">MapTiler</a>'
                            />
                            <Marker position={[event.venue.latitude, event.venue.longitude]}>
                              <Popup>
                                <div className="p-2">
                                  <h3 className="font-semibold text-gray-900">{event.venue.name}</h3>
                                  {event.venue.address && (
                                    <p className="text-sm text-gray-600 mt-1">{event.venue.address}</p>
                                  )}
                                </div>
                              </Popup>
                            </Marker>
                          </MapContainer>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <div className="text-center">
                              <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                              <p>Map coordinates not available</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                  </div>
                </section>
              </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            {/* Pricing removed for external-only */}

            {/* Quick Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Categories</span>
                  <div className="text-right">
                    {Array.isArray(event.categories) && event.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {event.categories.map(c => (
                          <span key={c} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="font-medium text-gray-900">{event.category || 'N/A'}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-gray-900 capitalize">{event.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available</span>
                  <span className="font-medium text-gray-900">
                    {isOpen ? 'Open access' : `${remaining} tickets`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Internal ticket modal removed */}
      <Footer />
    </div>
  )
} 

// DescriptionBlock moved to components/DescriptionBlock.jsx