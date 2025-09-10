import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Header from '../components/Header.jsx'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('Processing...')
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('Processing authentication...')
        
        // Debug: Log the current URL and search params
        console.log('[AuthCallback] Current URL:', window.location.href)
        console.log('[AuthCallback] Search params:', Object.fromEntries(searchParams.entries()))
        console.log('[AuthCallback] Hash:', window.location.hash)
        console.log('[AuthCallback] Origin:', window.location.origin)
        console.log('[AuthCallback] Expected callback URL:', `${window.location.origin}/auth/callback`)
        
        // Check if we're on the correct callback URL
        if (!window.location.href.includes('/auth/callback')) {
          console.warn('[AuthCallback] Warning: Not on expected callback URL')
        }
        
        // Check for OAuth errors or authorization code first
        const oauthError = searchParams.get('error')
        const oauthErrorDescription = searchParams.get('error_description')
        const code = searchParams.get('code')
        
        if (oauthError) {
          throw new Error(oauthErrorDescription || `Authentication failed: ${oauthError}`)
        }

        // If we have an OAuth code param, exchange it for a session (PKCE flow)
        if (code) {
          console.log('[AuthCallback] OAuth code detected, exchanging for session...')
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href)
          if (exchangeError) {
            console.error('[AuthCallback] exchangeCodeForSession error:', exchangeError)
            throw new Error('Failed to complete OAuth sign-in')
          }
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            setStatus('Authentication successful! Redirecting...')
            setTimeout(() => {
              navigate('/profile', { replace: true })
            }, 1000)
            return
          }
        }
        
        // For magic links, we need to handle the URL hash tokens
        // Check if we have access_token and refresh_token in the hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const hashError = hashParams.get('error')
        const hashErrorDescription = hashParams.get('error_description')
        const errorCode = hashParams.get('error_code')
        
        console.log('[AuthCallback] Hash params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, hashError, hashErrorDescription, errorCode })
        
        if (hashError) {
          // Handle specific OTP expiration error
          if (errorCode === 'otp_expired') {
            throw new Error(
              'Your magic link has expired. This usually happens when:\n' +
              '1. The link is older than the configured expiry time\n' +
              '2. You\'ve already used this link\n' +
              '3. The link was sent from a different device/browser\n\n' +
              'Please try signing up again to get a fresh magic link.'
            )
          } else {
            throw new Error(hashErrorDescription || hashError)
          }
        }
        
        // Check if we have the magic link tokens in the URL
        if (accessToken && refreshToken) {
          // We have tokens, set the session
          console.log('[AuthCallback] Setting session with tokens...')
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (setSessionError) {
            throw setSessionError
          }
          
          if (data.session) {
            console.log('[AuthCallback] Session set successfully:', data.session.user.email)
            setStatus('Email confirmed! Redirecting...')
            
            // Wait a moment to show success message
            setTimeout(() => {
              navigate('/profile', { replace: true })
            }, 1500)
            return
          }
        }
        
        // If no tokens in hash, the magic link might be invalid or expired
        // Let's try to get more information about what went wrong
        console.log('[AuthCallback] No tokens found in hash, checking URL parameters...')
        
        // Check for error parameters in the URL (this is now handled above for OAuth)
        // const urlError = searchParams.get('error')
        // const urlErrorDescription = searchParams.get('error_description')
        
        // if (urlError) {
        //   throw new Error(urlErrorDescription || urlError)
        // }
        
        // Check if we're missing the hash entirely (which suggests the magic link didn't work)
        if (!window.location.hash) {
          throw new Error('Invalid magic link format. Please check your email and try again.')
        }
        
        // If no tokens in hash, try to get session from storage
        console.log('[AuthCallback] No tokens in hash, checking for existing session...')
        
        // Try to get the session immediately
        const { data: initialData, error: initialError } = await supabase.auth.getSession()
        console.log('[AuthCallback] Initial session check:', { data: initialData, error: initialError })
        
        if (initialData.session) {
          console.log('[AuthCallback] Found existing session:', initialData.session.user.email)
          setStatus('Email confirmed! Redirecting...')
          
          // Wait a moment to show success message
          setTimeout(() => {
            navigate('/profile', { replace: true })
          }, 1500)
          return
        }
        
        // If we get here, the magic link didn't work properly
        // This usually means there's a configuration issue
        console.error('[AuthCallback] Magic link failed - no tokens and no session')
        
        // Check if this might be an OAuth callback instead
        console.log('[AuthCallback] Checking if this is an OAuth callback...')
        
        // For OAuth (Google, Facebook, Apple), Supabase automatically handles the callback
        // We just need to wait for the session to be established
        console.log('[AuthCallback] OAuth callback detected, waiting for session...')
        
        // Wait a bit for Supabase to process the OAuth response
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if we now have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('[AuthCallback] Session error:', sessionError)
          throw new Error('Failed to establish session after OAuth authentication')
        }
        
        if (session?.user) {
          console.log('[AuthCallback] OAuth authentication successful:', session.user.email)
          setStatus('Authentication successful! Redirecting...')
          
          // Wait a moment to show success message
          setTimeout(() => {
            navigate('/profile', { replace: true })
          }, 1500)
          return
        }
        
        // If no session yet, wait a bit more and try again
        console.log('[AuthCallback] No session yet, waiting a bit more...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession()
        
        if (retryError) {
          throw new Error('Failed to establish session after OAuth authentication')
        }
        
        if (retrySession?.user) {
          console.log('[AuthCallback] OAuth authentication successful on retry:', retrySession.user.email)
          setStatus('Authentication successful! Redirecting...')
          
          setTimeout(() => {
            navigate('/profile', { replace: true })
          }, 1500)
          return
        }
        
        // If we still don't have a session, provide a helpful error message
        throw new Error(
          'Authentication failed. This usually means:\n' +
          '1. For magic links: The link has expired or is invalid\n' +
          '2. For OAuth: There\'s a mismatch in Supabase OAuth redirect URL settings\n' +
          '3. The authentication provider configuration is incorrect\n\n' +
          'Please try signing in again or check your Supabase project settings.'
        )
        
      } catch (error) {
        console.error('Auth callback error:', error)
        setError(error.message)
        setStatus('Authentication failed')
      }
    }

    handleAuthCallback()
  }, [navigate, searchParams])

  if (error) {
    return (
      <div className="min-h-screen">
        <Header userLocation={{city:'HCMC',lat:10.7769,lng:106.7009}} setUserLocation={()=>{}} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="w-full max-w-md">
            <div className="card p-8 text-center space-y-4">
              <div className="text-red-600">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-lg font-medium">Authentication Failed</p>
              </div>
              <p className="text-gray-600">{error}</p>
              <div className="space-y-3">
                <button 
                  className="btn btn-primary w-full" 
                  onClick={() => navigate('/auth', { replace: true })}
                >
                  Try Again
                </button>
                <button 
                  className="btn btn-ghost w-full" 
                  onClick={() => navigate('/', { replace: true })}
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header userLocation={{city:'HCMC',lat:10.7769,lng:106.7009}} setUserLocation={()=>{}} />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center space-y-4">
            <div className="text-blue-600">
              <svg className="w-16 h-16 mx-auto mb-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-lg font-medium">{status}</p>
            </div>
            <div className="text-sm text-gray-600">
              Please wait while we complete your authentication...
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 