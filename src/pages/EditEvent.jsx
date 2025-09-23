import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Header from '../components/Header.jsx'
import { supabase } from '../lib/supabase.js'
import { composeBangkokIso, extractBangkokDate, extractBangkokTime } from '../helpers/time'
// Ticketing removed
import { CATEGORIES } from '../constants/categories'
// Ticketing removed – link-out only
import LocationSelector from '../components/LocationSelector.jsx'
import EventCoverUploader from '../components/EventCoverUploader.jsx'
import { PAYMENTS_ENABLED } from '../config/payments'
import '../styles.css'
import { useLang } from '../i18n/LangContext.jsx'

export default function EditEvent() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const event = location.state?.event
  const { t, fmtDate } = useLang()

  // Helper function to get translated category name
  const getCategoryLabel = (category) => {
    const key = `categories.${category.toLowerCase().replace(/\s+/g, '')}`
    return t(key) || category
  }

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [locationData, setLocationData] = useState({
    mode: 'venue',
    name: '',
    coordinates: null,
    address: null
  })
  const [externalUrl, setExternalUrl] = useState('')
  const [ticketInstructions, setTicketInstructions] = useState('')  // new
  const [coverUrl, setCoverUrl] = useState('')
  const [coverImage, setCoverImage] = useState(null)
  const [coverImagePreview, setCoverImagePreview] = useState('')
  // No ticketing UI
  const [loading, setLoading] = useState(false)
  const [hasSoldPaidTickets, setHasSoldPaidTickets] = useState(false)

  // No tier editor

  // Capacity is directly edited

  useEffect(() => {
    if (!event) {
      navigate('/manage-events')
      return
    }

    // Load event with ticket tiers from Supabase
    const loadEventWithTiers = async () => {
      try {
        const { data: eventData, error } = await supabase
          .from('events')
          .select(`
            *,
            venue:venues(*)
          `)
          .eq('id', event.id)
          .single()

        if (error) {
          console.error('Error loading event with tiers:', error)
          return
        }

        const eventWithTiers = eventData

        // Pre-populate form with event data
        setTitle(eventWithTiers.title || '')
        setDescription(eventWithTiers.description || '')
        setCategory(eventWithTiers.category || '')
        
        // Prefill categories (multi-category support)
        setCategories(
          Array.isArray(eventWithTiers.categories) && eventWithTiers.categories.length
            ? eventWithTiers.categories
            : (eventWithTiers.category ? [eventWithTiers.category] : [])
        )
        
        // Prefill using Bangkok timezone helpers to avoid UTC shifts
        const startAtStr = eventWithTiers.start_at
        if (startAtStr) {
          setDate(extractBangkokDate(startAtStr))
          setStartTime(extractBangkokTime(startAtStr))
        }
        
        if (eventWithTiers.end_at) {
          setEndDate(extractBangkokDate(eventWithTiers.end_at))
          setEndTime(extractBangkokTime(eventWithTiers.end_at))
        }
        
        if (eventWithTiers.venue && eventWithTiers.venue.name && eventWithTiers.venue.name !== 'TBD') {
          setLocationData({
            mode: 'venue',
            name: eventWithTiers.venue.name,
            coordinates: eventWithTiers.venue.latitude && eventWithTiers.venue.longitude 
              ? [eventWithTiers.venue.latitude, eventWithTiers.venue.longitude] 
              : null,
            address: eventWithTiers.venue.address || null
          })
        } else {
          setLocationData({
            mode: 'online',
            name: 'Online',
            coordinates: null,
            address: null
          })
        }
        
        setExternalUrl(eventWithTiers.external_ticket_url || '')
        setTicketInstructions(eventWithTiers.external_ticket_instructions || '')
        setCoverUrl(eventWithTiers.cover_url || '')
        setCoverImagePreview(eventWithTiers.cover_url || '')
        
        // Ticketing removed
      } catch (error) {
        console.error('Error in loadEventWithTiers:', error)
      }
    }

    loadEventWithTiers()
  }, [event, navigate])

  // Check for sold paid tickets when event loads
  useEffect(() => {
    if (event?.id) {
      checkForSoldPaidTickets().then(setHasSoldPaidTickets)
    }
  }, [event?.id])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('editEvent.signInRequired')}</h2>
            <p className="text-gray-600 mb-6">{t('editEvent.signInPrompt')}</p>
            <a href="/auth" className="btn btn-primary">{t('editEvent.signInBtn')}</a>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('editEvent.notFound')}</h2>
            <p className="text-gray-600 mb-6">{t('editEvent.notFoundPrompt')}</p>
            <a href="/manage-events" className="btn btn-primary">{t('editEvent.backToEvents')}</a>
          </div>
        </div>
      </div>
    )
  }

  const checkForSoldPaidTickets = async () => false

  const handleConversionToFree = async (finalCapacity) => {
    // Remove all paid tiers
    const { error: deleteError } = await supabase
      .from('ticket_tiers')
      .delete()
      .eq('event_id', event.id)
      .gt('price', 0)
    if (deleteError) throw deleteError

    // Upsert the single free tier to match finalCapacity
    const { data: existing, error: checkError } = await supabase
      .from('ticket_tiers')
      .select('id')
      .eq('event_id', event.id)
      .eq('price', 0)
      .limit(1)
    if (checkError) throw checkError

    if (existing && existing.length > 0) {
      const { error: updErr } = await supabase
        .from('ticket_tiers')
        .update({ quota: finalCapacity })
        .eq('id', existing[0].id)
      if (updErr) throw updErr
    } else {
      const { error: insErr } = await supabase
        .from('ticket_tiers')
        .insert({
          event_id: event.id,
          name: 'General Admission (Free)',
          price: 0,
          quota: finalCapacity
        })
      if (insErr) throw insErr
    }
  }

  // Removed paid tiers management; edit path will enforce single free tier

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validate required fields
    if (!title.trim()) {
      alert(t('validate.title'))
      setLoading(false)
      return
    }
    if (!date || !startTime) {
      alert(t('validate.dateStart'))
      setLoading(false)
      return
    }
    if (categories.length === 0) {
      alert(t('validate.category'))
      setLoading(false)
      return
    }
    if (!coverImagePreview && !coverUrl) {
      alert(t('validate.cover'))
      setLoading(false)
      return
    }
    if (locationData.mode === 'venue' && !locationData.name?.trim()) {
      alert(t('validate.venue'))
      setLoading(false)
      return
    }
    // Admission validation removed - discovery-only mode

    try {
      // Build timestamp strings using Bangkok timezone utility with explicit +07:00 offset
      const startAt = date && startTime ? composeBangkokIso(date, startTime) : null
      const effectiveEndDate = endDate || date
      const endAt = endTime ? composeBangkokIso(effectiveEndDate, endTime) : startAt

      // Validate timeline
      if (startAt && endAt && new Date(endAt) < new Date(startAt)) {
        alert(t('validate.endAfterStart'))
        setLoading(false)
        return
      }

      // Handle venue updates - create venue if needed and get venue_id
      let venue_id = null
      if (locationData.mode === 'venue' && locationData.name) {
        if (locationData.coordinates) {
          // Use the new RPC function for venues with coordinates
          const { data: venueId, error: venueError } = await supabase.rpc('upsert_custom_venue', {
            p_name: locationData.name.trim(),
            p_address: locationData.address || null,
            p_lat: locationData.coordinates[0],
            p_lng: locationData.coordinates[1]
          })
          
          if (venueError) {
            console.error('Error creating/updating venue:', venueError)
            alert(t('create.venueError', { msg: venueError.message }))
            setLoading(false)
            return
          }
          venue_id = venueId
          console.log('Venue created/updated successfully with coordinates:', venueId)
        } else {
          // Fallback for venues without coordinates - try to find existing venue first
        const { data: existingVenues, error: searchError } = await supabase
          .from('venues')
          .select('id, name')
            .eq('name', locationData.name)
        
        if (!searchError && existingVenues && existingVenues.length > 0) {
          venue_id = existingVenues[0].id
        } else {
            // Create new venue without coordinates
          const { data: newVenue, error: createError } = await supabase
            .from('venues')
              .insert([{ 
                name: locationData.name,
                address: locationData.address || null
              }])
            .select('id, name')
          
          if (!createError && newVenue && newVenue.length > 0) {
            venue_id = newVenue[0].id
          } else {
            // If venue creation fails, keep existing venue
            venue_id = event.venue?.id
          }
        }
      }
      }

      // Update event (ticketing removed)
      const { error } = await supabase
        .from('events')
        .update({
          title,
          description,
          start_at: startAt,
          end_at: endAt,
          categories,
          venue_id: venue_id, // Use the venue_id we determined above
          external_ticket_url: externalUrl || null,
          external_ticket_instructions: ticketInstructions || null,
          cover_url: coverImagePreview || coverUrl || null
        })
        .eq('id', event.id)
        .eq('creator_id', user.id)

      if (error) {
        console.error('Error updating event:', error)
        throw error
      }

      console.log('Event updated successfully')

      // Reload the event data to ensure we have the latest venue information
      const { data: updatedEvent, error: reloadError } = await supabase
        .from('events')
        .select('*, venue:venues(*)')
        .eq('id', event.id)
        .single()
      
      if (reloadError) {
        console.error('Error reloading event data:', reloadError)
      }

      alert(t('editEvent.saved'))
      navigate('/manage-events')
    } catch (error) {
      console.error('Error updating event:', error)
      alert(t('editEvent.saveError', { msg: error.message }))
    } finally {
      setLoading(false)
    }
  }

  // Cover image handling functions
  const handleCoverImageUpload = async (file) => {
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('create.imageFileType'))
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('create.imageFileSize'))
      return
    }
    
    setCoverImage(file)
    const reader = new FileReader()
    reader.onload = () => setCoverImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleCoverImageDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleCoverImageUpload(files[0])
    }
  }

  const handleCoverImageDragOver = (e) => {
    e.preventDefault()
  }

  const removeCoverImage = () => {
    setCoverImage(null)
    setCoverImagePreview('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      <div className="container mx-auto px-6 py-12">
        <div className="mb-16">
          <div className="text-center relative">
            {/* Background decorative elements */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-brand-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-blue-100/30 to-cyan-100/30 rounded-full blur-2xl"></div>
              <div className="absolute top-1/2 left-0 w-48 h-48 bg-gradient-to-r from-pink-100/30 to-rose-100/30 rounded-full blur-xl"></div>
          </div>

            {/* Main heading with enhanced styling */}
            <h1 
              className="text-6xl md:text-7xl font-black bg-gradient-to-r from-gray-900 via-brand-600 to-purple-700 bg-clip-text text-transparent mb-8"
              style={{ lineHeight: '1.6' }}
            >
              {t('editEvent.title')}
            </h1>
            
            {/* Subtitle with modern typography */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed font-light">
              {t('editEvent.subtitle')}
            </p>
            
            {/* Decorative line */}
            <div className="w-24 h-1 bg-gradient-to-r from-brand-500 to-purple-500 mx-auto rounded-full mb-8"></div>
          </div>
          </div>

        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Event Title */}
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('eventForm.title')}</h2>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors text-lg"
                placeholder={t('create.titlePlaceholder')}
              />
            </section>

            {/* Description */}
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('eventForm.description')}</h2>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                maxLength={4000}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors resize-none"
                placeholder={t('create.descriptionPlaceholder')}
              />
            </section>

            {/* Categories */}
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('eventForm.categories')}</h2>
            </div>
              <p className="text-gray-600 mb-6">{t('eventForm.categoriesHelp')}</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(opt => {
                  const selected = categories.includes(opt)
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() =>
                        setCategories(prev =>
                          prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]
                        )
                      }
                      className={`px-3 py-1 rounded-full border transition-colors ${
                        selected 
                          ? 'bg-brand-600 text-white border-brand-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-brand-300'
                      }`}
                      aria-pressed={selected}
                    >
                      {getCategoryLabel(opt)}
                    </button>
                  )
                })}
            </div>
              {categories.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">{t('validate.category')}</p>
              )}
            </section>

            {/* Date and Time */}
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('create.whenWhere')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('create.startDate')} *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('create.startTime')} *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('create.endDate')}</label>
                <input
                  type="date"
                  value={endDate}
                  min={date}
                  onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('create.endTime')}</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
            </section>

            {/* Location */}
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('create.venue')}</h2>
              </div>
              <LocationSelector 
                onLocationChange={setLocationData}
                initialLocation={locationData}
              />
            </section>


            {/* Cover Image */}
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('eventForm.cover')}</h2>
              </div>
              <p className="text-gray-600 mb-6">{t('create.coverHelp')}</p>
              
              {event?.id ? (
                <div className="space-y-6">
                  {event.cover_url && (
                    <div className="relative">
                      <img src={event.cover_url} alt={t('create.coverPreview')} className="w-full h-64 object-cover rounded-xl border border-gray-200 shadow-sm" />
                      <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {t('create.currentCover')}
                    </div>
                    </div>
                  )}
                  <EventCoverUploader
                    eventId={event.id}
                    onDone={(url) => {
                      setCoverUrl(url)
                      setCoverImagePreview(url)
                    }}
                  />
                  </div>
                ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('create.coverUpload')}</h3>
                  <p className="text-gray-500">{t('create.saveFirst')}</p>
                  </div>
                )}
            </section>

            {/* Tickets (link-out only) */}
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full grid place-items-center">
                  <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m-9 4h12M7 15h10" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('create.tickets')}</h2>
              </div>
              <div className="space-y-4">
                <input
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                  placeholder={t('create.externalLinkPlaceholder')}
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                />
                <textarea
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors resize-none"
                  rows={5}
                  placeholder={t('create.ticketInstructionsPlaceholder')}
                  value={ticketInstructions}
                  onChange={(e) => setTicketInstructions(e.target.value)}
                />
                <p className="text-sm text-gray-500">{t('create.ticketsOptional')}</p>
              </div>
            </section>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-8">
              <button
                type="button"
                onClick={() => navigate('/manage-events')}
                className="btn btn-ghost text-lg px-8 py-3 flex-1"
              >
                {t('form.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn text-lg px-8 py-3 flex-1 bg-gradient-to-r from-brand-600 to-purple-600 border-0 hover:from-brand-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
              >
                {loading ? t('create.publishing') : t('eventForm.updateEvent')}
              </button>
            </div>
            
            {/* No tier validation in free-only mode */}
          </form>
        </div>
      </div>
    </div>
  )
}