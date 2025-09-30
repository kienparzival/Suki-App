import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocation } from '../context/LocationContext.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
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

  // Load profile from Supabase database
  useEffect(() => {
    if (!user) return;

    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          prefix, first_name, last_name, suffix,
          home_phone, cell_phone, job_title, company,
          website, blog,
          address, address2, city, country, zip_code, state,
          interests, avatar_url
        `)
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[Profile] Load error', error);
        return;
      }

      if (data) {
        setProfile(prev => ({
          ...prev,
          prefix: data.prefix ?? 'Mr.',
          firstName: data.first_name ?? '',
          lastName: data.last_name ?? '',
          suffix: data.suffix ?? '',
          homePhone: data.home_phone ?? '',
          cellPhone: data.cell_phone ?? '',
          jobTitle: data.job_title ?? '',
          company: data.company ?? '',
          website: data.website ?? '',
          blog: data.blog ?? '',
          address: data.address ?? '',
          address2: data.address2 ?? '',
          city: data.city ?? '',
          country: data.country ?? 'Vietnam',
          zipCode: data.zip_code ?? '',
          state: data.state ?? '',
          interests: Array.isArray(data.interests) ? data.interests : [],
          avatar_url: data.avatar_url ?? null,
        }));
      }
    })();
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
    if (!user) return;
    setSaving(true);
    try {
      // Ensure interests is an array of strings
      const interests = Array.isArray(profile.interests) ? profile.interests : [];

      const payload = {
        id: user.id,                         // REQUIRED for RLS and upsert on your own row
        prefix: profile.prefix || null,
        first_name: profile.firstName || null,
        last_name: profile.lastName || null,
        suffix: profile.suffix || null,
        home_phone: profile.homePhone || null,
        cell_phone: profile.cellPhone || null,
        job_title: profile.jobTitle || null,
        company: profile.company || null,
        website: profile.website || null,
        blog: profile.blog || null,
        address: profile.address || null,
        address2: profile.address2 || null,
        city: profile.city || null,
        country: profile.country || null,
        zip_code: profile.zipCode || null,
        state: profile.state || null,
        interests,
        avatar_url: profile.avatar_url || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      // Update location system if city changed
      if (profile.city && profile.city.trim()) {
        updateLocationFromProfile(profile.city.trim());
      }

      setMessage('Profile saved successfully!');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      console.error('Error saving profile:', e);
      setMessage(`Failed to save profile: ${e.message ?? e}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input 
                    type="text" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={profile.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Company"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                  <input 
                    type="text" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={profile.address2}
                    onChange={(e) => handleInputChange('address2', e.target.value)}
                    disabled={!isEditing}
                      placeholder="Address Line 2"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                    <input 
                      type="text" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      value={profile.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      disabled={!isEditing}
                      placeholder="ZIP Code"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                    <input 
                      type="text" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      value={profile.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      disabled={!isEditing}
                      placeholder="State/Province"
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
                  {saving ? "Saving..." : "Save Changes"}
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
      <Footer />
    </div>
  )
}