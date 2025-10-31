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

// Available monthly tables (you can update this list as needed)
const MONTHLY_TABLES = [
  'January_2025', 'February_2025', 'April_2025', 'May_2025', 
  'June_2025', 'July_2025', 'August_2025', 'September_2025', 'October_2025'
]

// Get the latest available table (September_2025 as specified)
const getLatestTable = () => 'September_2025'

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
  const [monthlyTables, setMonthlyTables] = useState(MONTHLY_TABLES)

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
        toast.error(`Failed to fetch members from ${tableName}`)
        setMembers(mockMembers) // Fallback to mock data
      } else {
        // Filter out records with null Full Name
        const validMembers = (data || []).filter(member => member['Full Name'])
        setMembers(validMembers)
        toast.success(`Loaded ${validMembers.length} members from ${tableName}`)
      }
    } catch (error) {
      console.error('Error:', error)
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

  // Check if attendance column exists in the current table
  const checkAttendanceColumnExists = async (attendanceColumn) => {
    try {
      if (!isSupabaseConfigured()) return true
      
      // Try a simple query to see if the column exists
      const { error } = await supabase
        .from(currentTable)
        .select(`"${attendanceColumn}"`)
        .limit(1)
      
      return !error || error.code !== '42703' // 42703 is "column does not exist" error
    } catch (error) {
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

      const attendanceColumn = getAttendanceColumn(date)
      
      // Check if the column exists before updating
      const columnExists = await checkAttendanceColumnExists(attendanceColumn)
      if (!columnExists) {
        toast.error(`Attendance column for this date does not exist in ${currentTable}`)
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

      const attendanceColumn = getAttendanceColumn(date)
      
      // Check if the column exists before updating
      const columnExists = await checkAttendanceColumnExists(attendanceColumn)
      if (!columnExists) {
        toast.error(`Attendance column for this date does not exist in ${currentTable}`)
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

      const attendanceColumn = getAttendanceColumn(date)
      
      // Check if the column exists before querying
      const columnExists = await checkAttendanceColumnExists(attendanceColumn)
      if (!columnExists) {
        console.log(`Attendance column "${attendanceColumn}" does not exist in ${currentTable}`)
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

  // Create new month table with copied member data
  const createNewMonth = async ({ month, year, monthName, sundays }) => {
    try {
      const newTableName = `${monthName}_${year}`
      
      if (!isSupabaseConfigured()) {
        // Demo mode - just show success message
        toast.success(`${newTableName} created successfully! (Demo Mode)`)
        return { success: true, tableName: newTableName }
      }

      // Build complete migration SQL
      let migrationSQL = `
        CREATE TABLE IF NOT EXISTS "${newTableName}" (
          id BIGSERIAL PRIMARY KEY,
          "Full Name" TEXT NOT NULL,
          "Gender" TEXT NOT NULL,
          "Phone Number" BIGINT,
          "Age" TEXT,
          "Current Level" TEXT,
          inserted_at TIMESTAMPTZ DEFAULT NOW()
        );
      `

      // Add attendance columns for each Sunday to the migration
      for (let i = 0; i < sundays.length; i++) {
        const sunday = sundays[i]
        const day = sunday.getDate()
        let suffix = 'th'
        if (day === 1 || day === 21 || day === 31) suffix = 'st'
        else if (day === 2 || day === 22) suffix = 'nd'
        else if (day === 3 || day === 23) suffix = 'rd'
        
        const columnName = `Attendance ${day}${suffix}`
        
        migrationSQL += `
        ALTER TABLE "${newTableName}" 
        ADD COLUMN IF NOT EXISTS "${columnName}" BOOLEAN DEFAULT NULL;
        `
      }

      // Execute the migration SQL directly
       const { error: createError } = await supabase.rpc('exec_sql', {
         sql: migrationSQL
       })

      if (createError) {
        console.error('Error creating table:', createError)
        throw createError
      }

      // Copy member data from current table (excluding attendance columns)
      const { data: currentMembers, error: fetchError } = await supabase
        .from(currentTable)
        .select('Full Name, Gender, Phone Number, Age, Current Level')

      if (fetchError) throw fetchError

      if (currentMembers && currentMembers.length > 0) {
        const { error: insertError } = await supabase
          .from(newTableName)
          .insert(currentMembers)

        if (insertError) throw insertError
      }

      // Update monthly tables list
      setMonthlyTables(prev => [...prev, newTableName])
      
      toast.success(`${newTableName} created successfully with ${sundays.length} Sunday dates!`)
      return { success: true, tableName: newTableName }
    } catch (error) {
      console.error('Error creating new month:', error)
      toast.error('Failed to create new month')
      throw error
    }
  }

  // Filter members based on search term
  const filteredMembers = members.filter(member =>
    member['Full Name']?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Fetch members on component mount and when current table changes
  useEffect(() => {
    fetchMembers()
  }, [currentTable])

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
    setCurrentTable,
    createNewMonth
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContext