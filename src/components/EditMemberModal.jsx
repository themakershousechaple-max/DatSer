import React, { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { X, User, Phone, Calendar, BookOpen } from 'lucide-react'

const EditMemberModal = ({ isOpen, onClose, member }) => {
  const { updateMember, markAttendance, refreshSearch, currentTable, attendanceData, loadAllAttendanceData } = useApp()
  const { isDarkMode } = useTheme()
  
  // Helper function to get month display name from table name
  const getMonthDisplayName = (tableName) => {
    // Convert table name like "October_2025" to "October 2025"
    return tableName.replace('_', ' ')
  }
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    gender: '',
    phone_number: '',
    age: '',
    current_level: ''
  })

  // Helper function to generate Sunday dates for the current month/year
  const generateSundayDates = (currentTable) => {
    if (!currentTable) return []
    
    try {
      const [monthName, year] = currentTable.split('_')
      const yearNum = parseInt(year)
      
      const monthIndex = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ].indexOf(monthName)
      
      if (monthIndex === -1) return []
      
      const sundays = []
      const date = new Date(yearNum, monthIndex, 1)
      
      // Find the first Sunday of the month
      while (date.getDay() !== 0) {
        date.setDate(date.getDate() + 1)
      }
      
      // Collect all Sundays in the month
      while (date.getMonth() === monthIndex) {
        sundays.push(date.toISOString().split('T')[0]) // Format as YYYY-MM-DD
        date.setDate(date.getDate() + 7)
      }
      
      return sundays
    } catch (error) {
      console.error('Error generating Sunday dates:', error)
      return []
    }
  }

  // Generate Sunday dates dynamically based on current table, memoized to avoid ref churn
  const sundayDates = useMemo(() => generateSundayDates(currentTable), [currentTable])
  const [sundayAttendance, setSundayAttendance] = useState({})

  const levels = [
    'SHS1', 'SHS2', 'SHS3', 
    'JHS1', 'JHS2', 'JHS3', 
    'COMPLETED', 'UNIVERSITY'
  ]

  // Initialize form data when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        full_name: (member['full_name'] || member['Full Name'] || ''),
        gender: member['Gender'] || '',
        phone_number: member['Phone Number'] || '',
        age: member['Age'] || '',
        current_level: member['Current Level'] || ''
      })
    }
  }, [member])

  // Initialize attendance snapshot when modal opens (stable deps, no loop)
  useEffect(() => {
    if (!isOpen || !member || sundayDates.length === 0) return

    const initialAttendance = {}
    sundayDates.forEach(date => {
      const dateKey = date
      const memberAttendance = attendanceData[dateKey]?.[member.id]
      if (memberAttendance !== undefined) {
        initialAttendance[date] = memberAttendance
      }
    })
    setSundayAttendance(initialAttendance)
  }, [isOpen, member?.id, currentTable])

  // Update attendance state when attendanceData changes
  useEffect(() => {
    if (member && sundayDates.length > 0) {
      const updatedAttendance = {}
      sundayDates.forEach(date => {
        const dateKey = date
        const memberAttendance = attendanceData[dateKey]?.[member.id]
        if (memberAttendance !== undefined) {
          updatedAttendance[date] = memberAttendance
        }
      })
      setSundayAttendance(prev => ({ ...prev, ...updatedAttendance }))
    }
  }, [attendanceData, member?.id, sundayDates])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateMember(member.id, {
        // Pass normalized fields; AppContext will map to the correct table column
        full_name: formData.full_name,
        Gender: formData.gender,
        'Phone Number': formData.phone_number || null,
        Age: formData.age ? parseInt(formData.age) : null,
        'Current Level': formData.current_level
      })

      // Mark attendance for selected Sunday dates
      for (const [date, attendance] of Object.entries(sundayAttendance)) {
        if (attendance !== null) {
          await markAttendance(member.id, new Date(date), attendance)
        }
      }
      
      onClose()
      
      // Reset Sunday attendance state
      setSundayAttendance({})
      
      // Refresh search results to show updated information
      setTimeout(() => refreshSearch(), 100)
      
      // Show success message (would use toast in real implementation)
      alert('Member updated successfully!')
    } catch (error) {
      console.error('Error updating member:', error)
      alert('Error updating member. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!isOpen || !member) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Member</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                placeholder="Enter full name"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gender *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={handleInputChange}
                  required
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Male</span>
              </label>
              
              <label className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={handleInputChange}
                  required
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Female</span>
              </label>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                placeholder="Enter phone number"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Tip: enter local digits only; long numbers are trimmed for saving.</p>
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Age
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="1"
                max="120"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                placeholder="Enter age"
              />
            </div>
          </div>

          {/* Current Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Level
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                name="current_level"
                value={formData.current_level}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              >
                <option value="">Select level</option>
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sunday Attendance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {getMonthDisplayName(currentTable)} Sunday Attendance (Optional)
            </label>
            <div className="space-y-3">
              {sundayDates.map(date => {
                const dateObj = new Date(date)
                const formattedDate = dateObj.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })
                
                return (
                  <div key={date} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700 transition-colors">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {formattedDate}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setSundayAttendance(prev => ({ ...prev, [date]: true }))}
                        className={`px-3 py-1 text-xs rounded-full font-bold transition-all duration-200 ${
                          sundayAttendance[date] === true
                            ? 'bg-green-800 dark:bg-green-700 text-white shadow-xl ring-4 ring-green-300 dark:ring-green-400 border-2 border-green-900 dark:border-green-300 font-extrabold transform scale-110'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500 hover:bg-green-50 dark:hover:bg-green-800'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => setSundayAttendance(prev => ({ ...prev, [date]: false }))}
                        className={`px-3 py-1 text-xs rounded-full font-bold transition-all duration-200 ${
                          sundayAttendance[date] === false
                            ? 'bg-red-800 dark:bg-red-700 text-white shadow-xl ring-4 ring-red-300 dark:ring-red-400 border-2 border-red-900 dark:border-red-300 font-extrabold transform scale-110'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500 hover:bg-red-50 dark:hover:bg-red-800'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        type="button"
                        onClick={() => setSundayAttendance(prev => ({ ...prev, [date]: null }))}
                        className="px-3 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.full_name || !formData.gender}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Updating...' : 'Update Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditMemberModal