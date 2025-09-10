import React, { createContext, useContext, useState, useEffect } from 'react'

const LocationContext = createContext()

export function LocationProvider({ children }) {
  const [userLocation, setUserLocation] = useState(() => {
    // Try to load saved location from localStorage on initial state
    const savedLocation = localStorage.getItem('suki_user_location')
    if (savedLocation) {
      try {
        return JSON.parse(savedLocation)
      } catch (error) {
        console.error('Error parsing saved location:', error)
        localStorage.removeItem('suki_user_location')
      }
    }
    // Default location if no saved location
    return { city: 'HCMC', lat: 10.7769, lng: 106.7009 }
  })

  const updateUserLocation = (newLocation) => {
    setUserLocation(newLocation)
    // Save to localStorage for persistence
    localStorage.setItem('suki_user_location', JSON.stringify(newLocation))
  }

  // Function to update location based on profile city
  const updateLocationFromProfile = (profileCity) => {
    if (!profileCity) return
    
    // Map profile city to coordinates
    const cityToCoords = (city) => {
      const normalizedCity = (city || '').toLowerCase().trim()
      switch (normalizedCity) {
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
          // For custom cities, keep the current location or set a default
          return userLocation
      }
    }
    
    const newLocation = cityToCoords(profileCity)
    if (newLocation.city !== userLocation.city) {
      updateUserLocation(newLocation)
      console.log(`[LocationContext] Updated location from profile city: ${profileCity} → ${newLocation.city}`)
    }
  }

  return (
    <LocationContext.Provider value={{ 
      userLocation, 
      setUserLocation: updateUserLocation,
      updateLocationFromProfile 
    }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}
