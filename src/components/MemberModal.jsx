import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { X, User, Phone, Calendar, BookOpen, ChevronDown, Info } from 'lucide-react'
import { toast } from 'react-toastify'

const MemberModal = ({ isOpen, onClose }) => {
  const { addMember, markAttendance, currentTable, toggleMemberBadge, updateMemberBadges, updateMember } = useApp()
  const { isDarkMode } = useTheme()

  // Helper function to get month display name from table name
  const getMonthDisplayName = (tableName) => {
    // Convert table name like "October_2025" to "October 2025"
    return tableName.replace('_', ' ')
  }
  const [loading, setLoading] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [showParentErrors, setShowParentErrors] = useState(false)
  const [isLevelOpen, setIsLevelOpen] = useState(false)
  const [newlyAddedMemberId, setNewlyAddedMemberId] = useState(null)
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
  const [selectedTags, setSelectedTags] = useState([]) // ['member','regular','newcomer']
  const [showParentInfo, setShowParentInfo] = useState(false)
  const [parentInfo, setParentInfo] = useState({
    parent_name_1: '',
    parent_phone_1: '',
    parent_name_2: '',
    parent_phone_2: ''
  })

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

  const toggleTagSelect = (tag) => {
    setSelectedTags(prev => prev.includes(tag)
      ? prev.filter(t => t !== tag)
      : [...prev, tag]
    )
  }

  const [hasAttemptedSave, setHasAttemptedSave] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setHasAttemptedSave(true)

    const isFullNameValid = formData.full_name && formData.full_name.trim().length > 0
    const isGenderValid = !!formData.gender
    const isLevelValid = !!formData.current_level
    const phoneDigits = (formData.phone_number || '').replace(/\D/g, '')
    const isPhoneValid = phoneDigits.length === 10
    const ageNum = parseInt(formData.age)
    const isAgeValid = formData.age && !isNaN(ageNum) && ageNum >= 1 && ageNum <= 120

    // Only required fields are Full Name and Gender based on current form logic, 
    // but let's enforce all if they are touched or if we want strict validation.
    // Actually, looking at the code, Full Name and Gender are marked with *, others are not.
    // But the user said "ensure... gender phone number age... select all".
    // So I should enforce them if they are required.
    // The original code enforced: !isFullNameValid || !isGenderValid || !isLevelValid || !isPhoneValid || !isAgeValid
    // Wait, the original code enforced ALL of them?
    // Original: if (!isFullNameValid || !isGenderValid || !isLevelValid || !isPhoneValid || !isAgeValid)
    // Yes, it seems it was enforcing all of them to be valid if entered, or maybe required?
    // Let's check the original condition again.
    // isPhoneValid = phoneDigits.length === 10. If empty, length is 0, so invalid. 
    // So Phone WAS required.
    // isAgeValid = !isNaN... If empty, parseInt is NaN, so invalid.
    // So Age WAS required.
    // isLevelValid = !!formData.current_level. So Level WAS required.

    // So yes, I should enforce all of them.

    if (!isFullNameValid || !isGenderValid || !isLevelValid || !isPhoneValid || !isAgeValid) {
      setShowErrors(true)
      toast.error('Please fill in all required fields correctly')
      return
    }
    setLoading(true)

    try {
      const newMember = await addMember({
        ...formData,
        ...parentInfo,
        age: formData.age ? parseInt(formData.age) : null,
        phone_number: formData.phone_number || null
      })

      // Assign selected tags (Member / Regular / Newcomer)
      if (selectedTags.length > 0 && newMember?.id) {
        for (const tag of selectedTags) {
          try {
            await toggleMemberBadge(newMember.id, tag, { suppressToast: true })
          } catch (badgeError) {
            console.error(`Error assigning ${tag} badge:`, badgeError)
          }
        }
        try {
          await updateMemberBadges()
        } catch (updateError) {
          console.warn('Badge update recalculation failed:', updateError)
        }
      }

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

      // Reset form and open Parent Info popup to complete mandatory details
      setFormData({
        full_name: '',
        gender: '',
        phone_number: '',
        age: '',
        current_level: ''
      })
      setSundayAttendance(initializeSundayAttendance())
      setSelectedTags([])
      setParentInfo({ parent_name_1: '', parent_phone_1: '', parent_name_2: '', parent_phone_2: '' })
      setShowErrors(false)
      setNewlyAddedMemberId(newMember.id)
      setShowParentInfo(true)

      // Success toast handled in global state
    } catch (error) {
      console.error('Error adding member:', error)
      // Error toast handled in global state
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowParentInfo(true)}
              className="px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 border border-blue-300 dark:border-blue-700"
              title="Add Parent Info"
            >
              Add Parent Info
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Area */}
        <div className="overflow-y-auto no-scrollbar">
          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
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
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 border ${showErrors && (!formData.full_name || !formData.full_name.trim()) ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'}`}
                    placeholder="Enter full name"
                  />
                  {showErrors && (!formData.full_name || !formData.full_name.trim()) && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">Please enter full name</p>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors duration-200 ${formData.gender === 'male' ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-1 ring-primary-300 dark:ring-primary-800 shadow-sm font-semibold' : (showErrors && !formData.gender ? 'border-red-500 ring-1 ring-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300')}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={handleInputChange}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Male</span>
                  </label>

                  <label className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors duration-200 ${formData.gender === 'female' ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-1 ring-primary-300 dark:ring-primary-800 shadow-sm font-semibold' : (showErrors && !formData.gender ? 'border-red-500 ring-1 ring-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300')}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={handleInputChange}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Female</span>
                  </label>
                </div>
                {showErrors && !formData.gender && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">Please select gender to continue</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    className={`w-full pl-10 pr-20 py-2 rounded-lg focus:outline-none focus:ring-1 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border ${showErrors && ((formData.phone_number || '').replace(/\D/g, '').length !== 10) ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'}`}
                    placeholder="Enter phone number"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, phone_number: '0000000000' }))}
                      className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-600"
                      title="Set no phone number"
                    >
                      No Phone
                    </button>
                  </div>
                </div>
                {showErrors && ((formData.phone_number || '').replace(/\D/g, '').length !== 10) && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">Phone number must be 10 digits</p>
                )}
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
                    inputMode="numeric"
                    pattern="[0-9]*"
                    step="1"
                    className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 border ${showErrors && (!formData.age || isNaN(parseInt(formData.age))) ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'}`}
                    placeholder="Enter age"
                  />
                </div>
                {showErrors && (!formData.age || isNaN(parseInt(formData.age))) && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">Please enter age</p>
                )}
              </div>

              {/* Current Level */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Level
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsLevelOpen(!isLevelOpen)}
                    className={`w-full pl-10 pr-4 py-2 text-left rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 border flex items-center justify-between ${showErrors && !formData.current_level ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'}`}
                  >
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-3" />
                      <span className={!formData.current_level ? 'text-gray-500 dark:text-gray-400' : ''}>
                        {formData.current_level || 'Select level'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isLevelOpen ? 'transform rotate-180' : ''}`} />
                  </button>

                  {isLevelOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {levels.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => {
                            handleInputChange({ target: { name: 'current_level', value: level } })
                            setIsLevelOpen(false)
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${formData.current_level === level
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300'
                            }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {showErrors && !formData.current_level && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">Please select current level</p>
                )}
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
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${sundayAttendance[date] === true
                              ? 'bg-green-600 text-white shadow-sm'
                              : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                              }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setSundayAttendance(prev => ({ ...prev, [date]: false }))}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${sundayAttendance[date] === false
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

              {/* Tags selection */}
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Assign Tags (Optional)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => toggleTagSelect('member')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedTags.includes('member')
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800'
                      }`}
                  >
                    Member
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTagSelect('regular')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedTags.includes('regular')
                      ? 'bg-green-600 text-white border-green-600 shadow-sm'
                      : 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-800'
                      }`}
                  >
                    Regular
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTagSelect('newcomer')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedTags.includes('newcomer')
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-800'
                      }`}
                  >
                    Newcomer
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Tap to select one or more tags to save with this member.</p>
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
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Parent Info Popup */}
        {
          showParentInfo && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50" onClick={() => setShowParentInfo(false)}>
              <div className={`rounded-xl shadow-2xl w-full max-w-sm overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
                <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Parent Information</h3>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <div>
                    <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Full Name 1</label>
                    <input
                      type="text"
                      value={parentInfo.parent_name_1}
                      onChange={(e) => setParentInfo(prev => ({ ...prev, parent_name_1: e.target.value }))}
                      className={`w-full px-3 py-2 rounded border ${showParentErrors && (!parentInfo.parent_name_1 || !parentInfo.parent_name_1.trim()) ? 'border-red-500 ring-1 ring-red-400' : (isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900')}`}
                      placeholder="Enter parent full name"
                    />
                    {showParentErrors && (!parentInfo.parent_name_1 || !parentInfo.parent_name_1.trim()) && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">Please enter Parent Full Name 1</p>
                    )}
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone Number 1</label>
                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        value={parentInfo.parent_phone_1}
                        onChange={(e) => setParentInfo(prev => ({ ...prev, parent_phone_1: e.target.value }))}
                        className={`w-full pr-20 px-3 py-2 rounded border ${showParentErrors && ((parentInfo.parent_phone_1 || '').replace(/\D/g, '').length !== 10) ? 'border-red-500 ring-1 ring-red-400' : (isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900')}`}
                        placeholder="Enter phone number"
                      />
                      <button
                        type="button"
                        onClick={() => setParentInfo(prev => ({ ...prev, parent_phone_1: '0000000000' }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-600"
                      >
                        No Phone
                      </button>
                    </div>
                    {showParentErrors && ((parentInfo.parent_phone_1 || '').replace(/\D/g, '').length !== 10) && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">Phone number must be 10 digits</p>
                    )}
                  </div>
                  <div className={`rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} p-3`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Optional</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Full Name 2</label>
                        <input
                          type="text"
                          value={parentInfo.parent_name_2}
                          onChange={(e) => setParentInfo(prev => ({ ...prev, parent_name_2: e.target.value }))}
                          className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                          placeholder="Enter parent full name"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone Number 2</label>
                        <div className="relative">
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={10}
                            value={parentInfo.parent_phone_2}
                            onChange={(e) => setParentInfo(prev => ({ ...prev, parent_phone_2: e.target.value }))}
                            className={`w-full pr-20 px-3 py-2 rounded border ${(showParentErrors && (parentInfo.parent_phone_2 || '').length > 0 && ((parentInfo.parent_phone_2 || '').replace(/\D/g, '').length !== 10)) ? 'border-red-500 ring-1 ring-red-400' : (isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900')}`}
                            placeholder="Enter phone number"
                          />
                          <button
                            type="button"
                            onClick={() => setParentInfo(prev => ({ ...prev, parent_phone_2: '0000000000' }))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-600"
                          >
                            No Phone
                          </button>
                        </div>
                        {(showParentErrors && (parentInfo.parent_phone_2 || '').length > 0 && ((parentInfo.parent_phone_2 || '').replace(/\D/g, '').length !== 10)) && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">Phone number must be 10 digits</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-3 flex items-center justify-end gap-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    type="button"
                    onClick={() => { setShowParentInfo(false); setShowParentErrors(false); setNewlyAddedMemberId(null) }}
                    className={`px-3 py-1 rounded ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} hover:bg-gray-200`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const validName = parentInfo.parent_name_1 && parentInfo.parent_name_1.trim().length > 0
                      const validPhone1 = ((parentInfo.parent_phone_1 || '').replace(/\D/g, '').length === 10)
                      const phone2Len = ((parentInfo.parent_phone_2 || '').replace(/\D/g, '').length)
                      const validPhone2OrEmpty = phone2Len === 0 || phone2Len === 10
                      if (!validName || !validPhone1 || !validPhone2OrEmpty) {
                        setShowParentErrors(true)
                        return
                      }
                      try {
                        await updateMember(newlyAddedMemberId, {
                          parent_name_1: parentInfo.parent_name_1,
                          parent_phone_1: parentInfo.parent_phone_1,
                          parent_name_2: parentInfo.parent_name_2,
                          parent_phone_2: parentInfo.parent_phone_2
                        })
                      } catch (err) {
                        console.error('Failed to save parent info:', err)
                      }
                      setShowParentErrors(false)
                      setShowParentInfo(false)
                      setNewlyAddedMemberId(null)
                      onClose()
                    }}
                    className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )
        }

      </div >
    </div >
  )
}

export default MemberModal
