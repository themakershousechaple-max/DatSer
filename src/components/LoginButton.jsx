import React, { useState, useEffect, useRef } from 'react'
import {
  LogIn,
  LogOut,
  User,
  ChevronDown,
  Moon,
  Sun,
  Settings,
  Building2,
  Download,
  Trash2,
  HelpCircle,
  Lock,
  Bell,
  Shield
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useApp } from '../context/AppContext'
import { toast } from 'react-toastify'

const LoginButton = () => {
  const { user, loading, signInWithGoogle, signOut, isAuthenticated, preferences } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const { members, currentTable } = useApp()
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    setShowDropdown(false)
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Export all data as CSV
  const handleExportData = () => {
    try {
      const csvHeaders = ['Full Name', 'Gender', 'Age', 'Phone Number', 'Current Level', 'Workspace', 'Table']
      const csvRows = members.map(member => [
        member['Full Name'] || member['full_name'] || '',
        member['Gender'] || member['gender'] || '',
        member['Age'] || member['age'] || '',
        member['Phone Number'] || member['phone_number'] || '',
        member['Current Level'] || member['current_level'] || '',
        member['workspace'] || '',
        currentTable
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `datsar_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Data exported successfully!')
      setShowDropdown(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    )
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
      >
        {isSigningIn ? (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="hidden sm:inline">Sign in</span>
          </>
        )}
      </button>
    )
  }

  // User is authenticated - show profile dropdown
  const userPhoto = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.identities?.[0]?.identity_data?.avatar_url || user?.identities?.[0]?.identity_data?.picture
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]
  const workspaceName = preferences?.workspace_name || 'My Workspace'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {userPhoto ? (
          <img
            src={userPhoto}
            alt={userName}
            className="w-8 h-8 rounded-full border-2 border-primary-500"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm">
            {userName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
        <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
          {userName}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Professional Profile Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          <div className="absolute right-0 mt-2 w-72 z-50 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">

            {/* User Profile Section */}
            <div className="px-4 py-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-750 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={userName}
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {userName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-primary-600 dark:text-primary-400 truncate mt-0.5">
                    {workspaceName}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Settings */}
            <div className="px-2 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Quick Settings
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => { toggleTheme(); }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="flex items-center gap-3">
                  {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <span>Dark Mode</span>
                </span>
                <div className={`w-9 h-5 rounded-full transition-colors ${isDarkMode ? 'bg-primary-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${isDarkMode ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>

            {/* Account Section */}
            <div className="px-2 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Account
              </div>

              {/* Workspace Settings */}
              <button
                onClick={() => {
                  setShowDropdown(false)
                  if (window.openWorkspaceSettings) window.openWorkspaceSettings()
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span>Workspace Settings</span>
              </button>

              {/* Export Data */}
              <button
                onClick={handleExportData}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export My Data</span>
              </button>

              {/* Security/Password - shows info for Google users */}
              <button
                onClick={() => {
                  setShowDropdown(false)
                  if (user?.app_metadata?.provider === 'google') {
                    toast.info('Your account is secured via Google. Manage it in your Google account settings.')
                  } else {
                    toast.info('Password reset: Go to login page → Forgot password')
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>Security</span>
              </button>
            </div>

            {/* Help & Support */}
            <div className="px-2 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Support
              </div>

              <button
                onClick={() => {
                  setShowDropdown(false)
                  toast.info('Need help? Contact the TMH Teen Ministry admin team.')
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help & Support</span>
              </button>
            </div>

            {/* Danger Zone */}
            <div className="px-2 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-400">
                Danger Zone
              </div>

              <button
                onClick={() => {
                  setShowDropdown(false)
                  if (window.openDeleteAccount) window.openDeleteAccount()
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            </div>

            {/* Sign Out */}
            <div className="px-2 py-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
              <p className="text-[10px] text-gray-400 text-center">
                Datsar v1.0 • TMH Teen Ministry
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LoginButton
