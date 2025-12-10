import React, { useState, useEffect, useRef, useMemo, startTransition } from 'react'
import {
  Users,
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
import DateSelector from './DateSelector'
import { useApp } from '../context/AppContext'

const Header = ({ currentView, setCurrentView, isAdmin, setIsAdmin, onAddMember, onCreateMonth }) => {
  const { isDarkMode, toggleTheme } = useTheme()
  const {
    searchTerm,
    setSearchTerm,
    refreshSearch,
    forceRefreshMembers,
    loading,
    dashboardTab,
    setDashboardTab,
    filteredMembers,
    attendanceData,
    currentTable,
    isSupabaseConfigured,
    badgeFilter,
    toggleBadgeFilter,
    selectedAttendanceDate,
    setAndSaveAttendanceDate,
    focusDateSelector
  } = useApp()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showEditedDropdown, setShowEditedDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const mobileDropdownRef = useRef(null)
  const editedDropdownRef = useRef(null)
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
      const inEdited = editedDropdownRef.current?.contains(event.target)
      if (!inDesktop && !inMobile && !inDrawer && !inEdited) {
        setShowDropdown(false)
        setShowEditedDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [])

  const generateSundayDates = (table) => {
    if (!table) return []
    try {
      const [monthName, yearStr] = table.split('_')
      const year = parseInt(yearStr)
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const idx = months.indexOf(monthName)
      if (idx === -1) return []
      const res = []
      const d = new Date(year, idx, 1)
      while (d.getDay() !== 0) d.setDate(d.getDate() + 1)
      while (d.getMonth() === idx) {
        res.push(d.toISOString().split('T')[0])
        d.setDate(d.getDate() + 7)
      }
      return res
    } catch {
      return []
    }
  }

  const sundayDates = generateSundayDates(currentTable)

  const isEditedMember = (member) => {
    for (const dk of sundayDates) {
      const map = attendanceData[dk] || {}
      const val = map[member.id]
      if (val === true || val === false) return true
    }
    return false
  }

  const perDayCounts = useMemo(() => {
    const base = dashboardTab === 'edited' ? filteredMembers.filter(isEditedMember) : filteredMembers
    const acc = {}
    for (const dateStr of sundayDates) {
      const map = attendanceData[dateStr] || {}
      let p = 0
      for (const m of base) {
        const v = map[m.id]
        if (v === true) p += 1
      }
      acc[dateStr] = p
    }
    return acc
  }, [filteredMembers, attendanceData, sundayDates, dashboardTab])

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
    {
      id: 'edited_members',
      label: `Edited Members (${editedCount})`,
      icon: Edit3,
      onClick: () => { startTransition(() => { setCurrentView('dashboard'); setDashboardTab('edited') }) }
    },
    {
      id: 'duplicates',
      label: 'Duplicate Names',
      icon: Users,
      onClick: () => { startTransition(() => { setCurrentView('dashboard'); setDashboardTab('duplicates') }) }
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      onClick: () => { startTransition(() => { setCurrentView('analytics') }) }
    },
    // Action: Create new month goes into the menu
    {
      id: 'create_month',
      label: 'Create New Month',
      icon: Calendar,
      onClick: onCreateMonth
    }
  ]

  if (isAdmin) {
    menuItems.push({
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      onClick: () => { startTransition(() => { setCurrentView('admin') }) }
    })
  } else {
    menuItems.push({
      id: 'admin',
      label: 'Login',
      icon: Shield,
      onClick: () => { startTransition(() => { setCurrentView('admin') }) }
    })
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm md:border-b border-gray-200 dark:border-gray-700 z-50 w-full safe-area-top fixed top-0 left-0 right-0">
      <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-0 md:py-1 w-full">
        <div className="flex items-center justify-center md:justify-between min-h-[36px] md:min-h-[44px]">
          {/* Compact brand label */}
          <div className="flex items-center">
            <button
              onClick={() => { setCurrentView('dashboard'); setDashboardTab('all') }}
              className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white hover:underline"
              title="Go to Dashboard"
            >
              Datsar
            </button>
          </div>

          {/* Center Area - Desktop: left segmented control, right menu & badges */}
          <div className="hidden md:flex items-center flex-1 justify-between mx-2 lg:mx-4">
            {/* Dashboard Button */}
            <div className="flex items-center gap-1 lg:gap-2">
              <button
                onClick={() => { setCurrentView('dashboard'); setDashboardTab('all') }}
                className={`flex items-center space-x-0.5 px-2 lg:px-2 py-1 rounded-lg text-sm font-medium transition-colors ${currentView === 'dashboard' && dashboardTab === 'all'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-700 dark:text-gray-300">
                  <Users className="w-4 h-4" />
                </span>
                <span className="hidden lg:inline">Home</span>
                <span className="lg:hidden">Home</span>
              </button>
              {/* Desktop-only quick nav */}
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => { startTransition(() => { setCurrentView('dashboard'); setDashboardTab('edited') }) }}
                  className={`flex items-center space-x-0.5 px-3 lg:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'dashboard' && dashboardTab === 'edited'
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <span>Edited</span>
                </button>
                <button
                  onClick={() => { startTransition(() => { setCurrentView('dashboard'); setDashboardTab('duplicates') }) }}
                  className={`flex items-center space-x-0.5 px-3 lg:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'dashboard' && dashboardTab === 'duplicates'
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <span>Duplicates</span>
                </button>
                <button
                  onClick={() => startTransition(() => setCurrentView('analytics'))}
                  className={`flex items-center space-x-0.5 px-3 lg:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'analytics'
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <span>Analytics</span>
                </button>
                <button
                  onClick={() => startTransition(() => setCurrentView('admin'))}
                  className={`flex items-center space-x-0.5 px-3 lg:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'admin'
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Right group: Refresh + Add member + Menu (badge filter moved to Edited page) */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Refresh */}
              <button
                onClick={() => { forceRefreshMembers() }}
                className="flex items-center space-x-0.5 px-2 lg:px-2 py-1 rounded-lg text-sm font-medium transition-colors border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Refresh members"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md text-blue-700 dark:text-blue-300 transition-colors md:text-gray-700 md:dark:text-gray-300 hover:md:bg-gray-100 hover:md:dark:bg-gray-700">
                  <RefreshCw className="w-4 h-4" />
                </span>
                <span className="hidden lg:inline">Refresh</span>
              </button>

              {/* Add New Member (moved to the right of Refresh) */}
              <button
                onClick={() => { if (onAddMember) onAddMember(); }}
                className="flex items-center space-x-0.5 px-2 lg:px-2 py-1 rounded-lg text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                title="Add New Member"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md text-blue-700 dark:text-blue-300 transition-colors md:text-gray-700 md:dark:text-gray-300 hover:md:bg-gray-100 hover:md:dark:bg-gray-700">
                  <Plus className="w-4 h-4" />
                </span>
                <span className="hidden lg:inline">Add Member</span>
              </button>

              {/* Desktop Menu (icon-only on small screens, full name on large) */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center space-x-0.5 px-2 lg:px-2 py-1 rounded-lg text-sm font-medium transition-colors border border-gray-300 dark:border-gray-600 ${['analytics', 'export', 'admin'].includes(currentView)
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-600'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800'
                    }`}
                  title="Menu"
                >
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-transparent text-gray-700 dark:text-gray-300">
                    <Menu className="w-4 h-4" />
                  </span>
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
        <div className="md:hidden py-0">
          <div className="flex items-center justify-between">
            {/* Left: Home */}
            <div className="flex items-center">
              <button
                onClick={() => {
                  setCurrentView('dashboard');
                  setDashboardTab('all');
                  // Clear any search or filters when going home
                  setSearchTerm('');
                  setGenderFilter(null);
                  setSelectedMemberIds(new Set());
                  setSelectedDuplicateIds(new Set());
                }}
                className={`flex items-center space-x-1 pl-2 pr-3 lg:px-2 py-1 rounded-lg text-xs font-medium transition-colors ${currentView === 'dashboard' && dashboardTab === 'all'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                title="Go to Home Dashboard"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-700 dark:text-gray-300">
                  <Users className="w-4 h-4" />
                </span>
                <span className="hidden xs:inline sm:inline">Dashboard</span>
                <span className="xs:hidden">Home</span>
              </button>
            </div>

            {/* Right: Menu and actions (mobile) */}
            <div className="flex items-center gap-2">
              {/* Refresh (mobile, match desktop shape) */}
              <button
                onClick={() => { forceRefreshMembers() }}
                className="flex items-center space-x-0.5 px-2 lg:px-2 py-1 rounded-lg text-sm font-medium transition-colors border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Refresh"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md text-blue-700 dark:text-blue-300 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </span>
              </button>

              {/* Add Member (mobile, match desktop shape) */}
              <button
                onClick={() => { if (onAddMember) onAddMember(); }}
                className="flex items-center space-x-0.5 px-2 lg:px-2 py-1 rounded-lg text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                title="Add Member"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md text-blue-100 dark:text-blue-100 transition-colors">
                  <Plus className="w-4 h-4" />
                </span>
              </button>

              {/* Menu icon-only (match desktop square shape) */}
              <div className="relative" ref={mobileDropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center space-x-0.5 px-2 lg:px-2 py-1 rounded-lg text-sm font-medium transition-colors border border-gray-300 dark:border-gray-600 ${['analytics', 'export', 'admin'].includes(currentView)
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-600'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800'
                    }`}
                  title="Menu"
                >
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-transparent text-gray-700 dark:text-gray-300">
                    <Menu className="w-4 h-4" />
                  </span>
                </button>
                {/* Mobile dropdown replaced by right-side drawer */}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Summary pill with embedded Light/Dark toggle at top (single beautiful chip) */}
      {currentView === 'dashboard' && (
        <div className="md:border-t border-gray-200 dark:border-gray-700">
          <div className="mx-auto px-3 sm:px-4 py-1.5 md:py-1">
            <div className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-[11px] leading-4 text-gray-700 dark:text-gray-300 shadow-sm w-full max-w-4xl mx-auto">
              {/* Left: summary tokens */}
              <div className="flex items-center gap-1 flex-1 min-w-0">
                {selectedAttendanceDate && (
                  <>
                    <span>{selectedAttendanceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="text-gray-400">•</span>
                  </>
                )}
                <span>{compactFoundCount} found</span>
                <span className="text-gray-400">•</span>
                <span>{currentTable ? currentTable.replace('_', ' ') : ''}</span>
                <span className="text-gray-400">•</span>
                <span>{isSupabaseConfigured() ? 'Live' : 'Demo'}</span>
                <span className="hidden md:inline text-gray-400">•</span>
                <span className="hidden md:inline">Member Dashboard</span>
              </div>
              {/* Right: segmented toggle */}
              <div className="inline-flex items-center overflow-hidden rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex-shrink-0">
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
        </div>
      )}
      {/* Right-side Drawer Menu */}
      {showDropdown && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all"
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
            <div className="p-2" ref={editedDropdownRef}>
              <DateSelector variant="menu" />
              <div className="space-y-3">
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Views</div>
                  <div className="space-y-2">
                    {menuItems.filter(i => ['all_members', 'edited_members', 'duplicates'].includes(i.id)).map((item) => {
                      const Icon = item.icon
                      let active = false
                      if (item.id === 'all_members') {
                        active = currentView === 'dashboard' && dashboardTab === 'all'
                      } else if (item.id === 'edited_members') {
                        active = currentView === 'dashboard' && dashboardTab === 'edited'
                      } else if (item.id === 'duplicates') {
                        active = currentView === 'dashboard' && dashboardTab === 'duplicates'
                      }
                      return (
                        <div key={item.id}>
                          <button
                            onClick={() => { if (item.onClick) item.onClick(); else setCurrentView(item.id); setShowDropdown(false) }}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                          >
                            <span className="flex items-center gap-2"><Icon className="w-4 h-4" /><span>{item.label}</span></span>
                            {item.id === 'edited_members' && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); setShowEditedDropdown((prev) => !prev) }} className="px-2 py-0.5 rounded-full text-xs bg-blue-600 text-white" title="View Sunday counts">{editedCount}</button>
                            )}
                          </button>
                          {item.id === 'edited_members' && showEditedDropdown && (
                            <div className="mt-1 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-2">
                              {sundayDates.length === 0 ? (
                                <div className="text-xs text-gray-600 dark:text-gray-300">No Sundays</div>
                              ) : (
                                sundayDates.map((d) => {
                                  const label = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                  const count = perDayCounts[d] || 0
                                  const selected = selectedAttendanceDate && d === selectedAttendanceDate.toISOString().split('T')[0]
                                  return (
                                    <button key={d} onClick={() => { setAndSaveAttendanceDate(new Date(d)) }} className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs ${selected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                      <span>{label}</span>
                                      <span className={`${selected ? 'px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300' : 'px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>{count}</span>
                                    </button>
                                  )
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Insights</div>
                  <div className="space-y-2">
                    {menuItems.filter(i => ['analytics'].includes(i.id)).map((item) => {
                      const Icon = item.icon
                      const active = currentView === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => { if (item.onClick) item.onClick(); else setCurrentView(item.id); setShowDropdown(false) }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                        >
                          <span className="flex items-center gap-2"><Icon className="w-4 h-4" /><span>{item.label}</span></span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Actions</div>
                  <div className="space-y-2">
                    {menuItems.filter(i => ['create_month', 'export'].includes(i.id)).map((item) => {
                      const Icon = item.icon
                      const active = currentView === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => { if (item.onClick) item.onClick(); else setCurrentView(item.id); setShowDropdown(false) }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                        >
                          <span className="flex items-center gap-2"><Icon className="w-4 h-4" /><span>{item.label}</span></span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Access</div>
                  <div className="space-y-2">
                    {menuItems.filter(i => ['admin'].includes(i.id)).map((item) => {
                      const Icon = item.icon
                      const active = currentView === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => { if (item.onClick) item.onClick(); else setCurrentView(item.id); setShowDropdown(false) }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                        >
                          <span className="flex items-center gap-2"><Icon className="w-4 h-4" /><span>{item.label}</span></span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badge filter popup removed; badge chips now render on the Edited page */}
    </header>
  )
}

export default Header
