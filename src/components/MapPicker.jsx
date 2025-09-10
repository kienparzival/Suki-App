import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      onLocationSelect(lat, lng)
    },
  })
  return null
}

// Component to handle map centering when location changes
function MapCenterHandler({ selectedLocation }) {
  const map = useMapEvents({})
  
  useEffect(() => {
    if (selectedLocation && isValidCoordinate(selectedLocation)) {
      map.setView(selectedLocation, 15, { animate: true, duration: 1 })
    }
  }, [selectedLocation, map])
  
  return null
}

// Helper function to validate coordinates
const isValidCoordinate = (coord) => {
  return Array.isArray(coord) && 
         coord.length === 2 && 
         !isNaN(coord[0]) && 
         !isNaN(coord[1]) &&
         coord[0] >= -90 && coord[0] <= 90 &&
         coord[1] >= -180 && coord[1] <= 180;
};

export default function MapPicker({ 
  initialPosition = [10.7769, 106.7009], // Default to HCMC
  onLocationSelect,
  selectedLocation = null,
  height = '400px',
  className = ''
}) {
  const [position, setPosition] = useState(initialPosition)
  const [markerPosition, setMarkerPosition] = useState(selectedLocation || initialPosition)

  useEffect(() => {
    if (selectedLocation && isValidCoordinate(selectedLocation)) {
      setMarkerPosition(selectedLocation)
      setPosition(selectedLocation) // Also update map center
    }
  }, [selectedLocation])

  const handleLocationSelect = (lat, lng) => {
    const newPosition = [lat, lng]
    setMarkerPosition(newPosition)
    if (onLocationSelect) {
      onLocationSelect(lat, lng)
    }
  }

  return (
    <div className={`map-picker ${className}`} style={{ height }}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url={`https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> | &copy; <a href="https://www.maptiler.com/">MapTiler</a>'
        />
        <MapClickHandler onLocationSelect={handleLocationSelect} />
        <MapCenterHandler selectedLocation={selectedLocation} />
        {isValidCoordinate(markerPosition) && Number.isFinite(markerPosition[0]) && Number.isFinite(markerPosition[1]) && (
          <Marker position={markerPosition}>
            <Popup>
              Event Location
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
