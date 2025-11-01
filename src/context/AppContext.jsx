import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

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

// Get the latest available table with persistence
const getLatestTable = () => {
  // Try to get saved table from localStorage
  const savedTable = localStorage.getItem('selectedMonthTable')
  if (savedTable && FALLBACK_MONTHLY_TABLES.includes(savedTable)) {
    return savedTable
  }
  
  // Default to current month if available, otherwise October_2025
  const currentMonthTable = getCurrentMonthTable()
  if (FALLBACK_MONTHLY_TABLES.includes(currentMonthTable)) {
    return currentMonthTable
  }
  
  return 'October_2025'
}

// Mock data for development when Supabase is not configured
const mockMembers = [
  {
    id: '1',
    'Full Name': 'John Doe',
    'Gender': 'Male',
    'Phone Number': '123-456-7890',
    'Age': '16',
    'Current Level': 'SHS1',
    inserted_at: new Date().toISOString()
  },
  {
    id: '2',
    'Full Name': 'Jane Smith',
    'Gender': 'Female',
    'Phone Number': '098-765-4321',
    'Age': '15',
    'Current Level': 'JHS3',
    inserted_at: new Date().toISOString()
  },
  {
    id: '3',
    'Full Name': 'Michael Johnson',
    'Gender': 'Male',
    'Phone Number': '555-123-4567',
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
  const [attendanceData, setAttendanceData] = useState({})
  const [currentTable, setCurrentTable] = useState(getLatestTable())
  const [monthlyTables, setMonthlyTables] = useState(FALLBACK_MONTHLY_TABLES)
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(null)
  const [availableSundayDates, setAvailableSundayDates] = useState([])

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
        .order('inserted_at', { ascending: false })

      if (error) {
        console.error('Error fetching members:', error)
        console.log('Error details:', error.message, error.code)
        
        // Check if it's a table not found error
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          toast.error(`Table ${tableName} does not exist in database. Using mock data.`)
          console.log(`Table ${tableName} not found, using mock data`)
        } else {
          toast.error(`Failed to fetch members from ${tableName}: ${error.message}`)
        }
        setMembers(mockMembers) // Fallback to mock data
      } else {
        // Filter out records with null Full Name
        const validMembers = (data || []).filter(member => member['Full Name'])
        setMembers(validMembers)
        console.log(`Successfully loaded ${validMembers.length} members from ${tableName}`)
        toast.success(`Loaded ${validMembers.length} members from ${tableName}`)
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
          'Full Name': memberData.fullName || memberData['Full Name'],
          'Gender': memberData.gender || memberData['Gender'],
          'Phone Number': memberData.phoneNumber || memberData['Phone Number'],
          'Age': memberData.age || memberData['Age'],
          'Current Level': memberData.currentLevel || memberData['Current Level'],
          'Member Status': 'New', // Default status for new members
          'Badge Type': 'New Member', // Default badge
          'Join Date': new Date().toISOString().split('T')[0], // Join date
          'Manual Badge': null, // For manually assigned badges
          inserted_at: new Date().toISOString()
        }
        setMembers(prev => [newMember, ...prev])
        toast.success('Member added successfully! (Demo Mode)')
        return { success: true, data: newMember }
      }

      // Transform data to match monthly table structure
      const transformedData = {
        'Full Name': memberData.fullName || memberData['Full Name'],
        'Gender': memberData.gender || memberData['Gender'],
        'Phone Number': parseInt(memberData.phoneNumber || memberData['Phone Number']),
        'Age': memberData.age || memberData['Age'],
        'Current Level': memberData.currentLevel || memberData['Current Level']
      }

      const { data, error } = await supabase
        .from(currentTable)
        .insert([transformedData])
        .select()

      if (error) throw error

      setMembers(prev => [data[0], ...prev])
      toast.success(`Member added successfully to ${currentTable}!`)
      return { success: true, data: data[0] }
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('Failed to add member')
      return { success: false, error }
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
    
    // Set default to 2nd Sunday if available, otherwise first available Sunday
    if (sundays.length > 0) {
      const defaultDate = sundays.length >= 2 ? sundays[1] : sundays[0]
      setSelectedAttendanceDate(defaultDate)
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
      return 'New Member'
    }
    
    // Regular member badges based on attendance
    if (attendanceRate >= 90) {
      return 'Super Regular'
    } else if (attendanceRate >= 75) {
      return 'Regular Member'
    } else if (attendanceRate >= 50) {
      return 'Active Member'
    } else {
      return 'Occasional Member'
    }
  }

  // Update member badges for all members
  const updateMemberBadges = () => {
    setMembers(prev => prev.map(member => ({
      ...member,
      'Badge Type': calculateMemberBadge(member),
      'Attendance Rate': calculateAttendanceRate(member)
    })))
  }

  // Manually assign badge to member
  const assignManualBadge = async (memberId, badgeType) => {
    try {
      if (!isSupabaseConfigured()) {
        // Demo mode - update local state
        setMembers(prev => prev.map(member => 
          member.id === memberId 
            ? { ...member, 'Manual Badge': badgeType, 'Badge Type': badgeType }
            : member
        ))
        toast.success('Badge assigned successfully! (Demo Mode)')
        return { success: true }
      }

      // Prepare update object
      const updateData = { 'Manual Badge': badgeType }
      
      // If current table is November_2025, also update role columns
      if (currentTable === 'November_2025') {
        // Clear all role columns first
        updateData.Member = null
        updateData.Regular = null
        updateData.Newcomer = null
        
        // Set the appropriate role column based on badge type
        if (badgeType === 'member') {
          updateData.Member = 'Yes'
        } else if (badgeType === 'regular') {
          updateData.Regular = 'Yes'
        } else if (badgeType === 'newcomer') {
          updateData.Newcomer = 'Yes'
        }
      }

      const { data, error } = await supabase
        .from(currentTable)
        .update(updateData)
        .eq('id', memberId)
        .select()

      if (error) throw error

      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, 'Manual Badge': badgeType, 'Badge Type': badgeType }
          : member
      ))

      toast.success('Badge assigned successfully!')
      return { success: true }
    } catch (error) {
      console.error('Error assigning badge:', error)
      toast.error('Failed to assign badge')
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
          [attendanceColumn]: present ? 'Present' : 'Absent'
        })
        .eq('id', memberId)

      if (error) throw error

      // Update local state
      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, [attendanceColumn]: present ? 'Present' : 'Absent' }
          : member
      ))

      toast.success('Attendance marked successfully!')
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

      // Update local state
      setMembers(prev => prev.map(member => 
        memberIds.includes(member.id)
          ? { ...member, [attendanceColumn]: attendanceValue }
          : member
      ))

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
        const updatedMember = { ...members.find(m => m.id === id), ...updates }
        setMembers(prev => prev.map(m => m.id === id ? updatedMember : m))
        toast.success('Member updated successfully! (Demo Mode)')
        return updatedMember
      }

      const { data, error } = await supabase
        .from(currentTable)
        .update(updates)
        .eq('id', id)
        .select()
      
      if (error) throw error
      setMembers(prev => prev.map(m => m.id === id ? data[0] : m))
      toast.success(`Member updated successfully in ${currentTable}!`)
      return data[0]
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error('Failed to update member')
      throw error
    }
  }

  // Delete member
  const deleteMember = async (id) => {
    try {
      if (!isSupabaseConfigured()) {
        // Demo mode - remove from local state
        setMembers(prev => prev.filter(m => m.id !== id))
        toast.success('Member deleted successfully! (Demo Mode)')
        return
      }

      const { error } = await supabase
        .from(currentTable)
        .delete()
        .eq('id', id)
      
      if (error) throw error
      setMembers(prev => prev.filter(m => m.id !== id))
      toast.success(`Member deleted successfully from ${currentTable}!`)
    } catch (error) {
      console.error('Error deleting member:', error)
      toast.error('Failed to delete member')
      throw error
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
      const years = ['2024', '2025', '2026']
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
        toast.success(`Found ${availableTables.length} monthly tables`)
      } else {
        console.log('No monthly tables found, using fallback')
      }
    } catch (error) {
      console.error('Error fetching monthly tables:', error)
    }
  }

  // Filter members based on search term
  const filteredMembers = members.filter(member =>
    member['Full Name']?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  const value = {
    members,
    filteredMembers,
    loading,
    searchTerm,
    setSearchTerm,
    addMember,
    updateMember,
    deleteMember,
    fetchMembers,
    attendanceData,
    setAttendanceData,
    markAttendance,
    bulkAttendance,
    fetchAttendanceForDate,
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
    assignManualBadge,
    selectedAttendanceDate,
    setSelectedAttendanceDate,
    availableSundayDates,
    getAvailableSundayDates,
    initializeAttendanceDates,
    getSundaysInMonth
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContext