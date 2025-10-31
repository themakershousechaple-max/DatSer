import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { BarChart3, TrendingUp, Users, Calendar, PieChart, Activity } from 'lucide-react'

const Statistics = () => {
  const { members, attendanceData, fetchAttendanceForDate } = useApp()
  const { isDarkMode } = useTheme()
  const [stats, setStats] = useState({
    totalMembers: 0,
    maleMembers: 0,
    femaleMembers: 0,
    averageAge: 0,
    levelDistribution: {},
    weeklyAttendance: [],
    monthlyAttendance: [],
    attendanceRate: 0
  })
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('week') // week, month, year

  // Calculate member statistics
  const calculateMemberStats = () => {
    const totalMembers = members.length
    const maleMembers = members.filter(m => m['Gender']?.toLowerCase() === 'male').length
    const femaleMembers = members.filter(m => m['Gender']?.toLowerCase() === 'female').length
    const averageAge = totalMembers > 0 ? 
      Math.round(members.reduce((sum, m) => sum + (m['Age'] || 0), 0) / totalMembers) : 0

    // Level distribution
    const levelDistribution = {}
    members.forEach(member => {
      const level = member['Current Level'] || 'Unknown'
      levelDistribution[level] = (levelDistribution[level] || 0) + 1
    })

    return {
      totalMembers,
      maleMembers,
      femaleMembers,
      averageAge,
      levelDistribution
    }
  }

  // Calculate attendance statistics for a date range
  const calculateAttendanceStats = async (period) => {
    setLoading(true)
    try {
      const today = new Date()
      const dates = []

      if (period === 'week') {
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          dates.push(date.toISOString().split('T')[0])
        }
      } else if (period === 'month') {
        // Last 30 days
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          dates.push(date.toISOString().split('T')[0])
        }
      }

      // Fetch attendance for all dates
      for (const date of dates) {
        await fetchAttendanceForDate(date)
      }

      // Calculate attendance rates for each date
      const attendanceByDate = dates.map(date => {
        const presentCount = members.filter(member => 
          attendanceData[`${member.id}_${date}`] === true
        ).length
        const totalMembers = members.length
        const rate = totalMembers > 0 ? (presentCount / totalMembers) * 100 : 0

        return {
          date,
          presentCount,
          totalMembers,
          rate: Math.round(rate)
        }
      })

      // Calculate overall attendance rate
      const totalPossibleAttendance = dates.length * members.length
      const totalActualAttendance = dates.reduce((sum, date) => {
        return sum + members.filter(member => 
          attendanceData[`${member.id}_${date}`] === true
        ).length
      }, 0)

      const overallRate = totalPossibleAttendance > 0 ? 
        Math.round((totalActualAttendance / totalPossibleAttendance) * 100) : 0

      return {
        attendanceByDate,
        overallRate
      }
    } catch (error) {
      console.error('Error calculating attendance stats:', error)
      return { attendanceByDate: [], overallRate: 0 }
    } finally {
      setLoading(false)
    }
  }

  // Update statistics when members or period changes
  useEffect(() => {
    const memberStats = calculateMemberStats()
    
    calculateAttendanceStats(selectedPeriod).then(attendanceStats => {
      setStats({
        ...memberStats,
        weeklyAttendance: selectedPeriod === 'week' ? attendanceStats.attendanceByDate : [],
        monthlyAttendance: selectedPeriod === 'month' ? attendanceStats.attendanceByDate : [],
        attendanceRate: attendanceStats.overallRate
      })
    })
  }, [members, selectedPeriod, attendanceData])

  // Simple bar chart component
  const SimpleBarChart = ({ data, title, color = 'blue' }) => {
    const maxValue = Math.max(...data.map(d => d.rate), 1)
    
    return (
      <div className={`rounded-lg shadow-sm border p-6 transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <div className="space-y-3">
          {data.slice(-7).map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-16 text-xs transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {new Date(item.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div className={`flex-1 rounded-full h-4 relative transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className={`bg-${color}-500 h-4 rounded-full transition-all duration-300`}
                  style={{ width: `${(item.rate / maxValue) * 100}%` }}
                ></div>
              </div>
              <div className={`w-12 text-xs text-right transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {item.rate}%
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`max-w-7xl mx-auto p-6 transition-colors ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Statistics Dashboard</h1>
        <p className={`transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Overview of member demographics and attendance patterns</p>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPeriod === 'week'
                ? 'bg-blue-500 text-white'
                : isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPeriod === 'month'
                ? 'bg-blue-500 text-white'
                : isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`rounded-lg shadow-sm border p-6 transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Members</p>
              <p className={`text-2xl font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalMembers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className={`rounded-lg shadow-sm border p-6 transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average Age</p>
              <p className={`text-2xl font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.averageAge}</p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className={`rounded-lg shadow-sm border p-6 transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Attendance Rate</p>
              <p className={`text-2xl font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.attendanceRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className={`rounded-lg shadow-sm border p-6 transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Period</p>
              <p className={`text-2xl font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedPeriod === 'week' ? '7' : '30'} Days
              </p>
            </div>
            <Calendar className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gender Distribution */}
        <div className={`rounded-lg shadow-sm border p-6 transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <PieChart className={`w-5 h-5 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
            Gender Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Male</span>
              <div className="flex items-center gap-2">
                <div className={`w-32 rounded-full h-3 transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${stats.totalMembers > 0 ? (stats.maleMembers / stats.totalMembers) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className={`text-sm font-medium w-8 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.maleMembers}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Female</span>
              <div className="flex items-center gap-2">
                <div className={`w-32 rounded-full h-3 transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="bg-pink-500 h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${stats.totalMembers > 0 ? (stats.femaleMembers / stats.totalMembers) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className={`text-sm font-medium w-8 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.femaleMembers}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Level Distribution */}
        <div className={`rounded-lg shadow-sm border p-6 transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <BarChart3 className={`w-5 h-5 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
            Level Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.levelDistribution).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between">
                <span className={`transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{level}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-32 rounded-full h-3 transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${stats.totalMembers > 0 ? (count / stats.totalMembers) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className={`text-sm font-medium w-8 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Chart */}
      {loading ? (
        <div className={`rounded-lg shadow-sm border p-12 text-center transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading attendance data...</p>
        </div>
      ) : (
        <SimpleBarChart 
          data={selectedPeriod === 'week' ? stats.weeklyAttendance : stats.monthlyAttendance}
          title={`Attendance Rate - Last ${selectedPeriod === 'week' ? '7' : '30'} Days`}
          color="blue"
        />
      )}
    </div>
  )
}

export default Statistics