import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase, hasStoredSession, isSupabaseConfigured } from '../lib/supabase'
import { toast } from 'react-toastify'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  // Fast initial state: if we have a stored session, assume logged in (optimistic)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [preferences, setPreferences] = useState(null)
  const welcomeToastShownRef = useRef(false) // Prevent duplicate welcome toasts

  // Load preferences in background (non-blocking)
  const loadUserPreferencesBackground = useCallback((userId) => {
    // Use requestIdleCallback for old devices, fallback to setTimeout
    const scheduleLoad = window.requestIdleCallback || ((cb) => setTimeout(cb, 50))
    scheduleLoad(() => loadUserPreferences(userId))
  }, [])

  // Auto-accept collaborator invite when user signs in
  const autoAcceptInvite = async (userEmail) => {
    if (!userEmail || !supabase) return
    try {
      const { data, error } = await supabase.rpc('accept_invite_for_user', {
        user_email: userEmail.toLowerCase()
      })
      if (error) {
        console.log('[INVITE] No pending invite or error:', error.message)
        return
      }
      if (data?.accepted) {
        console.log('[INVITE] Auto-accepted invite, owner_id:', data.owner_id)
      }
    } catch (err) {
      console.error('[INVITE] Error auto-accepting invite:', err)
    }
  }

  // Initialize auth state - optimized for speed
  useEffect(() => {
    let mounted = true

    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      console.error('Supabase is not configured')
      setLoading(false)
      return
    }

    // FAST PATH: Check localStorage synchronously first
    // If session already exists, mark welcome toast as shown (don't show on refresh)
    const hadExistingSession = hasStoredSession()
    if (hadExistingSession) {
      welcomeToastShownRef.current = true // Prevent welcome toast on page refresh
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        // Check if there's a hash fragment with tokens (OAuth callback - implicit flow)
        if (window.location.hash && window.location.hash.includes('access_token')) {
          // Fresh login via OAuth - allow welcome toast
          welcomeToastShownRef.current = false
          // Let Supabase handle the hash - it will trigger onAuthStateChange
          if (supabase) {
            const { data, error } = await supabase.auth.getSession()
            if (error) {
              console.error('Error processing OAuth callback:', error)
            }
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname)
          }
          return
        }

        // Check for PKCE code in URL params (OAuth callbacks with PKCE flow)
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        if (code) {
          welcomeToastShownRef.current = false
          if (supabase) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            if (error) {
              console.error('Error exchanging code for session:', error)
            }
            // Clear the code from URL
            window.history.replaceState(null, '', window.location.pathname)
          }
          return
        }

        // Supabase will handle invite/magic links automatically via the hash fragment
        // The onAuthStateChange listener below will detect when the user is authenticated
        // Just ensure the hash is present and let Supabase process it
        if (window.location.hash) {
          console.log('[INVITE] Hash detected, letting Supabase process it')
          welcomeToastShownRef.current = false
          // Supabase's detectSessionInUrl will handle this automatically
          // Just wait a moment for it to process
          await new Promise(resolve => setTimeout(resolve, 500))
          return
        }

        if (supabase) {
          const { data: { session }, error } = await supabase.auth.getSession()

          if (error) {
            console.error('Error getting session:', error)
          }

          if (mounted) {
            setUser(session?.user ?? null)
            setLoading(false)
            // Load preferences in background - don't block UI
            if (session?.user) {
              loadUserPreferencesBackground(session.user.id)
            }
          }
        }
      } catch (error) {
        console.error('Error getting session:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Listen for auth changes FIRST
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)

        if (!mounted) return

        // Update user state immediately
        setUser(session?.user ?? null)
        setLoading(false)

        if (event === 'SIGNED_IN' && session?.user) {
          // Load preferences in background
          loadUserPreferencesBackground(session.user.id)
          // Auto-accept collaborator invite if user was invited
          autoAcceptInvite(session.user.email)
          // Show welcome toast only on fresh login (not refresh)
          if (!welcomeToastShownRef.current) {
            welcomeToastShownRef.current = true
            const isInvitedUser = session.user.user_metadata?.role === 'collaborator'
            const invitedBy = session.user.user_metadata?.invited_by
            if (isInvitedUser && invitedBy) {
              toast.success(`Welcome! You've been invited by ${invitedBy}.`)
            } else {
              toast.success(`Welcome, ${session.user.user_metadata?.full_name || session.user.email}!`)
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setPreferences(null)
          welcomeToastShownRef.current = false // Reset for next login
          toast.info('Signed out successfully')
        }
      })

      // Then get initial session
      getInitialSession()

      return () => {
        mounted = false
        subscription?.unsubscribe()
      }
    }
  }, [loadUserPreferencesBackground])

  // Load user preferences from database
  const loadUserPreferences = async (userId) => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned (new user)
          console.error('Error loading preferences:', error)
          return
        }

        if (data) {
          setPreferences(data)
          // Only apply database preferences if localStorage doesn't have values
          // This preserves user's most recent selections even after logout
          if (data.selected_month_table && !localStorage.getItem('selectedMonthTable')) {
            localStorage.setItem('selectedMonthTable', data.selected_month_table)
          }
          if (data.badge_filter && !localStorage.getItem('badgeFilter')) {
            localStorage.setItem('badgeFilter', JSON.stringify(data.badge_filter))
          }
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  // Save user preferences to database
  const saveUserPreferences = async (newPreferences) => {
    if (!user) return

    try {
      // If Supabase isn't configured/available (or user is offline), do not spam errors.
      // Still update local state so the UI keeps working.
      if (!isSupabaseConfigured || !supabase || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
        setPreferences(prev => ({
          ...(prev || {}),
          user_id: prev?.user_id || user.id,
          ...newPreferences
        }))
        return
      }

      if (supabase) {
        const { data, error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            ...newPreferences,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
          .select()
          .single()

        if (error) throw error

        setPreferences(data)
        return data
      }
    } catch (error) {
      // Network / fetch errors are expected when Supabase is unreachable.
      // Keep the UI responsive and avoid throwing (which can cascade into repeated calls).
      console.error('Error saving preferences:', error)
      setPreferences(prev => ({
        ...(prev || {}),
        user_id: prev?.user_id || user.id,
        ...newPreferences
      }))
      return
    }
  }

  // Update a single preference
  const updatePreference = async (key, value) => {
    if (!user) {
      // If not logged in, just save to localStorage
      return
    }

    try {
      // Always update local state immediately so UI reflects change.
      setPreferences(prev => ({
        ...(prev || {}),
        user_id: prev?.user_id || user.id,
        [key]: value
      }))

      // If Supabase isn't ready/online, skip remote write.
      if (!isSupabaseConfigured || !supabase || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
        return
      }

      await saveUserPreferences({
        ...preferences,
        [key]: value
      })
    } catch (error) {
      console.error('Error updating preference:', error)
    }
  }

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      if (!isSupabaseConfigured || !supabase) {
        toast.error('Authentication is not configured')
        throw new Error('Supabase is not configured')
      }

      // Build the redirect URL - must include the full path
      const redirectUrl = `${window.location.origin}${window.location.pathname}`
      console.log('Redirect URL:', redirectUrl)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      })

      if (error) throw error

      // If we get a URL back, redirect to it
      if (data?.url) {
        window.location.href = data.url
      }

      return data
    } catch (error) {
      console.error('Error signing in with Google:', error)
      toast.error('Failed to sign in with Google')
      throw error
    }
  }

  // Sign up with email and password
  const signUpWithEmail = async (email, password, fullName, captchaToken) => {
    try {
      if (supabase) {
        const redirectUrl = `${window.location.origin}${window.location.pathname}`

        const signUpOptions = {
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName
            }
          }
        }
        // Only add captchaToken if it exists
        if (captchaToken) {
          signUpOptions.options.captchaToken = captchaToken
        }
        const { data, error } = await supabase.auth.signUp(signUpOptions)

        if (error) throw error

        // Check if email confirmation is required
        if (data?.user?.identities?.length === 0) {
          toast.info('This email is already registered. Please sign in instead.')
          return { needsSignIn: true }
        }

        if (data?.user && !data?.session) {
          toast.success('Check your email for a confirmation link!')
          return { needsConfirmation: true }
        }

        return data
      }
    } catch (error) {
      console.error('Error signing up:', error)
      if (error.message?.includes('already registered')) {
        toast.error('This email is already registered. Please sign in.')
      } else {
        toast.error(error.message || 'Failed to sign up')
      }
      throw error
    }
  }

  // Sign in with email and password
  const signInWithEmail = async (email, password, captchaToken) => {
    try {
      if (supabase) {
        const signInOptions = { email, password }
        // Only add captchaToken if it exists
        if (captchaToken) {
          signInOptions.options = { captchaToken }
        }
        const { data, error } = await supabase.auth.signInWithPassword(signInOptions)

        if (error) throw error
        return data
      }
    } catch (error) {
      console.error('Error signing in:', error)
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password')
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error('Please check your email and confirm your account first')
      } else {
        toast.error(error.message || 'Failed to sign in')
      }
      throw error
    }
  }

  // Reset password
  const resetPassword = async (email, captchaToken) => {
    try {
      if (supabase) {
        const redirectUrl = `${window.location.origin}${window.location.pathname}`

        const resetOptions = { redirectTo: redirectUrl }
        // Only add captchaToken if it exists
        if (captchaToken) {
          resetOptions.captchaToken = captchaToken
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, resetOptions)

        if (error) throw error
        toast.success('Password reset email sent! Check your inbox.')
        return true
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error(error.message || 'Failed to send reset email')
      throw error
    }
  }

  // Sign out - memoized to prevent stale references
  const signOut = useCallback(async () => {
    // Supabase can throw AuthSessionMissingError if the session is already gone.
    // We still want the UI to reliably log out in that case.
    try {
      // Always clear local UI state FIRST to ensure immediate logout
      setUser(null)
      setPreferences(null)
      welcomeToastShownRef.current = false

      if (supabase) {
        const { error } = await supabase.auth.signOut()
        if (error) {
          const msg = (error?.message || '').toLowerCase()
          if (!msg.includes('auth session missing') && !msg.includes('session not found') && !msg.includes('session_missing')) {
            console.error('Error signing out:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error signing out:', error)
      // Don't throw - we already cleared local state so user is logged out
    }
  }, [])

  // Memoize bypassAuth to prevent recreation on every render
  const bypassAuth = useCallback(async () => {
    try {
      setLoading(true)
      // 1. Try to sign in as the persistent God Mode user
      if (supabase) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: 'dev@datser.local',
          password: 'GodMode123!'
        })

        if (!signInError) {
          toast.success('Logged in as God Mode User')
          return
        }

        // 2. If sign in fails, try to create the account
        if (signInError.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: 'dev@datser.local',
            password: 'GodMode123!',
            options: {
              data: { full_name: 'God Mode User' }
            }
          })

          if (signUpError) throw signUpError
          toast.success('God Mode Account Created & Logged In')
        } else {
          throw signInError
        }
      }
    } catch (error) {
      console.error('God Mode Error:', error)
      toast.error('God Mode Failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({
    user,
    loading,
    preferences,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    resetPassword,
    signOut,
    saveUserPreferences,
    updatePreference,
    loadUserPreferences,
    bypassAuth,
    isAuthenticated: !!user
  }), [user, loading, preferences, signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword, signOut, saveUserPreferences, updatePreference, loadUserPreferences, bypassAuth])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
