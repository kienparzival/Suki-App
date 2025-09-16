import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import Header from '../components/Header.jsx'

export default function AuthPage() {
  const { user, signInWithEmail, signInWithApple, signInWithFacebook, signInWithGoogle, loading, emailSent, cancelEmailFlow } = useAuth()
  const [email, setEmail] = useState('')
  const [activeTab, setActiveTab] = useState('signup') // 'signup' or 'signin'
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSend = async () => {
    try {
      setError('')
      setSuccessMessage('')
      const isSignUp = activeTab === 'signup'
      
      console.log('[Auth] Calling signInWithEmail with:', { email, isSignUp })
      const result = await signInWithEmail(email, isSignUp)
      console.log('[Auth] Result received:', result)
      
      if (result && result.success) {
        setSuccessMessage(result.message)
      } else {
        setError('Unexpected response from sign-in service')
      }
    } catch (e) {
      console.error('[Auth] Error in handleSend:', e)
      setError(e.message || 'An unexpected error occurred')
    }
  }

  const handleSocialSignIn = async (provider) => {
    try {
      setError('')
      setSuccessMessage('')
      
      let result
      switch (provider) {
        case 'apple':
          result = await signInWithApple()
          break
        case 'facebook':
          result = await signInWithFacebook()
          break
        case 'google':
          result = await signInWithGoogle()
          break
        default:
          throw new Error('Unknown provider')
      }
      
      if (result.success) {
        setSuccessMessage('Redirecting to sign in...')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const handleBackToProviders = () => {
    setEmail('')
    setError('')
    setSuccessMessage('')
    // Reset the email flow state in the context
    if (cancelEmailFlow) {
      cancelEmailFlow()
    }
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header userLocation={{city:'HCMC',lat:10.7769,lng:106.7009}} setUserLocation={()=>{}} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="card p-6">
            <p>You are signed in as <span className="font-medium">{user.email}</span>.</p>
            <a href="/profile" className="btn btn-primary mt-4">Go to Profile</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userLocation={{city:'HCMC',lat:10.7769,lng:106.7009}} setUserLocation={()=>{}} />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="w-full max-w-md">
          <div className="card p-8 space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-semibold mb-2">Welcome!</h1>
              <p className="text-gray-600">Choose your preferred sign-in method</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'signup'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('signup')}
              >
                Sign Up
              </button>
              <button
                className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'signin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('signin')}
              >
                Sign In
              </button>
            </div>

            {!emailSent && (
              <>
                {/* Social Authentication Buttons */}
                <div className="space-y-3">
                  <button 
                    className="btn btn-ghost w-full" 
                    onClick={() => handleSocialSignIn('apple')}
                    disabled={loading}
                  >
                    Continue with Apple
                  </button>
                  <button 
                    className="btn btn-ghost w-full" 
                    onClick={() => handleSocialSignIn('facebook')}
                    disabled={loading}
                  >
                    Continue with Facebook
                  </button>
                  <button 
                    className="btn btn-ghost w-full" 
                    onClick={() => handleSocialSignIn('google')}
                    disabled={loading}
                  >
                    Continue with Google
                  </button>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                  </div>
                </div>

                {/* Email Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input 
                      className="input w-full" 
                      type="email"
                      placeholder="you@email.com" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  
                  {activeTab === 'signup' && (
                    <p className="text-xs text-gray-500">
                      We'll send you a confirmation email to verify your account.
                    </p>
                  )}
                  
                  {activeTab === 'signin' && (
                    <p className="text-xs text-gray-500">
                      Enter your email to receive a sign-in link.
                    </p>
                  )}
                  
                  <button 
                    className="btn btn-primary w-full" 
                    onClick={handleSend}
                    disabled={loading || !email.trim()}
                  >
                    {loading ? 'Sending...' : activeTab === 'signup' ? 'Sign Up' : 'Sign In'}
                  </button>
                </div>
              </>
            )}

            {emailSent && (
              <div className="space-y-4 text-center">
                <div className="text-blue-600">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-medium">Check your email!</p>
                  <p className="text-sm text-gray-600 mt-2">
                    We've sent a confirmation link to <span className="font-medium">{email}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click the link in your email to {activeTab === 'signup' ? 'complete your sign up' : 'sign in'}. The link will expire in 24 hours.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button 
                    type="button"
                    className="btn btn-link text-sm" 
                    onClick={handleBackToProviders}
                  >
                    Use a different email
                  </button>
                  <button 
                    type="button"
                    className="btn btn-link text-sm" 
                    onClick={handleSend}
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Resend confirmation email'}
                  </button>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success">
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 