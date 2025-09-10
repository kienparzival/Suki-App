import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Header from '../components/Header.jsx'
import { supabase } from '../lib/supabase.js'
import '../styles.css'

export default function CopyEvent() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const originalEvent = location.state?.event

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [locationMode, setLocationMode] = useState('venue')
  const [venueName, setVenueName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
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
    
    // Set date to tomorrow by default
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setDate(tomorrow.toISOString().split('T')[0])
    
    const startDate = new Date(originalEvent.start_at)
    setStartTime(startDate.toTimeString().slice(0, 5))
    
    if (originalEvent.end_at) {
      const endDate = new Date(originalEvent.end_at)
      setEndTime(endDate.toTimeString().slice(0, 5))
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

    try {
      const startAt = new Date(`${date}T${startTime}`).toISOString()
      const endAt = endTime ? new Date(`${date}T${endTime}`).toISOString() : startAt

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
      const { error } = await supabase
        .from('events')
        .insert([{
          title,
          description,
          category,
          start_at: startAt,
          end_at: endAt,
          venue_id: venueId,
          capacity: capacity ? parseInt(capacity) : null,
          min_price: minPrice ? parseInt(minPrice) : 0,
          max_price: maxPrice ? parseInt(maxPrice) : 0,
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

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                <option value="Music">Music</option>
                <option value="Business & Professional">Business & Professional</option>
                <option value="Food & Drink">Food & Drink</option>
                <option value="Community & Culture">Community & Culture</option>
                <option value="Performing & Visual Arts">Performing & Visual Arts</option>
                <option value="Film, Media & Entertainment">Film, Media & Entertainment</option>
                <option value="Sports & Fitness">Sports & Fitness</option>
                <option value="Health & Wellness">Health & Wellness</option>
                <option value="Science & Technology">Science & Technology</option>
                <option value="Travel & Outdoor">Travel & Outdoor</option>
                <option value="Charity & Causes">Charity & Causes</option>
                <option value="Religion & Spirituality">Religion & Spirituality</option>
                <option value="Family & Education">Family & Education</option>
                <option value="Seasonal & Holiday">Seasonal & Holiday</option>
                <option value="Government & Politics">Government & Politics</option>
                <option value="Fashion & Beauty">Fashion & Beauty</option>
                <option value="Home & Lifestyle">Home & Lifestyle</option>
                <option value="Hobbies & Special Interests">Hobbies & Special Interests</option>
                <option value="School Activities">School Activities</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
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

            {/* Capacity and Pricing */}
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
