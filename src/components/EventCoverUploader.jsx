import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function EventCoverUploader({ eventId, onDone }) {
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  async function upload() {
    setError('')
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please choose an image.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Max file size is 5 MB.'); return }

    setBusy(true)

    try {
      // Get the authenticated user id from Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { 
        setError('Not signed in')
        setBusy(false)
        return 
      }

      console.log('[EventCover] Authenticated user:', user.id)
      console.log('[EventCover] Event ID:', eventId)

      // Generate a safe filename (ignore original filename completely)
        const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
      // Always generate a simple, safe key: <event_id>/cover-<timestamp>.<ext>
      const path = `${eventId}/cover-${Date.now()}.${ext}`

      console.log('[EventCover] uploading to path:', path)

      // 1) Upload
      const { error: upErr } = await supabase.storage
        .from('event-covers')                // bucket name ONLY here
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })

      if (upErr) {
        console.error('[EventCover] Storage upload error:', upErr)
        setError(upErr.message)
        setBusy(false)
        return
      }

      console.log('[EventCover] Storage upload successful')

      // 2) Public URL (REUSE the SAME path)
      const { data: pub } = supabase.storage.from('event-covers').getPublicUrl(path)
      const cover_url = pub.publicUrl
      console.log('[EventCover] Generated public URL:', cover_url)

      // 3) Save to events (requires event owner policy)
      const { error: evErr } = await supabase.from('events')
        .update({ cover_url })
        .eq('id', eventId)
        .eq('creator_id', user.id)  // Ensure user owns the event

      if (evErr) {
        console.error('[EventCover] Events update error:', evErr)
        setError(evErr.message)
        setBusy(false)
        return
      }

      console.log('[EventCover] Event update successful')
      onDone?.(cover_url)
    } catch (error) {
      console.error('[EventCover] Unexpected error:', error)
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type.startsWith('image/')) {
        setFile(droppedFile)
        setError('')
      } else {
        setError('Please drop an image file')
      }
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError('')
    }
  }

  return (
    <div className="space-y-3">
      {/* Drag and Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : file 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {file ? (
          <div className="space-y-3">
            <div className="w-20 h-20 mx-auto rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <img 
                src={URL.createObjectURL(file)} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-green-700">{file.name}</p>
              <p className="text-xs text-green-600">Ready to upload</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {dragActive ? 'Drop your cover image here' : 'Drag & drop your cover image here'}
              </p>
              <p className="text-xs text-gray-500">or click to browse</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {file && (
        <button 
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium" 
          onClick={upload} 
          disabled={busy}
        >
          {busy ? 'Uploading…' : 'Upload Cover Image'}
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded-lg">
          {error}
        </div>
      )}

      {/* File Info */}
      {file && (
        <div className="text-xs text-gray-500 text-center">
          Max file size: 5MB • Supported: JPG, PNG, GIF • Tip: Use ~1600×900 for best results
        </div>
      )}
    </div>
  )
}
