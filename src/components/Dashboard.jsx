import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { Search, Users, Filter, Edit3, Trash2, Calendar, ChevronDown, ChevronUp, ChevronRight, UserPlus, Award, Star, UserCheck, Check, X, Feather } from 'lucide-react'
import EditMemberModal from './EditMemberModal'
import MemberModal from './MemberModal'
import QRModal from './QRModal'
import MonthModal from './MonthModal'
import DateSelector from './DateSelector'
import ConfirmModal from './ConfirmModal'
import MissingDataModal from './MissingDataModal'
import SelectionToolbar from './SelectionToolbar'
import { useLongPressSelection } from '../hooks/useLongPressSelection'
import { toast } from 'react-toastify'

// Helper function to get month display name from table name
const getMonthDisplayName = (tableName) => {
  // Convert table name like "October_2025" to "October 2025"
  return tableName.replace('_', ' ')
}

// Helper function to get the target date (Nov 23)
const getTargetDate = (currentTable) => {
  return '2025-11-23'
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
    updateMember,
    selectedAttendanceDate,
    badgeFilter,
    toggleBadgeFilter,
    isSupabaseConfigured,
    // Global dashboard tab (controlled by mobile header)
    dashboardTab,
    setDashboardTab,
    setAndSaveAttendanceDate,
    loadAllAttendanceData,
    uiAction,
    validateMemberData,
    getPastSundays,
    getMissingAttendance
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

  // Tab state moved to AppContext: dashboardTab ('all' | 'edited')
  const [selectedSundayDate, setSelectedSundayDate] = useState(null)
  const [genderFilter, setGenderFilter] = useState(null)

  // iOS detection (used for minor tweaks if needed)
  const searchInputRef = useRef(null)
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isStandalone = typeof window !== 'undefined' && ((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone === true))

  // Multi-select state (members + Sundays)
  const [selectedMemberIds, setSelectedMemberIds] = useState(new Set())
  const [selectedBulkSundayDates, setSelectedBulkSundayDates] = useState(new Set())
  const [isBulkApplying, setIsBulkApplying] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [swipeOpenId, setSwipeOpenId] = useState(null)
  const [swipeOffset, setSwipeOffset] = useState({})
  const swipeStartXRef = useRef(null)
  const swipeActiveIdRef = useRef(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState(null)

  // QR modal for share / admin scan workflow
  const [openQrModal, setOpenQrModal] = useState(false)
  const [qrMember, setQrMember] = useState(null)

  // Custom confirmation modals
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Confirm",
    cancelText: "Cancel",
    confirmButtonClass: "bg-red-600 hover:bg-red-700 text-white",
    cancelButtonClass: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
  })
  const sundaysRef = useRef(null)

  // Duplicates management state
  const [selectedDuplicateIds, setSelectedDuplicateIds] = useState(new Set())

  // Ref to track the last fetched table to prevent re-fetching on every render
  const lastFetchedTableRef = useRef(null)

  // Missing data validation state
  const [showMissingDataModal, setShowMissingDataModal] = useState(false)
  const [missingDataMember, setMissingDataMember] = useState(null)
  const [missingFields, setMissingFields] = useState([])
  const [missingDates, setMissingDates] = useState([])
  const [pendingAttendanceAction, setPendingAttendanceAction] = useState(null)

  // Long-press selection hook (works with both touch and mouse)
  const {
    selectionMode,
    selectedIds: longPressSelectedIds,
    handleLongPressStart,
    handleLongPressMove,
    handleLongPressEnd,
    handleMouseDown,
    handleMouseUp,
    toggleSelection,
    clearSelection
  } = useLongPressSelection()

  // Local search term state for debounced search
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

  // Keep local input in sync when external searchTerm changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  // Debounce updates to global search term to reduce re-renders
  useEffect(() => {
    const tid = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        setSearchTerm(localSearchTerm)
      }
    }, 250)
    return () => clearTimeout(tid)
  }, [localSearchTerm])

  // Handle bulk attendance for long-press selection
  const handleLongPressBulkAction = async (present) => {
    if (longPressSelectedIds.size === 0) return

    const dateToUse = new Date(getTargetDate())
    const memberIds = Array.from(longPressSelectedIds)

    setIsBulkApplying(true)
    try {
      await bulkAttendance(memberIds, dateToUse, present)
      toast.success(`Marked ${memberIds.length} member${memberIds.length !== 1 ? 's' : ''} as ${present ? 'present' : 'absent'}!`)
      clearSelection()
    } catch (error) {
      console.error('Bulk action error:', error)
      toast.error('Failed to update attendance')
    } finally {
      setIsBulkApplying(false)
    }
  }

  // Sync long-press selection to selectedMemberIds when on Edited Members tab
  useEffect(() => {
    if (dashboardTab === 'edited') {
      setSelectedMemberIds(new Set(longPressSelectedIds))
    }
  }, [longPressSelectedIds, dashboardTab])

  // Check for missing data before marking attendance
  const checkMissingDataBeforeAttendance = (member, present) => {
    const fields = validateMemberData(member)
    const pastSundays = getPastSundays()
    const dates = getMissingAttendance(member.id, pastSundays)

    if (fields.length > 0 || dates.length > 0) {
      setMissingDataMember(member)
      setMissingFields(fields)
      setMissingDates(dates)
      setPendingAttendanceAction({ memberId: member.id, present })
      setShowMissingDataModal(true)
      return true // Has missing data
    }
    return false // No missing data
  }

  const onRowTouchStart = (id, e) => {
    swipeActiveIdRef.current = id
    swipeStartXRef.current = e.touches[0]?.clientX || 0
    setSwipeOffset(prev => ({ ...prev, [id]: 0 }))
  }

  const onRowTouchMove = (id, e) => {
    if (swipeActiveIdRef.current !== id) return
    const currentX = e.touches[0]?.clientX || 0
    const dx = currentX - (swipeStartXRef.current || 0)
    if (dx < 0) {
      const v = Math.min(-dx, 96)
      setSwipeOffset(prev => ({ ...prev, [id]: v }))
    } else {
      setSwipeOffset(prev => ({ ...prev, [id]: 0 }))
    }
  }

  const onRowTouchEnd = (id) => {
    const v = swipeOffset[id] || 0
    if (v > 48) setSwipeOpenId(id)
    else setSwipeOpenId(null)
    setSwipeOffset(prev => ({ ...prev, [id]: 0 }))
    swipeActiveIdRef.current = null
    swipeStartXRef.current = null
  }

  // Badge quick filter moved to Header popup

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
    const editedViaMaps = sundayDates.some((date) => {
      const map = attendanceData[date] || {}
      const v = map[member.id]
      return v === true || v === false
    })
    if (editedViaMaps) return true
    // Fallback: inspect member record columns in this monthly table
    for (const key in member) {
      if (key.startsWith('Attendance ')) {
        const val = member[key]
        if (val === true || val === false || val === 'Present' || val === 'Absent') {
          return true
        }
      }
    }
    return false
  }

  // Get filtered members based on active tab
  const getTabFilteredMembers = () => {
    const badgeFilteredMembers = getFilteredMembersByBadge()

    // Apply gender filter (large-screen quick toggle)
    const genderFilteredMembers = !genderFilter
      ? badgeFilteredMembers
      : badgeFilteredMembers.filter(member => {
        const g = (member['Gender'] || member.gender || '').toString()
        return g.toLowerCase() === genderFilter.toLowerCase()
      })

    // When searching, ignore tab filters and show all matching results
    if (searchTerm && searchTerm.trim()) {
      return genderFilteredMembers
    }

    if (dashboardTab === 'edited') {
      const dateKey = selectedSundayDate || (selectedAttendanceDate ? selectedAttendanceDate.toISOString().split('T')[0] : null)
      if (!dateKey) {
        const editedOnly = genderFilteredMembers.filter(member => isEditedMember(member))
        return editedOnly.sort((a, b) => {
          const an = (a['full_name'] || a['Full Name'] || '').toLowerCase()
          const bn = (b['full_name'] || b['Full Name'] || '').toLowerCase()
          return an.localeCompare(bn)
        })
      }
      const map = attendanceData[dateKey] || {}
      const filteredByDate = genderFilteredMembers.filter(m => map[m.id] === true || map[m.id] === false)
      return filteredByDate.sort((a, b) => {
        const av = map[a.id]
        const bv = map[b.id]
        const rank = (v) => (v === true ? 0 : v === false ? 1 : 2)
        const r = rank(av) - rank(bv)
        if (r !== 0) return r
        const an = (a['full_name'] || a['Full Name'] || '').toLowerCase()
        const bn = (b['full_name'] || b['Full Name'] || '').toLowerCase()
        return an.localeCompare(bn)
      })
    }

    if (dashboardTab === 'duplicates') {
      // For duplicates tab, only show members that are part of duplicate groups
      const duplicateMemberIds = new Set()
      duplicateGroups.forEach(group => {
        group.members.forEach(member => duplicateMemberIds.add(member.id))
      })
      return genderFilteredMembers.filter(member => duplicateMemberIds.has(member.id))
    }

    return genderFilteredMembers
  }

  // Aggregated counts across selected/all Sundays for members in current view
  const { presentCount, absentCount } = useMemo(() => {
    const membersBase = dashboardTab === 'edited'
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
  }, [attendanceData, selectedBulkSundayDates, currentTable, dashboardTab, members])

  // Helper function to normalize names for duplicate detection
  const normalizeName = (name) => {
    if (!name) return ''
    return name.toString().toLowerCase().trim().replace(/\s+/g, ' ')
  }

  // Duplicate groups detection
  const duplicateGroups = useMemo(() => {
    const map = {}
    members.forEach(m => {
      const name = normalizeName(m['Full Name'] || m.full_name)
      if (!name) return
      if (!map[name]) map[name] = []
      map[name].push(m)
    })
    return Object.entries(map)
      .filter(([, arr]) => arr.length > 1)
      .map(([name, arr]) => ({ name, members: arr }))
  }, [members])

  // Attendance counts across all Sundays for duplicate analysis
  const attendanceCounts = useMemo(() => {
    const counts = {}
    sundayDates.forEach(d => {
      const map = attendanceData[d] || {}
      Object.entries(map).forEach(([mid, val]) => {
        if (val === true) counts[mid] = (counts[mid] || 0) + 1
      })
    })
    return counts
  }, [attendanceData, sundayDates])

  // Smart keep logic for duplicates (prioritize 3+ Sunday attendance)
  const groupKeepId = (members) => {
    let best = null
    let bestCount = -1
    members.forEach(m => {
      const c = attendanceCounts[m.id] || 0
      if (c >= 3 && c > bestCount) { best = m.id; bestCount = c }
    })
    if (best !== null) return best
    // Fallback to highest attendance
    members.forEach(m => {
      const c = attendanceCounts[m.id] || 0
      if (c > bestCount) { best = m.id; bestCount = c }
    })
    return best || members[0]?.id
  }

  // Helper function to show confirmation modal
  const showConfirmModal = (config) => {
    setConfirmModalConfig({
      ...config,
      isOpen: true
    })
  }

  // Toggle duplicate selection
  const toggleSelectDuplicate = (memberId) => {
    setSelectedDuplicateIds(prev => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  // Bulk delete selected duplicates
  const deleteSelectedDuplicates = async () => {
    if (selectedDuplicateIds.size === 0) return

    showConfirmModal({
      title: "Delete Duplicate Members",
      message: `Delete ${selectedDuplicateIds.size} selected duplicate member${selectedDuplicateIds.size !== 1 ? 's' : ''}? This cannot be undone.`,
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          for (const id of Array.from(selectedDuplicateIds)) {
            await deleteMember(id)
          }
          setSelectedDuplicateIds(new Set())
          toast.success(`Deleted ${selectedDuplicateIds.size} duplicate member${selectedDuplicateIds.size !== 1 ? 's' : ''}.`)
        } catch (error) {
          console.error('Bulk delete failed:', error)
          toast.error('Failed to delete selected duplicates. Please try again.')
        }
      }
    })
  }

  // Per-Sunday counts for Edited Members (used in chips)
  const perDayCounts = useMemo(() => {
    const editedMembers = members.filter(isEditedMember)
    const acc = {}
    for (const dateStr of sundayDates) {
      const map = attendanceData[dateStr]
      let p = 0
      let a = 0
      if (map) {
        for (const m of editedMembers) {
          const val = map[m.id]
          if (val === true) p += 1
          else if (val === false) a += 1
        }
      } else {
        // Fallback: show total edited members before attendance map loads
        p = editedMembers.length
        a = 0
      }
      acc[dateStr] = { present: p, absent: a }
    }
    return acc
  }, [attendanceData, members, sundayDates])

  // Fetch attendance for the target date when table changes
  useEffect(() => {
    const targetDate = getTargetDate(currentTable)
    if (targetDate && lastFetchedTableRef.current !== currentTable) {
      lastFetchedTableRef.current = currentTable
      fetchAttendanceForDate(new Date(targetDate)).then(map => {
        setAttendanceData(prev => ({
          ...prev,
          [targetDate]: map
        }))
      })
    }
  }, [currentTable, fetchAttendanceForDate, setAttendanceData])

  // Preload attendance maps when switching to Edited tab
  useEffect(() => {
    if (dashboardTab === 'edited') {
      loadAllAttendanceData()
    }
  }, [dashboardTab])

  // Ensure attendance map loads when a Sunday is selected (local state)
  useEffect(() => {
    const loadMap = async () => {
      if (selectedSundayDate && !attendanceData[selectedSundayDate]) {
        const map = await fetchAttendanceForDate(new Date(selectedSundayDate))
        setAttendanceData(prev => ({ ...prev, [selectedSundayDate]: map }))
      }
    }
    loadMap()
  }, [selectedSundayDate, attendanceData, fetchAttendanceForDate, setAttendanceData])

  // Focus Sundays section when requested via header "Select Date"
  useEffect(() => {
    if (uiAction && uiAction.type === 'focusDateSelector' && sundaysRef.current) {
      try {
        sundaysRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } catch { }
    }
  }, [uiAction])

  // Fetch attendance for all Sunday dates
  useEffect(() => {
    // When viewing Edited Members, ensure Sunday attendance maps are available
    if (dashboardTab !== 'edited' && dashboardTab !== 'duplicates') return
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
  }, [dashboardTab, currentTable])

  // Reset selected Sunday when month changes
  useEffect(() => {
    setSelectedSundayDate(null)
  }, [currentTable])

  useEffect(() => {
    if (selectedAttendanceDate) {
      const key = selectedAttendanceDate.toISOString().split('T')[0]
      setSelectedSundayDate(key)
    }
  }, [selectedAttendanceDate])

  // Clear selections when month changes
  useEffect(() => {
    setSelectedMemberIds(new Set())
    setSelectedBulkSundayDates(new Set())
  }, [currentTable])

  // Clear multi-select when leaving Edited Members tab
  useEffect(() => {
    if (dashboardTab !== 'edited') {
      setSelectedMemberIds(new Set())
      setSelectedBulkSundayDates(new Set())
    }
  }, [dashboardTab])

  // Reset pagination when search term changes
  useEffect(() => {
    if (searchTerm) {
      // When searching, we show all results, so no need for pagination
    } else {
      // When search is cleared, reset to initial display limit
      setDisplayLimit(20)
    }
  }, [searchTerm])

  const openDeleteConfirm = (event, member) => {
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
    setMemberToDelete(member)
    setIsDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!memberToDelete) return
    try {
      await deleteMember(memberToDelete.id)
      const name = memberToDelete['full_name'] || memberToDelete['Full Name']
      setSwipeOpenId(null)
      setIsDeleteConfirmOpen(false)
      setMemberToDelete(null)
      toast.success(`Your ${name} has been deleted.`)
    } catch (error) {
      console.error('Error deleting member:', error)
      setIsDeleteConfirmOpen(false)
    }
  }

  const handleAttendance = async (memberId, present) => {
    // Check for missing data before marking attendance
    const member = members.find(m => m.id === memberId)
    if (member && checkMissingDataBeforeAttendance(member, present)) {
      return // Stop here if missing data found
    }

    // Always use the target date (Nov 23)
    const targetDate = getTargetDate(currentTable)
    if (!targetDate) {
      toast.error('Unable to determine the target date.')
      return
    }

    setAttendanceLoading(prev => ({ ...prev, [memberId]: true }))
    try {
      const memberName = member ? (member['full_name'] || member['Full Name']) : 'Member'
      const currentStatus = attendanceData[targetDate]?.[memberId]

      // Toggle functionality: if clicking the same status, deselect it (set to null)
      if (currentStatus === present) {
        await markAttendance(memberId, new Date(targetDate), null)
        toast.success(`Attendance cleared for: ${memberName}`, {
          style: {
            background: '#f3f4f6',
            color: '#374151'
          }
        })
      } else {
        await markAttendance(memberId, new Date(targetDate), present)
        toast.success(`Marked ${present ? 'present' : 'absent'} for Nov 23: ${memberName}`, {
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
    // Force target date to be the 23rd as requested
    const targetString = getTargetDate(currentTable)
    const dateToUse = specificDate ? new Date(specificDate) : new Date(targetString)
    const dateLabel = dateToUse.toLocaleDateString()

    showConfirmModal({
      title: "Bulk Attendance Update",
      message: `Mark all members as ${present ? 'present' : 'absent'} on ${dateLabel}?`,
      confirmText: "Update",
      confirmButtonClass: present ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white",
      onConfirm: async () => {
        try {
          const memberIds = filteredMembers.map(member => member.id)
          await bulkAttendance(memberIds, dateToUse, present)
          toast.success(`All members marked as ${present ? 'present' : 'absent'} successfully!`, {
            style: { background: present ? '#10b981' : '#ef4444', color: '#ffffff' }
          })
        } catch (error) {
          console.error('Error with bulk attendance:', error)
          toast.error('Error updating attendance. Please try again.', {
            style: { background: '#ef4444', color: '#ffffff' }
          })
        }
      }
    })
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

    const targetDate = getTargetDate(currentTable)
    if (!targetDate) {
      toast.error('Unable to determine the target date.')
      return
    }

    setIsBulkApplying(true)
    try {
      if (status === null) {
        // Clear individually when status is null
        for (const id of memberIds) {
          await markAttendance(id, new Date(targetDate), null)
        }
      } else {
        await bulkAttendance(memberIds, new Date(targetDate), status)
      }
      const actionText = status === null ? 'cleared' : status ? 'present' : 'absent'
      toast.success(`Bulk ${actionText} applied to ${memberIds.length} member(s) for Nov 23.`)
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

    showConfirmModal({
      title: "Delete Members",
      message: `Delete ${memberIds.length} selected member${memberIds.length !== 1 ? 's' : ''}? This cannot be undone.`,
      confirmText: "Delete",
      onConfirm: async () => {
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
    })
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

    showConfirmModal({
      title: "Assign Badge",
      message: `Assign "${badgeName}" to ${memberCount} member${memberCount !== 1 ? 's' : ''}?`,
      confirmText: "Assign",
      confirmButtonClass: "bg-blue-600 hover:bg-blue-700 text-white",
      onConfirm: async () => {
        setIsUpdatingBadges(true)
        try {
          for (const member of filteredMembers) {
            // Only add the badge if the member doesn't already have it
            if (!memberHasBadge(member, badgeType)) {
              await toggleMemberBadge(member.id, badgeType)
            }
          }
          await updateMemberBadges()
          toast.success(`Successfully assigned "${badgeName}" to ${memberCount} member${memberCount !== 1 ? 's' : ''}!`, {
            style: { background: '#3b82f6', color: '#ffffff' }
          })
        } catch (error) {
          console.error('Error assigning badges:', error)
          toast.error('Error assigning badges. Please try again.', {
            style: { background: '#ef4444', color: '#ffffff' }
          })
        } finally {
          setIsUpdatingBadges(false)
        }
      }
    })
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
    <div className="space-y-2 pb-12 max-w-7xl mx-auto px-3 sm:px-4">
      {/* Header removed; summary now shown in sticky Header */}

      {/* Desktop tab navigation removed; use mobile segmented control in Header */}

      {/* Edited Members: Sundays Quick View (desktop only) */}
      {dashboardTab === 'edited' && (
        <div ref={sundaysRef} className="hidden sm:block mt-8 sm:mt-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-3 sm:p-4">
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
              const map = attendanceData[dateStr]
              const presentCount = map
                ? members.filter(m => map[m.id] === true).length
                : 0
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 border ${isSelected
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

          {/* Present members summary for selected Sunday (no names list) */}
          {selectedSundayDate && (
            <div className="mt-2">
              {(() => {
                const dateObj = new Date(selectedSundayDate)
                const labelFull = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })
                const map = attendanceData[selectedSundayDate] || {}
                const presentCount = members.filter(m => map[m.id] === true).length
                return (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900 dark:text-white">
                        Present on {labelFull}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{presentCount} member{presentCount !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {dashboardTab === 'duplicates' && (
        <div className={`rounded-lg border p-4 mt-8 sm:mt-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Duplicate Names</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{duplicateGroups.length} names with duplicates</div>
              <button
                onClick={deleteSelectedDuplicates}
                disabled={selectedDuplicateIds.size === 0}
                className={`px-3 py-1 rounded text-sm ${selectedDuplicateIds.size === 0 ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
              >
                Delete Selected
              </button>
            </div>
            {duplicateGroups.length === 0 && (
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No duplicate names found</div>
            )}
            {duplicateGroups.map(group => {
              const keepId = groupKeepId(group.members)
              const keepMember = group.members.find(m => m.id === keepId)
              const keepMemberName = keepMember ? (keepMember['Full Name'] || keepMember.full_name) : 'Unknown'
              return (
                <div key={group.name} className={`rounded-lg border p-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary-600" />
                      <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{group.members[0]['Full Name'] || group.members[0].full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700">Keep: {keepMemberName}</span>
                      <button
                        onClick={async () => {
                          const toDelete = group.members.map(m => m.id).filter(id => id !== keepId)
                          for (const id of toDelete) { await deleteMember(id) }
                        }}
                        className="px-2 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete Others
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {group.members.map(m => {
                      const c = attendanceCounts[m.id] || 0
                      const selected = selectedDuplicateIds.has(m.id)
                      const isKeepMember = m.id === keepId
                      return (
                        <div key={m.id} className={`flex items-center justify-between pl-4 pr-3 py-2 sm:px-3 sm:py-2 rounded border-2 ${isKeepMember
                          ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                          : isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                          }`}>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleSelectDuplicate(m.id)}
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? 'bg-primary-600 border-primary-600' : isDarkMode ? 'border-gray-500' : 'border-gray-400'}`}
                              title={selected ? 'Unselect' : 'Select'}
                            >
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <div>
                              <div className={`text-sm font-medium ${isKeepMember
                                ? 'text-green-800 dark:text-green-300'
                                : isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                {m['Full Name'] || m.full_name}
                                {isKeepMember && <span className="ml-2 text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">Keep</span>}
                              </div>
                              <div className={`text-xs ${isKeepMember
                                ? 'text-green-600 dark:text-green-400'
                                : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>Attendance: {c}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteMember(m.id)}
                            className={`px-2 py-1 rounded text-xs border ${isKeepMember
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-50'
                              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 border-red-300 dark:border-red-700'
                              }`}
                            disabled={isKeepMember}
                            title={isKeepMember ? 'This member is recommended to keep' : 'Delete this member'}
                          >
                            Delete
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Badge/Sundays dashboard card removed per request */}

      {/* Top sticky search bar moved to Header.jsx */}





      {/* Long-Press Selection Toolbar - Outside grid, on its own row */}
      {longPressSelectedIds.size > 0 && (
        <div className="mt-8 sm:mt-10 mb-4">
          <SelectionToolbar
            selectedCount={longPressSelectedIds.size}
            onPresent={() => handleLongPressBulkAction(true)}
            onAbsent={() => handleLongPressBulkAction(false)}
            onCancel={clearSelection}
            onDelete={handleBulkDelete}
            onSelectAll={selectAllSundays}
            onClearDays={clearSundayBulkSelection}
            sundayDates={sundayDates}
            selectedSundayDates={selectedBulkSundayDates}
            onToggleSunday={toggleSundayBulkSelection}
            isLoading={isBulkApplying || isBulkDeleting}
            showSundaySelection={dashboardTab === 'edited' && longPressSelectedIds.size > 0}
          />
        </div>
      )}

      {/* Members List */}
      <div className={`${longPressSelectedIds.size > 0 ? '' : 'mt-8 sm:mt-10'} grid grid-cols-1 lg:grid-cols-3 gap-3`}>
        {/* Calculate displayed members based on search and pagination */}
        {(() => {
          // Get tab-filtered members first
          let tabFilteredMembers = getTabFilteredMembers()

          if (dashboardTab === 'edited' && selectedSundayDate) {
            const map = attendanceData[selectedSundayDate] || {}
            tabFilteredMembers = tabFilteredMembers.filter(m => map[m.id] === true)
          }

          const membersToShow = searchTerm
            ? tabFilteredMembers
            : tabFilteredMembers.slice(0, displayLimit)

          const hasMoreMembers = !searchTerm && tabFilteredMembers.length > displayLimit

          return (
            <>
              {/* Badge filter removed - badges now work automatically in background */}
              {/* Date Filter Indicator removed; use Sundays header Edit Date dropdown */}

              {membersToShow.map((member) => {
                const isExpanded = expandedMembers[member.id]
                const isSelected = longPressSelectedIds.has(member.id)

                return (
                  <div key={member.id} className="relative">
                    {/* Selection checkmark */}
                    {isSelected && (
                      <div className="selection-checkmark">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center space-x-1 rounded-xl" style={{ display: selectionMode ? 'none' : 'flex' }}>
                      <button
                        type="button"
                        onTouchStart={(e) => { e.stopPropagation() }}
                        onClick={(e) => { e.stopPropagation(); setQrMember(member); setOpenQrModal(true) }}
                        className="text-white flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg"
                        title="Share / QR"
                      >
                        <Feather className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onTouchStart={(e) => { e.stopPropagation() }}
                        onClick={(e) => { e.stopPropagation(); openDeleteConfirm(e, member) }}
                        className="text-white flex items-center justify-center w-12 h-12 rounded-xl bg-red-600 dark:bg-red-700 hover:bg-red-700 shadow-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div
                      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-300 dark:hover:border-primary-600 shadow-sm hover:shadow-md transition-all duration-200 border-r-4 border-r-red-600 dark:border-r-red-700 md:border-r-0 ${isSelected ? 'selection-highlight' : ''
                        }`}
                      style={{ transform: swipeOpenId === member.id ? 'translateX(-64px)' : 'translateX(0)', touchAction: 'pan-y', userSelect: 'none' }}
                      onTouchStart={(e) => {
                        if (!selectionMode) {
                          handleLongPressStart(member.id, e)
                          onRowTouchStart(member.id, e)
                        }
                      }}
                      onTouchMove={(e) => {
                        handleLongPressMove(e)
                        onRowTouchMove(member.id, e)
                      }}
                      onTouchEnd={() => {
                        handleLongPressEnd()
                        onRowTouchEnd(member.id)
                      }}
                      onMouseDown={(e) => {
                        if (!selectionMode) {
                          handleMouseDown(member.id, e)
                        }
                      }}
                      onMouseMove={(e) => {
                        handleLongPressMove(e)
                      }}
                      onMouseUp={() => {
                        handleMouseUp()
                      }}
                      onMouseLeave={() => {
                        handleMouseUp()
                      }}
                      onClick={() => {
                        if (selectionMode) {
                          toggleSelection(member.id)
                        }
                      }}
                    >
                      {/* Mobile-friendly stacked layout */}
                      <div className="px-3 py-3 sm:px-4 sm:py-3.5">
                        {/* Row 1: Expand toggle row (chevron + name + hint) */}
                        <button
                          type="button"
                          onClick={() => toggleMemberExpansion(member.id)}
                          className="w-full flex items-center gap-2 mb-2 text-left hover:bg-primary-50 dark:hover:bg-primary-900/40 rounded px-1 py-1 transition-colors"
                        >
                          <div className="p-1 text-gray-500 dark:text-gray-400 rounded flex-shrink-0 flex items-center justify-center">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </div>
                          {dashboardTab === 'edited' && isSelected && (
                            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg truncate flex-1">
                            {member['full_name'] || member['Full Name']}
                          </h3>
                          <span className="hidden xs:inline text-[11px] text-gray-500 dark:text-gray-400 flex-shrink-0 ml-1">
                            {isExpanded ? 'Hide details' : 'Details'}
                          </span>
                        </button>

                        {/* Row 2: Present/Absent (and desktop Delete) buttons */}
                        <div className="flex items-stretch gap-2 ml-0 w-full">
                          {/* Present/Absent buttons */}
                          <div className="flex flex-row items-stretch gap-2 w-full">
                            {/* Present/Absent buttons - compact on mobile, full on desktop */}
                            {(() => {
                              const targetDate = getTargetDate(currentTable)
                              const rowStatus = targetDate && attendanceData[targetDate] ? attendanceData[targetDate][member.id] : undefined
                              const isPresentSelected = rowStatus === true
                              const isAbsentSelected = rowStatus === false
                              return (
                                <>
                                  <button
                                    onClick={() => handleAttendance(member.id, true)}
                                    disabled={attendanceLoading[member.id]}
                                    className={`flex-1 px-2 py-2 rounded-md text-xs font-semibold transition-all duration-200 whitespace-nowrap sm:text-sm md:px-6 md:py-3 md:text-base ${isPresentSelected
                                      ? 'bg-green-600 dark:bg-green-700 text-white shadow ring-1 ring-green-300 dark:ring-green-500'
                                      : attendanceLoading[member.id]
                                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 md:bg-green-600 md:text-white md:hover:bg-green-700'
                                      }`}
                                    title={isPresentSelected ? "Click to clear" : "Mark present"}
                                  >
                                    {attendanceLoading[member.id] ? '...' : 'Present'}
                                  </button>
                                  <button
                                    onClick={() => handleAttendance(member.id, false)}
                                    disabled={attendanceLoading[member.id]}
                                    className={`flex-1 px-2 py-2 rounded-md text-xs font-semibold transition-all duration-200 whitespace-nowrap sm:text-sm md:px-6 md:py-3 md:text-base ${isAbsentSelected
                                      ? 'bg-red-600 dark:bg-red-700 text-white shadow ring-1 ring-red-300 dark:ring-red-500'
                                      : attendanceLoading[member.id]
                                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 md:bg-red-600 md:text-white md:hover:bg-red-700'
                                      }`}
                                    title={isAbsentSelected ? "Click to clear" : "Mark absent"}
                                  >
                                    {attendanceLoading[member.id] ? '...' : 'Absent'}
                                  </button>
                                </>
                              )
                            })()}

                          </div>

                          {/* Desktop Delete button - third equal-width button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openDeleteConfirm(e, member) }}
                            disabled={attendanceLoading[member.id]}
                            className="hidden md:inline-flex flex-1 items-center justify-center px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm font-semibold whitespace-nowrap"
                            title="Delete member"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Expandable Content */}
                      {isExpanded && (
                        <div className="px-2 sm:px-3 pb-2 sm:pb-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                          <div className="pt-2 sm:pt-2.5">
                            {/* Member Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3 mb-3 sm:mb-3 bg-blue-50 dark:bg-blue-900/30 p-3 sm:p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                              <div className="space-y-1.5 sm:space-y-2">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-sm sm:text-sm">Member Information</h4>
                                <div className="space-y-1 text-xs sm:text-xs">
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

                                {/* Parent Information (if available) */}
                                {(member['parent_name_1'] || member['parent_name_2']) && (
                                  <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Parent Information</h4>
                                    <div className="space-y-2 text-xs sm:text-sm">
                                      {member['parent_name_1'] && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-600 dark:text-gray-300">Parent 1:</span>
                                          <div className="text-right">
                                            <span className="block font-medium text-gray-900 dark:text-white">{member['parent_name_1']}</span>
                                            {member['parent_phone_1'] && (
                                              <span className="block text-xs text-gray-500 dark:text-gray-400">{member['parent_phone_1']}</span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      {member['parent_name_2'] && (
                                        <div className="flex justify-between items-center mt-2">
                                          <span className="text-gray-600 dark:text-gray-300">Parent 2:</span>
                                          <div className="text-right">
                                            <span className="block font-medium text-gray-900 dark:text-white">{member['parent_name_2']}</span>
                                            {member['parent_phone_2'] && (
                                              <span className="block text-xs text-gray-500 dark:text-gray-400">{member['parent_phone_2']}</span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="space-y-1.5 sm:space-y-2">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-sm sm:text-sm">Actions</h4>
                                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-2">
                                  <button
                                    onClick={() => setEditingMember(member)}
                                    className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 sm:py-1.5 text-xs sm:text-xs text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 rounded transition-colors sm:flex-1 md:flex-none"
                                  >
                                    <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span>Edit Member</span>
                                  </button>
                                  <button
                                    type="button"
                                    onTouchStart={(e) => { e.stopPropagation() }}
                                    onClick={(e) => openDeleteConfirm(e, member)}
                                    style={{ touchAction: 'manipulation' }}
                                    className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 sm:py-1.5 text-xs sm:text-xs text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors sm:flex-1 md:flex-none"
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
                                          className={`flex-1 px-2 py-1 rounded text-xs font-bold transition-all duration-200 ${isPresent
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
                                          className={`flex-1 px-2 py-1 rounded text-xs font-bold transition-all duration-200 ${isAbsent
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
                  </div>
                )
              })}

              {(hasMoreMembers || (!searchTerm && tabFilteredMembers.length > 0)) && (
                <div className="lg:col-span-3 mt-4 mb-4 flex flex-col items-center justify-center space-y-2">
                  {/* Load More Button */}
                  {hasMoreMembers && (
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
                          <span>Load More ({Math.max(tabFilteredMembers.length - displayLimit, 0)} remaining)</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Members count info */}
                  {!searchTerm && tabFilteredMembers.length > 0 && (
                    <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 text-center">
                      Showing {Math.min(displayLimit, tabFilteredMembers.length)} of {tabFilteredMembers.length} members
                    </div>
                  )}
                </div>
              )}

            </>
          )
        })()}
      </div>

      {/* Empty State */}
      {((dashboardTab === 'edited' && getTabFilteredMembers().length === 0) || (dashboardTab !== 'edited' && filteredMembers.length === 0)) && !loading && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No members found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {dashboardTab === 'edited'
              ? 'No edited members yet. Mark Present or Absent to see them here.'
              : searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by adding your first member'}
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

      {/* QR modal: shows QR code and WhatsApp share link for admin to send/scan */}
      {openQrModal && (
        <QRModal
          isOpen={openQrModal}
          member={qrMember}
          onClose={() => { setOpenQrModal(false); setQrMember(null) }}
        />
      )}

      {/* Delete Confirm Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md mx-4 overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* Header with warning icon */}
            <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Confirm Deletion</h3>
              </div>
              <button
                onClick={() => { setIsDeleteConfirmOpen(false); setMemberToDelete(null) }}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              </button>
            </div>

            {/* Enhanced confirmation message */}
            <div className="px-6 py-6 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Are you sure you want to delete this member?
                </h4>
                <p className="text-xl font-bold text-red-600 dark:text-red-400 mb-3">
                  {memberToDelete?.['full_name'] || memberToDelete?.['Full Name']}
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span><strong>This action cannot be undone.</strong> The member will be permanently removed from the system.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced action buttons */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 flex gap-3">
              <button
                onClick={() => { setIsDeleteConfirmOpen(false); setMemberToDelete(null) }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg hover:shadow-xl"
              >
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Month Modal */}
      <MonthModal
        isOpen={showMonthModal}
        onClose={() => setShowMonthModal(false)}
      />

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        confirmButtonClass={confirmModalConfig.confirmButtonClass}
        cancelButtonClass={confirmModalConfig.cancelButtonClass}
      />

      {/* Missing Data Modal */}
      {showMissingDataModal && missingDataMember && (
        <MissingDataModal
          member={missingDataMember}
          missingFields={missingFields}
          missingDates={missingDates}
          pendingAttendanceAction={pendingAttendanceAction}
          selectedAttendanceDate={new Date(getTargetDate(currentTable))}
          onClose={() => {
            setShowMissingDataModal(false)
            setMissingDataMember(null)
            setMissingFields([])
            setMissingDates([])
            setPendingAttendanceAction(null)
          }}
          onSave={async () => {
            // The modal handles the attendance marking internally using the correct date
            const dateStr = getTargetDate(currentTable)
            const present = pendingAttendanceAction?.present

            // Just show a success toast here if needed, or rely on the modal's toast
            // The modal shows "Attendance saved (Override)" or "Missing data saved successfully!"

            setPendingAttendanceAction(null)
          }}
        />
      )}

      {/* Bottom Search Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 safe-area-bottom">
        <div className="mx-auto px-3 sm:px-4 py-3">
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
          </div>
        </div>
      </div>

      {/* Add padding to prevent content from being hidden behind bottom search bar */}
      <div className="h-12" />
    </div>
  )
}

export default Dashboard
