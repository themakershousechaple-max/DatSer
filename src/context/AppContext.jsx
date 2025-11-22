import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-toastify'

const AppContext = createContext()

// Get current month table name
const getCurrentMonthTable = () => {
  const now = new Date()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const currentMonth = monthNames[now.getMonth()]
  const currentYear = now.getFullYear()
  return `${currentMonth}_${currentYear}`
}

// Fallback monthly tables for when Supabase is not configured
const FALLBACK_MONTHLY_TABLES = [
  'January_2025', 'February_2025', 'April_2025', 'May_2025', 
  'June_2025', 'July_2025', 'August_2025', 'September_2025', 'October_2025', 'November_2025'
]

const DEFAULT_ATTENDANCE_DATES = {
  'November_2025': '2025-11-16'
}

// Get the latest available table with persistence
const getLatestTable = () => {
  // Force November_2025 as default (clear old localStorage)
  localStorage.removeItem('selectedMonthTable')
  localStorage.setItem('selectedMonthTable', 'November_2025')
  
  // Try to get saved table from localStorage
  const savedTable = localStorage.getItem('selectedMonthTable')
  if (savedTable && FALLBACK_MONTHLY_TABLES.includes(savedTable)) {
    return savedTable
  }
  
  // Default to current month if available, otherwise November_2025
  const currentMonthTable = getCurrentMonthTable()
  if (FALLBACK_MONTHLY_TABLES.includes(currentMonthTable)) {
    return currentMonthTable
  }
  
  return 'November_2025'
}

// Mock data for development when Supabase is not configured
const mockMembers = [
  {
    id: '1',
    'Full Name': 'John Doe',
    'Gender': 'Male',
    'Phone Number': 1234567890,
    'Age': '16',
    'Current Level': 'SHS1',
    inserted_at: new Date().toISOString()
  },
  {
    id: '2',
    'Full Name': 'Jane Smith',
    'Gender': 'Female',
    'Phone Number': 987654321,
    'Age': '15',
    'Current Level': 'JHS3',
    inserted_at: new Date().toISOString()
  },
  {
    id: '3',
    'Full Name': 'Michael Johnson',
    'Gender': 'Male',
    'Phone Number': 555123456,
    'Age': '17',
    'Current Level': 'SHS2',
    inserted_at: new Date().toISOString()
  }
]

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [serverSearchResults, setServerSearchResults] = useState(null)
  const searchCacheRef = useRef(new Map())
  const nameColumnCacheRef = useRef(new Map())
  const [attendanceData, setAttendanceData] = useState({})
  const [currentTable, setCurrentTable] = useState(getLatestTable())
  const [monthlyTables, setMonthlyTables] = useState(FALLBACK_MONTHLY_TABLES)
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(null)
  const [availableSundayDates, setAvailableSundayDates] = useState([])
  // Global dashboard tab state (mobile header controls All/Edited)
  const [dashboardTab, setDashboardTab] = useState('all')
  
  // Badge filter state - persisted across all components
  const [badgeFilter, setBadgeFilter] = useState(() => {
    const saved = localStorage.getItem('badgeFilter')
    return saved ? JSON.parse(saved) : [] // Start with no badges selected
  })

  // Check if Supabase is properly configured
  const isSupabaseConfigured = () => {
    return supabase && import.meta.env.VITE_SUPABASE_URL && 
           import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_url_here' &&
           import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'
  }

  // Fetch members from current monthly table or use mock data
  const fetchMembers = async (tableName = currentTable) => {
    try {
      setLoading(true)
      console.log(`Fetching members from table: ${tableName}`)
      
      if (!isSupabaseConfigured()) {
        console.log('Using mock data - Supabase not configured')
        setMembers(mockMembers)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('*')

      if (error) {
        console.error('Error fetching members:', error)
        console.log('Error details:', error.message, error.code)
        
        // Only fallback to mock data when table clearly does not exist
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          toast.error(`Table ${tableName} does not exist in database. Using mock data.`)
          console.log(`Table ${tableName} not found, using mock data`)
          setMembers(mockMembers)
        } else {
          // Keep existing members; surface the error without replacing with mock
          toast.error(`Failed to fetch members from ${tableName}: ${error.message}`)
          console.warn('Fetch members failed; preserving current member list.')
        }
      } else {
        // Filter out records with null name, then normalize both name keys
        const validMembers = (data || []).filter(member => member['full_name'] || member['Full Name'])
        const normalizedMembers = validMembers.map(member => {
          const name = (
            typeof member['full_name'] === 'string' && member['full_name'].trim()
          ) ? member['full_name'] : (typeof member['Full Name'] === 'string' ? member['Full Name'] : '')
          return { ...member, full_name: name, 'Full Name': name }
        })
        setMembers(normalizedMembers)
        console.log(`Successfully loaded ${normalizedMembers.length} members from ${tableName}`)
        console.log('First few members:', normalizedMembers.slice(0, 3))
        console.log('Sample member structure:', normalizedMembers[0])
        // Removed automatic toast notification on page load
      }
    } catch (error) {
      console.error('Unexpected error in fetchMembers:', error)
      console.log(`Setting mock members (${mockMembers.length} members) due to error`)
      setMembers(mockMembers) // Fallback to mock data
    } finally {
      setLoading(false)
    }
  }

  // Add new member to current monthly table
  const addMember = async (memberData) => {
    try {
      if (!isSupabaseConfigured()) {
        // Demo mode - add to local state
        const newMember = {
          id: Date.now().toString(),
          'Full Name': memberData.full_name || memberData.fullName || memberData['Full Name'],
          'Gender': memberData.gender || memberData['Gender'],
          'Phone Number': memberData.phone_number || memberData.phoneNumber || memberData['Phone Number'],
          'Age': memberData.age || memberData['Age'],
          'Current Level': memberData.current_level || memberData.currentLevel || memberData['Current Level'],
          'Member Status': 'New', // Default status for new members
          'Badge Type': 'newcomer', // Default badge
          'Join Date': new Date().toISOString().split('T')[0], // Join date
          'Manual Badge': null, // For manually assigned badges
          inserted_at: new Date().toISOString()
        }
        setMembers(prev => [newMember, ...prev])
        toast.success('Member added successfully! (Demo Mode)')
        // Return the created member object directly for downstream usage
        return newMember
      }

      // Helper: sanitize phone to fit int4 (last 9 digits)
      const sanitizePhoneToInt = (val) => {
        if (val === undefined || val === null) return null
        const digits = String(val).replace(/\D+/g, '')
        if (!digits) return null
        const last9 = digits.slice(-9)
        const num = Number.parseInt(last9, 10)
        return Number.isFinite(num) ? num : null
      }

      // Transform data to match monthly table structure
      const genRaw = memberData.gender || memberData['Gender']
      const gen = typeof genRaw === 'string'
        ? (genRaw.trim().toLowerCase() === 'male' ? 'Male' : genRaw.trim().toLowerCase() === 'female' ? 'Female' : genRaw)
        : genRaw
      const ageRaw = memberData.age || memberData['Age']
      const ageParsed = ageRaw === undefined || ageRaw === null || ageRaw === '' ? null : Number.parseInt(ageRaw, 10)
      const transformedData = {
        'Full Name': memberData.full_name || memberData.fullName || memberData['Full Name'],
        'Gender': gen,
        'Phone Number': sanitizePhoneToInt(memberData.phone_number ?? memberData.phoneNumber ?? memberData['Phone Number']),
        'Age': Number.isFinite(ageParsed) ? ageParsed : null,
        'Current Level': memberData.current_level || memberData.currentLevel || memberData['Current Level'],
        // Optional parent info fields
        parent_name_1: memberData.parent_name_1 || null,
        parent_phone_1: memberData.parent_phone_1 || null,
        parent_name_2: memberData.parent_name_2 || null,
        parent_phone_2: memberData.parent_phone_2 || null
      }

      const { data, error } = await supabase
        .from(currentTable)
        .insert([transformedData])
        .select()

      if (error) throw error

      setMembers(prev => [data[0], ...prev])
      toast.success(`Member added successfully to ${currentTable}!`)
      // Return the created member row directly
      return data[0]
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('Failed to add member')
      // Propagate error; callers can catch
      throw error
    }
  }

  // Get attendance column name for a given date
  const getAttendanceColumn = (date) => {
    const day = date.getDate()
    let suffix = 'th'
    if (day === 1 || day === 21 || day === 31) suffix = 'st'
    else if (day === 2 || day === 22) suffix = 'nd'
    else if (day === 3 || day === 23) suffix = 'rd'
    return `Attendance ${day}${suffix}`
  }

  // Get all attendance columns for the current table
  const getAttendanceColumns = async () => {
    try {
      if (!isSupabaseConfigured()) return []
      
      const { data, error } = await supabase.rpc('get_table_columns', {
        table_name: currentTable
      })
      
      if (error) {
        console.error('Error getting table columns:', error)
        return []
      }
      
      // Filter for attendance columns
      return data?.filter(col => col.column_name.startsWith('Attendance ')) || []
    } catch (error) {
      console.error('Error getting attendance columns:', error)
      return []
    }
  }

  // Get available attendance dates for the current table
  const getAvailableAttendanceDates = async () => {
    try {
      const attendanceColumns = await getAttendanceColumns()
      
      // Extract dates from column names and sort them
      const dates = attendanceColumns
        .map(col => {
          const match = col.column_name.match(/Attendance (\d+)(st|nd|rd|th)/)
          return match ? parseInt(match[1]) : null
        })
        .filter(date => date !== null)
        .sort((a, b) => a - b)
      
      return dates
    } catch (error) {
      console.error('Error getting available attendance dates:', error)
      return []
    }
  }

  // Helper function to get all Sundays in a month
  const getSundaysInMonth = (monthName, year) => {
    const monthIndex = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ].indexOf(monthName)
    
    if (monthIndex === -1) {
      throw new Error(`Invalid month name: ${monthName}`)
    }
    
    const sundays = []
    const date = new Date(year, monthIndex, 1)
    
    // Find the first Sunday of the month
    while (date.getDay() !== 0) {
      date.setDate(date.getDate() + 1)
    }
    
    // Collect all Sundays in the month
    while (date.getMonth() === monthIndex) {
      sundays.push(new Date(date))
      date.setDate(date.getDate() + 7)
    }
    
    return sundays
  }

  // Get available Sunday dates for the current table
  const getAvailableSundayDates = async () => {
    try {
      // Parse the current table to get month and year
      const [monthName, year] = currentTable.split('_')
      const yearNum = parseInt(year)
      
      // Get all Sundays in the month
      const allSundays = getSundaysInMonth(monthName, yearNum)
      
      // Get attendance columns to see which Sundays have columns
      const attendanceColumns = await getAttendanceColumns()
      
      // Filter Sundays that have corresponding attendance columns
      const availableSundays = allSundays.filter(sunday => {
        const dayOfMonth = sunday.getDate()
        return attendanceColumns.some(col => {
          const match = col.column_name.match(/Attendance (\d+)(st|nd|rd|th)/)
          return match && parseInt(match[1]) === dayOfMonth
        })
      })
      
      return availableSundays
    } catch (error) {
      console.error('Error getting available Sunday dates:', error)
      return []
    }
  }

  // Initialize available Sunday dates and set default selected date
  const initializeAttendanceDates = async () => {
    const sundays = await getAvailableSundayDates()
    setAvailableSundayDates(sundays)
    
    if (sundays.length > 0) {
      // Try to restore user's last selected date from localStorage
      const savedDateKey = `selectedAttendanceDate_${currentTable}`
      const savedDate = localStorage.getItem(savedDateKey)
      
      if (savedDate) {
        // Check if the saved date is still available in current month
        const savedDateTime = new Date(savedDate)
        const matchingDate = sundays.find(sunday => {
          // Compare dates by year, month, and day (ignore time differences)
          return sunday.getFullYear() === savedDateTime.getFullYear() &&
                 sunday.getMonth() === savedDateTime.getMonth() &&
                 sunday.getDate() === savedDateTime.getDate()
        })
        
        if (matchingDate) {
          setSelectedAttendanceDate(matchingDate)
          return
        }
      }
      
      const twentyThird = sundays.find(sunday => sunday.getDate() === 23) || null

      const configured = DEFAULT_ATTENDANCE_DATES[currentTable]
      let defaultDate = null
      if (configured) {
        const cfgDate = new Date(configured)
        defaultDate = sundays.find(sunday => (
          sunday.getFullYear() === cfgDate.getFullYear() &&
          sunday.getMonth() === cfgDate.getMonth() &&
          sunday.getDate() === cfgDate.getDate()
        )) || null
      }
      if (!defaultDate) {
        defaultDate = twentyThird || (sundays.length >= 2 ? sundays[1] : sundays[0])
      }
      setAndSaveAttendanceDate(defaultDate)
    }
  }

  // Calculate member attendance rate
  const calculateAttendanceRate = (member) => {
    const attendanceColumns = Object.keys(member).filter(key => 
      key.startsWith('Attendance ') && member[key] !== null && member[key] !== undefined
    )
    
    if (attendanceColumns.length === 0) return 0
    
    const presentCount = attendanceColumns.filter(col => 
      member[col] === 'Present' || member[col] === true
    ).length
    
    return Math.round((presentCount / attendanceColumns.length) * 100)
  }

  // Calculate member badge based on attendance and join date
  const calculateMemberBadge = (member) => {
    const joinDate = new Date(member['Join Date'] || member.inserted_at)
    const now = new Date()
    const daysSinceJoin = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24))
    const attendanceRate = calculateAttendanceRate(member)
    
    // Check for manual badge first
    if (member['Manual Badge']) {
      return member['Manual Badge']
    }
    
    // New member (less than 30 days)
    if (daysSinceJoin < 30) {
      return 'newcomer'
    }
    
    // Regular member badges based on attendance
    if (attendanceRate >= 75) {
      return 'regular'
    } else if (attendanceRate >= 50) {
      return 'member'
    } else {
      return 'newcomer'
    }
  }

  // Update member badges for all members
  const updateMemberBadges = () => {
    setMembers(prev => prev.map(member => ({
      ...member,
      // Only update Badge Type if there's no Manual Badge assigned
      'Badge Type': member['Manual Badge'] || calculateMemberBadge(member),
      'Attendance Rate': calculateAttendanceRate(member)
    })))
  }

  // Toggle badge for member (supports multiple badges) - similar to attendance toggle
  const toggleMemberBadge = async (memberId, badgeType, options = {}) => {
    try {
      const { suppressToast = false } = options
      console.log(`Toggling ${badgeType} badge for member ${memberId}`)
      console.log('Supabase configured:', isSupabaseConfigured())
      console.log('Current table:', currentTable)
      
      // Find the member and log their current badge status
      const member = members.find(m => m.id === memberId)
      const memberName = member ? (member['Full Name'] || member['full_name']) : 'Member'
      console.log('Member found:', memberName)
      console.log('Current badge values:', {
        Member: member?.Member,
        Regular: member?.Regular,
        Newcomer: member?.Newcomer,
        'Manual Badges': member?.['Manual Badges']
      })
      
      if (!isSupabaseConfigured()) {
        // Demo mode - update local state
        setMembers(prev => prev.map(member => {
          if (member.id === memberId) {
            const currentBadges = member['Manual Badges'] || []
            let updatedBadges
            
            if (currentBadges.includes(badgeType)) {
              // Remove badge if already selected
              updatedBadges = currentBadges.filter(badge => badge !== badgeType)
            } else {
              // Add badge if not selected
              updatedBadges = [...currentBadges, badgeType]
            }
            
            const updatedMember = { ...member, 'Manual Badges': updatedBadges }
            return updatedMember
          }
          return member
        }))
        return { success: true }
      }

      // For Supabase, handle individual badge toggling like attendance
      const targetMember = members.find(m => m.id === memberId)
      
      // Check current badge status - this determines if we're turning ON or OFF
      const currentlyHasBadge = memberHasBadge(targetMember, badgeType)
      console.log(`Current badge status for ${badgeType}:`, currentlyHasBadge)
      
      // Prepare update object - toggle the badge state
      const updateData = {}
      
      // Update the specific badge column (toggle: if has badge, remove it; if doesn't have badge, add it)
      if (badgeType === 'member') {
        updateData.Member = currentlyHasBadge ? null : 'Yes'
      } else if (badgeType === 'regular') {
        updateData.Regular = currentlyHasBadge ? null : 'Yes'
      } else if (badgeType === 'newcomer') {
        updateData.Newcomer = currentlyHasBadge ? null : 'Yes'
      }

      console.log('Update data:', updateData)
      console.log('Updating member ID:', memberId)
      
      const { data, error } = await supabase
        .from(currentTable)
        .update(updateData)
        .eq('id', memberId)
        .select()

      console.log('Supabase update result:', { data, error })
      
      if (error) throw error

      // Update local state to reflect the change
      setMembers(prev => prev.map(member => {
        if (member.id === memberId) {
          const updatedMember = { ...member }
          
          // Update the specific badge column in local state
          if (badgeType === 'member') {
            updatedMember.Member = currentlyHasBadge ? null : 'Yes'
          } else if (badgeType === 'regular') {
            updatedMember.Regular = currentlyHasBadge ? null : 'Yes'
          } else if (badgeType === 'newcomer') {
            updatedMember.Newcomer = currentlyHasBadge ? null : 'Yes'
          }
          
          return updatedMember
        }
        return member
      }))

      // Show success message like attendance system (unless suppressed)
      if (!suppressToast) {
        if (currentlyHasBadge) {
          toast.success(`${badgeType.charAt(0).toUpperCase() + badgeType.slice(1)} badge removed for: ${memberName}`, {
            style: {
              background: '#f3f4f6',
              color: '#374151'
            }
          })
        } else {
          toast.success(`${badgeType.charAt(0).toUpperCase() + badgeType.slice(1)} badge assigned to: ${memberName}`, {
            style: {
              background: '#10b981',
              color: '#ffffff'
            }
          })
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error toggling badge:', error)
      toast.error('Failed to update badge. Please try again.')
      return { success: false, error }
    }
  }

  const findAttendanceColumnForDate = async (date) => {
    try {
      const attendanceColumns = await getAttendanceColumns()
      const dayOfMonth = date.getDate()
      
      // Find the column that matches this day of month
      const matchingColumn = attendanceColumns.find(col => {
        const match = col.column_name.match(/Attendance (\d+)(st|nd|rd|th)/)
        return match && parseInt(match[1]) === dayOfMonth
      })
      
      return matchingColumn ? matchingColumn.column_name : null
    } catch (error) {
      console.error('Error finding attendance column for date:', error)
      return null
    }
  }

  // Check if attendance column exists in the current table
  const checkAttendanceColumnExists = async (attendanceColumn) => {
    try {
      if (!isSupabaseConfigured()) return true
      
      // Get all attendance columns and check if the requested one exists
      const attendanceColumns = await getAttendanceColumns()
      return attendanceColumns.some(col => col.column_name === attendanceColumn)
    } catch (error) {
      console.error('Error checking attendance column:', error)
      return false
    }
  }

  // Mark attendance for a member in monthly table
  const markAttendance = async (memberId, date, present) => {
    try {
      if (!isSupabaseConfigured()) {
        // Demo mode - update local state
        const dateKey = date.toISOString().split('T')[0]
        setAttendanceData(prev => ({
          ...prev,
          [dateKey]: {
            ...prev[dateKey],
            [memberId]: present
          }
        }))
        toast.success(`Attendance marked! (Demo Mode)`)
        return { success: true }
      }

      const attendanceColumn = await findAttendanceColumnForDate(date)
      
      if (!attendanceColumn) {
        toast.error(`No attendance column found for this date in ${currentTable}`)
        return { success: false, error: 'Column does not exist' }
      }
      
      const { data, error } = await supabase
        .from(currentTable)
        .update({
          [attendanceColumn]: present === null ? null : (present ? 'Present' : 'Absent')
        })
        .eq('id', memberId)

      if (error) throw error

      // Update local state for members
      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, [attendanceColumn]: present === null ? null : (present ? 'Present' : 'Absent') }
          : member
      ))

      // Update local state for attendanceData (for real-time UI updates)
      const dateKey = date.toISOString().split('T')[0]
      setAttendanceData(prev => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          [memberId]: present
        }
      }))

      return { success: true }
    } catch (error) {
      console.error('Error marking attendance:', error)
      toast.error('Failed to mark attendance')
      return { success: false, error }
    }
  }

  // Bulk attendance marking for monthly table
  const bulkAttendance = async (memberIds, date, present) => {
    try {
      if (!isSupabaseConfigured()) {
        // Demo mode - update local state
        const dateKey = date.toISOString().split('T')[0]
        const updates = {}
        memberIds.forEach(id => {
          updates[id] = present
        })
        setAttendanceData(prev => ({
          ...prev,
          [dateKey]: {
            ...prev[dateKey],
            ...updates
          }
        }))
        toast.success(`Bulk attendance marked! (Demo Mode)`)
        return { success: true }
      }

      const attendanceColumn = await findAttendanceColumnForDate(date)
      
      if (!attendanceColumn) {
        toast.error(`No attendance column found for this date in ${currentTable}`)
        return { success: false, error: 'Column does not exist' }
      }
      
      const attendanceValue = present ? 'Present' : 'Absent'

      // Update each member's attendance in the monthly table
      const updatePromises = memberIds.map(memberId => 
        supabase
          .from(currentTable)
          .update({ [attendanceColumn]: attendanceValue })
          .eq('id', memberId)
      )

      const results = await Promise.all(updatePromises)
      
      // Check for errors
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} records`)
      }

      // Update local state for members
      setMembers(prev => prev.map(member => 
        memberIds.includes(member.id)
          ? { ...member, [attendanceColumn]: attendanceValue }
          : member
      ))

      // Update local state for attendanceData (for real-time UI updates)
      const dateKey = date.toISOString().split('T')[0]
      const updates = {}
      memberIds.forEach(id => {
        updates[id] = present
      })
      setAttendanceData(prev => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          ...updates
        }
      }))

      toast.success(`Bulk attendance marked successfully for ${memberIds.length} members!`)
      return { success: true }
    } catch (error) {
      console.error('Error marking bulk attendance:', error)
      toast.error('Failed to mark bulk attendance')
      return { success: false, error }
    }
  }

  // Fetch attendance for a specific date from monthly table
  const fetchAttendanceForDate = async (date) => {
    try {
      if (!isSupabaseConfigured()) {
        // Demo mode - return mock attendance data
        const dateKey = date.toISOString().split('T')[0]
        return attendanceData[dateKey] || {}
      }

      const attendanceColumn = await findAttendanceColumnForDate(date)
      
      if (!attendanceColumn) {
        console.log(`No attendance column found for this date in ${currentTable}`)
        return {}
      }
      
      const { data, error } = await supabase
        .from(currentTable)
        .select(`id, "${attendanceColumn}"`)

      if (error) throw error

      // Transform to object format
      const attendanceMap = {}
      data.forEach(record => {
        if (record[attendanceColumn]) {
          attendanceMap[record.id] = record[attendanceColumn] === 'Present'
        }
      })

      return attendanceMap
    } catch (error) {
      console.error('Error fetching attendance:', error)
      return {}
    }
  }

  // Update member
  const updateMember = async (id, updates) => {
    try {
      if (!isSupabaseConfigured()) {
        // Demo mode - update local state
        const baseMember = members.find(m => m.id === id) || {}
        const updatedMember = { ...baseMember, ...updates }
        const updatedNameDemo = (
          typeof updates.full_name === 'string' && updates.full_name.trim()
        ) ? updates.full_name : (typeof updates['Full Name'] === 'string' ? updates['Full Name'] : undefined)
        if (updatedNameDemo !== undefined) {
          updatedMember['full_name'] = updatedNameDemo
          updatedMember['Full Name'] = updatedNameDemo
        }
        setMembers(prev => prev.map(m => m.id === id ? updatedMember : m))
        toast.success('Member updated successfully! (Demo Mode)')
        return updatedMember
      }

      // Defensive copy so we can safely normalize values
      let normalized = { ...updates }

      // Normalize name field using schema-aware detection
      const nameCol = await resolveNameColumn(currentTable)
      const incomingName = (
        typeof normalized.full_name === 'string' && normalized.full_name.trim()
      ) ? normalized.full_name : (typeof normalized['Full Name'] === 'string' ? normalized['Full Name'] : undefined)
      if (incomingName !== undefined) {
        normalized = { ...normalized, [nameCol]: incomingName }
        delete normalized.full_name
        delete normalized['Full Name']
      }

      // Normalize gender to capitalized values the table expects
      const incomingGender = normalized.gender ?? normalized['Gender']
      if (typeof incomingGender === 'string') {
        const cap = incomingGender.trim().toLowerCase() === 'male' ? 'Male'
          : incomingGender.trim().toLowerCase() === 'female' ? 'Female'
          : incomingGender
        normalized = { ...normalized, Gender: cap }
        delete normalized.gender
      }

      // Normalize phone number (string -> integer, empty -> null)
      const incomingPhone = normalized.phone_number ?? normalized['Phone Number']
      if (incomingPhone !== undefined) {
        const digits = String(incomingPhone).replace(/\D+/g, '')
        const last9 = digits ? digits.slice(-9) : ''
        const parsed = last9 ? Number.parseInt(last9, 10) : null
        normalized = { ...normalized, 'Phone Number': Number.isFinite(parsed) ? parsed : null }
        delete normalized.phone_number
      }

      // Normalize age (string/number -> integer, empty -> null)
      const incomingAge = normalized.age ?? normalized['Age']
      if (incomingAge !== undefined) {
        const rawAge = typeof incomingAge === 'string' ? incomingAge.trim() : incomingAge
        const ageParsed = rawAge === '' || rawAge === null ? null : Number.parseInt(rawAge, 10)
        normalized = { ...normalized, Age: Number.isFinite(ageParsed) ? ageParsed : null }
        delete normalized.age
      }

      const { data, error } = await supabase
        .from(currentTable)
        .update(normalized)
        .eq('id', id)
        .select()
      
      if (error) throw error
      
      // Update members state with the returned data
      setMembers(prev => {
        const updatedRow = data[0] || {}
        const updatedName = (
          typeof updatedRow['full_name'] === 'string' && updatedRow['full_name'].trim()
        ) ? updatedRow['full_name'] : (typeof updatedRow['Full Name'] === 'string' ? updatedRow['Full Name'] : undefined)
        console.log('Updating member in state:', id, 'with name:', updatedName)
        console.log('Updated row data:', updatedRow)
        const updatedMembers = prev.map(m => {
          if (m.id !== id) return m
          const merged = { ...m, ...updatedRow }
          if (updatedName !== undefined) {
            merged['full_name'] = updatedName
            merged['Full Name'] = updatedName
          }
          console.log('Merged member after update:', merged)
          return merged
        })
        console.log('Updated members array:', updatedMembers)
        return updatedMembers
      })

      // Update search term to trigger re-filtering
      refreshSearch()
      
      toast.success(`Member updated successfully in ${currentTable}!`)
      return data[0]
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error('Failed to update member')
      throw error
    }
  }

  // Delete member
  const deleteMember = async (memberId) => {
    // Support deletion in demo mode by updating local state so mobile users on static deployments can manage entries
    if (!isSupabaseConfigured()) {
      setMembers(prevMembers => prevMembers.filter(member => member.id !== memberId))
      // Also remove from attendanceData snapshots to keep UI consistent
      setAttendanceData(prev => {
        const next = {}
        Object.entries(prev).forEach(([dateKey, map]) => {
          const { [memberId]: _removed, ...rest } = map || {}
          next[dateKey] = rest
        })
        return next
      })
      refreshSearch()
      toast.success('Member deleted (Demo Mode)')
      return { success: true }
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from(currentTable)
        .delete()
        .eq('id', memberId)

      if (error) {
        throw error
      }

      setMembers(prevMembers => prevMembers.filter(member => member.id !== memberId))
      refreshSearch() // Re-run search to update filtered list
      console.log(`Member with ID ${memberId} deleted successfully.`)
      toast.success('Member deleted')
    } catch (error) {
      console.error('Error deleting member:', error.message)
      toast.error('Error deleting member: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Create new month by copying October's structure
  const createNewMonth = async ({ month, year, monthName, sundays }) => {
    try {
      const monthIdentifier = `${monthName}_${year}`
      
      if (!isSupabaseConfigured()) {
        // Demo mode - just show success message
        toast.success(`${monthIdentifier} created successfully! (Demo Mode)`)
        return { success: true, tableName: monthIdentifier }
      }

      console.log(`Creating new month table: ${monthIdentifier}`)

      // Use our new function to create month table by copying October's structure
      const { data: result, error: createError } = await supabase.rpc(
        'create_new_month_table',
        {
          new_month_name: monthIdentifier
        }
      )

      if (createError) {
        console.error('Error creating month table:', createError)
        throw new Error(`Failed to create month table: ${createError.message}`)
      }

      console.log('Month table creation result:', result)

      toast.success(`Month ${monthName} ${year} created successfully! Table copied from October template.`)
      
      // Refresh the monthly tables list from database
      await fetchMonthlyTables()
      
      // Switch to the new month
      changeCurrentTable(monthIdentifier)
      
      console.log(`Successfully created month: ${monthIdentifier}`)
      return { success: true, tableName: monthIdentifier, result }
    } catch (error) {
      console.error('Error creating new month:', error)
      
      // Provide detailed error information
      let errorMessage = 'Failed to create new month'
      if (error.message) {
        errorMessage += `: ${error.message}`
      } else if (error.error) {
        errorMessage += `: ${error.error}`
      }
      
      toast.error(errorMessage)
      throw error
    }
  }

  // Fetch available month tables from database
  const fetchMonthlyTables = async () => {
    try {
      if (!isSupabaseConfigured()) {
        console.log('Using fallback monthly tables - Supabase not configured')
        return
      }

      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December']
      const years = ['2025'] // Only check 2025 tables to avoid 404 errors
      const availableTables = []

      // Check each potential month table by trying to fetch from it
      for (const year of years) {
        for (const month of months) {
          const tableName = `${month}_${year}`
          try {
            // Try to fetch just one record to check if table exists
            const { data, error } = await supabase
              .from(tableName)
              .select('id')
              .limit(1)

            if (!error) {
              availableTables.push(tableName)
            }
          } catch (err) {
            // Table doesn't exist, skip it
            continue
          }
        }
      }

      if (availableTables.length > 0) {
        // Sort tables by year and then by month
        availableTables.sort((a, b) => {
          const [monthA, yearA] = a.split('_')
          const [monthB, yearB] = b.split('_')
          
          if (yearA !== yearB) {
            return parseInt(yearA) - parseInt(yearB)
          }
          
          return months.indexOf(monthA) - months.indexOf(monthB)
        })
        
        setMonthlyTables(availableTables)
        console.log('Found monthly tables:', availableTables)
        // Removed automatic toast notification on page load
      } else {
        console.log('No monthly tables found, using fallback')
      }
    } catch (error) {
      console.error('Error fetching monthly tables:', error)
    }
  }

  // Debounce search term to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 50)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Optimized filter members based on debounced search term
  const filteredMembers = useMemo(() => {
    console.log('=== SEARCH DEBUG START ===')
    console.log('Current table being searched:', currentTable)
    console.log('FilteredMembers calculation - members count:', members.length)
    console.log('FilteredMembers calculation - search term:', debouncedSearchTerm)
    console.log('All member names:', members.map(m => (m['Full Name'] || m['full_name'] || 'No Name')).join(', '))
    console.log('=== MEMBER LIST START ===')
    members.forEach((member, index) => {
      console.log(`Member ${index + 1}:`, member['Full Name'] || member['full_name'] || 'No Name')
    })
    console.log('=== MEMBER LIST END ===')
    
    if (!debouncedSearchTerm.trim()) {
      console.log('No search term, returning all members:', members.length)
      return members
    }

    if (serverSearchResults) {
      console.log('Using server search results:', serverSearchResults.length)
      return serverSearchResults
    }

    // Simple and fast search implementation
    const searchTerm = debouncedSearchTerm.toLowerCase().trim()
    console.log('Searching for:', searchTerm)
        const tokens = searchTerm.split(/\s+/).filter(Boolean)
    const filtered = members.filter(member => {
      const fullName = (
        (typeof member['full_name'] === 'string' ? member['full_name'] : '') || 
        (typeof member['Full Name'] === 'string' ? member['Full Name'] : '') || 
        ''
      ).toLowerCase()
      return tokens.every(t => fullName.includes(t))
    })
    
    console.log('Filtered results count:', filtered.length)
    console.log('Filtered member names:', filtered.map(m => (m['Full Name'] || m['full_name'] || 'No Name')).join(', '))
    return filtered
  }, [members, debouncedSearchTerm, serverSearchResults])

  const resolveNameColumn = useCallback(async (tableName) => {
    const cached = nameColumnCacheRef.current.get(tableName)
    if (cached) return cached
    if (!isSupabaseConfigured()) return 'Full Name'
    let nameCol = 'Full Name'
    try {
      // Use select('*') to avoid referencing columns that might not exist
      const { data, error } = await supabase.from(tableName).select('*').limit(1)
      if (!error && data && data.length) {
        const row = data[0]
        if (Object.prototype.hasOwnProperty.call(row, 'Full Name')) {
          nameCol = 'Full Name'
        } else if (Object.prototype.hasOwnProperty.call(row, 'full_name')) {
          nameCol = 'full_name'
        }
      }
    } catch (e) {
      // Fall back gracefully; monthly tables commonly use "Full Name"
      console.warn('resolveNameColumn fallback due to error:', e)
    }
    nameColumnCacheRef.current.set(tableName, nameCol)
    return nameCol
  }, [isSupabaseConfigured])

  const performServerSearch = useCallback(async (term) => {
    const trimmed = term.trim()
    if (!trimmed) {
      setServerSearchResults(null)
      return
    }
    if (!isSupabaseConfigured()) {
      setServerSearchResults(null)
      return
    }

    // Quick attendance keywords
    const kw = trimmed.toLowerCase()
    if (kw === 'present' || kw === 'absent') {
      await quickMarkAttendanceFromKeyword(kw)
      setServerSearchResults(null)
      return
    }

    const CACHE_DURATION = 10 * 60 * 1000
    const cacheKey = `${currentTable}::${trimmed}`
    const hit = searchCacheRef.current.get(cacheKey)
    const now = Date.now()
    if (hit && now - hit.timestamp < CACHE_DURATION) {
      setServerSearchResults(hit.data || [])
      return
    }

    const nameCol = await resolveNameColumn(currentTable)
    const isAge = /^\d{1,3}$/.test(trimmed)
    const tokenized = trimmed.split(/\s+/).filter(Boolean)
    if (tokenized.length > 1 && !isAge) {
      setServerSearchResults(null)
      return
    }
    let query = supabase.from(currentTable).select('*')
    if (isAge) {
      query = query.eq('Age', parseInt(trimmed, 10))
    } else {
      const safe = trimmed.replace(/%/g, '').replace(/_/g, '').replace(/\s+/g, ' ').trim()
      const orExpr = `"${nameCol}".ilike.%${safe}%,"${nameCol}".ilike.${safe}%,"${nameCol}".ilike.% ${safe}%`
      query = query.or(orExpr)
    }
    const { data, error } = await query
    if (error) {
      console.error('Server search error', error)
      setServerSearchResults(null)
      return
    }
    const sorted = (data || []).slice().sort((a, b) => {
      const an = (a[nameCol] || '').toString().toLowerCase()
      const bn = (b[nameCol] || '').toString().toLowerCase()
      if (an < bn) return -1
      if (an > bn) return 1
      return 0
    })
    searchCacheRef.current.set(cacheKey, { timestamp: now, data: sorted })
    setServerSearchResults(sorted)
  }, [currentTable, isSupabaseConfigured, resolveNameColumn])

  useEffect(() => {
    performServerSearch(debouncedSearchTerm)
  }, [debouncedSearchTerm, currentTable, performServerSearch])

  const quickMarkAttendanceFromKeyword = useCallback(async (kw) => {
    const list = serverSearchResults && serverSearchResults.length > 0 ? serverSearchResults : filteredMembers
    const first = list && list.length ? list[0] : null
    if (!first) return
    const statusBool = kw === 'present'
    try {
      const dateObj = selectedAttendanceDate ? new Date(selectedAttendanceDate) : new Date()
      await markAttendance(first.id, dateObj, statusBool)
      await fetchMembers(currentTable)
    } catch (e) {
      console.error('Quick mark attendance failed', e)
    }
  }, [serverSearchResults, filteredMembers, selectedAttendanceDate, markAttendance, fetchMembers, currentTable])

  // Function to refresh search results
  const refreshSearch = useCallback(() => {
    // Force immediate update of debounced search term and trigger re-computation
    const currentSearch = searchTerm
    
    // Directly update the debounced search term to ensure immediate filtering
    setDebouncedSearchTerm(currentSearch)
    
    // Log for debugging
    console.log('Refreshing search with term:', currentSearch)
  }, [searchTerm])

  // Function to force refresh members from database
  const forceRefreshMembers = useCallback(async () => {
    console.log('Force refreshing members from database...')
    toast.info('Refreshing member data...')
    
    try {
      await fetchMembers(currentTable)
      toast.success('Member data refreshed successfully!')
      console.log('Members refreshed, new count:', members.length)
    } catch (error) {
      console.error('Error refreshing members:', error)
      toast.error('Failed to refresh member data')
    }
  }, [currentTable, fetchMembers, members.length])

  // Silent variant for programmatic refreshes (no toasts)
  const forceRefreshMembersSilent = useCallback(async () => {
    console.log('Force refreshing members (silent) ...')
    try {
      await fetchMembers(currentTable)
      console.log('Members refreshed silently, new count:', members.length)
    } catch (error) {
      console.error('Error refreshing members (silent):', error)
      // No toast here to prevent notification noise
    }
  }, [currentTable, fetchMembers, members.length])

  // Function to search for a member across all monthly tables
  const searchMemberAcrossAllTables = useCallback(async (searchName) => {
    console.log('=== SEARCHING ACROSS ALL TABLES ===')
    console.log('Looking for:', searchName)
    
    const searchTerm = searchName.toLowerCase().trim()
    const foundInTables = []
    
    for (const tableName of monthlyTables) {
      try {
        console.log(`Checking table: ${tableName}`)
        
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
          
          if (error) {
            console.log(`Error accessing ${tableName}:`, error.message)
            continue
          }
          
          const foundMembers = data?.filter(member => {
            const fullName = (
              (typeof member['full_name'] === 'string' ? member['full_name'] : '') || 
              (typeof member['Full Name'] === 'string' ? member['Full Name'] : '') || 
              ''
            ).toLowerCase()
            
            return fullName.includes(searchTerm)
          }) || []
          
          if (foundMembers.length > 0) {
            console.log(`Found ${foundMembers.length} matches in ${tableName}:`)
            foundMembers.forEach(member => {
              console.log(`  - ${member['Full Name'] || member['full_name']}`)
            })
            foundInTables.push({ table: tableName, members: foundMembers })
          }
        }
      } catch (error) {
        console.log(`Error searching ${tableName}:`, error.message)
      }
    }
    
    console.log('=== SEARCH RESULTS ===')
    if (foundInTables.length === 0) {
      console.log('Member not found in any table')
      toast.error(`"${searchName}" not found in any monthly table`)
    } else {
      console.log(`Found in ${foundInTables.length} table(s):`)
      foundInTables.forEach(({ table, members }) => {
        console.log(`  ${table}: ${members.length} match(es)`)
      })
      toast.success(`Found "${searchName}" in ${foundInTables.length} table(s)`)
    }
    
    return foundInTables
  }, [monthlyTables, isSupabaseConfigured])

  // Wrapper function to set attendance date and save to localStorage
  const setAndSaveAttendanceDate = useCallback((date) => {
    setSelectedAttendanceDate(date)
    // Save to localStorage with current table as key
    const savedDateKey = `selectedAttendanceDate_${currentTable}`
    localStorage.setItem(savedDateKey, date.toISOString())
  }, [currentTable])

  // Fetch monthly tables on component mount
  useEffect(() => {
    fetchMonthlyTables()
  }, [])

  // Fetch members on component mount and when current table changes
  useEffect(() => {
    fetchMembers()
  }, [currentTable])

  // Initialize attendance dates when current table changes
  useEffect(() => {
    initializeAttendanceDates()
  }, [currentTable])

  // Wrapper function for setCurrentTable with localStorage persistence
  const changeCurrentTable = (tableName) => {
    setCurrentTable(tableName)
    localStorage.setItem('selectedMonthTable', tableName)
  }

  // Badge filter functions
  const toggleBadgeFilter = (badgeType) => {
    setBadgeFilter(prev => {
      const newFilter = prev.includes(badgeType)
        ? prev.filter(type => type !== badgeType)
        : [...prev, badgeType]
      
      // Save to localStorage
      localStorage.setItem('badgeFilter', JSON.stringify(newFilter))
      return newFilter
    })
  }

  // Helper function to check if member has a specific badge
  const memberHasBadge = (member, badgeType) => {
    // Guard against undefined member objects (e.g., during fast search renders)
    if (!member) {
      console.warn('memberHasBadge: member is undefined for badgeType', badgeType)
      return false
    }

    // Check both the Supabase columns and Manual Badges array for compatibility
    let hasSupabaseBadge = false
    let hasManualBadge = false
    
    switch (badgeType) {
      case 'member':
        hasSupabaseBadge = member['Member'] === 'Yes'
        hasManualBadge = (member['Manual Badges'] || []).includes('member')
        break
      case 'regular':
        hasSupabaseBadge = member['Regular'] === 'Yes'
        hasManualBadge = (member['Manual Badges'] || []).includes('regular')
        break
      case 'newcomer':
        hasSupabaseBadge = member['Newcomer'] === 'Yes'
        hasManualBadge = (member['Manual Badges'] || []).includes('newcomer')
        break
      default:
        return false
    }
    
    const result = hasSupabaseBadge || hasManualBadge
    console.log(`memberHasBadge(${member?.['Full Name'] || member?.['full_name']}, ${badgeType}):`, {
      hasSupabaseBadge,
      hasManualBadge,
      result,
      supabaseValue: member?.[badgeType === 'member' ? 'Member' : badgeType === 'regular' ? 'Regular' : 'Newcomer'],
      manualBadges: member?.['Manual Badges']
    })
    
    return result
  }

  // Load all attendance data for all Sunday dates in the current month
  const loadAllAttendanceData = async () => {
    try {
      if (!isSupabaseConfigured()) {
        console.log('Demo mode - attendance data will be managed locally')
        return
      }

      // Get all attendance columns for the current table
      const attendanceColumns = await getAttendanceColumns()
      
      if (attendanceColumns.length === 0) {
        console.log('No attendance columns found in current table')
        return
      }

      // Build select query for all attendance columns
      const selectColumns = ['id', ...attendanceColumns.map(col => `"${col.column_name}"`)]
      
      const { data, error } = await supabase
        .from(currentTable)
        .select(selectColumns.join(', '))

      if (error) throw error

      // Transform data into the format expected by the UI
      const newAttendanceData = {}
      
      attendanceColumns.forEach(col => {
        const columnName = col.column_name
        const dateMatch = columnName.match(/(\d+)(st|nd|rd|th)/)
        
        if (dateMatch) {
          const day = parseInt(dateMatch[1])
          // Get current month and year from table name
          const [monthName, year] = currentTable.split('_')
          const monthIndex = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ].indexOf(monthName)
          
          if (monthIndex !== -1) {
            const date = new Date(parseInt(year), monthIndex, day)
            const dateKey = date.toISOString().split('T')[0]
            
            newAttendanceData[dateKey] = {}
            
            data.forEach(record => {
              if (record[columnName]) {
                newAttendanceData[dateKey][record.id] = record[columnName] === 'Present'
              }
            })
          }
        }
      })

      // Update attendance data state
      setAttendanceData(newAttendanceData)
      console.log('Loaded attendance data for all dates:', Object.keys(newAttendanceData))
      
    } catch (error) {
      console.error('Error loading attendance data:', error)
    }
  }

  // Load all badge data for the current table
  const loadAllBadgeData = async () => {
    try {
      if (!isSupabaseConfigured()) {
        console.log('Demo mode - badge data will be managed locally')
        return
      }

      console.log('Loading badge data from Supabase...')
      
      const { data, error } = await supabase
        .from(currentTable)
        .select('id, "Member", "Regular", "Newcomer", "Manual Badge", "Badge Type"')

      if (error) {
        console.error('Error loading badge data:', error)
        return
      }

      console.log('Badge data loaded:', data?.slice(0, 3)) // Log first 3 records for debugging
      
      // Update members with badge data
      setMembers(prev => prev.map(member => {
        const badgeData = data.find(d => d.id === member.id)
        if (badgeData) {
          return {
            ...member,
            'Member': badgeData.Member,
            'Regular': badgeData.Regular,
            'Newcomer': badgeData.Newcomer,
            'Manual Badge': badgeData['Manual Badge'],
            'Badge Type': badgeData['Badge Type']
          }
        }
        return member
      }))
      
    } catch (error) {
      console.error('Error loading badge data:', error)
    }
  }

  // Load attendance and badge data when table changes
  useEffect(() => {
    if (currentTable) {
      loadAllAttendanceData()
      loadAllBadgeData()
    }
  }, [currentTable])

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel('public:members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: currentTable,
        },
        (payload) => {
          console.log('Change received!', payload);

          if (payload.eventType === 'INSERT') {
            // Add the new member to the local state
            setMembers((prevMembers) => [...prevMembers, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            // Update the existing member in the local state
            setMembers((prevMembers) =>
              prevMembers.map((member) =>
                member.id === payload.new.id ? payload.new : member
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove the deleted member from the local state
            setMembers((prevMembers) =>
              prevMembers.filter((member) => member.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentTable]);

  const value = {
    members,
    filteredMembers,
    loading,
    searchTerm,
    setSearchTerm,
    refreshSearch,
    serverSearchResults,
    forceRefreshMembers,
    forceRefreshMembersSilent,
    searchMemberAcrossAllTables,
    addMember,
    updateMember,
    deleteMember,
    fetchMembers,
    attendanceData,
    setAttendanceData,
    markAttendance,
    bulkAttendance,
    fetchAttendanceForDate,
    loadAllAttendanceData,
    loadAllBadgeData,
    currentTable,
    monthlyTables,
    setCurrentTable: changeCurrentTable,
    createNewMonth,
    fetchMonthlyTables,
    getAttendanceColumns,
    getAvailableAttendanceDates,
    findAttendanceColumnForDate,
    calculateAttendanceRate,
    calculateMemberBadge,
    updateMemberBadges,
    
    toggleMemberBadge,
    memberHasBadge,
    selectedAttendanceDate,
    setSelectedAttendanceDate,
    setAndSaveAttendanceDate,
    availableSundayDates,
    getAvailableSundayDates,
    initializeAttendanceDates,
    getSundaysInMonth,
    badgeFilter,
    toggleBadgeFilter,
    // Expose Supabase configuration status to consumers
    isSupabaseConfigured,
    // Dashboard tab controls (for mobile header segmented control)
    dashboardTab,
    setDashboardTab
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
