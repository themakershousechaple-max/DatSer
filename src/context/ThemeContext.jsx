import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  return context
}

export const ThemeProvider = ({ children }) => {
  const { user, saveUserPreferences, preferences } = useAuth()
  
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

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e) => setSystemTheme(e.matches ? 'dark' : 'light')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  const resolvedTheme = themeMode === 'system' ? systemTheme : themeMode
  const isDarkMode = resolvedTheme === 'dark'

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode)

    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Also update legacy key for other tabs/compatibility
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
  }, [themeMode, isDarkMode])

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize)
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`)
    
    // Save to backend if user is logged in
    if (user && saveUserPreferences) {
      saveUserPreferences({ font_size: fontSize }).catch(console.error)
    }
  }, [fontSize, user, saveUserPreferences])

  useEffect(() => {
    localStorage.setItem('fontFamily', fontFamily)
    document.documentElement.style.setProperty('--font-family', fontFamily)
    
    // Save to backend if user is logged in
    if (user && saveUserPreferences) {
      saveUserPreferences({ font_family: fontFamily }).catch(console.error)
    }
  }, [fontFamily, user, saveUserPreferences])

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