import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Header from '../components/Header.jsx'
import { supabase } from '../lib/supabase.js'
import { composeBangkokIso, extractBangkokDate, extractBangkokTime } from '../helpers/time'
import { CATEGORIES } from '../constants/categories'
import LocationSelector from '../components/LocationSelector.jsx'
import EventCoverUploader from '../components/EventCoverUploader.jsx'
import '../styles.css'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function CopyEvent() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const originalEvent = location.state?.event
    // Helper function to get translated category name
  const getCategoryLabel = (category) => {
    // normalize: lower, remove all non-alphanumerics to create a stable key
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '')
    // try exact (clean) key first, then try a few common alternates, then fallback
    const candidates = [
      `categories.${slug}`,
      // also try using hyphen word-joins if needed
      `categories.${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    ]
    for (const k of candidates) {
      const val = t(k)
      if (val !== k) return val
    }
    return t(`categories.other`) || category
  }

  // ALL HOOKS MUST BE DECLARED FIRST - before any conditional logic
  // Basics
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Music')
  const [categories, setCategories] = useState([])

  // Schedule
  const [date, setDate] = useState('')          // yyyy-mm-dd
  const [startTime, setStartTime] = useState('') // HH:mm
  const [endDate, setEndDate] = useState('')     // yyyy-mm-dd
  const [endTime, setEndTime] = useState('')     // HH:mm

  // Location
  const [locationData, setLocationData] = useState({
    mode: 'venue',
    name: '',
    coordinates: null,
    address: null
  })

  // External tickets
  const [externalUrl, setExternalUrl] = useState('')
  const [ticketInstructions, setTicketInstructions] = useState('')

  // Media
  const [coverImage, setCoverImage] = useState(null)
  const [coverImagePreview, setCoverImagePreview] = useState('')
  const [loading, setLoading] = useState(false)

  // Description character limits
  const descMax = 4000
  const descCount = description.length

  useEffect(() => {
    if (!originalEvent) {
      navigate('/manage-events')
      return
    }

    // Pre-populate form with original event data
    setTitle(`${originalEvent.title} (Copy)`)
    setDescription(originalEvent.description || '')
    setCategory(originalEvent.category || '')
    
    // Prefill categories (multi-category support)
    setCategories(
      Array.isArray(originalEvent.categories) && originalEvent.categories.length
        ? originalEvent.categories
        : (originalEvent.category ? [originalEvent.category] : [])
    )
    
    // Set date to tomorrow by default
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setDate(tomorrow.toISOString().split("T")[0])
    
    // Use timezone helpers to extract date/time properly
    setStartTime(extractBangkokTime(originalEvent.start_at))
    
    if (originalEvent.end_at) {
      setEndDate(extractBangkokDate(originalEvent.end_at))
      setEndTime(extractBangkokTime(originalEvent.end_at))
    }
    
    // Set up location data
    if (originalEvent.venue?.name && originalEvent.venue.name !== 'TBD') {
      setLocationData({
        mode: 'venue',
        name: originalEvent.venue.name,
        coordinates: originalEvent.venue.latitude && originalEvent.venue.longitude 
          ? [originalEvent.venue.latitude, originalEvent.venue.longitude] 
          : null,
        address: originalEvent.venue.address || null
      })
    } else {
      setLocationData({ mode: 'online', name: 'Online', coordinates: null, address: null })
    }
    
    // Set cover and external ticket info
    setCoverImagePreview(originalEvent.cover_url || '')
    setExternalUrl(originalEvent.external_ticket_url || '')
    setTicketInstructions(originalEvent.external_ticket_instructions || '')
  }, [originalEvent, navigate])

  const handleCoverImageUpload = async (file) => {
    setCoverImage(file)
    const preview = await readFileAsDataUrl(file)
    setCoverImagePreview(preview)
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

  const toIso = (d, t) => {
    // Use Bangkok timezone utility with explicit +07:00 offset
    return composeBangkokIso(d, t)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      alert("Please sign in to create events")
      return
    }

    if (!title.trim()) { alert("Please enter a title"); return }
    if (!date || !startTime) { alert("Please select a date and start time"); return }
    if (categories.length === 0) { alert("Please select at least one category"); return }
    if (!coverImagePreview && (!coverImage)) { alert("Please upload a cover image"); return }
    if (locationData.mode === 'venue' && !locationData.name?.trim()) { 
      alert("Please enter a venue name or select \"To be announced\""); 
      return 
    }

    const start_at = toIso(date, startTime)
    const effectiveEndDate = endDate || date
    const end_at = endTime ? toIso(effectiveEndDate, endTime) : start_at

    // Validate timeline
    if (new Date(end_at) < new Date(start_at)) {
      alert("End time must be after start time")
      return
    }

    let venue
    if (locationData.mode === 'online') venue = { name: 'Online' }
    else if (locationData.mode === 'tba') venue = { name: 'To be announced' }
    else venue = { name: (locationData.name || '').trim() }

    setLoading(true)

    try {
      // 1) Create a venue if user provided a custom place
      let venue_id = null
      if (locationData.mode === 'venue' && locationData.name?.trim()) {
        if (locationData.coordinates) {
          // Use the new RPC function for venues with coordinates
          const { data: venueId, error: venueError } = await supabase.rpc('upsert_custom_venue', {
            p_name: locationData.name.trim(),
            p_address: locationData.address || null,
            p_lat: locationData.coordinates[0],
            p_lng: locationData.coordinates[1]
          })
          
          if (venueError) {
            console.error('Error creating venue:', venueError)
            alert(`Error creating venue: ${venueError.message}`)
            setLoading(false)
            return
          }
          venue_id = venueId
          console.log('Venue created successfully with coordinates:', venueId)
        } else {
          // Fallback for venues without coordinates
          const { data: venueData, error: venueError } = await supabase
            .from('venues')
            .insert({
                name: locationData.name.trim(),
                address: locationData.address || null
            })
            .select("id")
            .single()
          
          if (venueError) {
            console.error('Error creating venue:', venueError)
            alert(`Error creating venue: ${venueError.message}`)
            setLoading(false)
            return
          }
          venue_id = venueData.id
        }
      }

      // 2) Upload cover image if provided
      let cover_url = coverImagePreview || null
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-covers')
          .upload(fileName, coverImage)

        if (uploadError) {
          console.error('Cover upload error:', uploadError)
          alert(`Error uploading image: ${uploadError.message}`)
          setLoading(false)
          return
        }

        const { data: publicUrlData } = supabase.storage
          .from('event-covers')
          .getPublicUrl(uploadData.path)
        
        cover_url = publicUrlData.publicUrl
      }

      // 3) Create event
      const { error } = await supabase
        .from('events')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          start_at,
          end_at,
          venue_id,
          cover_url,
          categories: categories.length > 0 ? categories : null,
          external_ticket_url: externalUrl || null,
          external_ticket_instructions: ticketInstructions || null,
          status: 'published',
          creator_id: user.id
        })

      if (error) {
        console.error('Event creation error:', error)
        alert(`Error creating event: ${error.message}`)
        setLoading(false)
        return
      }

      alert("Event copied successfully!")
      navigate('/manage-events')
    } catch (error) {
      console.error('Error copying event:', error)
      alert(`Error creating event: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Please sign in to copy events</h2>
            <p className="text-gray-600 mb-6">You need to sign in to copy events</p>
            <a href="/auth" className="btn btn-primary">Sign In</a>
          </div>
        </div>
      </div>
    )
  }

  if (!originalEvent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Original event not found</h2>
            <p className="text-gray-600 mb-6">The event you want to copy doesn't exist or was deleted</p>
            <a href="/manage-events" className="btn btn-primary">Back to Events</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white overflow-x-hidden">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main heading with enhanced styling */}
        <div className="text-center mb-12">
          <h1 
            className="text-6xl md:text-7xl font-black bg-gradient-to-r from-gray-900 via-brand-600 to-purple-700 bg-clip-text text-transparent mb-8"
            style={{ lineHeight: '1.6' }}
          >
            Copy Event
          </h1>
          
          {/* Subtitle with modern typography */}
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed font-light">
            Create a duplicate of this event
          </p>
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
                <h2 className="text-2xl font-bold text-gray-900">Event Title <span className="text-red-500">*</span></h2>
              </div>
              <p className="text-gray-600 mb-6">This will be your event's title. Be specific and engaging to attract attendees!</p>
              <input 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors text-lg" 
                placeholder="Enter event title" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required
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
              <p className="text-gray-600 mb-6">Tell people what makes this special. You can use line breaks and emojis.</p>
              <textarea 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors resize-none" 
                rows={8} 
                maxLength={descMax} 
                placeholder="About this event (up to 4,000 characters)"
                value={description} 
                onChange={e => setDescription(e.target.value)} 
              />
              <div className="text-sm text-gray-500 text-right mt-2">{descCount}/{descMax}</div>
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
                      className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${
                        selected 
                          ? 'bg-brand-600 text-white border-brand-600 shadow-md' 
                          : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300 hover:bg-brand-50'
                      }`}
                      aria-pressed={selected}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
              {categories.length === 0 && (
                <p className="text-sm text-red-500 mt-3">Please select at least one category</p>
              )}
            </section>

            {/* Schedule */}
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">When & Where</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Start Date *</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Start Time *</label>
                  <input 
                    type="time" 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors" 
                    value={startTime} 
                    onChange={e => setStartTime(e.target.value)} 
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">End Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors" 
                    value={endDate} 
                    min={date}
                    onChange={e => setEndDate(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">End Time</label>
                  <input 
                    type="time" 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors" 
                    value={endTime} 
                    onChange={e => setEndTime(e.target.value)} 
                  />
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Venue</h2>
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
                <h2 className="text-2xl font-bold text-gray-900">Cover Image</h2>
              </div>
              <p className="text-gray-600 mb-6">Drag & drop a 16:9 image (min 1200×675) or click to upload</p>
              
              <EventCoverUploader
                onUpload={handleCoverImageUpload}
                onDrop={handleCoverImageDrop}
                onDragOver={handleCoverImageDragOver}
                onRemove={removeCoverImage}
                preview={coverImagePreview}
                loading={loading}
              />
              
              {!coverImagePreview && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload New Cover</h3>
                  <p className="text-sm text-gray-500">Drop your cover image here</p>
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
                <h2 className="text-2xl font-bold text-gray-900">Tickets (link-out only)</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Add an external link and optional instructions so attendees can buy on your site.
              </p>
              <div className="space-y-4">
                <input
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                  placeholder="https://..."
                  value={externalUrl}
                  onChange={e => setExternalUrl(e.target.value)}
                />
                <textarea
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors resize-none"
                  rows={5}
                  placeholder="e.g. Pay via Momo / VietQR then fill this form..."
                  value={ticketInstructions}
                  onChange={e => setTicketInstructions(e.target.value)}
                />
                <p className="text-sm text-gray-500">Optional: Add external ticket link and instructions</p>
              </div>
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
                disabled={loading}
                className="btn text-lg px-8 py-3 flex-1 bg-gradient-to-r from-brand-600 to-purple-600 border-0 hover:from-brand-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
              >
                {loading ? "Publishing..." : "Create Copy"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}