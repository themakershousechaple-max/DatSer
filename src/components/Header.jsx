import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Users,
  TrendingUp,
  Menu,
  X,
  CheckSquare,
  Calendar,
  ChevronDown,
  HelpCircle,
  Sparkles
} from 'lucide-react'
import DateSelector from './DateSelector'
import MonthPickerPopup from './MonthPickerPopup'
import { useApp } from '../context/AppContext'
import LoginButton from './LoginButton'

const Header = ({ currentView, setCurrentView, isAdmin, setIsAdmin, onAddMember, onCreateMonth, onToggleAIChat }) => {
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
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const dropdownRef = useRef(null)
  const mobileDropdownRef = useRef(null)
  const editedDropdownRef = useRef(null)
  const monthButtonRef = useRef(null)
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
      label: `Marked (${editedCount})`,
      icon: CheckSquare,
      onClick: () => { setCurrentView('dashboard'); setDashboardTab('edited') }
    },
    {
      id: 'duplicates',
      label: 'Duplicate Names',
      icon: Users,
      onClick: () => { setCurrentView('dashboard'); setDashboardTab('duplicates') }
    },
    {
      id: 'admin',
      label: 'Admin Panel',
      icon: TrendingUp,
      onClick: () => { setCurrentView('admin') }
    },
    // Action: Create new month goes into the menu
    {
      id: 'create_month',
      label: 'Create New Month',
      icon: Calendar,
      onClick: onCreateMonth
    },
    {
      id: 'ai_assistant',
      label: 'AI Assistant',
      icon: Sparkles,
      onClick: onToggleAIChat
    }
  ]

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

          {/* Center Area - Desktop Navigation */}
          <div className="hidden md:flex items-center flex-1 justify-between mx-2 lg:mx-4">
            {/* Left: Main Navigation Links */}
            <nav className="flex items-center gap-1">
              {/* Home/Dashboard */}
              <button
                onClick={() => { setCurrentView('dashboard'); setDashboardTab('all') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'dashboard' && dashboardTab === 'all'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <Users className="w-4 h-4" />
                <span>Members</span>
              </button>

              {/* Marked - Quick access */}
              <button
                onClick={() => { setCurrentView('dashboard'); setDashboardTab('edited') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'dashboard' && dashboardTab === 'edited'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Marked</span>
                {editedCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                    {editedCount}
                  </span>
                )}
              </button>

              {/* Admin Panel */}
              <button
                onClick={() => setCurrentView('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'admin'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Admin</span>
              </button>
            </nav>

            {/* Right: Help + Profile + Menu */}
            <div className="flex items-center gap-2">
              {/* Help Button */}
              <button
                onClick={() => setCurrentView('settings')}
                className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Help Center"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Profile/Login Button */}
              <LoginButton />

              {/* Menu Button (for more options) */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center gap-1.5 p-2 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-gray-600 ${showDropdown
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  title="More options"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-0">
          <div className="flex items-center justify-between">
            {/* Left: Logo/Home */}
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setDashboardTab('all');
              }}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'dashboard' && dashboardTab === 'all'
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <Users className="w-4 h-4" />
              <span>Members</span>
            </button>

            {/* Right: Profile + Menu */}
            <div className="flex items-center gap-2">
              {/* Profile/Login Button */}
              <LoginButton />

              {/* Menu Button */}
              <div className="relative" ref={mobileDropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`p-2 rounded-lg transition-colors border border-gray-200 dark:border-gray-600 ${showDropdown
                    ? 'bg-gray-100 dark:bg-gray-700'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  title="Menu"
                >
                  <Menu className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Summary pill - info bar */}
      {currentView === 'dashboard' && (
        <div className="md:border-t border-gray-200 dark:border-gray-700">
          <div className="mx-auto px-3 sm:px-4 py-1.5 md:py-1">
            <div className="flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-[11px] leading-4 text-gray-700 dark:text-gray-300 shadow-sm w-fit mx-auto">
              {selectedAttendanceDate && (
                <>
                  <span>{selectedAttendanceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className="text-gray-400">•</span>
                </>
              )}
              <span>{compactFoundCount} found</span>
              <span className="text-gray-400">•</span>
              <button
                ref={monthButtonRef}
                onClick={() => setShowMonthPicker(true)}
                className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {currentTable ? currentTable.replace('_', ' ') : 'Select Month'}
                <ChevronDown className="w-3 h-3" />
              </button>
              <span className="text-gray-400">•</span>
              <span className={isSupabaseConfigured() ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                {isSupabaseConfigured() ? 'Live' : 'Demo'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Month Picker Popup */}
      <MonthPickerPopup
        isOpen={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        anchorRef={monthButtonRef}
      />
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
                    {menuItems.filter(i => ['analytics', 'ai_assistant'].includes(i.id)).map((item) => {
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
