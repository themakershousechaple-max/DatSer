import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase, hasStoredSession } from '../lib/supabase'
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

  // Initialize auth state - optimized for speed
  useEffect(() => {
    let mounted = true

    // FAST PATH: Check localStorage synchronously first
    // If session already exists, mark welcome toast as shown (don't show on refresh)
    const hadExistingSession = hasStoredSession()
    if (hadExistingSession) {
      welcomeToastShownRef.current = true // Prevent welcome toast on page refresh
    }
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        // Check if there's a hash fragment with tokens (OAuth callback)
        if (window.location.hash && window.location.hash.includes('access_token')) {
          // Fresh login via OAuth - allow welcome toast
          welcomeToastShownRef.current = false
          // Let Supabase handle the hash - it will trigger onAuthStateChange
          const { data, error } = await supabase.auth.getSession()
          if (error) {
            console.error('Error processing OAuth callback:', error)
          }
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname)
          return
        }

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
      } catch (error) {
        console.error('Error getting session:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (!mounted) return

      // Update user state immediately
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Load preferences in background
        loadUserPreferencesBackground(session.user.id)
        // Show welcome toast only on fresh login (not refresh)
        if (!welcomeToastShownRef.current) {
          welcomeToastShownRef.current = true
          toast.success(`Welcome, ${session.user.user_metadata?.full_name || session.user.email}!`)
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
  }, [loadUserPreferencesBackground])

  // Load user preferences from database
  const loadUserPreferences = async (userId) => {
    try {
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
        // Apply preferences to localStorage for immediate use
        if (data.selected_month_table) {
          localStorage.setItem('selectedMonthTable', data.selected_month_table)
        }
        if (data.badge_filter) {
          localStorage.setItem('badgeFilter', JSON.stringify(data.badge_filter))
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
    } catch (error) {
      console.error('Error saving preferences:', error)
      throw error
    }
  }

  // Update a single preference
  const updatePreference = async (key, value) => {
    if (!user) {
      // If not logged in, just save to localStorage
      return
    }

    try {
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
      // Build the redirect URL - must include the full path
      const redirectUrl = `${window.location.origin}${window.location.pathname}`
      console.log('Redirect URL:', redirectUrl)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error signing in with Google:', error)
      toast.error('Failed to sign in with Google')
      throw error
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      // Save current preferences before signing out
      if (user && preferences) {
        const currentPrefs = {
          selected_month_table: localStorage.getItem('selectedMonthTable'),
          badge_filter: JSON.parse(localStorage.getItem('badgeFilter') || '[]'),
          dashboard_tab: 'all'
        }
        await saveUserPreferences(currentPrefs)
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
      throw error
    }
  }

  const value = {
    user,
    loading,
    preferences,
    signInWithGoogle,
    signOut,
    saveUserPreferences,
    updatePreference,
    loadUserPreferences,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
