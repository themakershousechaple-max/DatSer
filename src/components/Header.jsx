import React, { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Users, 
  BarChart3, 
  Download, 
  Shield, 
  Plus,
  Calendar,
  Moon,
  Sun,
  TrendingUp,
  Menu,
  Search,
  RefreshCw,
  X,
  Edit3
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useApp } from '../context/AppContext'

const Header = ({ currentView, setCurrentView, isAdmin, setIsAdmin, onAddMember, onCreateMonth }) => {
  const { isDarkMode, toggleTheme } = useTheme()
  const {
    searchTerm,
    setSearchTerm,
    refreshSearch,
    forceRefreshMembers,
    dashboardTab,
    setDashboardTab,
    filteredMembers,
    attendanceData,
    currentTable,
    isSupabaseConfigured,
    badgeFilter,
    toggleBadgeFilter
  } = useApp()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const mobileDropdownRef = useRef(null)
  // Badge filter moved to Edited page; header popup removed
  const drawerRef = useRef(null)
  // Close drawer with Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setShowDropdown(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  // Debounced search input for performance on low-end devices
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

  // Keep local input in sync when external searchTerm changes (e.g., clear/search from elsewhere)
  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  // Debounce updates to global search term to reduce re-renders during typing
  useEffect(() => {
    const tid = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        setSearchTerm(localSearchTerm)
      }
    }, 250)
    return () => clearTimeout(tid)
  }, [localSearchTerm])

  // Close dropdown when clicking outside (supports desktop and mobile dropdowns)
  useEffect(() => {
    const handleOutside = (event) => {
      const inDesktop = dropdownRef.current?.contains(event.target)
      const inMobile = mobileDropdownRef.current?.contains(event.target)
      const inDrawer = drawerRef.current?.contains(event.target)
      if (!inDesktop && !inMobile && !inDrawer) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [])

  // Compute compact summary count: respects search and dashboard tab (All/Edited)
  const compactFoundCount = useMemo(() => {
    try {
      if (!filteredMembers || filteredMembers.length === 0) return 0

      const hasSearch = !!(searchTerm && searchTerm.trim())
      if (hasSearch || dashboardTab === 'all') {
        return filteredMembers.length
      }

      // Edited tab: member has any attendance entry (present/absent) for current month dates
      const dateKeys = Object.keys(attendanceData || {})
      if (dateKeys.length === 0) return 0

      const isEditedMember = (member) => {
        for (const dk of dateKeys) {
          const map = attendanceData[dk] || {}
          const val = map[member.id]
          if (val === true || val === false) return true
        }
        return false
      }

      return filteredMembers.filter(isEditedMember).length
    } catch {
      return filteredMembers?.length ?? 0
    }
  }, [filteredMembers, dashboardTab, attendanceData, searchTerm])

  // Count of edited members (has attendance marked true/false for any date)
  const editedCount = useMemo(() => {
    try {
      if (!filteredMembers || filteredMembers.length === 0) return 0
      const dateKeys = Object.keys(attendanceData || {})
      if (dateKeys.length === 0) return 0
      let count = 0
      for (const member of filteredMembers) {
        let isEdited = false
        for (const dk of dateKeys) {
          const map = attendanceData[dk] || {}
          const val = map[member.id]
          if (val === true || val === false) { isEdited = true; break }
        }
        if (isEdited) count += 1
      }
      return count
    } catch {
      return 0
    }
  }, [filteredMembers, attendanceData])

  // Exclusive badge filter helper removed; inline badge chips now live on the Edited page
  
  const menuItems = [
    { id: 'all_members', label: 'All Members', icon: Users, onClick: () => { setCurrentView('dashboard'); setDashboardTab('all') } },
    { id: 'edited_members', label: `Edited Members (${editedCount})`, icon: Edit3, onClick: () => { setCurrentView('dashboard'); setDashboardTab('edited') } },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    // Action: Create new month goes into the menu
    { id: 'create_month', label: 'Create New Month', icon: Calendar, onClick: onCreateMonth }
  ]

  if (isAdmin) {
    menuItems.push(
      { id: 'export', label: 'Monthly Export', icon: Download },
      { id: 'admin', label: 'Admin', icon: Shield }
    )
  } else {
    menuItems.push({ id: 'admin', label: 'Login', icon: Shield })
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm md:border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50 w-full transition-colors duration-200 safe-area-top">
      <div className="mx-auto px-3 sm:px-4 py-0 md:py-1">
        <div className="flex items-center justify-center md:justify-between min-h-[32px] md:min-h-[44px]">
          {/* Compact brand label */}
          <div className="flex items-center">
            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Datsar</span>
          </div>

          {/* Center Area - Desktop: left segmented control, right menu & badges */}
          <div className="hidden md:flex items-center flex-1 justify-between mx-2 lg:mx-4">
            {/* Dashboard Button */}
            <div className="flex items-center gap-2 lg:gap-3">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center space-x-1.5 lg:space-x-2 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
              <span className="hidden lg:inline">Home</span>
              <span className="lg:hidden">Home</span>
              </button>

              {/* Segmented control removed; use Menu entries for All/Edited */}
            </div>

            {/* Right group: Menu only (badge filter moved to Edited page) */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Desktop Menu (icon-only on small screens, full name on large) */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center space-x-1.5 lg:space-x-2 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-300 dark:border-gray-600 ${
                    ['statistics', 'analytics', 'export', 'admin'].includes(currentView)
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-600'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800'
                  }`}
                  title="Menu"
                >
                  <Menu className="w-4 h-4" />
                  <span className="hidden lg:inline">Menu</span>
                </button>

                {/* Dropdown replaced by right-side drawer */}
              </div>
            </div>
          </div>



          {/* Right-side actions minimized (dark mode moved near summary pill) */}
          <div className="hidden md:flex items-center space-x-1 sm:space-x-2" />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pt-0 pb-1">
          <div className="flex items-center justify-between">
            {/* Left: Home */}
            <div className="flex items-center">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline sm:inline">Dashboard</span>
                <span className="xs:hidden">Home</span>
              </button>
            </div>

            {/* Right: Menu only (badge filter moved to Edited page) */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* Menu icon-only (chevron removed) */}
              <div className="relative" ref={mobileDropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-colors border border-gray-300 dark:border-gray-600 ${
                    ['statistics', 'analytics', 'export', 'admin'].includes(currentView)
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-600'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800'
                  }`}
                  title="Menu"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                {/* Mobile dropdown replaced by right-side drawer */}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Global sticky search bar (like Google) */}
      <div className="md:border-t border-gray-200 dark:border-gray-700">
        <div className="mx-auto px-3 sm:px-4 py-1 md:py-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search members by name..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setSearchTerm(localSearchTerm); refreshSearch() } }}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              />
              {(searchTerm || localSearchTerm) && (
                <button
                  onClick={() => { setSearchTerm(''); setLocalSearchTerm('') }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            {/* Add Member moved next to search bar */}
            <button
              onClick={onAddMember}
              className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center"
              title="Add member"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={forceRefreshMembers}
              className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center justify-center"
              title="Refresh member data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Summary pill with embedded Light/Dark toggle (single beautiful chip) */}
          {currentView === 'dashboard' && (
            <div className="mt-1">
              <div className="inline-flex items-center justify-between gap-2 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-[11px] leading-4 text-gray-700 dark:text-gray-300 shadow-sm">
                {/* Left: summary tokens */}
                <div className="flex items-center gap-1">
                  <span>{compactFoundCount} found</span>
                  <span className="text-gray-400">•</span>
                  <span>{currentTable ? currentTable.replace('_', ' ') : ''}</span>
                  <span className="text-gray-400">•</span>
                  <span>{isSupabaseConfigured() ? 'Live' : 'Demo'}</span>
                  <span className="hidden md:inline text-gray-400">•</span>
                  <span className="hidden md:inline">Member Dashboard</span>
                </div>
                {/* Right: segmented toggle */}
                <div className="inline-flex items-center overflow-hidden rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <button
                    onClick={() => { if (isDarkMode) toggleTheme() }}
                    className={`flex items-center gap-1 px-2 py-0.5 text-[10px] leading-4 ${!isDarkMode ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
                    title="Light mode"
                  >
                    <Sun className="w-3 h-3" />
                    <span className="hidden sm:inline">Light</span>
                  </button>
                  <button
                    onClick={() => { if (!isDarkMode) toggleTheme() }}
                    className={`flex items-center gap-1 px-2 py-0.5 text-[10px] leading-4 border-l border-gray-300 dark:border-gray-600 ${isDarkMode ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
                    title="Dark mode"
                  >
                    <Moon className="w-3 h-3" />
                    <span className="hidden sm:inline">Dark</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Right-side Drawer Menu */}
      {showDropdown && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowDropdown(false)}
          />
          <div ref={drawerRef} className="absolute right-0 top-0 z-10 h-full w-64 sm:w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Menu</span>
              <button
                onClick={() => setShowDropdown(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Close"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <div className="p-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const active = currentView === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick()
                      } else {
                        setCurrentView(item.id)
                      }
                      // Close drawer after action/navigation for better UX
                      setShowDropdown(false)
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1 ${
                      active
                        ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Badge filter popup removed; badge chips now render on the Edited page */}
    </header>
  )
}

export default Header