import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Header from '../components/Header.jsx'
import { supabase } from '../lib/supabase.js'
import { composeBangkokIso, extractBangkokDate, extractBangkokTime } from '../helpers/time'
import { ADMISSION_TICKETED, ADMISSION_OPEN } from '../helpers/event'
import { CATEGORIES } from '../constants/categories'
import '../styles.css'

export default function CopyEvent() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const originalEvent = location.state?.event

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [locationMode, setLocationMode] = useState('venue')
  const [venueName, setVenueName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [admission, setAdmission] = useState(ADMISSION_TICKETED)
  const [coverUrl, setCoverUrl] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!originalEvent) {
      navigate('/manage-events')
      return
    }

    // Pre-populate form with original event data
    setTitle(`${originalEvent.title} (Copy)`)
    setDescription(originalEvent.description || '')
    setCategory(originalEvent.category || '')
    setAdmission(originalEvent.admission || ADMISSION_TICKETED)
    
    // Prefill categories (multi-category support)
    setCategories(
      Array.isArray(originalEvent.categories) && originalEvent.categories.length
        ? originalEvent.categories
        : (originalEvent.category ? [originalEvent.category] : [])
    )
    
    // Set date to tomorrow by default
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setDate(tomorrow.toISOString().split('T')[0])
    
    // Use timezone helpers to extract date/time properly
    setStartTime(extractBangkokTime(originalEvent.start_at))
    
    if (originalEvent.end_at) {
      setEndDate(extractBangkokDate(originalEvent.end_at))
      setEndTime(extractBangkokTime(originalEvent.end_at))
    }
    
    if (originalEvent.venue && originalEvent.venue.name && originalEvent.venue.name !== 'TBD') {
      setLocationMode('venue')
      setVenueName(originalEvent.venue.name)
    } else {
      setLocationMode('online')
    }
    
    setCapacity(originalEvent.capacity?.toString() || '')
    setMinPrice(originalEvent.min_price?.toString() || '')
    setMaxPrice(originalEvent.max_price?.toString() || '')
    setCoverUrl(originalEvent.cover_url || '')
  }, [originalEvent, navigate])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
            <p className="text-gray-600">You need to be signed in to copy events.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!originalEvent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
            <p className="text-gray-600">The event you're trying to copy doesn't exist.</p>
          </div>
        </div>
      </div>
    )
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
    if (!coverUrl) {
      alert('Please upload a cover image')
      setLoading(false)
      return
    }
    if (locationMode === 'venue' && !venueName?.trim()) {
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
      const startAt = composeBangkokIso(date, startTime)
      const effectiveEndDate = endDate || date
      const endAt = endTime ? composeBangkokIso(effectiveEndDate, endTime) : startAt

      // Validate timeline
      if (new Date(endAt) < new Date(startAt)) {
        alert('End must be after start')
        setLoading(false)
        return
      }

      // Create venue if needed
      let venueId = null
      if (locationMode === 'venue' && venueName) {
        const { data: venueData, error: venueError } = await supabase
          .from('venues')
          .insert([{ name: venueName }])
          .select()
        
        if (venueError) throw venueError
        venueId = venueData[0].id
      }

      // Create new event
      const isTicketed = admission === ADMISSION_TICKETED
      const finalCapacity = isTicketed ? (capacity ? parseInt(capacity) : null) : null
      const minP = isTicketed ? (minPrice ? parseInt(minPrice) : 0) : 0
      const maxP = isTicketed ? (maxPrice ? parseInt(maxPrice) : 0) : 0

      const { error } = await supabase
        .from('events')
        .insert([{
          title,
          description,
          start_at: startAt,
          end_at: endAt,
          categories,
          venue_id: venueId,
          admission,
          capacity: finalCapacity,
          min_price: minP,
          max_price: maxP,
          cover_url: coverUrl || null,
          status: 'published',
          creator_id: user.id
        }])

      if (error) throw error

      alert('Event copied successfully!')
      navigate('/manage-events')
    } catch (error) {
      console.error('Error copying event:', error)
      alert('Failed to copy event: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Copy Event</h1>
            <p className="text-lg text-gray-600">
              Your event copy will have the same event info and settings, without attendee information.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            {/* Event Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter event title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your event"
              />
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <p className="text-sm text-gray-600 mb-3">Select one or more categories that best describe your event.</p>
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
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
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
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={date}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Admission */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admission</label>
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="admission"
                    checked={admission === ADMISSION_TICKETED}
                    onChange={() => setAdmission(ADMISSION_TICKETED)}
                    className="mr-2"
                  />
                  Ticketed (paid/free tickets, capacity applies)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="admission"
                    checked={admission === ADMISSION_OPEN}
                    onChange={() => setAdmission(ADMISSION_OPEN)}
                    className="mr-2"
                  />
                  Open — no ticket required, unlimited capacity
                </label>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="venue"
                    checked={locationMode === 'venue'}
                    onChange={(e) => setLocationMode(e.target.value)}
                    className="mr-2"
                  />
                  Venue
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="online"
                    checked={locationMode === 'online'}
                    onChange={(e) => setLocationMode(e.target.value)}
                    className="mr-2"
                  />
                  Online
                </label>
              </div>
            </div>

            {locationMode === 'venue' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter venue name"
                />
              </div>
            )}

            {/* Capacity and Pricing (ticketed only) */}
            {admission === ADMISSION_TICKETED && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Price (VND)
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price (VND)
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
            )}

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image URL
              </label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/manage-events')}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1"
              >
                {loading ? 'Creating...' : 'Create Event Copy'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
