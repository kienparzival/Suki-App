import React, { useState, useEffect } from 'react'
import MapPicker from './MapPicker'
import PlaceSearch from './PlaceSearch'

export default function LocationSelector({ 
  onLocationChange, 
  initialLocation = null,
  className = ''
}) {
  const [locationMode, setLocationMode] = useState('venue')
  const [venueName, setVenueName] = useState('')
  const [coordinates, setCoordinates] = useState(null)
  const [address, setAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Initialize with provided location
  useEffect(() => {
    if (initialLocation) {
      if (initialLocation.mode) setLocationMode(initialLocation.mode)
      if (initialLocation.name) setVenueName(initialLocation.name)
      if (initialLocation.coordinates) setCoordinates(initialLocation.coordinates)
      if (initialLocation.address) setAddress(initialLocation.address)
    }
  }, [initialLocation])

  // Reverse geocoding function
  const reverseGeocode = async (lat, lng) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`
      )
      
      if (response.ok) {
        const data = await response.json()
        const addressComponents = data.address || {}
        
        // Build address string
        const addressParts = []
        if (addressComponents.house_number) addressParts.push(addressComponents.house_number)
        if (addressComponents.road) addressParts.push(addressComponents.road)
        if (addressComponents.suburb) addressParts.push(addressComponents.suburb)
        if (addressComponents.city_district) addressParts.push(addressComponents.city_district)
        if (addressComponents.city) addressParts.push(addressComponents.city)
        if (addressComponents.state) addressParts.push(addressComponents.state)
        if (addressComponents.country) addressParts.push(addressComponents.country)
        
        const fullAddress = addressParts.join(', ')
        setAddress(fullAddress)
        
        // Use the address as venue name if no custom name is set
        if (!venueName) {
          setVenueName(fullAddress)
        }
        
        // Notify parent component
        if (onLocationChange) {
          onLocationChange({
            mode: locationMode,
            name: venueName || fullAddress,
            coordinates: [lat, lng],
            address: fullAddress
          })
        }
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle map location selection
  const handleMapLocationSelect = (lat, lng) => {
    setCoordinates([lat, lng])
    reverseGeocode(lat, lng)
  }

  // Handle venue name change
  const handleVenueNameChange = (e) => {
    const newName = e.target.value
    setVenueName(newName)
    
    if (onLocationChange && coordinates) {
      onLocationChange({
        mode: locationMode,
        name: newName,
        coordinates: coordinates,
        address: address
      })
    }
  }

  // Handle place search selection
  const handlePlaceSelect = (place) => {
    setVenueName(place.name)
    setCoordinates(place.coordinates)
    setAddress(place.address)
    
    if (onLocationChange) {
      onLocationChange({
        mode: locationMode,
        name: place.name,
        coordinates: place.coordinates,
        address: place.address
      })
    }
  }

  // Handle location mode change
  const handleLocationModeChange = (mode) => {
    setLocationMode(mode)
    
    if (onLocationChange) {
      if (mode === 'venue' && coordinates) {
        onLocationChange({
          mode: mode,
          name: venueName,
          coordinates: coordinates,
          address: address
        })
      } else {
        onLocationChange({
          mode: mode,
          name: mode === 'online' ? 'Online' : 'To be announced',
          coordinates: null,
          address: null
        })
      }
    }
  }

  return (
    <div className={`location-selector ${className}`}>
      {/* Location Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Location Type</label>
        <div className="flex gap-3">
          <button 
            className={`px-6 py-3 rounded-xl border-2 transition-all duration-200 ${
              locationMode === 'venue'
                ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/25'
                : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300 hover:bg-brand-50'
            }`} 
            onClick={() => handleLocationModeChange('venue')}
          >
            📍 Venue
          </button>
          <button 
            className={`px-6 py-3 rounded-xl border-2 transition-all duration-200 ${
              locationMode === 'online'
                ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/25'
                : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300 hover:bg-brand-50'
            }`} 
            onClick={() => handleLocationModeChange('online')}
          >
            💻 Online
          </button>
          <button 
            className={`px-6 py-3 rounded-xl border-2 transition-all duration-200 ${
              locationMode === 'tba'
                ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/25'
                : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300 hover:bg-brand-50'
            }`} 
            onClick={() => handleLocationModeChange('tba')}
          >
            ❓ TBA
          </button>
        </div>
      </div>

      {/* Venue Selection */}
      {locationMode === 'venue' && (
        <div className="space-y-6">
          {/* Place Search */}
          <div style={{ zIndex: 1000, position: 'relative' }}>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Search for a Place
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Type a place name to search and automatically pin the location on the map.
            </p>
            <PlaceSearch
              onPlaceSelect={handlePlaceSelect}
              placeholder="Search for a place (e.g., 'Hanoi Opera House', 'Ho Chi Minh City')"
            />
          </div>

          {/* Map */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Or Select Location on Map
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Click on the map to pinpoint your event location. The address will be automatically detected.
            </p>
            <MapPicker
              onLocationSelect={handleMapLocationSelect}
              selectedLocation={coordinates}
              height="300px"
              className="border-2 border-gray-200 rounded-xl overflow-hidden"
            />
          </div>

          {/* Venue Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venue Name
            </label>
            <input
              type="text"
              value={venueName}
              onChange={handleVenueNameChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
              placeholder="Enter venue name (e.g., 'Hanoi Opera House')"
            />
            <p className="text-sm text-gray-500 mt-1">
              You can customize the venue name while keeping the map location
            </p>
          </div>

          {/* Detected Address */}
          {address && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Detected Address</h4>
                  <p className="text-sm text-blue-700">{address}</p>
                  {coordinates && (
                    <p className="text-xs text-blue-600 mt-1">
                      Coordinates: {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="loading loading-spinner loading-sm"></div>
              <span className="text-sm">Detecting address...</span>
            </div>
          )}
        </div>
      )}

      {/* Online/TBA Display */}
      {(locationMode === 'online' || locationMode === 'tba') && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {locationMode === 'online' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {locationMode === 'online' ? 'Online Event' : 'Location TBA'}
          </h3>
          <p className="text-gray-600">
            {locationMode === 'online' 
              ? 'This event will be held online. No physical location needed.'
              : 'The location for this event will be announced later.'
            }
          </p>
        </div>
      )}
    </div>
  )
}
