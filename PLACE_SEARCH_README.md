# 🗺️ Place Search Integration

## Overview

The Create Event page now includes a **Google Maps-style place search** that allows users to type a place name and get autocomplete suggestions, then automatically pin the location on the map.

## Features

### 🔍 **Smart Place Search**
- **Autocomplete suggestions** as you type
- **Google Maps integration** (if API key provided)
- **OpenStreetMap fallback** (works without API key)
- **Vietnam-focused search** (restricted to Vietnamese locations)
- **Automatic map pinning** when place is selected

### 🎯 **How It Works**

1. **User types** a place name (e.g., "Hanoi Opera House")
2. **Suggestions appear** with place names and addresses
3. **User clicks** on desired suggestion
4. **Map automatically pins** the exact location
5. **Coordinates are captured** for accurate event discovery

## Setup Instructions

### Option 1: With Google Maps API (Recommended)

1. **Get Google Maps API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
   - Create a new project or select existing one
   - Enable these APIs:
     - Places API
     - Maps JavaScript API
   - Create credentials (API Key)
   - Restrict the key to your domain for security

2. **Add API Key to Environment**:
   ```bash
   # Create .env file in project root
   echo "VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here" > .env
   ```

3. **Restart Development Server**:
   ```bash
   npm run dev
   ```

### Option 2: Without Google Maps API (Fallback)

The system automatically falls back to **OpenStreetMap Nominatim API** if no Google Maps API key is provided. This is completely free but has some limitations:

- **Slower response times**
- **Less detailed place information**
- **No commercial usage restrictions**

## Technical Implementation

### Files Created/Modified

1. **`src/components/PlaceSearch.jsx`** - New component for place search
2. **`src/components/LocationSelector.jsx`** - Updated to include place search
3. **`package.json`** - Added `@googlemaps/js-api-loader` dependency

### Key Features

- **Dual API Support**: Google Places API + OpenStreetMap fallback
- **Vietnam Restriction**: Searches limited to Vietnamese locations
- **Real-time Suggestions**: Shows suggestions as user types
- **Automatic Geocoding**: Converts place names to coordinates
- **Map Integration**: Automatically pins selected locations

### API Usage

#### Google Places API (if available)
```javascript
// Searches with Google Places Autocomplete
autocompleteService.getPlacePredictions({
  input: searchTerm,
  types: ['establishment', 'geocode'],
  componentRestrictions: { country: 'vn' }
})
```

#### OpenStreetMap Nominatim (fallback)
```javascript
// Searches with Nominatim API
fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=vn&limit=5`)
```

## User Experience

### Before (Manual Map Clicking)
1. User opens Create Event page
2. User manually clicks on map to find location
3. User guesses approximate location
4. System reverse geocodes to get address
5. **Result**: Approximate location, potential inaccuracy

### After (Place Search)
1. User opens Create Event page
2. User types "Hanoi Opera House" in search box
3. System shows suggestions: "Hanoi Opera House, Trang Tien, Hoan Kiem, Hanoi, Vietnam"
4. User clicks on suggestion
5. Map automatically pins exact location
6. **Result**: Precise location, accurate coordinates

## Benefits

- **🎯 Accuracy**: Exact location pinning instead of approximate clicking
- **⚡ Speed**: Fast place search vs. manual map exploration
- **🌍 Coverage**: Works for any place in Vietnam
- **🔄 Fallback**: Works even without Google Maps API key
- **📱 Mobile Friendly**: Easy to use on mobile devices

## Testing

### Test Cases

1. **Search for famous landmarks**:
   - "Hanoi Opera House"
   - "Ho Chi Minh City Hall"
   - "Ben Thanh Market"

2. **Search for districts**:
   - "District 1 Ho Chi Minh"
   - "Ba Dinh Hanoi"

3. **Search for cities**:
   - "Hanoi"
   - "Ho Chi Minh City"
   - "Da Nang"

### Expected Results

- **Suggestions appear** after typing 3+ characters
- **Clicking suggestion** pins exact location on map
- **Coordinates are accurate** for event discovery
- **Address is properly formatted** for display

## Troubleshooting

### Common Issues

1. **No suggestions appearing**:
   - Check internet connection
   - Verify API key (if using Google Maps)
   - Check browser console for errors

2. **Map not updating**:
   - Ensure LocationSelector is properly integrated
   - Check that onPlaceSelect callback is working

3. **API key errors**:
   - Verify API key is correct
   - Check API restrictions in Google Cloud Console
   - Ensure required APIs are enabled

### Debug Mode

Enable debug logging by opening browser console and looking for:
- "Google Maps API key not found, using OpenStreetMap fallback"
- "Error loading Google Maps: [error details]"
- "Error searching with Nominatim: [error details]"

## Future Enhancements

- **Recent searches** - Remember user's recent place searches
- **Favorites** - Allow users to save favorite locations
- **Categories** - Filter suggestions by type (restaurant, hotel, etc.)
- **Photos** - Show place photos in suggestions
- **Reviews** - Display place ratings and reviews

---

The place search integration transforms the event creation experience from manual map clicking to intelligent place discovery, making it easier and more accurate for users to create events at specific locations! 🎉
