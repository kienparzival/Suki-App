import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase'
import { composeBangkokIso } from '../helpers/time'
import { ADMISSION_TICKETED, ADMISSION_OPEN } from '../helpers/event'
import { CATEGORIES } from '../constants/categories'
// Removed TicketTierManager – free-only single tier is auto-managed
import LocationSelector from '../components/LocationSelector.jsx'
import { PAYMENTS_ENABLED } from '../config/payments'
import { useLang } from '../i18n/LangContext.jsx'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function CreateEventPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLang()

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

  // Capacity (for ticketed events)
  const [capacity, setCapacity] = useState('')
  const [admission, setAdmission] = useState(ADMISSION_TICKETED)

  // Media
  const [images, setImages] = useState([])
  const [videos, setVideos] = useState([])
  const [coverImage, setCoverImage] = useState(null)
  const [coverImagePreview, setCoverImagePreview] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [externalUrl, setExternalUrl] = useState('')
  const [ticketInstructions, setTicketInstructions] = useState('')  // new

  // No tiers UI; capacity is directly input

  const handleGetStarted = () => {
    navigate('/auth')
  }

  // Show landing page for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Header searchTerm="" setSearchTerm={() => {}} />
        
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Section */}
            <div className="mb-16">
              <div className="text-center relative">
                {/* Background decorative elements */}
                <div className="absolute inset-0 -z-10">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-brand-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-blue-100/30 to-cyan-100/30 rounded-full blur-2xl"></div>
                  <div className="absolute top-1/2 left-0 w-48 h-48 bg-gradient-to-r from-pink-100/30 to-rose-100/30 rounded-full blur-xl"></div>
                </div>
                
                <h1 
                  className="text-6xl md:text-7xl font-black bg-gradient-to-r from-gray-900 via-brand-600 to-purple-700 bg-clip-text text-transparent mb-8"
                  style={{ lineHeight: '1.6' }}
                >
                  Create Amazing Events
              </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed font-light">
                  Easily create events for free on a platform that attendees love and trust
              </p>
                
                <div className="w-24 h-1 bg-gradient-to-r from-brand-500 to-purple-500 mx-auto rounded-full mb-8"></div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mb-16">
              <button
                onClick={handleGetStarted}
                className="btn btn-primary btn-lg text-lg px-8 py-4 bg-gradient-to-r from-brand-600 to-purple-600 border-0 hover:from-brand-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Create in Minutes</h3>
                <p className="text-gray-600">Set up your event with our intuitive form in just a few clicks</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Reach More People</h3>
                <p className="text-gray-600">Connect with attendees who trust our platform for great events</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">100% Free</h3>
                <p className="text-gray-600">No hidden fees, no subscriptions - create events completely free</p>
              </div>
            </div>

            {/* Social Proof */}
            <div className="text-center">
              <p className="text-gray-500 mb-4">Trusted by event organizers in Vietnam</p>
              <div className="flex justify-center items-center gap-8 text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>4.9/5</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  <span>10K+ Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Free Forever</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const descMax = 4000
  const descCount = (description || '').length

  const onSelectMedia = async (e) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    const videoFiles = files.filter(f => f.type.startsWith('video/'))
    const imageUrls = await Promise.all(imageFiles.map(readFileAsDataUrl))
    const videoUrls = await Promise.all(videoFiles.map(readFileAsDataUrl))
    setImages(prev => [...prev, ...imageUrls])
    setVideos(prev => [...prev, ...videoUrls])
  }

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

  const publish = async () => {
    if (!user) {
      alert(t('create.signInRequired'))
      return
    }

    if (!title.trim()) { alert(t('create.titleRequired')); return }
    if (!date || !startTime) { alert(t('create.dateRequired')); return }
    if (categories.length === 0) { alert(t('create.categoryRequired')); return }
    if (!coverImagePreview && (!images || images.length === 0)) { alert(t('create.imageRequired')); return }
    if (locationData.mode === 'venue' && !locationData.name?.trim()) { 
      alert(t('create.venueRequired')); 
      return 
    }
    // Ticketing removed

    const start_at = toIso(date, startTime)
    const effectiveEndDate = endDate || date
    const end_at = endTime ? toIso(effectiveEndDate, endTime) : start_at

    // Validate timeline
    if (new Date(end_at) < new Date(start_at)) {
      alert(t('create.endAfterStart'))
      return
    }

    let venue
    if (locationData.mode === 'online') venue = { name: 'Online' }
    else if (locationData.mode === 'tba') venue = { name: 'To be announced' }
    else venue = { name: (locationData.name || '').trim() }

    // Ticketing removed

    setPublishing(true)

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
            alert('Could not create venue: ' + venueError.message)
            setPublishing(false)
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
          .select('id')
          .single()
        
        if (venueError) {
          console.error('Error creating venue:', venueError)
          alert('Could not create venue: ' + venueError.message)
          setPublishing(false)
          return
        }
        venue_id = venueData.id
          console.log('Venue created successfully without coordinates:', venueData)
        }
      }

      // 2) Insert the event (NO `location` field here)
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert([{
          creator_id: user.id,
          venue_id,
          title: title.trim(),
          description: description.trim(),
          start_at,
          end_at,
          categories,
          cover_url: coverImagePreview || images[0] || '',
          status: 'published',
          external_ticket_url: externalUrl || null,
          external_ticket_instructions: ticketInstructions || null
        }])
        .select()

      if (eventError) {
        console.error('Error creating event:', eventError)
        alert('Failed to create event: ' + eventError.message)
      } else {
        console.log('Event created successfully:', eventData)
        
        // No internal tickets; link-out only
        
        // Dispatch event for other components to update
        window.dispatchEvent(new CustomEvent('suki:events_updated'))
        console.log('Event created successfully, navigating to home page')
        console.log('Created event data:', eventData[0])
        navigate('/')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event: ' + error.message)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header userLocation={{city:'HCMC',lat:10.7769,lng:106.7009}} setUserLocation={()=>{}} />
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
              Create Event
            </h1>
            
            {/* Subtitle with modern typography */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed font-light">
              Share your event with the world in just a few simple steps
            </p>
            
            {/* Decorative line */}
            <div className="w-24 h-1 bg-gradient-to-r from-brand-500 to-purple-500 mx-auto rounded-full mb-8"></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
        {/* Name */}
          <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t('create.title')} <span className="text-red-500">*</span></h2>
            </div>
            <p className="text-gray-600 mb-6">This will be your event's title. Be specific and engaging to attract attendees!</p>
            <input 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors text-lg" 
              placeholder={t('create.titlePlaceholder')} 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
            />
        </section>

        {/* About */}
          <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t('create.description')}</h2>
            </div>
            <p className="text-gray-600 mb-6">Tell people what makes this special. You can use line breaks and emojis.</p>
            <textarea 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors resize-none" 
              rows={8} 
              maxLength={descMax} 
              placeholder={t('create.descriptionPlaceholder')}
              value={description} 
              onChange={e => setDescription(e.target.value)} 
            />
            <div className="text-sm text-gray-500 text-right mt-2">{descCount}/{descMax}</div>
        </section>

        {/* Schedule */}
          <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t('create.whenWhere')}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">{t('create.startDate')} *</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required
                />
            </div>
            <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">{t('create.startTime')} *</label>
                <input 
                  type="time" 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors" 
                  value={startTime} 
                  onChange={e => setStartTime(e.target.value)} 
                  required
                />
            </div>
            <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">{t('create.endDate')}</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors" 
                  value={endDate} 
                  min={date}
                  onChange={e => setEndDate(e.target.value)} 
                />
            </div>
            <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">{t('create.endTime')}</label>
                <input 
                  type="time" 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors" 
                  value={endTime} 
                  onChange={e => setEndTime(e.target.value)} 
                />
            </div>
          </div>
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
          <p className="text-gray-600 mb-4">
            {t('create.ticketsDescription')}
          </p>
          <div className="space-y-4">
            <input
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
              placeholder={t('create.externalLink')}
              value={externalUrl}
              onChange={e => setExternalUrl(e.target.value)}
            />
            <textarea
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors resize-none"
              rows={5}
              placeholder={t('create.ticketInstructions')}
              value={ticketInstructions}
              onChange={e => setTicketInstructions(e.target.value)}
            />
            <p className="text-sm text-gray-500">{t('create.ticketsOptional')}</p>
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

        {/* Capacity removed */}
        {/* <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Event Capacity</h2>
          </div>
          <p className="text-gray-600 mb-6">Set the maximum number of attendees for your event.</p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Attendees
            </label>
            <input 
              type="number" 
              min="1"
              value={capacity} 
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
              placeholder="Enter maximum number of attendees"
            />
            <p className="text-sm text-gray-500 mt-2">One free General Admission pool will be created automatically.</p>
          </div>
        </section> */}

        {/* Ticketing removed: capacity-only for Ticketed admission */}

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
            <p className="text-gray-600 mb-6">Upload a cover image for your event. This will be displayed prominently.</p>
          
          {/* Cover Image Upload Area */}
          <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              coverImagePreview 
                ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 hover:border-brand-400 hover:bg-brand-50'
            }`}
            onDrop={handleCoverImageDrop}
            onDragOver={handleCoverImageDragOver}
          >
            {coverImagePreview ? (
                <div className="space-y-4">
                <img 
                  src={coverImagePreview} 
                  alt="Cover preview" 
                    className="mx-auto max-w-full max-h-64 object-cover rounded-xl border border-gray-200 shadow-lg"
                />
                  <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => document.getElementById('coverImageInput').click()}
                      className="btn btn-outline"
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={removeCoverImage}
                      className="btn btn-ghost text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-20 h-20 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                    <p className="text-xl font-medium text-gray-700">
                    Drop your cover image here
                  </p>
                    <p className="text-gray-500">
                    or click to browse files
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('coverImageInput').click()}
                    className="btn btn-outline"
                >
                  Browse Files
                </button>
                  <p className="text-sm text-gray-400">
                  PNG, JPG, JPEG up to 5MB
                </p>
              </div>
            )}
            
            {/* Hidden file input */}
            <input
              id="coverImageInput"
              type="file"
              accept="image/*"
              onChange={(e) => handleCoverImageUpload(e.target.files[0])}
              className="hidden"
            />
          </div>
        </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-8">
            <button 
              className="btn btn-ghost text-lg px-8 py-3" 
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary text-lg px-8 py-3 bg-gradient-to-r from-brand-600 to-purple-600 border-0 hover:from-brand-700 hover:to-purple-700 shadow-lg hover:shadow-xl" 
              onClick={publish} 
              disabled={publishing}
            >
              {publishing ? t('create.publishing') : t('create.publish')}
            </button>
            </div>
        </div>
      </div>
    </div>
  )
} 