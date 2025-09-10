import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'suki_user'

const defaultUser = null

const AuthContext = createContext({
  user: defaultUser,
  pendingEmail: '',
  emailSent: false,
  signInWithEmail: (email) => {},
  signOut: () => {},
  updateProfile: (partial) => {},
  signInWithApple: () => {},
  signInWithFacebook: () => {},
  signInWithGoogle: () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(defaultUser)
  const [pendingEmail, setPendingEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Load profile photo from localStorage if available
        let profilePhoto = null
        try {
          const photoKey = `suki_profile_photo_${session.user.id}`
          const storedPhoto = localStorage.getItem(photoKey)
          console.log('[Suki] Initial session: Looking for profile photo with key:', photoKey)
          console.log('[Suki] Initial session: Found photo in localStorage:', !!storedPhoto)
          
          if (storedPhoto) {
            profilePhoto = storedPhoto
            console.log('[Suki] Initial session: Successfully restored profile photo from localStorage for user:', session.user.id)
          } else {
            console.log('[Suki] Initial session: No profile photo found in localStorage for user:', session.user.id)
          }
        } catch (error) {
          console.warn('Could not restore profile photo from localStorage:', error)
        }
        
        setUser({
          id: session.user.id,
          email: session.user.email,
          city: session.user.user_metadata?.city || 'HCMC',
          interests: session.user.user_metadata?.interests || [],
          isOrganizer: session.user.user_metadata?.isOrganizer || false,
          createdAt: session.user.created_at,
          provider: session.user.app_metadata?.provider || 'email',
          profilePhoto: profilePhoto, // Include profile photo
        })
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if this is a different user (account switch) - both from localStorage and current state
          const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
          const currentStateUser = user
          const isAccountSwitch = (currentUser.id && currentUser.id !== session.user.id) || 
                                 (currentStateUser && currentStateUser.id !== session.user.id)
          
          if (isAccountSwitch) {
            const previousUserId = currentUser.id || currentStateUser?.id
            console.log('[Suki] Account switch detected from', previousUserId, 'to', session.user.id)
            // Dispatch event to notify components about account switch
            window.dispatchEvent(new CustomEvent('suki:account_switched', { 
              detail: { 
                previousUserId: previousUserId, 
                newUserId: session.user.id 
              } 
            }))
            
            // Also dispatch events updated event to force refresh
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('suki:events_updated'))
            }, 100)
          }
          
          // Load profile photo from localStorage if available
          let profilePhoto = null
          try {
            const photoKey = `suki_profile_photo_${session.user.id}`
            const storedPhoto = localStorage.getItem(photoKey)
            console.log('[Suki] Looking for profile photo with key:', photoKey)
            console.log('[Suki] Found photo in localStorage:', !!storedPhoto)
            
            if (storedPhoto) {
              profilePhoto = storedPhoto
              console.log('[Suki] Successfully restored profile photo from localStorage for user:', session.user.id)
            } else {
              console.log('[Suki] No profile photo found in localStorage for user:', session.user.id)
            }
          } catch (error) {
            console.warn('Could not restore profile photo from localStorage:', error)
          }
            
          const userData = {
            id: session.user.id,
            email: session.user.email,
            city: session.user.user_metadata?.city || 'HCMC',
            interests: session.user.user_metadata?.interests || [],
            isOrganizer: session.user.user_metadata?.isOrganizer || false,
            createdAt: session.user.created_at,
            provider: session.user.app_metadata?.provider || 'email',
            profilePhoto: profilePhoto, // Include profile photo
          }
          setUser(userData)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          localStorage.removeItem(STORAGE_KEY)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Update user data if needed
          setUser(prev => prev ? { ...prev, id: session.user.id } : null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = async (email, isSignUp = true) => {
    try {
      setLoading(true)
      const normalized = String(email || '').trim().toLowerCase()
      if (!normalized || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
        throw new Error('Invalid email')
      }

      // Debug: Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing. Please check your environment variables.')
      }

      setPendingEmail(normalized)

      console.log('[Suki] Attempting to send email to:', normalized, 'isSignUp:', isSignUp)

      // Force fresh magic link by clearing any existing sessions first
      if (!isSignUp) {
        console.log('[Suki] Clearing existing sessions for fresh magic link...')
        try {
          // Sign out any existing user to force fresh token generation
          await supabase.auth.signOut()
          console.log('[Suki] Existing sessions cleared')
        } catch (signOutError) {
          console.warn('[Suki] Could not clear existing sessions:', signOutError)
        }
      }

      // Use Supabase's signInWithOtp (magic link)
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
      const redirectUrl = `${siteUrl}/auth/callback`
      console.log('[Suki] Magic link redirect URL:', redirectUrl)
      
      const { error } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: isSignUp, // Only create user for sign up
          // Force fresh token generation by adding timestamp
          data: {
            timestamp: Date.now(),
            fresh: true
          }
        }
      })

      if (error) {
        console.error('[Suki] Supabase error:', error)
        if (!isSignUp && error.message.includes('User not found')) {
          throw new Error('No account found with this email. Please sign up first.')
        }
        throw new Error(error.message)
      }

      setEmailSent(true)
      console.log('[Suki] Confirmation email sent to', normalized)
      
      return { 
        success: true, 
        message: isSignUp 
          ? 'Check your email for the confirmation link!' 
          : 'Check your email for the sign-in link!'
      }
    } catch (error) {
      console.error('Error in signInWithEmail:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithApple = async () => {
    try {
      setLoading(true)
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${siteUrl}/auth/callback`
        }
      })
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Apple sign-in error:', error)
      throw new Error('Apple sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  const signInWithFacebook = async () => {
    try {
      setLoading(true)
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${siteUrl}/auth/callback`
        }
      })
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Facebook sign-in error:', error)
      throw new Error('Facebook sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/auth/callback`
        }
      })
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Google sign-in error:', error)
      throw new Error('Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // DON'T clear profile photo from localStorage - keep it for when user signs back in
      // The photo should persist across sign-out/sign-in cycles
      console.log('[Suki] User signed out, keeping profile photo in localStorage for future sign-ins')
      
      setUser(null)
      setPendingEmail('')
      setEmailSent(false)
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const updateProfile = async (partial) => {
    if (!user) return
    
    try {
      // Separate profile photo from other metadata
      const { profilePhoto, ...metadata } = partial
      
      // Update user metadata in Supabase (without photo)
      const { error: metadataError } = await supabase.auth.updateUser({
        data: metadata
      })
      
      if (metadataError) throw metadataError
      
      // Store profile photo separately in localStorage with a unique key
      if (profilePhoto) {
        try {
          localStorage.setItem(`suki_profile_photo_${user.id}`, profilePhoto)
        } catch (storageError) {
          console.warn('localStorage quota exceeded for photo, clearing and retrying...')
          try {
            // Clear only profile photos to free space
            const keys = Object.keys(localStorage)
            keys.forEach(key => {
              if (key.startsWith('suki_profile_photo_')) {
                localStorage.removeItem(key)
              }
            })
            localStorage.setItem(`suki_profile_photo_${user.id}`, profilePhoto)
          } catch (retryError) {
            console.warn('Still cannot save profile photo to localStorage:', retryError)
            // Continue without photo storage - user will need to re-upload
          }
        }
      }
      
      // Update local user state with all data including photo
      const updatedUser = { ...user, ...partial }
      setUser(updatedUser)
      
      // Also update localStorage with the updated user data
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser))
      } catch (storageError) {
        console.warn('Could not update user in localStorage:', storageError)
      }
      
      // Update localStorage with metadata only (no large photos)
      const metadataUser = { ...user, ...metadata }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(metadataUser))
      } catch (storageError) {
        console.warn('localStorage quota exceeded, clearing old data and retrying...')
        // Clear localStorage and try again
        localStorage.clear()
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(metadataUser))
        } catch (retryError) {
          console.warn('Still cannot save to localStorage:', retryError)
          // Continue without localStorage - Supabase is the source of truth
        }
      }
      
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  const value = useMemo(() => ({
    user,
    pendingEmail,
    emailSent,
    loading,
    signInWithEmail,
    signOut,
    updateProfile,
    signInWithApple,
    signInWithFacebook,
    signInWithGoogle,
  }), [user, pendingEmail, emailSent, loading])

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
} 