import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { Calendar, Database, Users, Activity, LogOut, RefreshCw, Filter, Edit, Search, Trash2, X, ChevronDown, ChevronUp, Check } from 'lucide-react'
import EditMemberModal from './EditMemberModal'
import DateSelector from './DateSelector'

const AdminPanel = ({ onLogout }) => {
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
    changeCurrentTable
  } = useApp()
  const { isDarkMode } = useTheme()
  
  const [systemStats, setSystemStats] = useState({
    totalMembers: 0,
    activeMonth: '',
    totalTables: 0,
    lastUpdated: new Date().toLocaleString()
  })
  
  // Edit member modal state
  const [editingMember, setEditingMember] = useState(null)
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false)

  useEffect(() => {
    setSystemStats({
      totalMembers: members.length,
      activeMonth: currentTable,
      totalTables: monthlyTables.length,
      lastUpdated: new Date().toLocaleString()
    })
  }, [members, currentTable, monthlyTables])



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
    return fullName.includes(searchTerm.toLowerCase())
  })

  const handleTableSwitch = (tableName) => {
    console.log(`Switching to table: ${tableName}`)
    changeCurrentTable(tableName)
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

  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pb-24 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-colors">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Datsar Administration • Data Search Hub</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemStats.totalMembers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Month</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{getMonthDisplayName(systemStats.activeMonth)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Databases</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemStats.totalTables}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">System Status</p>
                  <button
                    onClick={refreshStats}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">Online</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Updated: {systemStats.lastUpdated}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Database Connection Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-colors">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Database Connection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Connection Status</h3>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-green-600 dark:text-green-400 font-medium">Connected to Supabase</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Project: Datsar Data Hub
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Current Configuration</h3>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p>Environment: Production</p>
                <p>Region: US East</p>
                <p>Last Sync: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Databases - Styled Dropdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Databases</h2>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {monthlyTables.length} database{monthlyTables.length !== 1 ? 's' : ''} available
            </div>
          </div>

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
                        onClick={() => {
                          handleTableSwitch(table)
                          setIsMonthMenuOpen(false)
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

      {/* Bottom Search Bar fills safe area with bar color */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600 p-4 shadow-lg z-50 transition-colors safe-area-bottom">
        <div className="max-w-7xl mx-auto pb-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search members by name or gender..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => { /* keep bar fixed; avoid scroll jumps on iOS */ }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* Date Selector on the right side */}
            <DateSelector />
          </div>
        </div>
      </div>
      
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