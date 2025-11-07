import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { X, User, Phone, Calendar, BookOpen, ChevronDown, Info } from 'lucide-react'

const MemberModal = ({ isOpen, onClose }) => {
  const { addMember, markAttendance, currentTable } = useApp()
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

  // Generate Sunday dates dynamically based on current table
  const sundayDates = generateSundayDates(currentTable)
  
  // Initialize Sunday attendance state dynamically
  const initializeSundayAttendance = () => {
    const attendance = {}
    sundayDates.forEach(date => {
      attendance[date] = null // null = not set, true = present, false = absent
    })
    return attendance
  }

  const [sundayAttendance, setSundayAttendance] = useState(() => initializeSundayAttendance())
  const [previousIsOpen, setPreviousIsOpen] = useState(false)
  
  // Reset attendance state when modal opens (but not while it stays open) or current table changes
  React.useEffect(() => {
    if (isOpen && !previousIsOpen) {
      // Modal just opened, reset attendance
      setSundayAttendance(initializeSundayAttendance())
    }
    setPreviousIsOpen(isOpen)
  }, [isOpen, currentTable])

  const levels = [
    'SHS1', 'SHS2', 'SHS3', 
    'JHS1', 'JHS2', 'JHS3', 
    'COMPLETED', 'UNIVERSITY'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const newMember = await addMember({
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        phone_number: formData.phone_number || null
      })
      
      // Mark attendance for selected Sunday dates
      for (const [date, attendance] of Object.entries(sundayAttendance)) {
        if (attendance !== null) {
          try {
            await markAttendance(newMember.id, new Date(date), attendance)
          } catch (attendanceError) {
            console.error(`Error marking attendance for ${date}:`, attendanceError)
          }
        }
      }
      
      // Reset form and close modal
       setFormData({
         full_name: '',
         gender: '',
         phone_number: '',
         age: '',
         current_level: ''
       })
       setSundayAttendance(initializeSundayAttendance())
      onClose()
      
      // Show success message (would use toast in real implementation)
      alert('Member added successfully!')
    } catch (error) {
      console.error('Error adding member:', error)
      alert('Error adding member. Please try again.')
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 max-w-md w-full mx-4 max-h-[90vh] flex flex-col transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Member</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable Form Area */}
        <div className="overflow-y-auto no-scrollbar">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Section: Member Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Info className="w-4 h-4" />
                <span>Basic information</span>
              </div>
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
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
                <label className={`flex items-center space-x-2 p-3 border ${formData.gender === 'male' ? 'border-primary-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 transition-colors duration-200`}>
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
                
                <label className={`flex items-center space-x-2 p-3 border ${formData.gender === 'female' ? 'border-primary-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 transition-colors duration-200`}>
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                    placeholder="Enter phone number"
                />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Tip: enter local digits only if international numbers cause errors.</p>
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                    placeholder="Enter age"
                />
                </div>
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
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                  >
                      <option value="">Select level</option>
                      <optgroup label="SHS">
                        <option value="SHS1">SHS1</option>
                        <option value="SHS2">SHS2</option>
                        <option value="SHS3">SHS3</option>
                      </optgroup>
                      <optgroup label="JHS">
                        <option value="JHS1">JHS1</option>
                        <option value="JHS2">JHS2</option>
                        <option value="JHS3">JHS3</option>
                      </optgroup>
                      <optgroup label="Other">
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="UNIVERSITY">UNIVERSITY</option>
                      </optgroup>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Grouped for clarity. Pick SHS/JHS or an alternative.</p>
            </div>

            {/* Sunday Attendance */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {getMonthDisplayName(currentTable)} Sunday Attendance (Optional)
                </label>
                <div className="space-y-3">
                {sundayDates.map(date => {
                    const dateObj = new Date(date)
                    const dateLabel = dateObj.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                    })
                    
                    return (
                    <div key={date} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors duration-200">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {dateLabel}
                        </span>
                        <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={() => setSundayAttendance(prev => ({ ...prev, [date]: true }))}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            sundayAttendance[date] === true
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                            }`}
                        >
                            Present
                        </button>
                        <button
                            type="button"
                            onClick={() => setSundayAttendance(prev => ({ ...prev, [date]: false }))}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            sundayAttendance[date] === false
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                            }`}
                        >
                            Absent
                        </button>
                        <button
                            type="button"
                            onClick={() => setSundayAttendance(prev => ({ ...prev, [date]: null }))}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
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
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 transition-colors"
                >
                Cancel
                </button>
                <button
                type="submit"
                disabled={loading || !formData.full_name || !formData.gender}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                {loading ? 'Adding...' : 'Add Member'}
                </button>
            </div>
            </form>
        </div>
      </div>
    </div>
  )
}

export default MemberModal