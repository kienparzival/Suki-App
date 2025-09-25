import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { CATEGORIES } from '../constants/categories'
import CategoryScroller from './CategoryScroller'

export default function FilterBar({ selectedCategory, onCategoryChange, browsingLocation, onLocationChange, selectedTimeFilter, onTimeFilterChange }) {
		const [showAllCategories, setShowAllCategories] = useState(false)
	const [showLocationDropdown, setShowLocationDropdown] = useState(false)
	
	// Use categories from constants
	const allCategories = CATEGORIES
	
	const visibleCategories = showAllCategories ? allCategories : allCategories.slice(0, 8)

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          
          // Function to get city name from coordinates
          const getCityFromCoordinates = (lat, lng) => {
            // Comprehensive Vietnamese cities database
            const cities = [
              { name: 'Ho Chi Minh City', lat: 10.7769, lng: 106.7009, radius: 0.5 },
              { name: 'Hanoi', lat: 21.0278, lng: 105.8342, radius: 0.5 },
              { name: 'Da Nang', lat: 16.0544, lng: 108.2022, radius: 0.3 },
              { name: 'Hai Phong', lat: 20.8449, lng: 106.6881, radius: 0.3 },
              { name: 'Can Tho', lat: 10.0452, lng: 105.7469, radius: 0.3 },
              { name: 'Bien Hoa', lat: 10.9447, lng: 106.8243, radius: 0.3 },
              { name: 'Hue', lat: 16.4637, lng: 107.5909, radius: 0.3 },
              { name: 'Nha Trang', lat: 12.2388, lng: 109.1967, radius: 0.3 },
              { name: 'Buon Ma Thuot', lat: 12.6667, lng: 108.0500, radius: 0.3 },
              { name: 'Quy Nhon', lat: 13.7563, lng: 109.2237, radius: 0.3 },
              { name: 'Vung Tau', lat: 10.3459, lng: 107.0843, radius: 0.3 },
              { name: 'Thai Nguyen', lat: 21.5944, lng: 105.8481, radius: 0.3 },
              { name: 'Thanh Hoa', lat: 19.8067, lng: 105.7847, radius: 0.3 },
              { name: 'Nam Dinh', lat: 20.4201, lng: 106.1683, radius: 0.3 },
              { name: 'Vinh', lat: 18.6792, lng: 105.6919, radius: 0.3 },
              { name: 'My Tho', lat: 10.3600, lng: 106.3600, radius: 0.3 },
              { name: 'Ca Mau', lat: 9.1767, lng: 105.1500, radius: 0.3 },
              { name: 'Rach Gia', lat: 10.0167, lng: 105.0833, radius: 0.3 },
              { name: 'Long Xuyen', lat: 10.3833, lng: 105.4167, radius: 0.3 },
              { name: 'Soc Trang', lat: 9.6000, lng: 105.9833, radius: 0.3 },
              { name: 'Tra Vinh', lat: 9.9333, lng: 106.3500, radius: 0.3 },
              { name: 'Bac Lieu', lat: 9.2833, lng: 105.7167, radius: 0.3 },
              { name: 'Dong Thap', lat: 10.5167, lng: 105.6167, radius: 0.3 },
              { name: 'An Giang', lat: 10.5167, lng: 105.1167, radius: 0.3 },
              { name: 'Kien Giang', lat: 9.8167, lng: 105.1167, radius: 0.3 },
              { name: 'Tien Giang', lat: 10.3500, lng: 106.3500, radius: 0.3 },
              { name: 'Ben Tre', lat: 10.2333, lng: 106.3833, radius: 0.3 },
              { name: 'Vinh Long', lat: 10.2500, lng: 105.9667, radius: 0.3 },
              { name: 'Hau Giang', lat: 9.7833, lng: 105.4667, radius: 0.3 },
              { name: 'Dong Nai', lat: 10.9500, lng: 106.8167, radius: 0.3 },
              { name: 'Binh Duong', lat: 11.3167, lng: 106.6333, radius: 0.3 },
              { name: 'Tay Ninh', lat: 11.3167, lng: 106.1000, radius: 0.3 },
              { name: 'Binh Phuoc', lat: 11.7500, lng: 106.6000, radius: 0.3 },
              { name: 'Lam Dong', lat: 11.9333, lng: 108.4500, radius: 0.3 },
              { name: 'Ninh Thuan', lat: 11.5667, lng: 108.9833, radius: 0.3 },
              { name: 'Binh Thuan', lat: 10.9333, lng: 108.1000, radius: 0.3 },
              { name: 'Khanh Hoa', lat: 12.2500, lng: 109.1833, radius: 0.3 },
              { name: 'Phu Yen', lat: 13.0833, lng: 109.3167, radius: 0.3 },
              { name: 'Dak Lak', lat: 12.6667, lng: 108.0500, radius: 0.3 },
              { name: 'Dak Nong', lat: 12.0000, lng: 107.6833, radius: 0.3 },
              { name: 'Gia Lai', lat: 13.9833, lng: 108.0000, radius: 0.3 },
              { name: 'Kon Tum', lat: 14.3500, lng: 108.0000, radius: 0.3 },
              { name: 'Quang Nam', lat: 15.8833, lng: 108.3333, radius: 0.3 },
              { name: 'Quang Ngai', lat: 15.1167, lng: 108.8000, radius: 0.3 },
              { name: 'Binh Dinh', lat: 13.7667, lng: 109.2333, radius: 0.3 },
              { name: 'Quang Binh', lat: 17.4667, lng: 106.6000, radius: 0.3 },
              { name: 'Quang Tri', lat: 16.7500, lng: 107.2000, radius: 0.3 },
              { name: 'Thua Thien Hue', lat: 16.4637, lng: 107.5909, radius: 0.3 },
              { name: 'Ha Tinh', lat: 18.3333, lng: 105.9000, radius: 0.3 },
              { name: 'Nghe An', lat: 18.6792, lng: 105.6919, radius: 0.3 },
              { name: 'Lao Cai', lat: 22.4833, lng: 103.9500, radius: 0.3 },
              { name: 'Dien Bien', lat: 21.3833, lng: 103.0167, radius: 0.3 },
              { name: 'Lai Chau', lat: 22.0000, lng: 103.3333, radius: 0.3 },
              { name: 'Son La', lat: 21.3167, lng: 103.9167, radius: 0.3 },
              { name: 'Yen Bai', lat: 21.7000, lng: 104.8667, radius: 0.3 },
              { name: 'Hoa Binh', lat: 20.8167, lng: 105.3333, radius: 0.3 },
              { name: 'Lang Son', lat: 21.8333, lng: 106.7500, radius: 0.3 },
              { name: 'Quang Ninh', lat: 21.0167, lng: 107.3000, radius: 0.3 },
              { name: 'Bac Giang', lat: 21.2667, lng: 106.2000, radius: 0.3 },
              { name: 'Phu Tho', lat: 21.3000, lng: 105.4333, radius: 0.3 },
              { name: 'Vinh Phuc', lat: 21.3167, lng: 105.6000, radius: 0.3 },
              { name: 'Bac Ninh', lat: 21.1833, lng: 106.0500, radius: 0.3 },
              { name: 'Hai Duong', lat: 20.9333, lng: 106.3167, radius: 0.3 },
              { name: 'Hung Yen', lat: 20.6500, lng: 106.0667, radius: 0.3 },
              { name: 'Thai Binh', lat: 20.4500, lng: 106.3333, radius: 0.3 },
              { name: 'Ha Nam', lat: 20.5500, lng: 105.9167, radius: 0.3 },
              { name: 'Ninh Binh', lat: 20.2500, lng: 105.9667, radius: 0.3 },
              { name: 'Long An', lat: 10.6000, lng: 106.1667, radius: 0.3 },
              { name: 'Ba Ria - Vung Tau', lat: 10.3459, lng: 107.0843, radius: 0.3 }
            ];

            // Calculate distance and find closest city
            let closestCity = null;
            let minDistance = Infinity;

            for (const city of cities) {
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
          
          onLocationChange({
            mode: 'current',
            city: cityName,
            lat: latitude,
            lng: longitude,
          });
          
          setShowLocationDropdown(false);
        },
        (error) => {
          console.error('Error getting current location:', error);
          alert('Could not get your current location. Please choose a city manually.');
          setShowLocationDropdown(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setShowLocationDropdown(false);
    }
  };

  const handleBrowseOnline = () => {
    onLocationChange({ mode: 'online', city: 'Online Events' });
    setShowLocationDropdown(false);
  };

  const handleBrowseAllLocations = () => {
    onLocationChange({ mode: 'all', city: 'All locations' });
    setShowLocationDropdown(false);
  };

  return (
    <section className="space-y-6">
      {/* Category Filter */}
      <div>
        <label className="text-sm text-neutral-500 mb-3 block font-medium">Category</label>
        <CategoryScroller selected={selectedCategory} onChange={onCategoryChange} />
      </div>
      
      {/* Browsing Location Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base text-neutral-700 font-medium">Browsing events in</span>
          <button
            className="flex items-center gap-1 text-brand-600 hover:text-brand-700 transition-colors"
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showLocationDropdown ? 'rotate-180' : ''}`} />
            <span className="font-medium">{browsingLocation || t('allLocations')}</span>
          </button>
        </div>
        
        {showLocationDropdown && (
          <div className="absolute z-20 mt-2 w-64 bg-white border border-neutral-200 rounded-xl shadow-xl">
            {/* Browse all locations option */}
            <button
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 transition-colors"
              onClick={handleBrowseAllLocations}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600 font-medium">Browse all locations</span>
              </div>
            </button>
            
            {/* Use my current location option */}
            <button
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 transition-colors"
              onClick={handleUseCurrentLocation}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-blue-600 font-medium">Use current location</span>
              </div>
            </button>
            
            {/* Browse online events option */}
            <button
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors"
              onClick={handleBrowseOnline}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-600 font-medium">Browse online events</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Time Filter Tabs */}
      <div>
        <div className="border-b border-neutral-200">
          <div className="flex space-x-8">
            <button
              className={`pb-3 px-1 font-medium transition-all duration-200 ${
                selectedTimeFilter === 'all'
                  ? 'text-brand-600 border-b-2 border-brand-600'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
              onClick={() => onTimeFilterChange('all')}
            >
              All
            </button>
            <button
              className={`pb-3 px-1 font-medium transition-all duration-200 ${
                selectedTimeFilter === 'today'
                  ? 'text-brand-600 border-b-2 border-brand-600'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
              onClick={() => onTimeFilterChange('today')}
            >
              Today
            </button>
            <button
              className={`pb-3 px-1 font-medium transition-all duration-200 ${
                selectedTimeFilter === 'weekend'
                  ? 'text-brand-600 border-b-2 border-brand-600'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
              onClick={() => onTimeFilterChange('weekend')}
            >
              This Weekend
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
