import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { MapPin, Ticket, Heart, Star, Plus, User, LogIn, ChevronDown, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocation } from '../context/LocationContext.jsx'
import { trackSearch } from '../lib/analytics.js'

const cities = [
  // Major Cities & Provinces
  { city: 'Ho Chi Minh City', lat: 10.7769, lng: 106.7009 },
  { city: 'Hanoi', lat: 21.0278, lng: 105.8342 },
  { city: 'Da Nang', lat: 16.0544, lng: 108.2022 },
  { city: 'Hai Phong', lat: 20.8449, lng: 106.6881 },
  { city: 'Can Tho', lat: 10.0452, lng: 105.7469 },
  { city: 'Bien Hoa', lat: 10.9447, lng: 106.8243 },
  { city: 'Hue', lat: 16.4637, lng: 107.5909 },
  { city: 'Nha Trang', lat: 12.2388, lng: 109.1967 },
  { city: 'Buon Ma Thuot', lat: 12.6667, lng: 108.0500 },
  { city: 'Quy Nhon', lat: 13.7563, lng: 109.2237 },
  { city: 'Vung Tau', lat: 10.3459, lng: 107.0843 },
  { city: 'Thai Nguyen', lat: 21.5944, lng: 105.8481 },
  { city: 'Thanh Hoa', lat: 19.8067, lng: 105.7847 },
  { city: 'Nam Dinh', lat: 20.4201, lng: 106.1683 },
  { city: 'Vinh', lat: 18.6792, lng: 105.6919 },
  { city: 'My Tho', lat: 10.3600, lng: 106.3600 },
  { city: 'Ca Mau', lat: 9.1767, lng: 105.1500 },
  { city: 'Rach Gia', lat: 10.0167, lng: 105.0833 },
  { city: 'Long Xuyen', lat: 10.3833, lng: 105.4167 },
  { city: 'Soc Trang', lat: 9.6000, lng: 105.9833 },
  { city: 'Tra Vinh', lat: 9.9333, lng: 106.3500 },
  { city: 'Bac Lieu', lat: 9.2833, lng: 105.7167 },
  { city: 'Dong Thap', lat: 10.5167, lng: 105.6167 },
  { city: 'An Giang', lat: 10.5167, lng: 105.1167 },
  { city: 'Kien Giang', lat: 9.8167, lng: 105.1167 },
  { city: 'Tien Giang', lat: 10.3500, lng: 106.3500 },
  { city: 'Ben Tre', lat: 10.2333, lng: 106.3833 },
  { city: 'Vinh Long', lat: 10.2500, lng: 105.9667 },
  { city: 'Hau Giang', lat: 9.7833, lng: 105.4667 },
  { city: 'Dong Nai', lat: 10.9500, lng: 106.8167 },
  { city: 'Binh Duong', lat: 11.3167, lng: 106.6333 },
  { city: 'Tay Ninh', lat: 11.3167, lng: 106.1000 },
  { city: 'Binh Phuoc', lat: 11.7500, lng: 106.6000 },
  { city: 'Lam Dong', lat: 11.9333, lng: 108.4500 },
  { city: 'Ninh Thuan', lat: 11.5667, lng: 108.9833 },
  { city: 'Binh Thuan', lat: 10.9333, lng: 108.1000 },
  { city: 'Khanh Hoa', lat: 12.2500, lng: 109.1833 },
  { city: 'Phu Yen', lat: 13.0833, lng: 109.3167 },
  { city: 'Dak Lak', lat: 12.6667, lng: 108.0500 },
  { city: 'Dak Nong', lat: 12.0000, lng: 107.6833 },
  { city: 'Gia Lai', lat: 13.9833, lng: 108.0000 },
  { city: 'Kon Tum', lat: 14.3500, lng: 108.0000 },
  { city: 'Quang Nam', lat: 15.8833, lng: 108.3333 },
  { city: 'Quang Ngai', lat: 15.1167, lng: 108.8000 },
  { city: 'Binh Dinh', lat: 13.7667, lng: 109.2333 },
  { city: 'Quang Binh', lat: 17.4667, lng: 106.6000 },
  { city: 'Quang Tri', lat: 16.7500, lng: 107.2000 },
  { city: 'Thua Thien Hue', lat: 16.4637, lng: 107.5909 },
  { city: 'Ha Tinh', lat: 18.3333, lng: 105.9000 },
  { city: 'Nghe An', lat: 18.6792, lng: 105.6919 },
  { city: 'Lao Cai', lat: 22.4833, lng: 103.9500 },
  { city: 'Dien Bien', lat: 21.3833, lng: 103.0167 },
  { city: 'Lai Chau', lat: 22.0000, lng: 103.3333 },
  { city: 'Son La', lat: 21.3167, lng: 103.9167 },
  { city: 'Yen Bai', lat: 21.7000, lng: 104.8667 },
  { city: 'Hoa Binh', lat: 20.8167, lng: 105.3333 },
  { city: 'Lang Son', lat: 21.8333, lng: 106.7500 },
  { city: 'Quang Ninh', lat: 21.0167, lng: 107.3000 },
  { city: 'Bac Giang', lat: 21.2667, lng: 106.2000 },
  { city: 'Phu Tho', lat: 21.3000, lng: 105.4333 },
  { city: 'Vinh Phuc', lat: 21.3167, lng: 105.6000 },
  { city: 'Bac Ninh', lat: 21.1833, lng: 106.0500 },
  { city: 'Hai Duong', lat: 20.9333, lng: 106.3167 },
  { city: 'Hung Yen', lat: 20.6500, lng: 106.0667 },
  { city: 'Thai Binh', lat: 20.4500, lng: 106.3333 },
  { city: 'Ha Nam', lat: 20.5500, lng: 105.9167 },
  { city: 'Ninh Binh', lat: 20.2500, lng: 105.9667 },
  { city: 'Long An', lat: 10.6000, lng: 106.1667 },
  { city: 'Ba Ria - Vung Tau', lat: 10.3459, lng: 107.0843 }
]

export default function Header({ searchTerm, setSearchTerm }) {
  const { user, signOut } = useAuth()
  const { userLocation, setUserLocation } = useLocation()
  const [locationInput, setLocationInput] = useState(userLocation?.city || '')
  const [open, setOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const containerRef = useRef(null)
  const profileDropdownRef = useRef(null)

  useEffect(() => {
    // Load saved location from localStorage on component mount
    const savedLocation = localStorage.getItem('suki_user_location')
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation)
        // normalize old saved values where online used {lat:0,lng:0}
        if (parsedLocation?.city === 'Online Events') {
          parsedLocation.lat = null
          parsedLocation.lng = null
          parsedLocation.mode = 'online'
        }
        console.log('Loading saved location:', parsedLocation);
        setUserLocation(parsedLocation)
        setLocationInput(parsedLocation.city)
      } catch (error) {
        console.error('Error parsing saved location:', error)
        localStorage.removeItem('suki_user_location')
      }
    } else {
      setLocationInput(userLocation?.city || '')
    }
  }, []) // Remove userLocation?.city dependency to prevent infinite loop

  // Sync location input when userLocation changes
  useEffect(() => {
    if (userLocation?.city) {
      console.log('Syncing location input with userLocation:', userLocation.city);
      setLocationInput(userLocation.city);
    }
  }, [userLocation?.city]);

  useEffect(() => {
    // Load recent searches from localStorage on component mount
    const savedSearches = localStorage.getItem('suki_recent_searches')
    if (savedSearches) {
      try {
        const parsedSearches = JSON.parse(savedSearches)
        setRecentSearches(parsedSearches)
      } catch (error) {
        console.error('Error parsing recent searches:', error)
        localStorage.removeItem('suki_recent_searches')
      }
    }
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (!profileDropdownRef.current) return
      if (!profileDropdownRef.current.contains(e.target)) setProfileDropdownOpen(false)
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  const suggestions = useMemo(() => {
    const q = (locationInput || '').trim().toLowerCase()
    if (!q) return []
    
    // Filter cities based on search query
    let filteredCities = cities.filter(c => c.city.toLowerCase().includes(q))
    
    // Sort by relevance - exact matches first, then starts with, then contains
    filteredCities.sort((a, b) => {
      const aCity = a.city.toLowerCase()
      const bCity = b.city.toLowerCase()
      
      // Exact match gets highest priority
      if (aCity === q) return -1
      if (bCity === q) return 1
      
      // Starts with gets second priority
      if (aCity.startsWith(q) && !bCity.startsWith(q)) return -1
      if (bCity.startsWith(q) && !aCity.startsWith(q)) return 1
      
      // Then sort alphabetically
      return aCity.localeCompare(bCity)
    })
    
    // Limit to 4 suggestions maximum
    return filteredCities.slice(0, 4)
  }, [locationInput])

  const pickCity = (c) => {
    const newLocation = { city: c.city, lat: c.lat, lng: c.lng }
    setUserLocation(newLocation)
    setLocationInput(c.city)
    setOpen(false)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (suggestions.length > 0) {
      pickCity(suggestions[0])
    }
  }

  const handleSignOut = () => {
    signOut()
    setProfileDropdownOpen(false)
  }

  const addToRecentSearches = (search) => {
    if (!search.trim()) return
    
    const newSearches = [search.trim(), ...recentSearches.filter(s => s !== search.trim())].slice(0, 5)
    setRecentSearches(newSearches)
    localStorage.setItem('suki_recent_searches', JSON.stringify(newSearches))
  }

  const removeFromRecentSearches = (searchToRemove) => {
    const newSearches = recentSearches.filter(s => s !== searchToRemove)
    setRecentSearches(newSearches)
    localStorage.setItem('suki_recent_searches', JSON.stringify(newSearches))
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      addToRecentSearches(searchTerm)
      setSearchFocused(false)
      
      // Track search event
      trackSearch({
        q: searchTerm.trim(),
        category: 'all', // Default category, could be enhanced later
        city: userLocation?.city || 'All locations'
      })
    }
  }

  const handleSearchSelect = (search) => {
    setSearchTerm(search)
    addToRecentSearches(search)
    setSearchFocused(false)
    
    // Track search event when selecting from recent searches
    trackSearch({
      q: search.trim(),
      category: 'all', // Default category, could be enhanced later
      city: userLocation?.city || 'All locations'
    })
  }

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          
          // Function to get city name from coordinates
          const getCityFromCoordinates = (lat, lng) => {
            // Use the same comprehensive cities list with radius for detection
            const citiesWithRadius = cities.map(city => ({
              name: city.city,
              lat: city.lat,
              lng: city.lng,
              radius: 0.5 // 0.5 degree radius for most cities
            }));

            // Calculate distance and find closest city
            let closestCity = null;
            let minDistance = Infinity;

            for (const city of citiesWithRadius) {
              const distance = Math.sqrt(
                Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
              );
              
              if (distance < city.radius && distance < minDistance) {
                minDistance = distance;
                closestCity = city.name;
              }
            }

            return closestCity || 'Current Location';
          };

          const cityName = getCityFromCoordinates(latitude, longitude);
          
          const newLocation = {
            city: cityName,
            lat: latitude,
            lng: longitude,
          };
          
          console.log('Setting location to:', newLocation);
          setUserLocation(newLocation);
          setLocationInput(cityName);
          // Save to localStorage
          localStorage.setItem('suki_user_location', JSON.stringify(newLocation));
          setOpen(false);
        },
        (error) => {
          console.error('Error getting current location:', error);
          alert('Could not get your current location. Please choose a city manually.');
          setOpen(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setOpen(false);
    }
  };

  const setOnlineLocation = () => {
    const onlineLoc = { city: 'Online Events', lat: null, lng: null, mode: 'online' }
    setUserLocation(onlineLoc);
    setLocationInput('Online Events');
    localStorage.setItem('suki_user_location', JSON.stringify(onlineLoc));
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="w-full pt-[env(safe-area-inset-top)] py-3">
        {/* Row 1 — brand + desktop search/location + actions */}
        <div className="flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="/Suki.png" alt="Suki logo" className="size-12" />
        </Link>

          <div className="hidden md:flex items-center flex-1 mx-6 lg:mx-8" ref={containerRef}>
          {/* Combined Search and Location Box */}
          <div className="flex border border-neutral-300 bg-white w-full">
            {/* Search Input - Left */}
            <div className="relative flex-1">
              <form onSubmit={handleSearchSubmit}>
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                <input
                  type="text"
                  className="w-full px-3 py-2 pl-10 border-0 focus:outline-none focus:ring-0"
                  placeholder="Search events"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                />
              </form>
              
              {/* Recent Searches Dropdown */}
              {searchFocused && recentSearches.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg">
                  <div className="p-2">
                    <div className="text-xs font-medium text-neutral-500 mb-2 px-2">Recent searches</div>
                    {recentSearches.map((search, index) => (
                      <div key={index} className="flex items-center justify-between group hover:bg-neutral-50 rounded px-2 py-2">
                        <button
                          type="button"
                          className="flex-1 text-left text-sm text-neutral-700 hover:text-neutral-900"
                          onClick={() => handleSearchSelect(search)}
                        >
                          <Search className="w-4 h-4 inline mr-2 text-neutral-400" />
                          {search}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromRecentSearches(search)}
                          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-600 p-1 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Divider Line */}
            <div className="border-l border-neutral-300"></div>
            
            {/* Location Input - Right */}
            <div className="relative flex-1">
              <MapPin className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              <input
                type="text"
                className="w-full px-3 py-2 pl-10 border-0 focus:outline-none focus:ring-0"
                placeholder="Choose a location"
                value={locationInput}
                onChange={(e) => { setLocationInput(e.target.value); setOpen(true) }}
                onFocus={() => setOpen(true)}
              />
              {open && (
                <div className="absolute z-10 mt-2 w-full bg-white border border-neutral-200 shadow-soft">
                  {/* Use my current location option */}
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-neutral-100 border-b border-neutral-100"
                    onClick={() => useCurrentLocation()}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-600 font-medium">Use my current location</span>
                    </div>
                  </button>
                  
                  {/* Browse online events option */}
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-neutral-100 border-b border-neutral-100"
                    onClick={() => setOnlineLocation()}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-600 font-medium">Browse online events</span>
                    </div>
                  </button>
                  
                  {/* City suggestions */}
                  {suggestions.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-medium text-neutral-500 bg-neutral-50 border-b border-neutral-100">
                        Cities
                      </div>
                  {suggestions.map(c => (
                    <button
                      key={c.city}
                      type="button"
                          className="w-full text-left px-3 py-2 hover:bg-neutral-100 text-sm"
                      onClick={() => pickCity(c)}
                    >
                      {c.city}
                    </button>
                  ))}

                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          <NavLink to="/" className="btn btn-ghost" style={{flexDirection: 'column', height: 'auto', padding: '0.5rem 0.75rem'}}>
            <Star className="w-5 h-5 mb-1" />
            <span className="text-xs">Discover</span>
          </NavLink>
          {/* Tickets removed */}
          {user && (
            <NavLink to="/saved" className="btn btn-ghost" style={{flexDirection: 'column', height: 'auto', padding: '0.5rem 0.75rem'}}>
              <Heart className="w-5 h-5 mb-1"/> 
              <span className="text-xs">Saved</span>
            </NavLink>
          )}
          <NavLink to="/create" className="btn btn-ghost" style={{flexDirection: 'column', height: 'auto', padding: '0.5rem 0.75rem'}}>
            <Plus className="w-5 h-5 mb-1"/> 
            <span className="text-xs">Create an event</span>
          </NavLink>
          
          {/* Profile/Sign In Section */}
          {user ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                className="flex items-center gap-2 btn btn-ghost hover:bg-neutral-100"
                onMouseEnter={() => setProfileDropdownOpen(true)}
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                {/* User Profile Image */}
                {user.profilePhoto ? (
                  <img 
                    src={user.profilePhoto} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover border-2 border-neutral-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                    <User className="size-4 text-neutral-500" />
                  </div>
                )}
                
                {/* User Email */}
                <span className="hidden sm:inline text-sm font-medium text-neutral-700">
                  {user.email}
                </span>
                <ChevronDown className="size-4 text-neutral-500" />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-neutral-200 shadow-soft z-50">
                  <div className="py-2">
                    <NavLink 
                      to="/browse-events" 
                      className="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Browse Events
                    </NavLink>
                    <NavLink 
                      to="/manage-events" 
                      className="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Manage My Events
                    </NavLink>
                    <NavLink 
                      to="/saved" 
                      className="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Saved
                    </NavLink>
                    <NavLink 
                      to="/profile" 
                      className="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Account Settings
                    </NavLink>
                    <hr className="my-2 border-neutral-200" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <NavLink to="/auth" className="btn btn-ghost">
              <LogIn className="size-4 mr-1"/> Sign in
            </NavLink>
          )}
        </nav>
        </div>

        {/* Row 2 — Mobile Search + Location */}
        <div className="mt-2 grid grid-cols-1 gap-2 md:hidden" ref={containerRef}>
          {/* Mobile Search */}
          <div className="relative">
            <form onSubmit={handleSearchSubmit}>
              <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              <input
                type="text"
                className="w-full h-11 pl-10 pr-3 text-[15px] border border-neutral-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-neutral-400"
                placeholder="Search events"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              />
            </form>
            {searchFocused && recentSearches.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg">
                <div className="p-2">
                  <div className="text-xs font-medium text-neutral-500 mb-2 px-2">Recent searches</div>
                  {recentSearches.map((search, index) => (
                    <div key={index} className="flex items-center justify-between group hover:bg-neutral-50 rounded px-2 py-2">
                      <button
                        type="button"
                        className="flex-1 text-left text-sm text-neutral-700 hover:text-neutral-900"
                        onClick={() => handleSearchSelect(search)}
                      >
                        <Search className="w-4 h-4 inline mr-2 text-neutral-400" />
                        {search}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromRecentSearches(search)}
                        className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-600 p-1 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Location */}
          <div className="relative">
            <MapPin className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              className="w-full h-11 pl-10 pr-3 text-[15px] border border-neutral-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-neutral-400"
              placeholder="Choose a location"
              value={locationInput}
              onChange={(e) => { setLocationInput(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
            />
            {open && (
              <div className="absolute z-50 mt-2 w-full bg-white border border-neutral-200 shadow-soft">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-neutral-100 border-b border-neutral-100"
                  onClick={() => useCurrentLocation()}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-600 font-medium">Use my current location</span>
                  </div>
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-neutral-100 border-b border-neutral-100"
                  onClick={() => setOnlineLocation()}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-600 font-medium">Browse online events</span>
                  </div>
                </button>
                {suggestions.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-neutral-500 bg-neutral-50 border-b border-neutral-100">
                      Cities
                    </div>
                    {suggestions.map(c => (
                      <button
                        key={c.city}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-neutral-100 text-sm"
                        onClick={() => pickCity(c)}
                      >
                        {c.city}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
