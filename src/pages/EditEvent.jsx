import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Header from '../components/Header.jsx'
import { supabase } from '../lib/supabase.js'
import { composeBangkokIso, extractBangkokDate, extractBangkokTime } from '../helpers/time'
import { ADMISSION_TICKETED, ADMISSION_OPEN } from '../helpers/event'
import { CATEGORIES } from '../constants/categories'
import TicketTierManager from '../components/TicketTierManager.jsx'
import LocationSelector from '../components/LocationSelector.jsx'
import EventCoverUploader from '../components/EventCoverUploader.jsx'
import { PAYMENTS_ENABLED } from '../config/payments'
import '../styles.css'

export default function EditEvent() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const event = location.state?.event

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
  const [capacity, setCapacity] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [coverImage, setCoverImage] = useState(null)
  const [coverImagePreview, setCoverImagePreview] = useState('')
  const [ticketTiers, setTicketTiers] = useState([])
  const [ticketTiersValid, setTicketTiersValid] = useState(true)
  const [isFree, setIsFree] = useState(false)
  const [admission, setAdmission] = useState(ADMISSION_TICKETED)
  const [loading, setLoading] = useState(false)
  const [hasSoldPaidTickets, setHasSoldPaidTickets] = useState(false)

  // Handle ticket tiers change
  const handleTicketTiersChange = useCallback((tiers) => {
    if (tiers === null) {
      setTicketTiersValid(false)
    } else {
      setTicketTiers(tiers)
      setTicketTiersValid(true)
    }
  }, [])

  // Auto-update capacity when ticket tiers change (only for paid events)
  useEffect(() => {
    if (!isFree && ticketTiers.length > 0) {
      const totalCapacity = ticketTiers.reduce(
        (sum, t) => sum + (parseInt(t.quota, 10) || 0),
        0
      )
      setCapacity(totalCapacity.toString())
    }
  }, [ticketTiers, isFree])

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
            venue:venues(*),
            ticket_tiers(
              id,
              name,
              price,
              quota
            )
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
        
        setCapacity(eventWithTiers.capacity?.toString() || '')
        setMinPrice(eventWithTiers.min_price?.toString() || '')
        setMaxPrice(eventWithTiers.max_price?.toString() || '')
        setCoverUrl(eventWithTiers.cover_url || '')
        setCoverImagePreview(eventWithTiers.cover_url || '')
        
        // Load ticket tiers if they exist
        if (eventWithTiers.ticket_tiers && eventWithTiers.ticket_tiers.length > 0) {
          setTicketTiers(eventWithTiers.ticket_tiers)
        }
        
        // Set free status based on pricing and admission
        setIsFree(eventWithTiers.min_price === 0 && eventWithTiers.max_price === 0)
        setAdmission(eventWithTiers.admission || ADMISSION_TICKETED)
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Please Sign In</h2>
            <p className="text-gray-600 mb-6">You need to be signed in to edit events.</p>
            <a href="/auth" className="btn btn-primary">Sign In</a>
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
            <p className="text-gray-600 mb-6">The event you're trying to edit doesn't exist.</p>
            <a href="/manage-events" className="btn btn-primary">Back to Events</a>
          </div>
        </div>
      </div>
    )
  }

  const checkForSoldPaidTickets = async () => {
    try {
      // Get all paid tiers (price > 0) for this event
      const { data: paidTiers, error: tiersError } = await supabase
        .from('ticket_tiers')
        .select('id, name, price')
        .eq('event_id', event.id)
        .gt('price', 0)

      if (tiersError) {
        console.error('Error checking paid tiers:', tiersError)
        return false // Allow the operation if we can't check
      }

      if (!paidTiers || paidTiers.length === 0) {
        return false // No paid tiers, so no sold paid tickets
      }

      // Check if any of these paid tiers have sold tickets
      for (const tier of paidTiers) {
        const { data: soldTickets, error: ticketsError } = await supabase
          .from('tickets')
          .select('id')
          .eq('tier_id', tier.id)
          .limit(1) // We only need to know if at least one exists

        if (ticketsError) {
          console.error('Error checking sold tickets for tier:', tier.name, ticketsError)
          continue // Skip this tier if we can't check
        }

        if (soldTickets && soldTickets.length > 0) {
          return true // Found sold tickets in a paid tier
        }
      }

      return false // No sold paid tickets found
    } catch (error) {
      console.error('Error in checkForSoldPaidTickets:', error)
      return false // Allow the operation if we can't check
    }
  }

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

  const handlePaidTierManagement = async () => {
    if (ticketTiers.length > 0) {
      // For paid events, eliminate ALL previous tiers (including any free tier),
      // then insert exactly the tiers specified in the editor
      const { error: deleteError } = await supabase
        .from('ticket_tiers')
        .delete()
        .eq('event_id', event.id)

      if (deleteError) {
        console.error('Error deleting existing ticket tiers:', deleteError)
        throw deleteError
      }

      // Insert new paid tiers
      const tiersToInsert = ticketTiers.map(tier => ({
        event_id: event.id,
        name: tier.name,
        price: 0,
        quota: parseInt(tier.quota) || 0
      }))

      const { error: tiersError } = await supabase
        .from('ticket_tiers')
        .insert(tiersToInsert)

      if (tiersError) {
        console.error('Error inserting new paid tiers:', tiersError)
        throw tiersError
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validate required fields
    if (!title.trim()) {
      alert('Please enter a title')
      setLoading(false)
      return
    }
    if (!date || !startTime) {
      alert('Please select a date and start time')
      setLoading(false)
      return
    }
    if (categories.length === 0) {
      alert('Please select at least one category')
      setLoading(false)
      return
    }
    if (!coverImagePreview && !coverUrl) {
      alert('Please upload a cover image')
      setLoading(false)
      return
    }
    if (locationData.mode === 'venue' && !locationData.name?.trim()) {
      alert('Please enter a venue name or select "To be announced"')
      setLoading(false)
      return
    }
    if (admission === ADMISSION_TICKETED && !capacity && (!ticketTiers || ticketTiers.length === 0)) {
      alert('Please set capacity for ticketed events')
      setLoading(false)
      return
    }

    try {
      // Build timestamp strings using Bangkok timezone utility with explicit +07:00 offset
      const startAt = date && startTime ? composeBangkokIso(date, startTime) : null
      const effectiveEndDate = endDate || date
      const endAt = endTime ? composeBangkokIso(effectiveEndDate, endTime) : startAt

      // Validate timeline
      if (startAt && endAt && new Date(endAt) < new Date(startAt)) {
        alert('End must be after start')
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
            alert('Could not create/update venue: ' + venueError.message)
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

      // Admission-based price/capacity
      const minPrice = 0
      const maxPrice = 0
      let finalCapacity = null
      let totalFromTiers = 0
      if (admission === ADMISSION_TICKETED) {
        totalFromTiers = ticketTiers.reduce(
          (sum, t) => sum + (parseInt(t.quota, 10) || 0),
          0
        )

        finalCapacity =
          ticketTiers.length > 0
            ? (isFree ? (parseInt(capacity, 10) || 0) : totalFromTiers)
            : (parseInt(capacity, 10) || null)
      }

      console.log('Capacity Debug:', {
        capacity,
        ticketTiers: ticketTiers.length,
        totalFromTiers,
        finalCapacity,
        isFree,
        admission
      })

      // Update event
      const { error } = await supabase
        .from('events')
        .update({
          title,
          description,
          start_at: startAt,
          end_at: endAt,
          categories,
          venue_id: venue_id, // Use the venue_id we determined above
          admission,
          capacity: finalCapacity,
          min_price: minPrice,
          max_price: maxPrice,
          cover_url: coverImagePreview || coverUrl || null
        })
        .eq('id', event.id)
        .eq('creator_id', user.id)

      if (error) {
        console.error('Error updating event:', error)
        throw error
      }

      console.log('Event updated successfully with capacity:', finalCapacity)

      // Update ticket tiers according to admission
      if (admission === ADMISSION_OPEN) {
        await supabase
          .from('ticket_tiers')
          .delete()
          .eq('event_id', event.id)
      } else if (ticketTiers.length > 0) {
        // SAFETY CHECK 1: Validate that new quotas are not less than tickets already sold
        const validationErrors = []
        
        for (const newTier of ticketTiers) {
          // Find the original tier to get current sales
          const originalTier = event.ticket_tiers?.find(t => t.name === newTier.name)
          
          if (originalTier && newTier.quota < originalTier.quota) {
            // Check if reducing quota would cause issues
            const { data: soldTickets } = await supabase
              .from('tickets')
              .select('id')
              .eq('tier_id', originalTier.id)
            
            const ticketsSold = soldTickets?.length || 0
            
            if (newTier.quota < ticketsSold) {
              validationErrors.push(
                `Cannot reduce "${newTier.name}" quota to ${newTier.quota} - ${ticketsSold} tickets already sold`
              )
            }
          }
        }
        
        // SAFETY CHECK 2: Validate that no tiers with sold tickets are being deleted
        const originalTierNames = event.ticket_tiers?.map(t => t.name) || []
        const newTierNames = ticketTiers.map(t => t.name)
        const deletedTierNames = originalTierNames.filter(name => !newTierNames.includes(name))
        
        for (const deletedTierName of deletedTierNames) {
          const deletedTier = event.ticket_tiers?.find(t => t.name === deletedTierName)
          
          if (deletedTier) {
            // Check if this deleted tier has sold tickets
            const { data: soldTickets } = await supabase
              .from('tickets')
              .select('id')
              .eq('tier_id', deletedTier.id)
            
            const ticketsSold = soldTickets?.length || 0
            
            if (ticketsSold > 0) {
              validationErrors.push(
                `Cannot delete "${deletedTierName}" tier - ${ticketsSold} tickets already sold`
              )
            }
          }
        }
        
        if (validationErrors.length > 0) {
          alert('Cannot update event: ' + validationErrors.join('\n'))
          return
        }

        // Handle tier conversion logic
        if (isFree) {
          // Converting to free: remove all paid tiers, keep/create free tier
          await handleConversionToFree(finalCapacity)
        } else if (PAYMENTS_ENABLED) {
          // Converting to paid or updating paid tiers
          await handlePaidTierManagement()
        }
      } else if (isFree) {
        // No tiers provided but event is marked as free - create free tier
        await handleConversionToFree(finalCapacity)
      } else if (!isFree) {
        // Paid event with no tiers: remove all existing tiers so none show up
        const { error: deleteAllError } = await supabase
          .from('ticket_tiers')
          .delete()
          .eq('event_id', event.id)
        
        if (deleteAllError) {
          console.error('Error deleting all tiers for paid event with no tiers:', deleteAllError)
          throw deleteAllError
        }
      }

      // Reload the event data to ensure we have the latest venue information
      const { data: updatedEvent, error: reloadError } = await supabase
        .from('events')
        .select('*, venue:venues(*)')
        .eq('id', event.id)
        .single()
      
      if (reloadError) {
        console.error('Error reloading event data:', reloadError)
      }

      alert('Event updated successfully!')
      navigate('/manage-events')
    } catch (error) {
      console.error('Error updating event:', error)
      alert('Failed to update event: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Cover image handling functions
  const handleCoverImageUpload = async (file) => {
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, JPEG, etc.)')
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB')
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
              Edit Event
            </h1>
            
            {/* Subtitle with modern typography */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed font-light">
              Update your event details and settings
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
                <h2 className="text-2xl font-bold text-gray-900">Event Title</h2>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors text-lg"
                placeholder="Enter event title"
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
                <h2 className="text-2xl font-bold text-gray-900">Description</h2>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                maxLength={4000}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors resize-none"
                placeholder="About this event (up to 4,000 characters)"
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
                <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
              </div>
              <p className="text-gray-600 mb-6">Select one or more categories that best describe your event.</p>
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
                      {opt}
                    </button>
                  )
                })}
            </div>
              {categories.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">Please select at least one category</p>
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
                <h2 className="text-2xl font-bold text-gray-900">Date & Time</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  min={date}
                  onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
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
                <h2 className="text-2xl font-bold text-gray-900">Location</h2>
              </div>
              <LocationSelector 
                onLocationChange={setLocationData}
                initialLocation={locationData}
              />
            </section>

            {/* Admission */}
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Admission</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`flex items-start gap-3 p-5 border-2 rounded-xl cursor-pointer transition-colors ${admission === ADMISSION_TICKETED ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300'}`}>
                  <input
                    type="radio"
                    name="admission"
                    className="mt-1 h-5 w-5 text-brand-600 focus:ring-brand-500"
                    checked={admission === ADMISSION_TICKETED}
                    onChange={() => setAdmission(ADMISSION_TICKETED)}
                  />
                  <div>
                    <div className="text-gray-900 font-medium">Ticketed</div>
                    <p className="text-sm text-gray-600">Paid/free tickets, capacity applies</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-5 border-2 rounded-xl cursor-pointer transition-colors ${admission === ADMISSION_OPEN ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300'}`}>
                  <input
                    type="radio"
                    name="admission"
                    className="mt-1 h-5 w-5 text-brand-600 focus:ring-brand-500"
                    checked={admission === ADMISSION_OPEN}
                    onChange={() => setAdmission(ADMISSION_OPEN)}
                  />
              <div>
                    <div className="text-gray-900 font-medium">Open</div>
                    <p className="text-sm text-gray-600">No ticket required, unlimited capacity</p>
                  </div>
                </label>
              </div>
            </section>

            {/* Capacity and Pricing */}
            {admission === ADMISSION_TICKETED && (
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Capacity & Pricing</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  min="1"
                  disabled={!isFree && ticketTiers.length > 0}
                    className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors ${
                    !isFree && ticketTiers.length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Unlimited"
                />
                {(!isFree && ticketTiers.length > 0) ? (
                  <p className="text-xs text-neutral-500 mt-1">
                    Capacity is the sum of tier quotas. Edit the tiers above to change capacity.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Set the maximum number of people who can attend your event.
                  </p>
                )}
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Price (VND)</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min="0"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                  placeholder="0"
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (VND)</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min="0"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
            </section>
            )}

            {/* Cover Image */}
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Cover Image</h2>
              </div>
              <p className="text-gray-600 mb-6">Upload a cover image to make your event stand out. Recommended size: 1600×900 pixels.</p>
              
              {event?.id ? (
                <div className="space-y-6">
                  {event.cover_url && (
                    <div className="relative">
                      <img src={event.cover_url} alt="Current cover" className="w-full h-64 object-cover rounded-xl border border-gray-200 shadow-sm" />
                      <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        Current Cover
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Cover Image Upload</h3>
                  <p className="text-gray-500">Save the event first to upload a cover image</p>
                  </div>
                )}
            </section>

            {/* Ticket Tiers */}
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
              </div>
                <h2 className="text-2xl font-bold text-gray-900">Ticket Tiers</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Manage your ticket types, prices, and quantities. You can have free and paid tiers.
              </p>
              
              {/* Free Tickets Option */}
              <div className="mb-6">
                <label className="inline-flex items-center gap-3 text-gray-700">
                  <input
                    type="checkbox" 
                    className={`w-5 h-5 text-brand-600 rounded focus:ring-brand-500 ${
                      hasSoldPaidTickets && !isFree ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    checked={isFree} 
                    disabled={hasSoldPaidTickets && !isFree}
                    onChange={async e => {
                      const newIsFree = e.target.checked
                      
                      // Check if converting from paid to free and if there are sold tickets
                      if (newIsFree && !isFree) {
                        // Check if any paid tiers have sold tickets
                        const hasSoldPaidTickets = await checkForSoldPaidTickets()
                        if (hasSoldPaidTickets) {
                          alert('Cannot convert to free event: Some paid tickets have already been sold. Please contact support if you need to make changes.')
                          return // Don't change the checkbox state
                        }
                      }
                      
                      setIsFree(newIsFree)
                      
                      if (newIsFree) {
                        // Converting from paid to free: remove all existing tiers
                        setTicketTiers([])
                        setMinPrice('0')
                        setMaxPrice('0')
                      } else {
                        // Converting from free to paid: keep existing free tickets in a free tier
                        // The existing free tier will remain for already sold tickets
                        // User can add new paid tiers via TicketTierManager
                      }
                    }} 
                  />
                  <span className={`font-medium ${hasSoldPaidTickets && !isFree ? 'text-gray-400' : ''}`}>
                    My tickets are free
                  </span>
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  {hasSoldPaidTickets && !isFree ? (
                    <span className="text-red-600 font-medium">
                      ⚠️ Cannot convert to free: Some paid tickets have already been sold. Contact support for assistance.
                    </span>
                  ) : (
                    'Check this if you want to offer all tickets for free. No tiering options will be available.'
                  )}
                </p>
            </div>

              {/* Show TicketTierManager only when not free */}
              {!isFree && (
              <TicketTierManager 
                tiers={ticketTiers} 
                  onChange={handleTicketTiersChange}
                eventId={event.id}
                originalEvent={event}
                isEditing={true}
              />
              )}
              
              {/* Show message when free tickets are selected */}
              {isFree && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Free Event</h3>
                  <p className="text-green-700">
                    Your event will be completely free for all attendees. No ticket tiers or pricing needed!
                </p>
              </div>
              )}
            </section>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-8">
              <button
                type="button"
                onClick={() => navigate('/manage-events')}
                className="btn btn-ghost text-lg px-8 py-3 flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !ticketTiersValid}
                className={`btn text-lg px-8 py-3 flex-1 bg-gradient-to-r from-brand-600 to-purple-600 border-0 hover:from-brand-700 hover:to-purple-700 shadow-lg hover:shadow-xl ${
                  !ticketTiersValid ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Updating...' : 'Update Event'}
              </button>
            </div>
            
            {/* Validation Status */}
            {!ticketTiersValid && (
              <div className="text-center">
                <p className="text-sm text-red-600">
                  ⚠️ Cannot save event - Please fix the validation errors above
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}