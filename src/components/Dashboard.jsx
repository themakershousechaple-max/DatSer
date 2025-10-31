import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { Search, Users, Filter, Edit3, Trash2, Calendar, ChevronDown, ChevronRight, UserPlus } from 'lucide-react'
import EditMemberModal from './EditMemberModal'
import MemberModal from './MemberModal'
import MonthModal from './MonthModal'

const Dashboard = () => {
  const { 
    filteredMembers, 
    loading, 
    searchTerm, 
    setSearchTerm, 
    deleteMember, 
    markAttendance, 
    bulkAttendance,
    fetchAttendanceForDate,
    attendanceData,
    currentTable 
  } = useApp()
  const { isDarkMode } = useTheme()
  const [selectedDate, setSelectedDate] = useState('2025-09-01')
  const [editingMember, setEditingMember] = useState(null)
  const [attendanceLoading, setAttendanceLoading] = useState({})
  const [expandedMembers, setExpandedMembers] = useState({})
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showMonthModal, setShowMonthModal] = useState(false)

  // September 2025 Sunday dates
  const sundayDates = [
    '2025-09-07',
    '2025-09-14', 
    '2025-09-21',
    '2025-09-28'
  ]

  // Fetch attendance when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAttendanceForDate(new Date(selectedDate))
    }
  }, [selectedDate, fetchAttendanceForDate])

  // Fetch attendance for all Sunday dates
  useEffect(() => {
    sundayDates.forEach(date => {
      fetchAttendanceForDate(new Date(date))
    })
  }, [fetchAttendanceForDate])

  const handleDelete = async (member) => {
    if (window.confirm(`Are you sure you want to delete ${member['Full Name']}?`)) {
      try {
        await deleteMember(member.id)
        // Show success toast (would be implemented with react-toastify)
      } catch (error) {
        console.error('Error deleting member:', error)
      }
    }
  }

  const handleAttendance = async (memberId, present) => {
    setAttendanceLoading(prev => ({ ...prev, [memberId]: true }))
    try {
      await markAttendance(memberId, new Date(selectedDate), present)
      // Show success message
    } catch (error) {
      console.error('Error marking attendance:', error)
      alert('Error marking attendance. Please try again.')
    } finally {
      setAttendanceLoading(prev => ({ ...prev, [memberId]: false }))
    }
  }

  const handleAttendanceForDate = async (memberId, present, specificDate) => {
    const loadingKey = `${memberId}_${specificDate}`
    setAttendanceLoading(prev => ({ ...prev, [loadingKey]: true }))
    try {
      await markAttendance(memberId, new Date(specificDate), present)
    } catch (error) {
      console.error('Error marking attendance:', error)
      alert('Error marking attendance. Please try again.')
    } finally {
      setAttendanceLoading(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  const handleBulkAttendance = async (present, specificDate = null) => {
    const dateToUse = specificDate || selectedDate
    const dateLabel = specificDate ? new Date(specificDate).toLocaleDateString() : selectedDate
    
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
              {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found
            </p>
            <div className="flex items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">Database:</span>
              <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md font-medium">
                {currentTable.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Search Bar at bottom of viewport */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600 p-4 shadow-lg z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search members by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
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
        </div>
      </div>





      {/* Members List */}
      <div className="space-y-3">
        {filteredMembers.map((member) => {
          const isExpanded = expandedMembers[member.id]
          
          return (
            <div key={member.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden hover:shadow-md transition-all duration-200">
              {/* Compact Header Row */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  {/* Left side: Name and expand button */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleMemberExpansion(member.id)}
                      className="p-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{member['Full Name']}</h3>
                  </div>

                  {/* Right side: Attendance buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAttendance(member.id, true)}
                      disabled={attendanceLoading[member.id]}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        attendanceData[`${member.id}_${selectedDate}`] === true
                          ? 'bg-green-600 text-white'
                          : attendanceLoading[member.id]
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                      }`}
                      title="Mark present"
                    >
                      {attendanceLoading[member.id] ? '...' : 'Present'}
                    </button>
                    <button
                      onClick={() => handleAttendance(member.id, false)}
                      disabled={attendanceLoading[member.id]}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        attendanceData[`${member.id}_${selectedDate}`] === false
                          ? 'bg-red-600 text-white'
                          : attendanceLoading[member.id]
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                      }`}
                      title="Mark absent"
                    >
                      {attendanceLoading[member.id] ? '...' : 'Absent'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                  <div className="pt-4">
                    {/* Member Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Member Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Gender:</span>
                            <span className="font-medium capitalize text-gray-900 dark:text-white">{member['Gender']}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Phone:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{member['Phone Number'] || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Age:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{member['Age'] || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Level:</span>
                            <span className="font-medium text-primary-600 dark:text-primary-400 capitalize">
                              {member['Current Level']?.toLowerCase() || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Actions</h4>
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => setEditingMember(member)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 rounded transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Edit Member</span>
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Member</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* September 2025 Sunday Attendance */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4 transition-colors">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 transition-colors">September 2025 Sunday Attendance</h4>
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
                                  className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    isPresent
                                      ? 'bg-green-600 text-white'
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
                                  className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    isAbsent
                                      ? 'bg-red-600 text-white'
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
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No members found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first member'}
          </p>
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