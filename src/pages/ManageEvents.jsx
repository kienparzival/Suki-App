import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import Header from '../components/Header.jsx'
import { Edit, Trash2, Eye, Calendar, MoreVertical, List, CalendarDays, Link, Copy as CopyIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatBangkokLabel, formatBangkokDate } from '../helpers/time'
import { useNavigate } from 'react-router-dom'
import { T } from '../i18n.tsx'

export default function ManageEvents() {
  const { user } = useAuth()
  const navigate = useNavigate()
    const [userLocation, setUserLocation] = useState({ city: 'HCMC', lat: 10.7769, lng: 106.7009 })
  const [myEvents, setMyEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'calendar'
  const [showActionsMenu, setShowActionsMenu] = useState(null) // event ID for which menu is open
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })


  useEffect(() => {
    // Load user's saved city from profile
    if (user?.city) {
      const cityToCoords = (city) => {
        switch ((city || '').toLowerCase()) {
          case 'hcmc':
          case 'ho chi minh city':
          case 'saigon':
            return { city: 'HCMC', lat: 10.7769, lng: 106.7009 }
          case 'hanoi':
            return { city: 'Hanoi', lat: 21.0278, lng: 105.8342 }
          case 'danang':
          case 'da nang':
            return { city: 'Danang', lat: 16.0544, lng: 108.2208 }
          default:
            return { city: 'HCMC', lat: 10.7769, lng: 106.7009 }
        }
      }
      setUserLocation(cityToCoords(user.city))
    }

    // Load user's created events
    loadMyEvents()
    
  }, [user])

      // Add focus listener to reload data when returning from edit
    useEffect(() => {
      const handleFocus = () => {
        if (user) {
          loadMyEvents()
        }
      }

      window.addEventListener('focus', handleFocus)
      return () => window.removeEventListener('focus', handleFocus)
      }, [user])


  // Force refresh when page becomes visible (catches missed real-time updates)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadMyEvents()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  // Listen for events updates
        useEffect(() => {
          const handleEventsUpdate = () => {
            console.log('Events update event received in ManageEvents, reloading...')
            if (user) {
              loadMyEvents()
            }
          }

          // Listen for account switches
          const handleAccountSwitch = () => {
            console.log('Account switch detected in ManageEvents, reloading...')
            if (user) {
              loadMyEvents()
            }
          }
      
          window.addEventListener('suki:events_updated', handleEventsUpdate)
          window.addEventListener('suki:account_switched', handleAccountSwitch)
          
          return () => {
            window.removeEventListener('suki:events_updated', handleEventsUpdate)
            window.removeEventListener('suki:account_switched', handleAccountSwitch)
          }
        }, [user])

  const loadMyEvents = useCallback(async () => {
    if (!user) return
    setLoading(true)
    
    try {
      // Load events from Supabase with ticket tiers
      const { data: supabaseEvents, error } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(*)
        `)
        .eq('creator_id', user.id)
        .order('start_at', { ascending: false })

      if (error) {
        console.error('Error loading Supabase events:', error)
        setMyEvents([])
      } else {
        // Get live tiers with sold/remaining via RPC (bypasses RLS safely)
        // Ticketing removed; no tier fetch
        
        setMyEvents(supabaseEvents || [])
      }
    } catch (error) {
      console.error('Error loading events:', error)
      setMyEvents([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Also listen for focus events to refresh when returning from other pages
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadMyEvents()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, loadMyEvents])

  const handleEditEvent = (event) => {
    navigate('/edit-event', { state: { event } })
  }

  const handleCopyEvent = (event) => {
    navigate('/copy-event', { state: { event } })
  }

  const handleViewEvent = (eventId) => {
    navigate(`/events/${eventId}`)
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('creator_id', user.id)

      if (error) {
        console.error('Error deleting event:', error)
        alert('Could not delete: ' + error.message)
      } else {
        setMyEvents(prev => prev.filter(e => e.id !== eventId))
        setShowActionsMenu(null)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Could not delete: ' + error.message)
    }
  }

  const copyEventLink = (eventId) => {
    const url = `${window.location.origin}/events/${eventId}`
    navigator.clipboard.writeText(url)
      alert("Event link copied to clipboard!")
    setShowActionsMenu(null)
  }

  const copyEvent = (event) => {
    handleCopyEvent(event)
    setShowActionsMenu(null)
  }

  const getEventStatus = (event) => {
    const now = new Date()
    const eventDate = new Date(event.start_at)
    
    if (event.status === 'cancelled') return "Cancelled"
    if (eventDate < now) return "Past"
    if (event.status === 'published') return "Published"
    return "Draft"
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Published": return 'text-green-600 bg-green-100'
      case "Past": return 'text-gray-600 bg-gray-100'
      case "Cancelled": return 'text-red-600 bg-red-100'
      default: return 'text-yellow-600 bg-yellow-100'
    }
  }

  // ticketing removed → no gross/sold calculations

  const parseLocalDateTime = (s) => {
    return new Date(s)
  }

  const formatDate = (dateString) => {
    return formatBangkokDate(dateString)
  }

  const formatDateTime = (dateString) => {
    return formatBangkokLabel(dateString, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const toggleActionsMenu = (eventId, buttonElement) => {
    if (showActionsMenu === eventId) {
      setShowActionsMenu(null)
    } else {
      const rect = buttonElement.getBoundingClientRect()
      setDropdownPosition({
        top: rect.top - 200,
        left: rect.right - 200
      })
      setShowActionsMenu(eventId)
    }
  }

  const closeActionsMenu = () => {
    setShowActionsMenu(null)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (!event.target.closest('.actions-menu')) {
        closeActionsMenu()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4"><T>Manage Events</T></h1>
          <p className="text-lg text-gray-600"><T>Monitor and manage your events and make updates</T></p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              <T>List View</T>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <T>Calendar View</T>
            </button>
          </div>
          
          <a href="/create" className="btn btn-primary">
            <T>Create New Event</T>
          </a>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="loading loading-spinner loading-lg"></div>
            <p className="mt-4 text-gray-600"><T>Loading your events...</T></p>
          </div>
        ) : myEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2"><T>No events yet</T></h3>
            <p className="text-gray-600 mb-4"><T>You haven't created any events yet. Start by creating your first event!</T></p>
            <a href="/create" className="btn btn-primary"><T>Create Your First Event</T></a>
          </div>
        ) : viewMode === 'list' ? (
          /* List View - Table */
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><T>Event</T></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><T>Status</T></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><T>Actions</T></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myEvents.map((event) => {
                    const status = getEventStatus(event)
                    
                    return (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {event.cover_url ? (
                                <img 
                                  src={event.cover_url} 
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Calendar className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {event.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDateTime(event.start_at)} • {event.venue?.name || 'TBD'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                            <T>{status}</T>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="relative actions-menu">
                            <button
                              onClick={(e) => toggleActionsMenu(event.id, e.currentTarget)}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            
                            {showActionsMenu === event.id && (
                              <div className="fixed w-48 bg-white rounded-md shadow-lg py-1 z-50 border" style={{
                                top: `${dropdownPosition.top}px`,
                                left: `${dropdownPosition.left}px`
                              }}>
                                <button
                                  onClick={() => handleViewEvent(event.id)}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  <T>View</T>
                                </button>
                                <button
                                  onClick={() => handleEditEvent(event)}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  <T>Edit</T>
                                </button>
                                <button
                                  onClick={() => copyEventLink(event.id)}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <Link className="w-4 h-4 mr-2" />
                                  <T>Copy Link</T>
                                </button>
                                <button
                                  onClick={() => copyEvent(event)}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <CopyIcon className="w-4 h-4 mr-2" />
                                  <T>Copy</T>
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  <T>Delete</T>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Calendar View - Placeholder */
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2"><T>Calendar View</T></h3>
            <p className="text-gray-600"><T>Calendar view coming soon!</T></p>
          </div>
        )}

        {/* Ticketing approvals removed: discovery-only mode */}
      </div>
    </div>
  )
}

