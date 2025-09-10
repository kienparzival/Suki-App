import React, { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

const ResultPopup = ({ result, onClose }) => {
  if (!result) return null

  const getIcon = () => {
    switch (result.kind) {
      case 'ok': return <CheckCircle className="w-16 h-16 text-green-500" />
      case 'warn': return <AlertTriangle className="w-16 h-16 text-yellow-500" />
      case 'err': return <XCircle className="w-16 h-16 text-red-500" />
      default: return <AlertTriangle className="w-16 h-16 text-gray-500" />
    }
  }

  const getBgColor = () => {
    switch (result.kind) {
      case 'ok': return 'bg-green-50 border-green-200'
      case 'warn': return 'bg-yellow-50 border-yellow-200'
      case 'err': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getTextColor = () => {
    switch (result.kind) {
      case 'ok': return 'text-green-800'
      case 'warn': return 'text-yellow-800'
      case 'err': return 'text-red-800'
      default: return 'text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${getBgColor()} border-2 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="mb-4">
          {getIcon()}
        </div>
        
        <h3 className={`text-2xl font-bold mb-2 ${getTextColor()}`}>
          {result.kind === 'ok' ? 'SUCCESS!' : 
           result.kind === 'warn' ? 'WARNING' : 'ERROR'}
        </h3>
        
        <p className={`text-lg ${getTextColor()} mb-6`}>
          {result.text}
        </p>
        
        <button
          onClick={onClose}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            result.kind === 'ok' ? 'bg-green-500 hover:bg-green-600 text-white' :
            result.kind === 'warn' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
            'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          Scan Next Ticket
        </button>
      </div>
    </div>
  )
}

export default function Scanner() {
  const { user } = useAuth()
  const [search] = useSearchParams()
  const [events, setEvents] = useState([])
  const [eventId, setEventId] = useState(search.get('event') || '')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const scannerRef = useRef(null)
  const html5Ref = useRef(null)
  const scanningRef = useRef(true)

  const initializeScanner = () => {
    if (!eventId) return

    const element = document.getElementById('qr-reader')
    if (!element) {
      setError('QR reader element not found')
      return
    }

    // Ensure decode gate is open
    scanningRef.current = true

    try {
      html5Ref.current = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false)
      html5Ref.current.render(async (decodedText) => {
        // Gate decodes using a ref to avoid stale state closures
        if (!scanningRef.current) return

        try {
          // Close the gate immediately to prevent duplicate scans
          scanningRef.current = false

          // Stop the scanner completely
          if (html5Ref.current) {
            try {
              await html5Ref.current.clear()
            } catch (clearError) {
              console.warn('Error clearing scanner:', clearError)
            }
            html5Ref.current = null
          }

          const cleaned = decodedText.trim().toLowerCase().startsWith('suki:')
            ? decodedText.trim().slice(5)
            : decodedText.trim()
          setError('')
          const { data, error } = await supabase.rpc('validate_and_use_ticket', {
            p_event: eventId,
            p_qr_token: cleaned
          })
          if (error) {
            setResult({ kind: 'err', text: error.message })
          } else {
            const status = data?.status
            if (status === 'OK') {
              setResult({ kind: 'ok', text: 'PASS ✓ Ticket validated' })
            } else if (status === 'ALREADY_USED') {
              setResult({ kind: 'warn', text: 'ALREADY USED' })
            } else if (status === 'WRONG_EVENT') setResult({ kind: 'err', text: 'WRONG EVENT' })
            else if (status === 'NOT_FOUND') setResult({ kind: 'err', text: 'TICKET NOT FOUND' })
            else if (status === 'FORBIDDEN') setResult({ kind: 'err', text: 'You are not allowed to scan for this event' })
            else if (status === 'NOT_AUTHENTICATED') setResult({ kind: 'err', text: 'Please sign in' })
            else setResult({ kind: 'err', text: status || 'ERROR' })
          }
        } catch (e) {
          setResult({ kind: 'err', text: e.message })
        }
      }, (e) => {
        if (typeof e === 'string' && e) setError(e)
      })
    } catch (e) {
      setError('Failed to initialize scanner: ' + e.message)
    }
  }

  const restartScanner = () => {
    // Clear any existing scanner instance
    if (html5Ref.current) {
      try {
        html5Ref.current.clear()
      } catch (e) {
        console.warn('Error clearing scanner:', e)
      }
      html5Ref.current = null
    }

    // Clear the QR reader element content
    const element = document.getElementById('qr-reader')
    if (element) {
      element.innerHTML = ''
    }

    // Open the gate and reset errors
    scanningRef.current = true
    setError('')

    // Restart the scanner after a short delay to allow camera to release
    setTimeout(() => {
      initializeScanner()
    }, 300)
  }

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id,title,start_at')
        .eq('creator_id', user.id)
        .eq('status', 'published')
        .order('start_at', { ascending: false })
      if (!error) setEvents(data || [])
    })()
  }, [user])

  useEffect(() => {
    if (!eventId) return
    if (html5Ref.current) return

    // Reset for new event
    scanningRef.current = true
    setResult(null)
    setError('')

    const timer = setTimeout(() => {
      initializeScanner()
    }, 100)

    return () => {
      clearTimeout(timer)
      try { html5Ref.current?.clear(); } catch {}
      html5Ref.current = null
    }
  }, [eventId])

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="card p-6 text-center">Please sign in to access the scanner.</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Door Scanner</h1>
          <Link to="/manage-events" className="btn">Back</Link>
        </div>

        <div className="card p-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">Choose event to scan</label>
          <select 
            className="input w-full" 
            value={eventId} 
            onChange={e=>setEventId(e.target.value)}
          >
            <option value="">— Select one of your published events —</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.title} — {new Date(ev.start_at).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {eventId && (
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">QR Code Scanner</h2>
            <div id="qr-reader" ref={scannerRef} className="w-full" />
            {error && (
              <div className="p-3 rounded text-center bg-red-600/20 text-red-300">
                Camera error: {error}
              </div>
            )}
            <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded">
              💡 <strong>Tip:</strong> If camera access is blocked, allow it in your browser settings. 
              This scanner works best on mobile devices.
            </div>
          </div>
        )}

        {/* Result Popup */}
        <ResultPopup 
          result={result} 
          onClose={() => {
            setResult(null)
            restartScanner()
          }} 
        />
      </div>
    </div>
  )
}
