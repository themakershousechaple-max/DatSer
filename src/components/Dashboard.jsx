import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { Search, Users, Filter, Edit3, Trash2, Calendar, ChevronDown, ChevronRight, UserPlus, Award, Star, UserCheck } from 'lucide-react'
import EditMemberModal from './EditMemberModal'
import MemberModal from './MemberModal'
import MonthModal from './MonthModal'
import DateSelector from './DateSelector'

const Dashboard = ({ isAdmin = false }) => {
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
    currentTable,
    members,
    calculateMemberBadge,
    assignManualBadge,
    updateMemberBadges,
    selectedAttendanceDate
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
  const [badgeFilter, setBadgeFilter] = useState('all')
  const [isUpdatingBadges, setIsUpdatingBadges] = useState(false)
  const [badgeAssignmentLoading, setBadgeAssignmentLoading] = useState({})

  // September 2025 Sunday dates
  const sundayDates = [
    '2025-09-07',
    '2025-09-14', 
    '2025-09-21',
    '2025-09-28'
  ]

  // Fetch attendance when date changes
  useEffect(() => {
    if (selectedAttendanceDate) {
      fetchAttendanceForDate(new Date(selectedAttendanceDate))
    }
  }, [selectedAttendanceDate, fetchAttendanceForDate])

  // Fetch attendance for all Sunday dates
  useEffect(() => {
    sundayDates.forEach(date => {
      fetchAttendanceForDate(new Date(date))
    })
  }, [fetchAttendanceForDate])

  // Reset pagination when search term changes
  useEffect(() => {
    if (searchTerm) {
      // When searching, we show all results, so no need for pagination
    } else {
      // When search is cleared, reset to initial display limit
      setDisplayLimit(20)
    }
  }, [searchTerm])

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
      await markAttendance(memberId, new Date(selectedAttendanceDate), present)
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
          await assignManualBadge(member.id, badgeName)
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
    if (badgeFilter === 'all') return filteredMembers
    
    return filteredMembers.filter(member => {
      const badge = calculateMemberBadge(member)
      switch (badgeFilter) {
        case 'member':
          return badge === 'Member Badge'
        case 'regular':
          return badge === 'Regular Attendee'
        case 'newcomer':
          return badge === 'Newcomer'
        default:
          return true
      }
    })
  }

  const handleIndividualBadgeAssignment = async (memberId, badgeType) => {
    setBadgeAssignmentLoading(prev => ({ ...prev, [memberId]: badgeType }))
    
    try {
      await assignManualBadge(memberId, badgeType)
      await updateMemberBadges()
    } catch (error) {
      console.error('Error assigning badge:', error)
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
              {getFilteredMembersByBadge().length} member{getFilteredMembersByBadge().length !== 1 ? 's' : ''} found
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

      {/* Compact Badge Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Badge Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-600" />
              Badge Management
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Members', icon: Users },
                { key: 'member', label: 'Member Badge', icon: Award },
                { key: 'regular', label: 'Regular', icon: UserCheck },
                { key: 'newcomer', label: 'Newcomer', icon: Star }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setBadgeFilter(key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    badgeFilter === key
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Badge Types Reference (Display Only) */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 sm:text-right mb-1 sm:mb-0">
              Badge Types Reference:
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'member', label: 'Member', icon: Award, color: 'blue' },
                { key: 'regular', label: 'Regular', icon: UserCheck, color: 'green' },
                { key: 'newcomer', label: 'Newcomer', icon: UserCheck, color: 'yellow' }
              ].map(({ key, label, icon: Icon, color }) => (
                <div
                  key={key}
                  title={`${label} badge - Use individual member buttons to assign`}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium cursor-default opacity-75 ${
                    color === 'blue' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                    color === 'green' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                    'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Search Bar at bottom of viewport */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600 p-4 shadow-lg z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Search Input */}
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
            
            {/* Date Selector */}
            <DateSelector />
          </div>
        </div>
      </div>





      {/* Members List */}
      <div className="space-y-3">
        {/* Calculate displayed members based on search and pagination */}
        {(() => {
          // Get badge-filtered members first
          const badgeFilteredMembers = getFilteredMembersByBadge()
          
          // When searching, show all matching results for better UX
          const membersToShow = searchTerm 
            ? badgeFilteredMembers 
            : badgeFilteredMembers.slice(0, displayLimit)
          
          const hasMoreMembers = !searchTerm && badgeFilteredMembers.length > displayLimit
          
          return (
            <>
              {membersToShow.map((member) => {
          const isExpanded = expandedMembers[member.id]
          
          return (
            <div key={member.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden hover:shadow-md transition-all duration-200">
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
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate min-w-0">{member['Full Name']}</h3>
                      {(() => {
                        const badge = calculateMemberBadge(member)
                        const badgeConfig = {
                          'Member Badge': { color: 'blue', icon: Award },
                          'Regular Attendee': { color: 'green', icon: UserCheck },
                          'Newcomer': { color: 'yellow', icon: UserCheck },
                          'VIP Member': { color: 'purple', icon: Award },
                          'Youth Leader': { color: 'indigo', icon: Award }
                        }
                        const config = badgeConfig[badge] || { color: 'gray', icon: Award }
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
                            <span className="hidden sm:inline">{badge}</span>
                            <span className="sm:hidden">
                              {badge === 'Member Badge' ? 'Member' :
                               badge === 'Regular Attendee' ? 'Regular' :
                               badge === 'Newcomer' ? 'New' :
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
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleAttendance(member.id, true)}
                        disabled={attendanceLoading[member.id]}
                        className={`px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
                          attendanceData[`${member.id}_${selectedAttendanceDate}`] === true
                            ? 'bg-green-600 text-white'
                            : attendanceLoading[member.id]
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                        }`}
                        title="Mark present"
                      >
                        {attendanceLoading[member.id] ? '...' : <span className="hidden sm:inline">Present</span>}
                        {attendanceLoading[member.id] ? '...' : <span className="sm:hidden">P</span>}
                      </button>
                      <button
                        onClick={() => handleAttendance(member.id, false)}
                        disabled={attendanceLoading[member.id]}
                        className={`px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
                          attendanceData[`${member.id}_${selectedAttendanceDate}`] === false
                            ? 'bg-red-600 text-white'
                            : attendanceLoading[member.id]
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                        }`}
                        title="Mark absent"
                      >
                        {attendanceLoading[member.id] ? '...' : <span className="hidden sm:inline">Absent</span>}
                        {attendanceLoading[member.id] ? '...' : <span className="sm:hidden">A</span>}
                      </button>
                    </div>

                    {/* Badge assignment buttons */}
                    <div className="flex space-x-1 ml-2 border-l border-gray-300 dark:border-gray-600 pl-2">
                      <button
                        onClick={() => handleIndividualBadgeAssignment(member.id, 'member')}
                        disabled={badgeAssignmentLoading[member.id]}
                        className={`p-1 rounded transition-colors ${
                          calculateMemberBadge(member) === 'member'
                            ? 'bg-blue-600 text-white'
                            : badgeAssignmentLoading[member.id] === 'member'
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                        }`}
                        title="Assign Member Badge"
                      >
                        {badgeAssignmentLoading[member.id] === 'member' ? '...' : <Award className="w-3 h-3 sm:w-4 sm:h-4" />}
                      </button>
                      <button
                        onClick={() => handleIndividualBadgeAssignment(member.id, 'regular')}
                        disabled={badgeAssignmentLoading[member.id]}
                        className={`p-1 rounded transition-colors ${
                          calculateMemberBadge(member) === 'regular'
                            ? 'bg-green-600 text-white'
                            : badgeAssignmentLoading[member.id] === 'regular'
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                        }`}
                        title="Assign Regular Badge"
                      >
                        {badgeAssignmentLoading[member.id] === 'regular' ? '...' : <Star className="w-3 h-3 sm:w-4 sm:h-4" />}
                      </button>
                      <button
                        onClick={() => handleIndividualBadgeAssignment(member.id, 'newcomer')}
                        disabled={badgeAssignmentLoading[member.id]}
                        className={`p-1 rounded transition-colors ${
                          calculateMemberBadge(member) === 'newcomer'
                            ? 'bg-yellow-600 text-white'
                            : badgeAssignmentLoading[member.id] === 'newcomer'
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                        }`}
                        title="Assign Newcomer Badge"
                      >
                        {badgeAssignmentLoading[member.id] === 'newcomer' ? '...' : <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
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
                            <span className="font-medium text-primary-600 dark:text-primary-400 capitalize truncate ml-2">
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
                            onClick={() => handleDelete(member)}
                            className="flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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
                  <span>Load More ({filteredMembers.length - displayLimit} remaining)</span>
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Members count info */}
        {!searchTerm && filteredMembers.length > 0 && (
          <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {Math.min(displayLimit, filteredMembers.length)} of {filteredMembers.length} members
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