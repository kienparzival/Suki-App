import React, { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import { QRCodeCanvas } from 'qrcode.react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLocation } from '../context/LocationContext'
import { formatBangkokLabel, formatBangkokDate } from '../helpers/time'

// Offline storage keys
const OFFLINE_TICKETS_KEY = 'suki_offline_tickets'
const OFFLINE_TICKETS_TIMESTAMP_KEY = 'suki_offline_tickets_timestamp'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export default function Tickets() {
  const { user } = useAuth()
  const { userLocation } = useLocation()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  // Offline storage functions
  const saveTicketsToOfflineStorage = (ticketsData) => {
    try {
      localStorage.setItem(OFFLINE_TICKETS_KEY, JSON.stringify(ticketsData))
      localStorage.setItem(OFFLINE_TICKETS_TIMESTAMP_KEY, Date.now().toString())
      console.log('Tickets saved to offline storage')
    } catch (error) {
      console.error('Error saving tickets to offline storage:', error)
    }
  }

  const loadTicketsFromOfflineStorage = () => {
    try {
      const timestamp = localStorage.getItem(OFFLINE_TICKETS_TIMESTAMP_KEY)
      const ticketsData = localStorage.getItem(OFFLINE_TICKETS_KEY)
      
      if (timestamp && ticketsData) {
        const age = Date.now() - parseInt(timestamp)
        if (age < CACHE_DURATION) {
          console.log('Loading tickets from offline storage')
          return JSON.parse(ticketsData)
        } else {
          console.log('Offline cache expired, clearing old data')
          localStorage.removeItem(OFFLINE_TICKETS_KEY)
          localStorage.removeItem(OFFLINE_TICKETS_TIMESTAMP_KEY)
        }
      }
    } catch (error) {
      console.error('Error loading tickets from offline storage:', error)
    }
    return null
  }

  const checkOnlineStatus = () => {
    const online = navigator.onLine
    setIsOffline(!online)
    return online
  }

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const loadTickets = async () => {
      try {
        setLoading(true)
        
        // Check online status first
        const isOnline = checkOnlineStatus()
        
        if (isOnline) {
          // Try to fetch from Supabase when online
          try {
            const { data, error } = await supabase
              .from('tickets')
              .select(`
                id,
                qr_token,
                created_at,
                event_id,
                tier_id,
                orders!inner(
                  id,
                  total_amount,
                  status,
                  created_at
                ),
                events!inner(
                  id,
                  title,
                  description,
                  start_at,
                  end_at,
                  cover_url,
                  venue_id,
                  venues(name)
                ),
                ticket_tiers(
                  id,
                  name,
                  price
                )
              `)
              .eq('orders.user_id', user.id)
              .order('created_at', { ascending: false })

            if (error) {
              console.error('Error fetching tickets from Supabase:', error)
              throw error
            }

            console.log('Tickets loaded from Supabase:', data)
            
            // Save to offline storage for future offline access
            if (data && data.length > 0) {
              saveTicketsToOfflineStorage(data)
            }
            
            setTickets(data || [])
            return
          } catch (supabaseError) {
            console.error('Supabase fetch failed, trying offline storage:', supabaseError)
          }
        }
        
        // Fallback to offline storage
        const offlineTickets = loadTicketsFromOfflineStorage()
        if (offlineTickets) {
          console.log('Using offline tickets:', offlineTickets)
          setTickets(offlineTickets)
        } else {
          console.log('No offline tickets available')
          setTickets([])
        }
        
      } catch (error) {
        console.error('Error loading tickets:', error)
        // Final fallback to offline storage
        const offlineTickets = loadTicketsFromOfflineStorage()
        if (offlineTickets) {
          setTickets(offlineTickets)
        } else {
          setTickets([])
        }
      } finally {
        setLoading(false)
      }
    }

    loadTickets()

    // Listen for events updates (new tickets purchased)
    const handleEventsUpdate = () => {
      console.log('Events update event received in Tickets, reloading tickets...')
      if (user) {
        loadTickets()
      }
    }

    // Listen for online/offline status changes
    const handleOnlineStatusChange = () => {
      const isOnline = checkOnlineStatus()
      if (isOnline && user) {
        console.log('Back online, refreshing tickets...')
        loadTickets()
      }
    }

    window.addEventListener('suki:events_updated', handleEventsUpdate)
    window.addEventListener('online', handleOnlineStatusChange)
    window.addEventListener('offline', handleOnlineStatusChange)
    
    return () => {
      window.removeEventListener('suki:events_updated', handleEventsUpdate)
      window.removeEventListener('online', handleOnlineStatusChange)
      window.removeEventListener('offline', handleOnlineStatusChange)
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchTerm="" setSearchTerm={() => {}} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My Tickets</h1>
          {isOffline && (
            <div className="badge badge-warning gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Offline Mode
            </div>
          )}
        </div>
        
        {!user ? (
          <div className="card p-8 sm:p-10 text-center text-neutral-700">
            <p className="mb-4">Please sign in to view your tickets.</p>
            <a href="/auth" className="btn btn-primary">Sign In</a>
          </div>
        ) : loading ? (
          <div className="card p-8 sm:p-10 text-center text-neutral-700">
            <div className="loading loading-spinner loading-lg mb-4"></div>
            <p>Loading your tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="card p-8 sm:p-10 text-center text-neutral-700">
            <p className="mb-4">You don't have any tickets yet.</p>
            <p className="text-sm text-neutral-500">Discover events and purchase tickets to see them here.</p>
          </div>
        ) : (
          <>
            {isOffline && (
              <div className="card p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  <span className="font-medium">Offline Mode Active</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Your tickets are loaded from offline storage. QR codes are fully functional without internet connection.
                </p>
              </div>
            )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {tickets.map(ticket => (
              <article key={ticket.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-neutral-900">{ticket.events.title}</h3>
                  <span className={`badge ${ticket.orders.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                    {ticket.orders.status}
                  </span>
                </div>
                
                <div className="text-sm text-neutral-600">
                  <p>{formatBangkokDate(ticket.events.start_at)}</p>
                  <p>{formatBangkokLabel(ticket.events.start_at, { hour: '2-digit', minute: '2-digit' })} - {formatBangkokLabel(ticket.events.end_at, { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-neutral-500">{ticket.events.venues?.name || 'TBD'}</p>
                  {ticket.ticket_tiers && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="text-xs font-medium text-blue-900">{ticket.ticket_tiers.name}</div>
                      <div className="text-xs text-blue-700">
                        {ticket.ticket_tiers.price === 0 ? 'Free' : `${ticket.ticket_tiers.price.toLocaleString()} VND`}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-white inline-block p-2 rounded border border-neutral-200">
                  <QRCodeCanvas value={ticket.qr_token || `ticket-${ticket.id}`} size={120} />
                </div>
                
                <div className="text-xs text-neutral-500">
                  <p>Order: #{ticket.orders.id}</p>
                  <p>Ticket ID: {ticket.id}</p>
                  <p>Purchased: {formatBangkokDate(ticket.orders.created_at)}</p>
                </div>
              </article>
            ))}
          </div>
            </>
          )}
      </main>
    </div>
  )
}
