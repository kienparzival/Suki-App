import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocation } from '../context/LocationContext.jsx'
import Header from '../components/Header.jsx'
import AvatarUploader from '../components/AvatarUploader.jsx'
import { supabase } from '../lib/supabase.js'
import { CATEGORIES } from '../constants/categories'

export default function Profile() {
  const { user, signOut, updateProfile } = useAuth()
  const { updateLocationFromProfile } = useLocation()
  const [profile, setProfile] = useState({
    profilePhoto: null,
    avatar_url: null,
    prefix: 'Mr.',
    firstName: '',
    lastName: '',
    suffix: '',
    homePhone: '',
    cellPhone: '',
    jobTitle: '',
    company: '',
    website: '',
    blog: '',
    address: '',
    address2: '',
    city: '',
    interests: [],
    country: 'Vietnam',
    zipCode: '',
    state: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  // Update location when profile city changes
  useEffect(() => {
    if (profile.city && profile.city.trim()) {
      updateLocationFromProfile(profile.city.trim())
    }
  }, [profile.city, updateLocationFromProfile])

  useEffect(() => {
    if (user) {
      // Load existing profile data from localStorage
      try {
        const savedProfile = localStorage.getItem(`suki_profile_${user.id}`)
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile)
          // Ensure interests are properly formatted as array
          if (parsed.interests && typeof parsed.interests === 'string') {
            parsed.interests = parsed.interests.split(',').map(s => s.trim()).filter(Boolean)
          } else if (!parsed.interests) {
            parsed.interests = []
          }
          
          // Load profile photo from localStorage first (highest priority)
          let profilePhoto = null
          try {
            const photoKey = `suki_profile_photo_${user.id}`
            const storedPhoto = localStorage.getItem(photoKey)
            console.log('[Profile] Looking for profile photo with key:', photoKey)
            console.log('[Profile] Found photo in localStorage:', !!storedPhoto)
            
            if (storedPhoto) {
              profilePhoto = storedPhoto
              console.log('[Profile] Successfully loaded photo from localStorage for user:', user.id)
            } else {
              console.log('[Profile] No photo found in localStorage for user:', user.id)
            }
          } catch (error) {
            console.warn('Could not load profile photo from localStorage:', error)
          }
          
          // If no photo in localStorage, try user metadata
          if (!profilePhoto && user.profilePhoto) {
            profilePhoto = user.profilePhoto
            console.log('[Profile] Loaded photo from user metadata for user:', user.id)
          }
          
          // Set the profile with photo included
          const profileWithPhoto = { ...parsed, profilePhoto }
          setProfile(profileWithPhoto)
          
          // Update user state to include the photo so header can display it
          if (profilePhoto) {
            user.profilePhoto = profilePhoto
            console.log('[Profile] Profile photo set successfully for user:', user.id)
          } else {
            console.log('[Profile] No profile photo found for user:', user.id)
          }
        } else {
          // Set default values from user profile
          setProfile(prev => ({ 
            ...prev, 
            city: user.city || 'HCMC',
            interests: user.interests || []
          }))
          
          // Load profile photo from localStorage first (highest priority)
          let profilePhoto = null
          try {
            const photoKey = `suki_profile_photo_${user.id}`
            const storedPhoto = localStorage.getItem(photoKey)
            console.log('[Profile] Looking for profile photo with key:', photoKey)
            console.log('[Profile] Found photo in localStorage:', !!storedPhoto)
            
            if (storedPhoto) {
              profilePhoto = storedPhoto
              console.log('[Profile] Successfully loaded photo from localStorage for user:', user.id)
            } else {
              console.log('[Profile] No photo found in localStorage for user:', user.id)
            }
          } catch (error) {
            console.warn('Could not load profile photo from localStorage:', error)
          }
          
          // If no photo in localStorage, try user metadata
          if (!profilePhoto && user.profilePhoto) {
            profilePhoto = user.profilePhoto
            console.log('[Profile] Loaded photo from user metadata for user:', user.id)
          }
          
          // Set the profile with photo included
          if (profilePhoto) {
            setProfile(prev => ({ ...prev, profilePhoto }))
            // Update user state to include the photo so header can display it
            user.profilePhoto = profilePhoto
            console.log('[Profile] Profile photo set successfully for user:', user.id)
          } else {
            console.log('[Profile] No profile photo found for user:', user.id)
          }
        }

      } catch (error) {
        console.warn('Error loading profile from localStorage:', error)
        // Fallback to user metadata
        setProfile(prev => ({ 
          ...prev, 
          city: user.city || 'HCMC',
          profilePhoto: user.profilePhoto || null,
          interests: user.interests || []
        }))
      }
    }
  }, [user])

  // Load avatar_url from database
  useEffect(() => {
    if (user) {
      const loadAvatar = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single()
          
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error loading avatar:', error)
            return
          }
          
          if (data?.avatar_url) {
            setProfile(prev => ({ ...prev, avatar_url: data.avatar_url }))
          }
        } catch (error) {
          console.error('Error loading avatar from database:', error)
        }
      }
      
      loadAvatar()
    }
  }, [user])

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const compressImage = (dataUrl, maxWidth = 200, maxHeight = 200) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Calculate new dimensions
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7) // 70% quality
        
        resolve(compressedDataUrl)
      }
      img.src = dataUrl
    })
  }

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          // Compress the image before storing
          const compressedPhoto = await compressImage(e.target.result)
          setProfile(prev => ({ ...prev, profilePhoto: compressedPhoto }))
          console.log('[Profile] Photo uploaded and compressed successfully for user:', user.id)
        } catch (error) {
          console.error('Error compressing image:', error)
          // Fallback to original image
          setProfile(prev => ({ ...prev, profilePhoto: e.target.result }))
          console.log('[Profile] Photo uploaded with fallback (no compression) for user:', user.id)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (user) {
      setSaving(true)
      try {
        // Prepare the profile data to save to Supabase
        const profileData = {
          city: profile.city,
          interests: profile.interests || [],
          profilePhoto: profile.profilePhoto,
          firstName: profile.firstName,
          lastName: profile.lastName,
          prefix: profile.prefix,
          suffix: profile.suffix,
          homePhone: profile.homePhone,
          cellPhone: profile.cellPhone,
          jobTitle: profile.jobTitle,
          company: profile.company,
          website: profile.website,
          blog: profile.blog,
          address: profile.address,
          address2: profile.address2,
          country: profile.country,
          zipCode: profile.zipCode,
          state: profile.state
        }

        // Update user metadata in Supabase
        await updateProfile(profileData)
        
        // Update location system if city changed
        if (profile.city && profile.city.trim()) {
          updateLocationFromProfile(profile.city.trim())
        }
        
        // Save to localStorage as backup (without large photos to avoid quota issues)
        try {
          const profileForStorage = {
            ...profile,
            profilePhoto: null // Don't store large photos in localStorage
          }
          localStorage.setItem(`suki_profile_${user.id}`, JSON.stringify(profileForStorage))
          console.log('[Profile] Saved profile metadata to localStorage for user:', user.id)
        } catch (storageError) {
          console.warn('localStorage quota exceeded, clearing and retrying...')
          try {
            localStorage.clear()
            const profileForStorage = {
              ...profile,
              profilePhoto: null
            }
            localStorage.setItem(`suki_profile_${user.id}`, JSON.stringify(profileForStorage))
          } catch (retryError) {
            console.warn('Still cannot save to localStorage:', retryError)
            // Continue without localStorage - Supabase is the source of truth
          }
        }
        
        setMessage('Profile saved successfully!')
        setIsEditing(false)
        setTimeout(() => setMessage(''), 3000)
      } catch (error) {
        console.error('Error saving profile:', error)
        setMessage(`Error saving profile: ${error.message}`)
        setTimeout(() => setMessage(''), 5000)
      } finally {
        setSaving(false)
      }
    }
  }

  const handleSignOut = () => {
    signOut()
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Header searchTerm="" setSearchTerm={() => {}} />
        <div className="container mt-10">
          <div className="card p-6 text-center">
            <p>Please sign in to view your profile.</p>
            <a href="/auth" className="btn btn-primary mt-4">Sign In</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchTerm="" setSearchTerm={() => {}} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
            </div>
            <div className="flex gap-3">
              {!isEditing && (
                <button 
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              )}
              <button 
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
            </div>
          </div>

          {message && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-800 font-medium">{message}</span>
            </div>
            </div>
          )}
          
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Photo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Photo</h2>
              
              <div className="text-center">
                {(profile.avatar_url || profile.profilePhoto) ? (
                  <div className="mb-6">
                    <img 
                      src={profile.avatar_url || profile.profilePhoto} 
                    alt="Profile" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg mx-auto"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                
                {isEditing && user && (
                  <AvatarUploader
                    userId={user.id}
                    onDone={(url) => {
                      setProfile(prev => ({ ...prev, avatar_url: url }))
                      // Also update user state for header display
                      if (user) {
                        user.profilePhoto = url
                      }
                    }}
                  />
                )}
              </div>
              </div>
            </div>

          {/* Right Column - Profile Information */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prefix</label>
                  <select 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={profile.prefix}
                    onChange={(e) => handleInputChange('prefix', e.target.value)}
                    disabled={!isEditing}
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Prof.">Prof.</option>
                  </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input 
                    type="text" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={profile.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="First Name"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input 
                    type="text" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={profile.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Last Name"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Suffix</label>
                  <input 
                    type="text" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={profile.suffix}
                    onChange={(e) => handleInputChange('suffix', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Suffix"
                  />
                </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Home Phone</label>
                  <input 
                    type="tel" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={profile.homePhone}
                    onChange={(e) => handleInputChange('homePhone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Home Phone"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cell Phone</label>
                  <input 
                    type="tel" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={profile.cellPhone}
                    onChange={(e) => handleInputChange('cellPhone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Cell Phone"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <input 
                    type="text" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={profile.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Job Title"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company / Organization</label>
                  <input 
                    type="text" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={profile.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Company / Organization"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input 
                    type="url" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={profile.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Website"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blog</label>
                  <input 
                    type="url" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={profile.blog}
                    onChange={(e) => handleInputChange('blog', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Blog"
                  />
                </div>
              </div>
            </div>

            {/* Interests */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Interests</h2>
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                  Select your interests 
                  {profile.interests.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({profile.interests.length} selected)
                    </span>
                  )}
                </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CATEGORIES.map(category => (
                      <label key={category} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={profile.interests.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange('interests', [...profile.interests, category])
                          } else {
                            handleInputChange('interests', profile.interests.filter(interest => interest !== category))
                          }
                        }}
                        disabled={!isEditing}
                      />
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
                </div>
            </div>

              {/* Address */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Address</h2>
                <div className="space-y-6">
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input 
                    type="text" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={profile.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Address"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address 2</label>
                  <input 
                    type="text" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={profile.address2}
                    onChange={(e) => handleInputChange('address2', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Address 2"
                  />
                </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input 
                      type="text" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      value={profile.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      disabled={!isEditing}
                      placeholder="City"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input 
                      type="text" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      value={profile.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Country"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Zip/Postal Code</label>
                    <input 
                      type="text" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      value={profile.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Zip/Postal Code"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input 
                      type="text" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      value={profile.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      disabled={!isEditing}
                      placeholder="State"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex gap-4">
                <button 
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium" 
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                  </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}