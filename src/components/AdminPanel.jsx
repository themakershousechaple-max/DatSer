import React, { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { toast } from 'react-toastify'
import {
  Users,
  Calendar,
  Award,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trophy,
  ArrowRight,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Star
} from 'lucide-react'

const AdminPanel = ({ onBack }) => {
  const {
    members,
    currentTable,
    attendanceData,
    availableSundayDates,
    isMonthAttendanceComplete,
    updateMember,
    calculateAttendanceRate
  } = useApp()
  const { isDarkMode } = useTheme()

  // Badge processing state
  const [isProcessingBadges, setIsProcessingBadges] = useState(false)
  const [badgeResults, setBadgeResults] = useState(null)
  const [showBadgeResults, setShowBadgeResults] = useState(false)

  // Get month display name
  const monthDisplayName = currentTable ? currentTable.replace('_', ' ') : 'No Month Selected'

  // Calculate quick stats
  const stats = useMemo(() => {
    // Get all sunday dates for this month
    const sundayDates = availableSundayDates?.map(d => {
      if (d instanceof Date) {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
      return d
    }) || []

    let totalPresent = 0
    let totalAbsent = 0
    let totalMarked = 0

    // Calculate per-sunday stats
    const sundayStats = sundayDates.map(dateKey => {
      const map = attendanceData[dateKey] || {}
      const present = Object.values(map).filter(v => v === true).length
      const absent = Object.values(map).filter(v => v === false).length
      totalPresent += present
      totalAbsent += absent
      totalMarked += present + absent
      return {
        date: dateKey,
        present,
        absent,
        total: present + absent, marked: present + absent > 0
      }
    })

    // Calculate attendance rate
    const totalPossible = members.length * sundayDates.length
    const attendanceRate = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0

    return {
      totalMembers: members.length,
      totalPresent,
      totalAbsent,
      attendanceRate,
      sundayStats,
      sundaysCompleted: sundayStats.filter(s => s.marked).length,
      totalSundays: sundayDates.length
    }
  }, [members, attendanceData, availableSundayDates])

  // Get top attendees
  const topAttendees = useMemo(() => {
    return members
      .map(member => {
        const rate = calculateAttendanceRate(member)
        return {
          id: member.id,
          name: member['full_name'] || member['Full Name'] || 'Unknown',
          rate,
          badge: member['Badge Type'] || 'newcomer'
        }
      })
      .filter(m => m.rate > 0)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5)
  }, [members, calculateAttendanceRate])

  // Process badges
  const processBadges = async () => {
    setIsProcessingBadges(true)
    setBadgeResults(null)

    try {
      const monthComplete = isMonthAttendanceComplete()

      if (!monthComplete) {
        toast.error('Please complete attendance for all Sundays first.')
        setIsProcessingBadges(false)
        return
      }

      const results = {
        qualified: [],
        notQualified: [],
        totalProcessed: 0
      }

      // Get all sundays sorted
      const sortedSundays = [...(availableSundayDates || [])].sort((a, b) => {
        const dateA = a instanceof Date ? a : new Date(a)
        const dateB = b instanceof Date ? b : new Date(b)
        return dateA - dateB
      })

      for (const member of members) {
        results.totalProcessed++

        // Count total present
        let presentCount = 0
        let consecutiveCount = 0
        let hasThreeConsecutive = false

        for (const sunday of sortedSundays) {
          const dateKey = sunday instanceof Date
            ? `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`
            : sunday
          const status = attendanceData[dateKey]?.[member.id]

          if (status === true) {
            presentCount++
            consecutiveCount++
            if (consecutiveCount >= 3) hasThreeConsecutive = true
          } else {
            consecutiveCount = 0
          }
        }

        const memberInfo = {
          id: member.id,
          name: member['full_name'] || member['Full Name'],
          presentCount,
          currentBadge: member['Badge Type'] || 'newcomer'
        }

        // Badge rules:
        // Member = 2+ Sundays present
        // Regular = 3+ consecutive Sundays present
        if (hasThreeConsecutive) {
          if (member['Badge Type'] !== 'regular') {
            await updateMember(member.id, { 'Badge Type': 'regular' }, { silent: true })
            memberInfo.newBadge = 'regular'
            memberInfo.upgraded = true
          }
          results.qualified.push(memberInfo)
        } else if (presentCount >= 2) {
          if (member['Badge Type'] !== 'member' && member['Badge Type'] !== 'regular') {
            await updateMember(member.id, { 'Badge Type': 'member' }, { silent: true })
            memberInfo.newBadge = 'member'
            memberInfo.upgraded = true
          }
          results.qualified.push(memberInfo)
        } else {
          results.notQualified.push(memberInfo)
        }
      }

      setBadgeResults(results)
      setShowBadgeResults(true)

      const upgraded = results.qualified.filter(m => m.upgraded).length
      toast.success(`Badge processing complete! ${upgraded} members upgraded.`)
    } catch (error) {
      console.error('Error processing badges:', error)
      toast.error('Failed to process badges. Please try again.')
    } finally {
      setIsProcessingBadges(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-500" />
                Admin Panel
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {monthDisplayName}
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMembers}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Members</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalPresent}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Present</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.totalAbsent}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Absent</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.attendanceRate}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Attendance Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Badge Processing - Hero Section */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-6 h-6" />
                <h2 className="text-lg font-bold">Badge Processing</h2>
              </div>
              <p className="text-white/80 text-sm mb-4">
                Automatically assign badges based on attendance
              </p>
              <div className="space-y-1 text-sm text-white/70 mb-4">
                <p>• <span className="text-blue-200 font-medium">Member</span> = 2+ Sundays present</p>
                <p>• <span className="text-green-200 font-medium">Regular</span> = 3+ consecutive Sundays</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.sundaysCompleted}/{stats.totalSundays}</div>
              <p className="text-xs text-white/70">Sundays Marked</p>
            </div>
          </div>

          <button
            onClick={processBadges}
            disabled={isProcessingBadges || stats.sundaysCompleted < stats.totalSundays}
            className={`w-full mt-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${stats.sundaysCompleted < stats.totalSundays
                ? 'bg-white/20 text-white/50 cursor-not-allowed'
                : 'bg-white text-blue-600 hover:bg-blue-50 shadow-lg btn-press'
              }`}
          >
            {isProcessingBadges ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : stats.sundaysCompleted < stats.totalSundays ? (
              <>
                <AlertTriangle className="w-5 h-5" />
                Complete All Sundays First
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Process Badges for {monthDisplayName}
              </>
            )}
          </button>
        </div>

        {/* Badge Results */}
        {badgeResults && showBadgeResults && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in-up">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Badge Results
              </h3>
              <button
                onClick={() => setShowBadgeResults(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {badgeResults.qualified.length}
                  </p>
                  <p className="text-sm text-green-600/70 dark:text-green-400/70">Qualified</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                    {badgeResults.notQualified.length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Not Qualified</p>
                </div>
              </div>

              {badgeResults.qualified.filter(m => m.upgraded).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Recently Upgraded:</p>
                  {badgeResults.qualified.filter(m => m.upgraded).slice(0, 5).map(member => (
                    <div key={member.id} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-900 dark:text-white">{member.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${member.newBadge === 'regular'
                          ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                          : 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                        }`}>
                        {member.newBadge === 'regular' ? '⭐ Regular' : '👤 Member'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* This Month's Sundays */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              This Month's Sundays
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {stats.sundayStats.map((sunday, index) => {
                const date = new Date(sunday.date)
                const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                return (
                  <div key={sunday.date} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${sunday.marked
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                        }`}>
                        {sunday.marked ? <Check className="w-4 h-4" /> : index + 1}
                      </div>
                      <span className={`font-medium ${sunday.marked ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        {label}
                      </span>
                    </div>
                    {sunday.marked ? (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600 dark:text-green-400">{sunday.present} present</span>
                        <span className="text-red-500">{sunday.absent} absent</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Not marked
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top Attendees */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Top Attendees
            </h3>
          </div>
          <div className="p-4">
            {topAttendees.length === 0 ? (
              <p className="text-center text-gray-400 py-4">No attendance data yet</p>
            ) : (
              <div className="space-y-2">
                {topAttendees.map((attendee, index) => (
                  <div key={attendee.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-amber-600' :
                              'bg-blue-500'
                        }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{attendee.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{attendee.badge}</p>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${attendee.rate >= 90 ? 'text-green-500' :
                        attendee.rate >= 75 ? 'text-blue-500' :
                          'text-yellow-500'
                      }`}>
                      {attendee.rate}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel