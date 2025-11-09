import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { Search, Users, Filter, Edit3, Trash2, Calendar, ChevronDown, ChevronUp, ChevronRight, UserPlus, Award, Star, UserCheck, Check, RefreshCw, X } from 'lucide-react'
import EditMemberModal from './EditMemberModal'
import MemberModal from './MemberModal'
import MonthModal from './MonthModal'
import DateSelector from './DateSelector'
import { toast } from 'react-toastify'

// Helper function to get month display name from table name
const getMonthDisplayName = (tableName) => {
  // Convert table name like "October_2025" to "October 2025"
  return tableName.replace('_', ' ')
}

const Dashboard = ({ isAdmin = false }) => {
  const { 
    filteredMembers, 
    loading, 
    searchTerm, 
    setSearchTerm, 
    refreshSearch,
    forceRefreshMembers,
    forceRefreshMembersSilent,
    searchMemberAcrossAllTables,
    deleteMember, 
    markAttendance, 
    bulkAttendance,
    fetchAttendanceForDate,
    attendanceData,
    setAttendanceData,
    currentTable,
    members,
    calculateMemberBadge,

    toggleMemberBadge,
    memberHasBadge,
    updateMemberBadges,
    selectedAttendanceDate,
    badgeFilter,
    toggleBadgeFilter,
    isSupabaseConfigured
  } = useApp()
  const { isDarkMode } = useTheme()
  const [editingMember, setEditingMember] = useState(null)
  const [attendanceLoading, setAttendanceLoading] = useState({})
  const [expandedMembers, setExpandedMembers] = useState({})
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showMonthModal, setShowMonthModal] = useState(false)
  
  // Pagination state
  const [displayLimit, setDisplayLimit] = useState(20) // Initial display limit
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // Badge management state
  const [isUpdatingBadges, setIsUpdatingBadges] = useState(false)
  const [badgeAssignmentLoading, setBadgeAssignmentLoading] = useState({})
  
  // Tab state for showing all members vs edited members
  const [activeTab, setActiveTab] = useState('all') // 'all' or 'edited'
  const [isBadgeDropdownOpen, setIsBadgeDropdownOpen] = useState(false)
  const [selectedSundayDate, setSelectedSundayDate] = useState(null)
  const [isSundayPopupOpen, setIsSundayPopupOpen] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // iOS detection (used for minor tweaks if needed)
  const searchInputRef = useRef(null)
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isStandalone = typeof window !== 'undefined' && ((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone === true))

  // Multi-select state (members + Sundays)
  const [selectedMemberIds, setSelectedMemberIds] = useState(new Set())
  const [selectedBulkSundayDates, setSelectedBulkSundayDates] = useState(new Set())
  const [isBulkApplying, setIsBulkApplying] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Quick filter: set badge filter exclusively to the given key
  const setExclusiveBadgeFilter = (badgeKey) => {
    const allBadges = ['member', 'regular', 'newcomer']
    const isOnlyThis = badgeFilter.length === 1 && badgeFilter[0] === badgeKey
    if (isOnlyThis) {
      // Clear filter if the same quick filter is tapped again
      toggleBadgeFilter(badgeKey)
      return
    }
    // Ensure only the chosen badge is selected
    allBadges.forEach((badge) => {
      const included = badgeFilter.includes(badge)
      if (badge === badgeKey) {
        if (!included) toggleBadgeFilter(badge)
      } else {
        if (included) toggleBadgeFilter(badge)
      }
    })
  }

  // Helper function to generate Sunday dates for the current month/year
  const generateSundayDates = (currentTable) => {
    if (!currentTable) return []
    
    try {
      const [monthName, year] = currentTable.split('_')
      const yearNum = parseInt(year)
      
      const monthIndex = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ].indexOf(monthName)
      
      if (monthIndex === -1) return []
      
      const sundays = []
      const date = new Date(yearNum, monthIndex, 1)
      
      // Find the first Sunday of the month
      while (date.getDay() !== 0) {
        date.setDate(date.getDate() + 1)
      }
      
      // Collect all Sundays in the month
      while (date.getMonth() === monthIndex) {
        sundays.push(date.toISOString().split('T')[0]) // Format as YYYY-MM-DD
        date.setDate(date.getDate() + 7)
      }
      
      return sundays
    } catch (error) {
      console.error('Error generating Sunday dates:', error)
      return []
    }
  }

  // Generate Sunday dates dynamically based on current table
  const sundayDates = generateSundayDates(currentTable)

  // Aggregated counts across selected or all Sundays for Edited Members
  const selectedDatesForCounting = selectedBulkSundayDates && selectedBulkSundayDates.size > 0
    ? selectedBulkSundayDates
    : new Set(sundayDates)

  // Function to check if a member has been edited (has attendance marked for any date)
  const isEditedMember = (member) => {
    return sundayDates.some(date => {
      const dateKey = date
      const dateAttendance = attendanceData[dateKey] || {}
      return dateAttendance[member.id] === true || dateAttendance[member.id] === false
    })
  }

  // Get filtered members based on active tab
  const getTabFilteredMembers = () => {
    const badgeFilteredMembers = getFilteredMembersByBadge()

    // When searching, ignore tab filters and show all matching results
    if (searchTerm && searchTerm.trim()) {
      return badgeFilteredMembers
    }

    if (activeTab === 'edited') {
      return badgeFilteredMembers.filter(member => isEditedMember(member))
    }

    return badgeFilteredMembers
  }

  // Aggregated counts across selected/all Sundays for members in current view
  const { presentCount, absentCount } = useMemo(() => {
    const membersBase = activeTab === 'edited' 
      ? members.filter(isEditedMember)
      : members
    let present = 0
    let absent = 0
    selectedDatesForCounting.forEach((dateKey) => {
      const map = attendanceData[dateKey] || {}
      for (const m of membersBase) {
        const val = map[m.id]
        if (val === true) present += 1
        else if (val === false) absent += 1
      }
    })
    return { presentCount: present, absentCount: absent }
  }, [attendanceData, selectedBulkSundayDates, currentTable, activeTab, members])

  // Per-Sunday counts for Edited Members (used in chips)
  const perDayCounts = useMemo(() => {
    const editedMembers = members.filter(isEditedMember)
    const acc = {}
    for (const dateStr of sundayDates) {
      const map = attendanceData[dateStr] || {}
      let p = 0
      let a = 0
      for (const m of editedMembers) {
        const val = map[m.id]
        if (val === true) p += 1
        else if (val === false) a += 1
      }
      acc[dateStr] = { present: p, absent: a }
    }
    return acc
  }, [attendanceData, members, sundayDates])

  // Fetch attendance when date changes
  useEffect(() => {
    if (selectedAttendanceDate) {
      fetchAttendanceForDate(new Date(selectedAttendanceDate))
    }
  }, [selectedAttendanceDate, fetchAttendanceForDate])

  // Fetch attendance for all Sunday dates
  useEffect(() => {
    // When viewing Edited Members, ensure Sunday attendance maps are available
    if (activeTab !== 'edited') return
    let isCancelled = false
    const load = async () => {
      for (const date of sundayDates) {
        const map = await fetchAttendanceForDate(new Date(date))
        if (isCancelled) return
        if (map && Object.keys(map).length > 0) {
          setAttendanceData(prev => ({
            ...prev,
            [date]: { ...(prev[date] || {}), ...map }
          }))
        }
      }
    }
    load()
    return () => { isCancelled = true }
  }, [activeTab, currentTable])

  // Reset selected Sunday when month changes
  useEffect(() => {
    setSelectedSundayDate(null)
  }, [currentTable])

  // Clear selections when month changes
  useEffect(() => {
    setSelectedMemberIds(new Set())
    setSelectedBulkSundayDates(new Set())
  }, [currentTable])

  // Clear multi-select when leaving Edited Members tab
  useEffect(() => {
    if (activeTab !== 'edited') {
      setSelectedMemberIds(new Set())
      setSelectedBulkSundayDates(new Set())
    }
  }, [activeTab])

  // Reset pagination when search term changes
  useEffect(() => {
    if (searchTerm) {
      // When searching, we show all results, so no need for pagination
    } else {
      // When search is cleared, reset to initial display limit
      setDisplayLimit(20)
    }
  }, [searchTerm])

  const handleDelete = async (event, member) => {
    // Prevent row-level click handlers from firing on mobile tap
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
    if (window.confirm(`Are you sure you want to delete ${member['full_name'] || member['Full Name']}?`)) {
      try {
        await deleteMember(member.id)
        // Show success toast (would be implemented with react-toastify)
      } catch (error) {
        console.error('Error deleting member:', error)
      }
    }
  }

  const handleAttendance = async (memberId, present) => {
    // If no specific attendance date is selected, apply the action across ALL Sundays
    if (!selectedAttendanceDate) {
      setAttendanceLoading(prev => ({ ...prev, [memberId]: true }))
      try {
        const member = members.find(m => m.id === memberId)
        const memberName = member ? (member['full_name'] || member['Full Name']) : 'Member'
        for (const dateStr of sundayDates) {
          await markAttendance(memberId, new Date(dateStr), present)
        }
        toast.success(`Marked ${present ? 'present' : 'absent'} for all Sundays (${sundayDates.length}) for: ${memberName}`, {
          style: {
            background: present ? '#10b981' : '#ef4444',
            color: '#ffffff'
          }
        })
      } catch (error) {
        console.error('Error marking attendance across all Sundays:', error)
        toast.error('Failed to update attendance for all Sundays. Please try again.')
      } finally {
        setAttendanceLoading(prev => ({ ...prev, [memberId]: false }))
      }
      return
    }

    // Existing single-date toggle behavior
    setAttendanceLoading(prev => ({ ...prev, [memberId]: true }))
    try {
      const member = members.find(m => m.id === memberId)
      const memberName = member ? (member['full_name'] || member['Full Name']) : 'Member'
      const dateKey = selectedAttendanceDate ? selectedAttendanceDate.toISOString().split('T')[0] : null
      const currentStatus = dateKey && attendanceData[dateKey] ? attendanceData[dateKey][memberId] : undefined
      // Toggle functionality: if clicking the same status, deselect it (set to null)
      if (currentStatus === present) {
        await markAttendance(memberId, new Date(selectedAttendanceDate), null)
        toast.success(`Attendance cleared for: ${memberName}`, {
          style: {
            background: '#f3f4f6',
            color: '#374151'
          }
        })
      } else {
        await markAttendance(memberId, new Date(selectedAttendanceDate), present)
        toast.success(`Marked ${present ? 'present' : 'absent'} for: ${memberName}`, {
          style: {
            background: present ? '#10b981' : '#ef4444',
            color: '#ffffff'
          }
        })
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
      toast.error('Failed to update attendance. Please try again.')
    } finally {
      setAttendanceLoading(prev => ({ ...prev, [memberId]: false }))
    }
  }

  const handleAttendanceForDate = async (memberId, present, specificDate) => {
    const loadingKey = `${memberId}_${specificDate}`
    setAttendanceLoading(prev => ({ ...prev, [loadingKey]: true }))
    try {
      // Read from date-keyed attendance map
      const currentStatus = attendanceData[specificDate]?.[memberId]
      
      // Toggle functionality: if clicking the same status, deselect it (set to null)
      if (currentStatus === present) {
        await markAttendance(memberId, new Date(specificDate), null)
        toast.success(`Attendance cleared for ${new Date(specificDate).toLocaleDateString()}`)
      } else {
        await markAttendance(memberId, new Date(specificDate), present)
        toast.success(`Marked as ${present ? 'present' : 'absent'} for ${new Date(specificDate).toLocaleDateString()}`)
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
      toast.error('Failed to update attendance. Please try again.')
    } finally {
      setAttendanceLoading(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  const handleBulkAttendance = async (present, specificDate = null) => {
    const dateToUse = specificDate || selectedAttendanceDate
    const dateLabel = specificDate ? new Date(specificDate).toLocaleDateString() : selectedAttendanceDate
    
    if (window.confirm(`Mark all members as ${present ? 'present' : 'absent'} on ${dateLabel}?`)) {
      try {
        const memberIds = filteredMembers.map(member => member.id)
        await bulkAttendance(memberIds, new Date(dateToUse), present)
        alert(`All members marked as ${present ? 'present' : 'absent'} successfully!`)
      } catch (error) {
        console.error('Error with bulk attendance:', error)
        alert('Error updating attendance. Please try again.')
      }
    }
  }

  const toggleMemberExpansion = (memberId) => {
    setExpandedMembers(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }))
  }

  // Toggle member selection for bulk actions
  const toggleMemberSelection = (memberId) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  const clearMemberSelection = () => setSelectedMemberIds(new Set())

  const selectAllVisibleMembers = () => {
    const tabFilteredMembers = getTabFilteredMembers()
    const membersToShow = searchTerm ? tabFilteredMembers : tabFilteredMembers.slice(0, displayLimit)
    setSelectedMemberIds(new Set(membersToShow.map(m => m.id)))
  }

  // Toggle Sunday selection for bulk actions
  const toggleSundayBulkSelection = (dateStr) => {
    setSelectedBulkSundayDates(prev => {
      const next = new Set(prev)
      if (next.has(dateStr)) next.delete(dateStr)
      else next.add(dateStr)
      return next
    })
  }

  const selectAllSundays = () => {
    setSelectedBulkSundayDates(new Set(sundayDates))
  }

  const clearSundayBulkSelection = () => setSelectedBulkSundayDates(new Set())

  // Bulk apply attendance to selected members and Sundays
  const handleMultiAttendanceAction = async (status) => {
    const memberIds = Array.from(selectedMemberIds)
    if (memberIds.length === 0) {
      toast.error('Please select at least one member to apply.')
      return
    }

    const dates = selectedBulkSundayDates.size > 0
      ? Array.from(selectedBulkSundayDates)
      : (selectedAttendanceDate ? [selectedAttendanceDate] : sundayDates)

    // Defaulting to all Sundays when none are selected and no date is set

    setIsBulkApplying(true)
    try {
      for (const dateStr of dates) {
        if (status === null) {
          // Clear individually when status is null
          for (const id of memberIds) {
            await markAttendance(id, new Date(dateStr), null)
          }
        } else {
          await bulkAttendance(memberIds, new Date(dateStr), status)
        }
      }
      const actionText = status === null ? 'cleared' : status ? 'present' : 'absent'
      toast.success(`Bulk ${actionText} applied to ${memberIds.length} member(s) for ${dates.length} date(s).`)
    } catch (error) {
      console.error('Bulk attendance failed:', error)
      toast.error('Failed to apply bulk update. Please try again.')
    } finally {
      setIsBulkApplying(false)
    }
  }

  // Bulk delete selected members
  const handleBulkDelete = async () => {
    const memberIds = Array.from(selectedMemberIds)
    if (memberIds.length === 0) return
    const confirmed = window.confirm(`Delete ${memberIds.length} selected member${memberIds.length !== 1 ? 's' : ''}? This cannot be undone.`)
    if (!confirmed) return
    setIsBulkDeleting(true)
    try {
      for (const id of memberIds) {
        await deleteMember(id)
      }
      setSelectedMemberIds(new Set())
      toast.success(`Deleted ${memberIds.length} member${memberIds.length !== 1 ? 's' : ''}.`)
    } catch (error) {
      console.error('Bulk delete failed:', error)
      toast.error('Failed to delete selected members. Please try again.')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkBadgeAssignment = async (badgeType) => {
    if (!filteredMembers.length) return
    
    const badgeNames = {
      'member': 'Member Badge',
      'regular': 'Regular Attendee',
      'newcomer': 'Newcomer'
    }
    
    const badgeName = badgeNames[badgeType]
    const memberCount = filteredMembers.length
    
    if (window.confirm(`Assign "${badgeName}" to ${memberCount} member${memberCount !== 1 ? 's' : ''}?`)) {
      setIsUpdatingBadges(true)
      try {
        for (const member of filteredMembers) {
          // Only add the badge if the member doesn't already have it
          if (!memberHasBadge(member, badgeType)) {
            await toggleMemberBadge(member.id, badgeType)
          }
        }
        await updateMemberBadges()
        alert(`Successfully assigned "${badgeName}" to ${memberCount} member${memberCount !== 1 ? 's' : ''}!`)
      } catch (error) {
        console.error('Error assigning badges:', error)
        alert('Error assigning badges. Please try again.')
      } finally {
        setIsUpdatingBadges(false)
      }
    }
  }

  const getFilteredMembersByBadge = () => {
    // When searching, ignore badge filters and search across all members
    if (searchTerm.trim()) return filteredMembers

    // If no filters selected, show all members
    if (badgeFilter.length === 0) return filteredMembers
    
    // Filter members by selected badge filters
    // Use explicit badge assignment if available; otherwise fall back to calculated badge
    return filteredMembers.filter(member => {
      return badgeFilter.some((type) => {
        // Match if the member explicitly has the badge or their calculated badge equals the type
        return memberHasBadge(member, type) || calculateMemberBadge(member) === type
      })
    })
  }



  const handleIndividualBadgeAssignment = async (memberId, badgeType) => {
    setBadgeAssignmentLoading(prev => ({ ...prev, [memberId]: badgeType }))
    
    try {
      const member = members.find(m => m.id === memberId)
      const memberName = member ? (member['full_name'] || member['Full Name']) : 'Member'
      const hasBadge = memberHasBadge(member, badgeType)
      
      // Badge colors matching the icon colors
      const badgeColors = {
        'member': '#3b82f6',   // Blue
        'regular': '#10b981',  // Green
        'newcomer': '#f59e0b'  // Amber/Gold
      }
      
      // Toggle the badge
      await toggleMemberBadge(memberId, badgeType, { suppressToast: true })
      await updateMemberBadges()
      
      const badgeName = badgeType.charAt(0).toUpperCase() + badgeType.slice(1)
      // Single consolidated notification and silent refresh
      const message = `${badgeName} badge ${hasBadge ? 'removed' : 'assigned'} for: ${memberName} • data refreshed`
      toast.success(message, {
        style: hasBadge
          ? { background: '#f3f4f6', color: '#374151' }
          : { background: badgeColors[badgeType], color: '#ffffff' }
      })
      // Ensure UI reflects latest DB state when using Supabase, but silently
      await forceRefreshMembersSilent()
    } catch (error) {
      console.error('Error managing badge:', error)
      toast.error('Failed to update badge. Please try again.')
    } finally {
      setBadgeAssignmentLoading(prev => ({ ...prev, [memberId]: null }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Member Dashboard</h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <p className="text-gray-600 dark:text-gray-300">
              {getTabFilteredMembers().length} member{getTabFilteredMembers().length !== 1 ? 's' : ''} found
            </p>
            <div className="flex items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">Database:</span>
              <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md font-medium">
                {currentTable.replace('_', ' ')}
              </span>
              <span className="ml-3 text-gray-500 dark:text-gray-400">Mode:</span>
              <span className={`ml-2 px-2 py-1 rounded-md font-medium ${isSupabaseConfigured() ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'}`}>
                {isSupabaseConfigured() ? 'Live DB' : 'Demo Mode'}
              </span>
            </div>
          </div>
        </div>

        
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'all'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Members
          </button>
          <button
            onClick={() => setActiveTab('edited')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
              activeTab === 'edited'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Edited Members
            {(() => {
              const editedCount = getFilteredMembersByBadge().filter(member => isEditedMember(member)).length
              return editedCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
                  {editedCount > 99 ? '99+' : editedCount}
                </span>
              )
            })()}
          </button>
        </div>
      </div>

      {/* Edited Members: Sundays Quick View (desktop only) */}
      {activeTab === 'edited' && (
        <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-600" />
              {getMonthDisplayName(currentTable)} Sundays
            </h3>
            {selectedSundayDate && (
              <button
                onClick={() => setSelectedSundayDate(null)}
                className="text-xs sm:text-sm px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                title="Clear date selection"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sunday date chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {sundayDates.length === 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-300">No Sundays found for this month</div>
            )}
            {sundayDates.map(dateStr => {
              const isSelected = selectedSundayDate === dateStr
              const dateObj = new Date(dateStr)
              const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const presentCount = getTabFilteredMembers().filter(m => (attendanceData[dateStr] || {})[m.id] === true).length
              return (
                <button
                  key={dateStr}
                  onClick={async () => {
                    setSelectedSundayDate(dateStr)
                    // Ensure attendance map for this date is loaded
                    if (!attendanceData[dateStr]) {
                      const map = await fetchAttendanceForDate(new Date(dateStr))
                      setAttendanceData(prev => ({ ...prev, [dateStr]: map }))
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 border ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-700 shadow'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title={`View present members for ${label}`}
                >
                  <span>{label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${isSelected ? 'bg-white/20' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>{presentCount}</span>
                </button>
              )
            })}
          </div>

          {/* Present members list for selected Sunday */}
          {selectedSundayDate && (
            <div className="mt-2">
              {(() => {
                const dateObj = new Date(selectedSundayDate)
                const labelFull = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })
                const presentMembers = getTabFilteredMembers().filter(m => (attendanceData[selectedSundayDate] || {})[m.id] === true)
                return (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900 dark:text-white">
                        Present on {labelFull}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{presentMembers.length} member{presentMembers.length !== 1 ? 's' : ''}</div>
                    </div>
                    {presentMembers.length === 0 ? (
                      <div className="text-sm text-gray-600 dark:text-gray-300">No present members recorded for this date.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {presentMembers.map(m => (
                          <div key={m.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1">
                            <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            <span className="text-sm text-gray-900 dark:text-white truncate">{m['full_name'] || m['Full Name']}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* Compact Badge Management with Mobile Dropdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-3 sm:p-4">
        {/* Mobile: dropdown trigger */}
        <div className="sm:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBadgeDropdownOpen(v => !v)}
              className="flex-1 flex items-center justify-between px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              title="Filter by Badge (Select multiple)"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Filter className="w-4 h-4 text-primary-600" />
                Filter by Badge
                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">(Select multiple)</span>
              </span>
              {isBadgeDropdownOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Sundays button (right side) */}
            {activeTab === 'edited' && (
              <button
                onClick={() => setIsSundayPopupOpen(true)}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                title={`${getMonthDisplayName(currentTable)} Sundays`}
              >
                {(() => {
                  if (selectedSundayDate) {
                    const dateObj = new Date(selectedSundayDate)
                    const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    const presentCount = getTabFilteredMembers().filter(m => (attendanceData[selectedSundayDate] || {})[m.id] === true).length
                    return (
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary-600" />
                        <span className="text-xs font-medium">{label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">{presentCount}</span>
                      </span>
                    )
                  }
                  return <Calendar className="w-5 h-5 text-primary-600" />
                })()}
              </button>
            )}
            
          </div>

          {isBadgeDropdownOpen && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap gap-2">
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
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary-600 dark:bg-primary-700 text-white shadow ring-2 ring-primary-300 dark:ring-primary-500'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                      }`}
                      title={isSelected ? `Remove ${label} filter` : `Add ${label} filter`}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                      {isSelected && (
                        <Check className="w-3 h-3 ml-1 bg-white text-primary-600 rounded-full" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Multi-select controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const allBadges = ['member', 'regular', 'newcomer']
                    allBadges.forEach(badge => {
                      if (!badgeFilter.includes(badge)) toggleBadgeFilter(badge)
                    })
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
                        <Icon className="w-3 h-3" />
                        {label}
                        {isActive && <Check className="w-3 h-3 ml-1" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Mobile-only Sundays popup */}
          {activeTab === 'edited' && isSundayPopupOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
              onClick={() => setIsSundayPopupOpen(false)}
            >
              <div
                className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-600 shadow-2xl p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{getMonthDisplayName(currentTable)} Sundays</span>
                  </div>
                  <button
                    onClick={() => setIsSundayPopupOpen(false)}
                    className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sunday options with checkbox-like selection */}
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {sundayDates.length === 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">No Sundays found for this month</div>
                  )}
                  {sundayDates.map(dateStr => {
                    const isSelected = selectedSundayDate === dateStr
                    const dateObj = new Date(dateStr)
                    const label = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                    const presentCount = getTabFilteredMembers().filter(m => (attendanceData[dateStr] || {})[m.id] === true).length
                    return (
                      <button
                        key={dateStr}
                        onClick={async () => {
                          if (!attendanceData[dateStr]) {
                            const map = await fetchAttendanceForDate(new Date(dateStr))
                            setAttendanceData(prev => ({ ...prev, [dateStr]: map }))
                          }
                          setSelectedSundayDate(prev => (prev === dateStr ? null : dateStr))
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors ${
                          isSelected
                            ? 'bg-primary-600 text-white border-primary-700 shadow'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                        title={`Select ${label}`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{label}</span>
                          {isSelected && <Check className="w-4 h-4" />}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${isSelected ? 'bg-white/20' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>{presentCount}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedSundayDate(null)}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsSundayPopupOpen(false)}
                    className="px-3 py-1.5 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop / larger screens: inline filter row */}
        <div className="hidden sm:flex sm:flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Badge Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-600" />
              Filter by Badge
              <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">(Select multiple)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
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

              {/* Multi-select controls */}
              <div className="flex gap-2 ml-2 border-l border-gray-300 dark:border-gray-600 pl-2">
                <button
                  onClick={() => {
                    const allBadges = ['member', 'regular', 'newcomer']
                    allBadges.forEach(badge => { if (!badgeFilter.includes(badge)) toggleBadgeFilter(badge) })
                  }}
                  className="px-2 py-1 text-xs text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                  title="Select all badge filters"
                >
                  All
                </button>
                <button
                  onClick={() => { badgeFilter.forEach(badge => toggleBadgeFilter(badge)) }}
                  className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Clear all badge filters"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Badge Types Reference (click to quick filter) */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 sm:text-right mb-1 sm:mb-0">
              Badge Types Reference:
            </div>
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
                    className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium opacity-75 cursor-pointer transition-all ${
                      color === 'blue'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : color === 'green'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                    } ${isActive ? 'ring-2 ring-primary-400 dark:ring-primary-500 shadow-sm' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {isActive && <Check className="w-3 h-3 ml-1" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Search Bar: sticks to bottom; rises above keyboard when focused on mobile */}
      <div className={`fixed ${isSearchFocused ? 'ios-bottom-bar' : 'bottom-0'} left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600 py-2 px-4 shadow-lg z-50 transition-colors duration-200 ${activeTab === 'edited' && selectedSundayDate ? 'hidden sm:block' : ''}`}>
        <div className="max-w-7xl mx-auto pb-2">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search members by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') refreshSearch() }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
                ref={searchInputRef}
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
            
            {/* Refresh Button */}
            <button
              onClick={forceRefreshMembers}
              className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
              title="Refresh member data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>





      {/* Members List (hidden on mobile when a Sunday is selected) */}
      <div className={`${activeTab === 'edited' && selectedSundayDate ? 'hidden sm:block' : ''} space-y-3 pb-24 sm:pb-20 safe-area-bottom`}>
        {/* Calculate displayed members based on search and pagination */}
        {(() => {
          // Get tab-filtered members first
          const tabFilteredMembers = getTabFilteredMembers()
          
          // When searching, show all matching results for better UX
          const membersToShow = searchTerm 
            ? tabFilteredMembers 
            : tabFilteredMembers.slice(0, displayLimit)
          
          const hasMoreMembers = !searchTerm && tabFilteredMembers.length > displayLimit
          
          return (
            <>
              {/* Bulk Selection Toolbar (only on Edited Members) */}
              {activeTab === 'edited' && selectedMemberIds.size > 1 && (
                <div className="sticky top-0 sm:top-2 z-30 bg-primary-50/80 dark:bg-primary-900/50 border border-primary-300 dark:border-primary-700 rounded-xl p-3 sm:p-4 mb-3 shadow-md backdrop-blur flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-700 dark:text-primary-200" />
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-200">{selectedMemberIds.size} selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMultiAttendanceAction(true)}
                      disabled={isBulkApplying || isBulkDeleting}
                      className={`h-9 px-3 rounded-lg text-sm font-semibold shadow-sm ${isBulkApplying || isBulkDeleting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white`}
                      title="Mark selected as present"
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleMultiAttendanceAction(false)}
                      disabled={isBulkApplying || isBulkDeleting}
                      className={`h-9 px-3 rounded-lg text-sm font-semibold shadow-sm ${isBulkApplying || isBulkDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white`}
                      title="Mark selected as absent"
                    >
                      Absent
                    </button>
                    <button
                      onClick={() => handleMultiAttendanceAction(null)}
                      disabled={isBulkApplying || isBulkDeleting}
                      className={`h-9 px-3 rounded-lg text-sm font-semibold shadow-sm ${isBulkApplying || isBulkDeleting ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700'} text-white`}
                      title="Clear attendance for selected"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onTouchStart={(e) => { e.stopPropagation() }}
                      onClick={(e) => { e.stopPropagation(); handleBulkDelete() }}
                      style={{ touchAction: 'manipulation' }}
                      disabled={isBulkApplying || isBulkDeleting}
                      className={`h-9 px-3 rounded-lg text-sm font-semibold shadow-sm ${isBulkApplying || isBulkDeleting ? 'bg-red-300 cursor-not-allowed' : 'bg-red-800 hover:bg-red-900'} text-white flex items-center gap-2`}
                      title="Delete selected members"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    {isBulkApplying && (
                      <div className="ml-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {isBulkDeleting && (
                      <div className="ml-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  <div className="sm:w-px sm:h-6 sm:bg-primary-300 sm:dark:bg-primary-700 sm:mx-2" />
                  {/* Sundays selector - mobile friendly chips */}
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary-700 dark:text-primary-200">Select Sundays:</span>
                      <button
                        onClick={selectAllSundays}
                        className="px-2 py-1 text-xs rounded bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-200 hover:bg-primary-200 dark:hover:bg-primary-700"
                        title="Select all Sundays"
                      >
                        Select all
                      </button>
                      <button
                        onClick={clearSundayBulkSelection}
                        className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Clear Sundays selection"
                      >
                        Clear days
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto -mx-1 px-1 py-1">
                      {sundayDates.map(dateStr => {
                        const checked = selectedBulkSundayDates.has(dateStr)
                        const label = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        return (
                          <label key={dateStr} className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSundayBulkSelection(dateStr)}
                              className="sr-only peer"
                            />
                            <span className={`min-w-[96px] h-8 px-2 inline-flex items-center justify-center gap-2 rounded-full border text-xs font-medium shadow-sm transition-colors ${checked ? 'bg-primary-600 text-white border-primary-700' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                              title={`Toggle ${label}`}
                            >
                              <span>{label}</span>
                              <span className="flex items-center gap-1">
                                <span className={`px-1 rounded ${checked ? 'bg-white/20 text-white' : 'bg-green-100 text-green-800 dark:bg-green-800/40 dark:text-green-200'} text-[10px] font-semibold`}>P {perDayCounts[dateStr]?.present ?? 0}</span>
                                <span className={`px-1 rounded ${checked ? 'bg-white/20 text-white' : 'bg-red-100 text-red-800 dark:bg-red-800/40 dark:text-red-200'} text-[10px] font-semibold`}>A {perDayCounts[dateStr]?.absent ?? 0}</span>
                              </span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                    {/* Aggregated counts across selected/all Sundays */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary-700 dark:text-primary-200">Totals:</span>
                      <span className="h-7 px-2 inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 dark:bg-green-800/40 dark:text-green-200 text-xs font-semibold">
                        Present: {presentCount}
                      </span>
                      <span className="h-7 px-2 inline-flex items-center justify-center rounded-full bg-red-100 text-red-800 dark:bg-red-800/40 dark:text-red-200 text-xs font-semibold">
                        Absent: {absentCount}
                      </span>
                    </div>
                  </div>
                  <div className="sm:ml-auto flex items-center gap-2">
                    <button
                      onClick={selectAllVisibleMembers}
                      className="px-2 py-1 text-xs rounded bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-200 hover:bg-primary-200 dark:hover:bg-primary-700"
                      title="Select all visible members"
                    >
                      Select all members in view
                    </button>
                    <button
                      onClick={clearMemberSelection}
                      className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      title="Clear member selection"
                    >
                      Clear selection
                    </button>
                  </div>
                </div>
              )}
              {membersToShow.map((member) => {
          const isExpanded = expandedMembers[member.id]
          
          return (
            <div key={member.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-primary-300 dark:hover:border-primary-600 shadow-sm hover:shadow-md transition-all duration-200">
              {/* Compact Header Row */}
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  {/* Left side: Name, badge, and expand button */}
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <button
                      onClick={() => toggleMemberExpansion(member.id)}
                      className="p-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 rounded transition-colors flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                    {/* Round checkbox replaces avatar, only on Edited Members */}
                    {activeTab === 'edited' && (
                      <label className="flex-shrink-0 cursor-pointer" title="Select member for bulk actions">
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.has(member.id)}
                          onChange={() => toggleMemberSelection(member.id)}
                          className="sr-only peer"
                        />
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center transition-colors peer-checked:bg-primary-600 peer-checked:border-primary-600">
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                        </span>
                      </label>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate min-w-0">{member['full_name'] || member['Full Name']}</h3>
                      {(() => {
                        const badge = calculateMemberBadge(member)
                        if (badge === 'newcomer') return null
                        const badgeConfig = {
                          'member': { color: 'blue', icon: Award, display: 'Member Badge' },
                          'regular': { color: 'green', icon: UserCheck, display: 'Regular Attendee' },
                          'VIP Member': { color: 'purple', icon: Award, display: 'VIP Member' },
                          'Youth Leader': { color: 'indigo', icon: Award, display: 'Youth Leader' }
                        }
                        const config = badgeConfig[badge] || { color: 'gray', icon: Award, display: badge }
                        const Icon = config.icon
                        
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            config.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                            config.color === 'green' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                            config.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                            config.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' :
                            config.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' :
                            'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                          }`}>
                            <Icon className="w-3 h-3" />
                            <span className="hidden sm:inline">{config.display}</span>
                            <span className="sm:hidden">
                              {badge === 'member' ? 'Member' :
                               badge === 'regular' ? 'Regular' :
                               badge === 'newcomer' ? 'New' :
                               badge === 'VIP Member' ? 'VIP' :
                               badge === 'Youth Leader' ? 'Leader' : badge}
                            </span>
                          </span>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Right side: Attendance and Badge buttons */}
                  <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                    {/* Attendance buttons */}
                    <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-md py-1 px-2">
                      {(() => {
                        const dateKeyForRow = selectedAttendanceDate ? selectedAttendanceDate.toISOString().split('T')[0] : null
                        const rowStatus = dateKeyForRow && attendanceData[dateKeyForRow] ? attendanceData[dateKeyForRow][member.id] : undefined
                        const isPresentSelected = rowStatus === true
                        const isAbsentSelected = rowStatus === false
                        return (
                          <>
                      <button
                        onClick={() => handleAttendance(member.id, true)}
                        disabled={attendanceLoading[member.id]}
                        className={`px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm font-bold transition-all duration-200 ${
                          isPresentSelected
                            ? 'bg-green-800 dark:bg-green-700 text-white shadow-xl transform scale-110 ring-4 ring-green-300 dark:ring-green-400 border-2 border-green-900 dark:border-green-300 font-extrabold'
                            : attendanceLoading[member.id]
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : isAbsentSelected
                            ? 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900 hover:text-green-700 dark:hover:text-green-300'
                            : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 border border-green-300 dark:border-green-700'
                        }`}
                        title={isPresentSelected ? "Click to clear attendance" : "Mark present"}
                      >
                        {attendanceLoading[member.id] ? '...' : <span className="hidden sm:inline">Present</span>}
                        {attendanceLoading[member.id] ? '...' : <span className="sm:hidden">P</span>}
                      </button>
                      <button
                        onClick={() => handleAttendance(member.id, false)}
                        disabled={attendanceLoading[member.id]}
                        className={`px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm font-bold transition-all duration-200 ${
                          isAbsentSelected
                            ? 'bg-red-800 dark:bg-red-700 text-white shadow-xl transform scale-110 ring-4 ring-red-300 dark:ring-red-400 border-2 border-red-900 dark:border-red-300 font-extrabold'
                            : attendanceLoading[member.id]
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : isPresentSelected
                            ? 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-300'
                            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 border border-red-300 dark:border-red-700'
                        }`}
                        title={isAbsentSelected ? "Click to clear attendance" : "Mark absent"}
                      >
                        {attendanceLoading[member.id] ? '...' : <span className="hidden sm:inline">Absent</span>}
                        {attendanceLoading[member.id] ? '...' : <span className="sm:hidden">A</span>}
                      </button>
                          </>
                        )
                      })()}
                    </div>

                    {/* Badge assignment buttons */}
                    <div className="flex space-x-1 ml-2 border-l-2 border-gray-300 dark:border-gray-600 pl-2 bg-gray-100 dark:bg-gray-700 rounded-r-md py-1 px-2">
                      <button
                        onClick={() => handleIndividualBadgeAssignment(member.id, 'member')}
                        disabled={badgeAssignmentLoading[member.id]}
                        className={`p-1 rounded transition-all duration-200 ${
                          memberHasBadge(member, 'member')
                            ? 'bg-blue-800 dark:bg-blue-700 text-white shadow-xl transform scale-110 ring-2 ring-blue-300 dark:ring-blue-400 border-2 border-blue-900 dark:border-blue-300 font-extrabold'
                            : badgeAssignmentLoading[member.id] === 'member'
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 border border-blue-300 dark:border-blue-700'
                        }`}
                        title={memberHasBadge(member, 'member') ? "Click to remove Member badge" : "Assign Member Badge"}
                      >
                        {badgeAssignmentLoading[member.id] === 'member' ? '...' : <Award className="w-3 h-3 sm:w-4 sm:h-4" />}
                      </button>
                      <button
                        onClick={() => handleIndividualBadgeAssignment(member.id, 'regular')}
                        disabled={badgeAssignmentLoading[member.id]}
                        className={`p-1 rounded transition-all duration-200 ${
                          memberHasBadge(member, 'regular')
                            ? 'bg-green-800 dark:bg-green-700 text-white shadow-xl transform scale-110 ring-2 ring-green-300 dark:ring-green-400 border-2 border-green-900 dark:border-green-300 font-extrabold'
                            : badgeAssignmentLoading[member.id] === 'regular'
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 border border-green-300 dark:border-green-700'
                        }`}
                        title={memberHasBadge(member, 'regular') ? "Click to remove Regular badge" : "Assign Regular Badge"}
                      >
                        {badgeAssignmentLoading[member.id] === 'regular' ? '...' : <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />}
                      </button>
                      <button
                        onClick={() => handleIndividualBadgeAssignment(member.id, 'newcomer')}
                        disabled={badgeAssignmentLoading[member.id]}
                        className={`p-1 rounded transition-all duration-200 ${
                          memberHasBadge(member, 'newcomer')
                            ? 'bg-yellow-800 dark:bg-yellow-700 text-white shadow-xl transform scale-110 ring-2 ring-yellow-300 dark:ring-yellow-400 border-2 border-yellow-900 dark:border-yellow-300 font-extrabold'
                            : badgeAssignmentLoading[member.id] === 'newcomer'
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800 border border-yellow-300 dark:border-yellow-700'
                        }`}
                        title={memberHasBadge(member, 'newcomer') ? "Click to remove Newcomer badge" : "Assign Newcomer Badge"}
                      >
                        {badgeAssignmentLoading[member.id] === 'newcomer' ? '...' : <Star className="w-3 h-3 sm:w-4 sm:h-4" />}
                      </button>

                    </div>
                  </div>
                </div>
              </div>

              {/* Expandable Content */}
              {isExpanded && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                  <div className="pt-3 sm:pt-4">
                    {/* Member Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 bg-blue-50 dark:bg-blue-900/30 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="space-y-2 sm:space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">Member Information</h4>
                        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">Gender:</span>
                            <span className="font-medium capitalize text-gray-900 dark:text-white truncate ml-2">{member['Gender']}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">Phone:</span>
                            <span className="font-medium text-gray-900 dark:text-white truncate ml-2">{member['Phone Number'] || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">Age:</span>
                            <span className="font-medium text-gray-900 dark:text-white truncate ml-2">{member['Age'] || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">Level:</span>
                            <span className="font-medium text-primary-600 dark:text-primary-400 capitalize ml-2">
                              {member['Current Level']?.toLowerCase() || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2 sm:space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">Actions</h4>
                        <div className="flex flex-col space-y-1 sm:space-y-2">
                          <button
                            onClick={() => setEditingMember(member)}
                            className="flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 rounded transition-colors"
                          >
                            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Edit Member</span>
                          </button>
                          <button
                            type="button"
                            onTouchStart={(e) => { e.stopPropagation() }}
                            onClick={(e) => handleDelete(e, member)}
                            style={{ touchAction: 'manipulation' }}
                            className="flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Delete Member</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sunday Attendance */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4 transition-colors">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 transition-colors">{getMonthDisplayName(currentTable)} Sunday Attendance</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {sundayDates.map(date => {
                          const dateKey = date
                          const dateAttendance = attendanceData[dateKey] || {}
                          const isPresent = dateAttendance[member.id] === true
                          const isAbsent = dateAttendance[member.id] === false
                          const isLoading = attendanceLoading[`${member.id}_${dateKey}`]
                          
                          return (
                            <div 
                              key={date} 
                              className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3 transition-colors"
                              style={isDarkMode ? { backgroundColor: 'rgb(30, 41, 54)' } : {}}
                            >
                              <div className="text-center mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleAttendanceForDate(member.id, true, date)}
                                  disabled={isLoading}
                                  className={`flex-1 px-2 py-1 rounded text-xs font-bold transition-all duration-200 ${
                                    isPresent
                                      ? 'bg-green-800 dark:bg-green-700 text-white shadow-lg ring-2 ring-green-300 dark:ring-green-400 border border-green-900 dark:border-green-300 font-extrabold'
                                      : isLoading
                                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                      : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                                  }`}
                                >
                                  {isLoading ? '...' : 'P'}
                                </button>
                                <button
                                  onClick={() => handleAttendanceForDate(member.id, false, date)}
                                  disabled={isLoading}
                                  className={`flex-1 px-2 py-1 rounded text-xs font-bold transition-all duration-200 ${
                                    isAbsent
                                      ? 'bg-red-800 dark:bg-red-700 text-white shadow-lg ring-2 ring-red-300 dark:ring-red-400 border border-red-900 dark:border-red-300 font-extrabold'
                                      : isLoading
                                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                      : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                                  }`}
                                >
                                  {isLoading ? '...' : 'A'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        
        {/* Load More Button */}
        {hasMoreMembers && (
          <div className="flex justify-center mt-6">
            <button
              onClick={async () => {
                setIsLoadingMore(true)
                // Simulate a small delay for better UX
                await new Promise(resolve => setTimeout(resolve, 300))
                setDisplayLimit(prev => prev + 20)
                setIsLoadingMore(false)
              }}
              disabled={isLoadingMore}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Load More ({tabFilteredMembers.length - displayLimit} remaining)</span>
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Members count info */}
        {!searchTerm && tabFilteredMembers.length > 0 && (
          <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {Math.min(displayLimit, tabFilteredMembers.length)} of {tabFilteredMembers.length} members
          </div>
        )}
        
        </>
      )
    })()}
  </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No members found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first member'}
          </p>
          
          {/* Debug Information for Search Issues */}
          {searchTerm && members.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-md mx-auto text-left">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">🔍 Debug Info</h4>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <p><strong>Search term:</strong> "{searchTerm}"</p>
                <p><strong>Total members:</strong> {members.length}</p>
                <p><strong>Filtered results:</strong> {filteredMembers.length}</p>
                <p><strong>Current table:</strong> {currentTable}</p>
                <p><strong>Supabase status:</strong> {isSupabaseConfigured() ? 'Connected' : 'Not configured (showing mock data)'}</p>
              </div>
              <button
                onClick={forceRefreshMembers}
                className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </button>
              
              <button
                onClick={() => searchMemberAcrossAllTables(searchTerm)}
                className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                disabled={!searchTerm.trim()}
              >
                <Search className="w-4 h-4" />
                Search All Tables
              </button>
              {!isSupabaseConfigured() && (
                <div className="mt-3 text-xs text-yellow-700 dark:text-yellow-300">
                  Tip: Configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to search real data.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <EditMemberModal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          member={editingMember}
        />
      )}

      {/* Add Member Modal */}
      <MemberModal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
      />

      {/* Create Month Modal */}
      <MonthModal
        isOpen={showMonthModal}
        onClose={() => setShowMonthModal(false)}
      />
    </div>
  )
}

export default Dashboard