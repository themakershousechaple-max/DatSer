import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { Calendar, Database, Users, Activity, LogOut, RefreshCw, Filter, Edit, Search, Trash2, X, ChevronDown, ChevronUp, Check, TrendingUp, Edit3, Award, Phone } from 'lucide-react'
import { toast } from 'react-toastify'
import EditMemberModal from './EditMemberModal'
import DateSelector from './DateSelector'

const AdminPanel = ({ onLogout, setCurrentView }) => {
  const { 
    monthlyTables, 
    currentTable, 
    setCurrentTable, 
    members, 
    markAttendance, 
    attendanceLoading,
    searchTerm,
    setSearchTerm,
    filteredMembers,
    refreshSearch,
    attendanceData,
    selectedAttendanceDate,
    deleteMember,
    setDashboardTab,
    availableSundayDates,
    isMonthAttendanceComplete,
    updateMember
  } = useApp()
  const { isDarkMode } = useTheme()
  // Bottom search bar is always keyboard-aware via visualViewport offset
  
  const [systemStats, setSystemStats] = useState({
    totalMembers: 0,
    activeMonth: '',
    totalTables: 0,
    lastUpdated: new Date().toLocaleString()
  })
  
  // Edit member modal state
  const [editingMember, setEditingMember] = useState(null)
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false)
  
  // Badge processing state
  const [badgeResults, setBadgeResults] = useState(null)
  const [isProcessingBadges, setIsProcessingBadges] = useState(false)
  const [isBadgeResultsOpen, setIsBadgeResultsOpen] = useState(false)
  
  // Statistics dropdown state
  const [isStatsOpen, setIsStatsOpen] = useState(false)

  useEffect(() => {
    setSystemStats({
      totalMembers: members.length,
      activeMonth: currentTable,
      totalTables: monthlyTables.length,
      lastUpdated: new Date().toLocaleString()
    })
  }, [members, currentTable, monthlyTables])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMonthMenuOpen && !event.target.closest('[aria-haspopup="listbox"]') && !event.target.closest('[role="listbox"]')) {
        setIsMonthMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMonthMenuOpen])

  // Aggregate attendance stats for the currently selected date
  const selectedDateKey = selectedAttendanceDate
    ? selectedAttendanceDate.toISOString().split('T')[0]
    : null

  const attendanceMapForSelectedDate = selectedDateKey
    ? (attendanceData[selectedDateKey] || {})
    : {}

  const presentCount = Object.values(attendanceMapForSelectedDate).filter(v => v === true).length
  const absentCount = Object.values(attendanceMapForSelectedDate).filter(v => v === false).length
  const markedCount = presentCount + absentCount
  const unmarkedCount = members.length - markedCount



  // Helper function to get latest attendance status for a member
  const getLatestAttendanceStatus = (member) => {
    // Get all attendance dates and find the most recent one with data for this member
    const attendanceDates = Object.keys(attendanceData).sort().reverse()
    
    for (const date of attendanceDates) {
      const memberAttendance = attendanceData[date]?.[member.id]
      if (memberAttendance !== undefined) {
        return memberAttendance // true for present, false for absent
      }
    }
    return null // No attendance data found
  }

  // Filter members based on search term
  const filteredMembersList = members.filter(member => {
    const fullName = (member['full_name'] || member['Full Name'] || '').toLowerCase()
    const tokens = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return true
    return tokens.every(t => fullName.includes(t))
  })

  const handleTableSwitch = (tableName) => {
    console.log(`Switching to table: ${tableName}`)
    // Use setCurrentTable from context (already mapped to the persistent changer)
    setCurrentTable(tableName)
    setIsMonthMenuOpen(false) // Close the dropdown after selection
  }

  const getMonthDisplayName = (tableName) => {
    // Convert table name like "October_2025" to "October 2025"
    return tableName.replace('_', ' ')
  }

  const getTableStatus = (tableName) => {
    return tableName === currentTable ? 'Active' : 'Available'
  }

  const refreshStats = () => {
    setSystemStats(prev => ({
      ...prev,
      lastUpdated: new Date().toLocaleString()
    }))
  }

  // Process badges manually and show results
  const processBadgesManually = async () => {
    setIsProcessingBadges(true)
    setBadgeResults(null)
    
    try {
      console.log('Starting badge processing...')
      console.log('Available Sunday dates:', availableSundayDates)
      console.log('Attendance data:', attendanceData)
      console.log('Members count:', members.length)
      
      // Check if month is complete
      const monthComplete = isMonthAttendanceComplete()
      console.log('Is month complete?', monthComplete)
      
      if (!monthComplete) {
        toast.error('Month is not complete yet. All Sundays must have attendance data.')
        setIsProcessingBadges(false)
        return
      }

      const results = {
        qualified: [],
        notQualified: [],
        totalProcessed: 0
      }

      // Check each member for 3 consecutive Sundays
      for (const member of members) {
        results.totalProcessed++
        
        // Check for 3 consecutive Present attendances
        const sortedSundays = [...availableSundayDates].sort((a, b) => a - b)
        let consecutiveCount = 0
        let hasThreeConsecutive = false
        
        for (const sunday of sortedSundays) {
          const dateKey = sunday.toISOString().split('T')[0]
          const memberStatus = attendanceData[dateKey]?.[member.id]
          
          if (memberStatus === true) {
            consecutiveCount++
            if (consecutiveCount >= 3) {
              hasThreeConsecutive = true
              break
            }
          } else if (memberStatus === false) {
            consecutiveCount = 0
          } else {
            consecutiveCount = 0
          }
        }

        // Build Sunday attendance breakdown
        const sundayAttendance = sortedSundays.map(sunday => {
          const dateKey = sunday.toISOString().split('T')[0]
          const status = attendanceData[dateKey]?.[member.id]
          return {
            date: sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            status: status === true ? 'Present' : status === false ? 'Absent' : 'Not Marked'
          }
        })

        const memberInfo = {
          id: member.id,
          name: member['full_name'] || member['Full Name'],
          phone: member['Phone Number'] || member['phone_number'] || 'No phone',
          currentBadge: member['Badge Type'] || 'newcomer',
          sundayAttendance: sundayAttendance
        }

        if (hasThreeConsecutive) {
          // Only update if not already regular or vip
          if (member['Badge Type'] !== 'regular' && member['Badge Type'] !== 'vip') {
            await updateMember(member.id, {
              'Badge Type': 'regular'
            })
            memberInfo.badgeAssigned = true
          } else {
            memberInfo.badgeAssigned = false
            memberInfo.reason = 'Already has regular or vip badge'
          }
          results.qualified.push(memberInfo)
        } else {
          memberInfo.reason = 'Did not attend 3 consecutive Sundays'
          results.notQualified.push(memberInfo)
        }
      }

      setBadgeResults(results)
      setIsBadgeResultsOpen(true) // Auto-open results after processing
      toast.success(`Badge processing complete! ${results.qualified.filter(m => m.badgeAssigned).length} badges assigned.`)
    } catch (error) {
      console.error('Error processing badges:', error)
      console.error('Error details:', error.message, error.stack)
      // Show the actual error message to the user
      toast.error(`Failed to process badges: ${error.message || error.toString()}`)
    } finally {
      setIsProcessingBadges(false)
    }
  }

  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pb-24 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header - Compact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-4 transition-colors">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <span className="text-xs text-gray-500 dark:text-gray-400">Datsar Administration</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-3 h-3 mr-1.5" />
              Logout
            </button>
          </div>
        </div>

        {/* System Statistics - Compact Dropdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 transition-colors">
          <button
            onClick={() => setIsStatsOpen(!isStatsOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">System Overview</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">({systemStats.totalMembers} members • {getMonthDisplayName(systemStats.activeMonth)})</span>
            </div>
            {isStatsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {isStatsOpen && (
            <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {/* Total Members */}
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Members</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{systemStats.totalMembers}</p>
                  </div>
                </div>

                {/* Active Month */}
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Month</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{getMonthDisplayName(systemStats.activeMonth)}</p>
                  </div>
                </div>

                {/* Total Databases */}
                <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Databases</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{systemStats.totalTables}</p>
                  </div>
                </div>

                {/* System Status */}
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
                    <p className="text-xs font-bold text-green-600 dark:text-green-400">Online</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Monthly Databases - Compact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4 transition-colors">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Monthly Databases</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{monthlyTables.length} available</span>
            </div>
          </div>
          <div className="p-3">

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-white">Select Month</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMonthMenuOpen(v => !v)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                }`}
                aria-haspopup="listbox"
                aria-expanded={isMonthMenuOpen}
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">{getMonthDisplayName(currentTable)}</span>
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">Active</span>
                </span>
                {isMonthMenuOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>

              {isMonthMenuOpen && (
                <div
                  className={`absolute z-40 mt-2 w-full max-h-64 overflow-y-auto no-scrollbar rounded-lg shadow-lg border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                  role="listbox"
                >
                  {monthlyTables.map((table) => {
                    const isActive = table === currentTable
                    return (
                      <button
                        key={table}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleTableSwitch(table)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                          isDarkMode
                            ? `hover:bg-gray-700 ${isActive ? 'bg-blue-900/20' : ''} text-white`
                            : `hover:bg-gray-100 ${isActive ? 'bg-blue-50' : ''} text-gray-900`
                        }`}
                        role="option"
                        aria-selected={isActive}
                      >
                        <span className="flex items-center gap-2">
                          <Database className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                          <span>{getMonthDisplayName(table)}</span>
                        </span>
                        {isActive && (
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="text-sm text-gray-600 dark:text-white">
              Active: {getMonthDisplayName(currentTable)} • {members.length} members
            </div>
          </div>
          </div>

          {monthlyTables.length === 0 && (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Monthly Databases Found</h3>
              <p className="text-gray-600 dark:text-gray-300">
                No monthly tables are currently available in the system.
              </p>
            </div>
          )}
        </div>

        {/* Sunday Attendance section removed as requested */}

        {/* Bulk Attendance Actions removed as requested */}

        {/* Badge Processing moved to Analytics page */}

        {/* Member Names Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Members</h2>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {filteredMembers.length} of {members.length} members
              {searchTerm && ` (filtered by "${searchTerm}")`}
            </div>
          </div>

          {filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="relative group border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-gray-700"
                  onClick={() => setEditingMember(member)}
                >
                  <div className="flex items-center">
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">{member['full_name'] || member['Full Name']}</h3>
                        <button
                          type="button"
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the member edit modal
                            if (window.confirm(`Are you sure you want to delete ${member['full_name'] || member['Full Name']}?`)) {
                              deleteMember(member.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                          title="Delete Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {(() => {
                        const attendanceStatus = getLatestAttendanceStatus(member)
                        if (attendanceStatus === true) {
                          return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-800 dark:bg-green-700 text-white ring-2 ring-green-300 dark:ring-green-400">
                              P
                            </span>
                          )
                        } else if (attendanceStatus === false) {
                          return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-800 dark:bg-red-700 text-white ring-2 ring-red-300 dark:ring-red-400">
                              A
                            </span>
                          )
                        }
                        return null
                      })()}
                      <p className="text-sm text-gray-600 dark:text-gray-300">{member.Gender}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                      <span>ID: {member.id}</span>
                      <span>Click to edit</span>
                    </div>
                  </div>

                  {/* Edit button on hover */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Members Found</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {searchTerm 
                  ? `No members match your search for "${searchTerm}"` 
                  : "No members are currently registered in this database."
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Clear search to see all members
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Top sticky search bar moved to Header.jsx */}
      
      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        member={editingMember}
      />
    </div>
  )
}

export default AdminPanel