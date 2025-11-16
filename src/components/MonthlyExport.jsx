import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { Download, Calendar, Users, FileText, Filter } from 'lucide-react'
import { toast } from 'react-toastify'

const MonthlyExport = () => {
  const { members, attendanceData, fetchAttendanceForDate } = useApp()
  const { isDarkMode } = useTheme()
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [exportData, setExportData] = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalDays: 0,
    averageAttendance: 0,
    presentDays: 0,
    absentDays: 0
  })

  // Generate all days in the selected month
  const getDaysInMonth = (yearMonth) => {
    const [year, month] = yearMonth.split('-')
    const date = new Date(year, month - 1, 1)
    const days = []
    
    while (date.getMonth() === month - 1) {
      days.push(new Date(date).toISOString().split('T')[0])
      date.setDate(date.getDate() + 1)
    }
    
    return days
  }

  // Fetch attendance data for the entire month
  const fetchMonthlyData = async () => {
    if (!selectedMonth) return
    
    setLoading(true)
    try {
      const days = getDaysInMonth(selectedMonth)
      
      // Fetch attendance for each day
      for (const day of days) {
        await fetchAttendanceForDate(day)
      }
      
      // Generate export data
      const monthlyData = members.map(member => {
        const memberAttendance = {}
        let presentCount = 0
        let totalDays = 0
        
        days.forEach(day => {
          const attendanceKey = `${member.id}_${day}`
          const isPresent = attendanceData[attendanceKey]
          memberAttendance[day] = isPresent
          
          if (isPresent === true) presentCount++
          if (isPresent !== undefined) totalDays++
        })
        
        return {
          id: member.id,
          name: member['full_name'] || member['Full Name'],
          gender: member['Gender'],
          phone: member['Phone Number'],
          age: member['Age'],
          level: member['Current Level'],
          attendance: memberAttendance,
          presentDays: presentCount,
          totalDays: totalDays,
          attendanceRate: totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) : '0'
        }
      })
      
      setExportData(monthlyData)
      
      // Calculate statistics
      const totalMembers = monthlyData.length
      const totalDays = days.length
      const totalPresentDays = monthlyData.reduce((sum, member) => sum + member.presentDays, 0)
      const totalPossibleDays = totalMembers * totalDays
      const averageAttendance = totalPossibleDays > 0 ? ((totalPresentDays / totalPossibleDays) * 100).toFixed(1) : 0
      
      setStats({
        totalMembers,
        totalDays,
        averageAttendance,
        presentDays: totalPresentDays,
        absentDays: totalPossibleDays - totalPresentDays
      })
      
    } catch (error) {
      console.error('Error fetching monthly data:', error)
      toast.error('Error fetching monthly data. Please try again.', {
        style: { background: '#ef4444', color: '#ffffff' }
      })
    } finally {
      setLoading(false)
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    if (exportData.length === 0) {
      toast.warn('No data to export. Select a month and refresh first.', {
        style: { background: '#f59e0b', color: '#ffffff' }
      })
      return
    }

    const days = getDaysInMonth(selectedMonth)
    const headers = [
      'Name', 'Gender', 'Phone', 'Age', 'Level', 
      ...days.map(day => new Date(day).getDate()),
      'Present Days', 'Total Days', 'Attendance Rate (%)'
    ]

    const csvContent = [
      headers.join(','),
      ...exportData.map(member => [
        `"${member.name}"`,
        member.gender,
        member.phone,
        member.age,
        member.level,
        ...days.map(day => {
          const attendance = member.attendance[day]
          return attendance === true ? 'P' : attendance === false ? 'A' : '-'
        }),
        member.presentDays,
        member.totalDays,
        member.attendanceRate
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `TMHT_Attendance_${selectedMonth}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    if (selectedMonth) {
      fetchMonthlyData()
    }
  }, [selectedMonth])

  const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  })

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Monthly Export</h1>
        <p className={`transition-colors ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>Export attendance data for any month</p>
      </div>

      {/* Controls */}
      <div className={`rounded-lg shadow-sm border p-6 mb-6 transition-colors ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar className={`w-5 h-5 transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <label htmlFor="month-select" className={`text-sm font-medium transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Select Month:
              </label>
            </div>
            <input
              id="month-select"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={fetchMonthlyData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Filter className="w-4 h-4" />
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
            
            <button
              onClick={exportToCSV}
              disabled={exportData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className={`rounded-lg shadow-sm border p-6 transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Members</p>
              <p className={`text-2xl font-bold transition-colors ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{stats.totalMembers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className={`rounded-lg shadow-sm border p-6 transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Days in Month</p>
              <p className={`text-2xl font-bold transition-colors ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{stats.totalDays}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className={`rounded-lg shadow-sm border p-6 transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Average Attendance</p>
              <p className={`text-2xl font-bold transition-colors ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{stats.averageAttendance}%</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className={`rounded-lg shadow-sm border p-6 transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Present Days</p>
              <p className={`text-2xl font-bold transition-colors ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{stats.presentDays}</p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDarkMode ? 'bg-green-900' : 'bg-green-100'
            }`}>
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Preview */}
      {loading ? (
        <div className={`rounded-lg shadow-sm border p-12 text-center transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`transition-colors ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>Loading monthly data...</p>
        </div>
      ) : exportData.length > 0 ? (
        <div className={`rounded-lg shadow-sm border overflow-hidden transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className={`px-6 py-4 border-b transition-colors ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold transition-colors ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Attendance Data for {monthName}
            </h3>
            <p className={`text-sm mt-1 transition-colors ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {exportData.length} members • {stats.totalDays} days
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y transition-colors ${
              isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              <thead className={`transition-colors ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Member
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Contact
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Present Days
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Attendance Rate
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 divide-gray-700' 
                  : 'bg-white divide-gray-200'
              }`}>
                {exportData.map((member) => (
                  <tr key={member.id} className={`transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className={`text-sm font-medium transition-colors ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{member.name}</div>
                        <div className={`text-sm transition-colors ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>{member.gender} • Age {member.age} • {member.level}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm transition-colors ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{member.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm transition-colors ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {member.presentDays} / {member.totalDays}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        parseFloat(member.attendanceRate) >= 80 
                          ? 'bg-green-100 text-green-800'
                          : parseFloat(member.attendanceRate) >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className={`rounded-lg shadow-sm border p-12 text-center transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <FileText className={`w-16 h-16 mx-auto mb-4 transition-colors ${
            isDarkMode ? 'text-gray-600' : 'text-gray-300'
          }`} />
          <h3 className={`text-lg font-medium mb-2 transition-colors ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>No Data Available</h3>
          <p className={`mb-4 transition-colors ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Select a month and click "Refresh Data" to load attendance information.
          </p>
        </div>
      )}
    </div>
  )
}

export default MonthlyExport