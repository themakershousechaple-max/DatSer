import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  return context
}

export const ThemeProvider = ({ children }) => {
  const { user, updatePreference, preferences } = useAuth()

  const [themeMode, setThemeMode] = useState(() => {
    return preferences?.theme_mode || localStorage.getItem('themeMode') || 'system'
  })

  const [systemTheme, setSystemTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )

  const [fontSize, setFontSize] = useState(() => {
    return preferences?.font_size || localStorage.getItem('fontSize') || '16'
  })

  const [fontFamily, setFontFamily] = useState(() => {
    return preferences?.font_family || localStorage.getItem('fontFamily') || 'Inter'
  })

  // Track if we've loaded initial prefs to avoid overwriting local changes later
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)

  // 1. One-way Sync: Only load preferences ONCE when they become available
  useEffect(() => {
    if (preferences && !preferencesLoaded && user) {
      if (preferences.theme_mode) setThemeMode(preferences.theme_mode)
      if (preferences.font_size) setFontSize(preferences.font_size)
      if (preferences.font_family) setFontFamily(preferences.font_family)
      setPreferencesLoaded(true)
    }
  }, [preferences, preferencesLoaded, user])

  // Reset to defaults when user logs out
  useEffect(() => {
    if (!user) {
      setThemeMode('system')
      setFontSize('16')
      setFontFamily('Inter')
      setPreferencesLoaded(false)

      localStorage.removeItem('themeMode')
      localStorage.removeItem('fontSize')
      localStorage.removeItem('fontFamily')
      localStorage.removeItem('theme')
    }
  }, [user])

  // System Theme Listener
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e) => setSystemTheme(e.matches ? 'dark' : 'light')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  const resolvedTheme = themeMode === 'system' ? systemTheme : themeMode
  const isDarkMode = resolvedTheme === 'dark'

  // Ref to track first render to avoid saving defaults
  const isFirstRender = React.useRef(true)
  useEffect(() => { isFirstRender.current = false }, [])

  // --- APPLICATION EFFECTS (DOM & LS) ---

  // Apply Theme to DOM
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode)
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
  }, [themeMode, isDarkMode])

  // Apply Font Size to DOM
  useEffect(() => {
    localStorage.setItem('fontSize', fontSize)
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`)
  }, [fontSize])

  // Apply Font Family to DOM
  useEffect(() => {
    localStorage.setItem('fontFamily', fontFamily)
    document.documentElement.style.setProperty('--font-family', fontFamily)
  }, [fontFamily])


  // --- SAVE TO BACKEND EFFECTS (Debounced/Conditional) ---

  // Save Theme Mode (Immediate but guarded)
  useEffect(() => {
    if (isFirstRender.current || !updatePreference || !user || !preferencesLoaded) return
    updatePreference('theme_mode', themeMode)
  }, [themeMode, updatePreference, user, preferencesLoaded])

  // Save Font Size (Debounced 800ms)
  useEffect(() => {
    if (isFirstRender.current || !updatePreference || !user || !preferencesLoaded) return

    const timer = setTimeout(() => {
      updatePreference('font_size', fontSize)
    }, 800)

    return () => clearTimeout(timer)
  }, [fontSize, updatePreference, user, preferencesLoaded])

  // Save Font Family (Immediate)
  useEffect(() => {
    if (isFirstRender.current || !updatePreference || !user || !preferencesLoaded) return
    updatePreference('font_family', fontFamily)
  }, [fontFamily, updatePreference, user, preferencesLoaded])

  const toggleTheme = () => {
    // Simple toggle overrides system preference
    setThemeMode((prev) => {
      // If currently dark (resolved), go to light. Else dark.
      return isDarkMode ? 'light' : 'dark'
    })
  }

  const value = {
    isDarkMode,
    toggleTheme,
    themeMode,
    setThemeMode,
    theme: resolvedTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}