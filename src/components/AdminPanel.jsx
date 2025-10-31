import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { Calendar, Database, Users, Activity, LogOut, RefreshCw, Filter, Edit, Search } from 'lucide-react'
import EditMemberModal from './EditMemberModal'

const AdminPanel = ({ onLogout }) => {
  const { monthlyTables, currentTable, setCurrentTable, members, markAttendance, attendanceLoading } = useApp()
  const { isDarkMode } = useTheme()
  
  // September 2025 Sunday dates
  const sundayDates = [
    { date: '2025-09-07', day: 7, label: 'Sunday, Sep 7th' },
    { date: '2025-09-14', day: 14, label: 'Sunday, Sep 14th' },
    { date: '2025-09-21', day: 21, label: 'Sunday, Sep 21st' },
    { date: '2025-09-28', day: 28, label: 'Sunday, Sep 28th' }
  ]
  const [systemStats, setSystemStats] = useState({
    totalMembers: 0,
    activeMonth: '',
    totalTables: 0,
    lastUpdated: new Date().toLocaleString()
  })
  
  // Edit member modal state
  const [editingMember, setEditingMember] = useState(null)
  
  // Search functionality state
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setSystemStats({
      totalMembers: members.length,
      activeMonth: currentTable,
      totalTables: monthlyTables.length,
      lastUpdated: new Date().toLocaleString()
    })
  }, [members, currentTable, monthlyTables])



  // Filter members based on search term
  const filteredMembers = members.filter(member =>
    member['Full Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.Gender?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleTableSwitch = (tableName) => {
    setCurrentTable(tableName)
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

  const handleBulkAttendance = async (present, specificDate = null) => {
    if (attendanceLoading) return
    
    try {
      const promises = members.map(member => 
        markAttendance(member.id, present, specificDate)
      )
      await Promise.all(promises)
    } catch (error) {
      console.error('Error marking bulk attendance:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pb-24 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-colors">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">TMHT Check-in System Administration</p>
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
                Project: TMH TEEN Data Compilation
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

        {/* Monthly Databases */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Databases</h2>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {monthlyTables.length} database{monthlyTables.length !== 1 ? 's' : ''} available
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthlyTables.map((table) => (
              <div
                key={table}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  table === currentTable
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 shadow-md'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm bg-white dark:bg-gray-800'
                }`}
                onClick={() => handleTableSwitch(table)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${
                      table === currentTable ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Database className={`w-5 h-5 ${
                        table === currentTable ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {getMonthDisplayName(table)}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Status: {getTableStatus(table)}
                      </p>
                    </div>
                  </div>
                  {table === currentTable && (
                    <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Current
                    </div>
                  )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>Table: {table}</span>
                    <span>
                      {table === currentTable ? `${members.length} members` : 'Click to switch'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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

        {/* September 2025 Sunday Attendance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {getMonthDisplayName(currentTable)} - Sunday Attendance
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {members.length} member{members.length !== 1 ? 's' : ''} in current database
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sundayDates.map((sunday) => (
              <div key={sunday.date} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700 transition-colors">
                <div className="text-center mb-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{sunday.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Attendance {sunday.day}th</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAttendance(sunday.date, 'present')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded-md transition-colors"
                  >
                    All Present
                  </button>
                  <button
                    onClick={() => handleBulkAttendance(sunday.date, 'absent')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded-md transition-colors"
                  >
                    All Absent
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bulk Attendance Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-colors">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Bulk Attendance Actions</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAttendance(true)}
                disabled={attendanceLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Mark all present"
              >
                <span>All Present</span>
              </button>
              <button
                onClick={() => handleBulkAttendance(false)}
                disabled={attendanceLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Mark all absent"
              >
                <span>All Absent</span>
              </button>
            </div>
          </div>
        </div>

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
                      <h3 className="font-medium text-gray-900 dark:text-white">{member['Full Name']}</h3>
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

      {/* Fixed Search Bar at bottom of viewport */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600 p-4 shadow-lg z-50 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search members by name or gender..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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