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
  Filter,
  Award,
  Star,
  UserCheck,
  Check,
  X
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
  const [isBadgePopupOpen, setIsBadgePopupOpen] = useState(false)

  // Close dropdown when clicking outside (supports desktop and mobile dropdowns)
  useEffect(() => {
    const handleOutside = (event) => {
      const inDesktop = dropdownRef.current?.contains(event.target)
      const inMobile = mobileDropdownRef.current?.contains(event.target)
      if (!inDesktop && !inMobile) {
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

  // Exclusive badge filter helper (replicates Dashboard behavior)
  const setExclusiveBadgeFilter = (badgeKey) => {
    const isOnlyThis = badgeFilter.length === 1 && badgeFilter[0] === badgeKey
    if (isOnlyThis) {
      toggleBadgeFilter(badgeKey)
      return
    }
    if (!badgeFilter.includes(badgeKey)) toggleBadgeFilter(badgeKey)
    badgeFilter.forEach(b => { if (b !== badgeKey) toggleBadgeFilter(b) })
  }
  
  const menuItems = [
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
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
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors duration-200 safe-area-top">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between min-h-[60px] sm:min-h-[64px]">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white leading-tight">Datsar</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-tight truncate">Data Search Hub</p>
            </div>
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

              {currentView === 'dashboard' && (
                <div className="inline-flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                  <button
                    onClick={() => setDashboardTab('all')}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      dashboardTab === 'all'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                    title="Show All Members"
                  >
                    All
                  </button>
                  <button
                    onClick={() => setDashboardTab('edited')}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-300 dark:border-gray-600 ${
                      dashboardTab === 'edited'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                    title="Show Edited Members"
                  >
                    Edited
                  </button>
                </div>
              )}
            </div>

            {/* Right group: Filter by Badge then far-right Menu */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Desktop: Filter by Badge (shows full name on large screens) */}
              <button
                onClick={() => setIsBadgePopupOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Filter by Badge"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden lg:inline">Filter by Badge</span>
              </button>

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

                {/* Dropdown Menu */}
                {showDropdown && (
                <div className="absolute right-0 mt-1 w-44 lg:w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentView(item.id)
                          setShowDropdown(false)
                        }}
                        className={`w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors text-left ${
                          currentView === item.id
                            ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
                )}
              </div>
            </div>
          </div>



          {/* Action Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            
            <button
              onClick={onAddMember}
              className="flex items-center space-x-1 sm:space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add Member</span>
            </button>
            <button
              onClick={onCreateMonth}
              className="flex items-center space-x-1 sm:space-x-2 bg-green-600 hover:bg-green-700 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              title="Create New Month"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden lg:inline">New Month</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-1.5 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center space-x-1.5 sm:space-x-2">
            {/* Home */}
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

            {/* Segmented control: All / Edited */}
            {currentView === 'dashboard' && (
              <div className="inline-flex items-center gap-1.5 sm:gap-2">
                <div className="inline-flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                  <button
                    onClick={() => setDashboardTab('all')}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                      dashboardTab === 'all'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                    title="Show All Members"
                  >
                    All
                  </button>
                  <button
                    onClick={() => setDashboardTab('edited')}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors border-l border-gray-300 dark:border-gray-600 ${
                      dashboardTab === 'edited'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                    title="Show Edited Members"
                  >
                    Edited
                  </button>
                </div>
              </div>
            )}

            {/* Filter by Badge */}
            {currentView === 'dashboard' && (
              <button
                onClick={() => setIsBadgePopupOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-2 rounded-lg text-xs font-medium transition-colors border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Filter by Badge"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden xs:inline">Badges</span>
              </button>
            )}

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

              {/* Mobile Dropdown Menu */}
              {showDropdown && (
                <div className="absolute left-1/2 transform -translate-x-1/2 mt-1 w-40 sm:w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentView(item.id)
                          setShowDropdown(false)
                        }}
                        className={`w-full flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm font-medium transition-colors text-left ${
                          currentView === item.id
                            ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Global sticky search bar (like Google) */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search members by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') refreshSearch() }}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <button
              onClick={forceRefreshMembers}
              className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center justify-center"
              title="Refresh member data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Tiny, sticky summary pill under the search bar (all screens) */}
          {currentView === 'dashboard' && (
            <div className="mt-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] leading-4 text-gray-700 dark:text-gray-300">
                <span>{compactFoundCount} found</span>
                <span className="text-gray-400">•</span>
                <span>{currentTable ? currentTable.replace('_', ' ') : ''}</span>
                <span className="text-gray-400">•</span>
                <span>{isSupabaseConfigured() ? 'Live' : 'Demo'}</span>
                <span className="text-gray-400">•</span>
                <span>Member Dashboard</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Badge Filter Popup (Header) */}
      {isBadgePopupOpen && currentView === 'dashboard' && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setIsBadgePopupOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-600 shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Filter by Badge</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">(Select multiple)</span>
              </div>
              <button
                onClick={() => setIsBadgePopupOpen(false)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badge multi-select */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { key: 'member', label: 'Member Badge', icon: Award },
                { key: 'regular', label: 'Regular', icon: UserCheck },
                { key: 'newcomer', label: 'Newcomer', icon: Star }
              ].map(({ key, label, icon: Icon }) => {
                const isSelected = badgeFilter.includes(key)
                return (
                  <button
                    key={key}
                    onClick={() => toggleBadgeFilter(key)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary-600 dark:bg-primary-700 text-white shadow ring-2 ring-primary-300 dark:ring-primary-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                    }`}
                    title={isSelected ? `Remove ${label} filter` : `Add ${label} filter`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {isSelected && <Check className="w-4 h-4 ml-1 bg-white text-primary-600 rounded-full" />}
                  </button>
                )
              })}
            </div>

            {/* Multi-select controls */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => {
                  const allBadges = ['member', 'regular', 'newcomer']
                  allBadges.forEach(badge => { if (!badgeFilter.includes(badge)) toggleBadgeFilter(badge) })
                }}
                className="px-2 py-1 text-xs text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors border border-primary-200 dark:border-primary-700"
                title="Select all badge filters"
              >
                All
              </button>
              <button
                onClick={() => { badgeFilter.forEach(badge => toggleBadgeFilter(badge)) }}
                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors border border-gray-300 dark:border-gray-600"
                title="Clear all badge filters"
              >
                Clear
              </button>
            </div>

            {/* Badge Types Reference (tap to quick filter) */}
            <div className="space-y-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">Badge Types Reference:</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'member', label: 'Member', icon: Award, color: 'blue' },
                  { key: 'regular', label: 'Regular', icon: UserCheck, color: 'green' },
                  { key: 'newcomer', label: 'Newcomer', icon: Star, color: 'yellow' }
                ].map(({ key, label, icon: Icon, color }) => {
                  const isActive = badgeFilter.length === 1 && badgeFilter[0] === key
                  return (
                    <button
                      key={key}
                      onClick={() => setExclusiveBadgeFilter(key)}
                      title={isActive ? `Show all members (clear ${label})` : `Show only ${label} members`}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium opacity-80 cursor-pointer transition-all ${
                        color === 'blue'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : color === 'green'
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                      } ${isActive ? 'ring-2 ring-primary-400 dark:ring-primary-500 shadow-sm' : ''}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                      {isActive && <Check className="w-3 h-3 ml-1" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header