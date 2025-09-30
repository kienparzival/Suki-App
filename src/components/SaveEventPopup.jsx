import React from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Heart } from 'lucide-react'

export default function SaveEventPopup({ event, isOpen, onClose }) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleSignIn = () => {
    navigate('/auth')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Sign in to save this event</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Card */}
        <div className="p-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              {/* Event Image */}
              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {event.cover_url ? (
                  <img 
                    src={event.cover_url} 
                    alt={event.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Event Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                  {event.title}
                </h4>
                <p className="text-xs text-gray-600 mb-2">
                  {new Date(event.start_at).toLocaleDateString()} at {new Date(event.start_at).toLocaleTimeString()}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2">
                  <span data-no-translate>{event.venue?.name || 'TBD'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleSignIn}
              className="flex-1 btn btn-primary flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
