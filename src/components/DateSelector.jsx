import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Calendar, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const DateSelector = ({ variant = 'icon' }) => {
  const { 
    selectedAttendanceDate, 
    setAndSaveAttendanceDate, 
    availableSundayDates 
  } = useApp()
  const { isDarkMode } = useTheme()
  
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const [autoSundayEnabled, setAutoSundayEnabled] = useState(() => {
    return localStorage.getItem('autoSundayEnabled') === 'true'
  })

  const toggleAutoSunday = () => {
    const newValue = !autoSundayEnabled
    setAutoSundayEnabled(newValue)
    localStorage.setItem('autoSundayEnabled', newValue.toString())
    if (newValue) {
      autoSelectSunday()
    }
  }

  const autoSelectSunday = () => {
    if (availableSundayDates.length === 0) return
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isTodaySunday = today.getDay() === 0
    let targetSunday = null

    if (isTodaySunday) {
      for (const date of availableSundayDates) {
        const dateTime = new Date(date)
        dateTime.setHours(0, 0, 0, 0)
        if (dateTime.getTime() === today.getTime()) {
          targetSunday = date
          break
        }
      }
    }

    if (!targetSunday) {
      for (const date of availableSundayDates) {
        const dateTime = new Date(date)
        dateTime.setHours(0, 0, 0, 0)
        if (dateTime <= today) {
          targetSunday = date
        }
      }
    }

    if (!targetSunday && availableSundayDates.length > 0) {
      targetSunday = availableSundayDates[0]
    }

    if (targetSunday) {
      setAndSaveAttendanceDate(targetSunday)
    }
  }

  useEffect(() => {
    if (!autoSundayEnabled || availableSundayDates.length === 0) return
    if (selectedAttendanceDate) return
    autoSelectSunday()
  }, [autoSundayEnabled, availableSundayDates])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscKey)
    return () => document.removeEventListener('keydown', handleEscKey)
  }, [isOpen])

  const formatDate = (date) => {
    if (!date) return 'Select Date'
    const options = variant === 'menu'
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' }
    return date.toLocaleDateString('en-US', options)
  }

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th'
    switch (day % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }

  const formatDateWithOrdinal = (date) => {
    const day = date.getDate()
    const suffix = getOrdinalSuffix(day)
    const options = { month: 'long', year: 'numeric' }
    const monthYear = date.toLocaleDateString('en-US', options)
    return `${day}${suffix} ${monthYear}`
  }

  const handleDateSelect = (date) => {
    setAndSaveAttendanceDate(date)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {variant === 'menu' ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
          title={selectedAttendanceDate ? `Selected: ${formatDate(selectedAttendanceDate)}` : 'Select Attendance Date'}
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{selectedAttendanceDate ? formatDate(selectedAttendanceDate) : 'Select Attendance Date'}</span>
          </span>
          {selectedAttendanceDate && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">Selected</span>
          )}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center w-10 h-10 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
            isOpen ? 'bg-blue-700 ring-2 ring-blue-300' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          title={selectedAttendanceDate ? `Selected: ${formatDate(selectedAttendanceDate)}` : 'Select Attendance Date'}
        >
          <Calendar className="w-5 h-5" />
        </button>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4" 
          onClick={() => setIsOpen(false)}
        >
          <div 
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`bg-gradient-to-r ${isDarkMode ? 'from-blue-700 to-blue-800' : 'from-blue-600 to-blue-700'} text-white px-6 py-4 relative`}>
              <button
                onClick={() => setIsOpen(false)}
                className={`absolute top-4 right-4 p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white hover:bg-opacity-10' : 'hover:bg-white hover:bg-opacity-20'}`}
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold pr-8">Select Attendance Date</h3>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-blue-200' : 'text-blue-100'}`}>Choose a Sunday for marking attendance</p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {availableSundayDates.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Calendar className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-300'}`} />
                  <p className={`text-base mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>No attendance dates available</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Please check your current month table</p>
                </div>
              ) : (
                <div className="py-4">
                  {availableSundayDates.map((date, index) => {
                    const isSelected = selectedAttendanceDate && date.getTime() === selectedAttendanceDate.getTime()
                    return (
                      <button
                        key={index}
                        onClick={() => handleDateSelect(date)}
                        className={`w-full text-left px-6 py-4 transition-all duration-200 border-l-4 hover:shadow-sm ${
                          isSelected
                            ? isDarkMode 
                              ? 'bg-blue-900 bg-opacity-30 border-l-blue-400 text-blue-300 shadow-sm'
                              : 'bg-blue-50 border-l-blue-500 text-blue-700 shadow-sm'
                            : isDarkMode
                              ? 'border-l-transparent hover:bg-gray-700 hover:border-l-gray-500 text-gray-200'
                              : 'border-l-transparent hover:bg-gray-50 hover:border-l-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`text-base ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                              {formatDateWithOrdinal(date)}
                            </div>
                            <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Sunday Service
                            </div>
                          </div>
                          {isSelected && (
                            <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            
            <div className={`px-6 py-4 border-t ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Auto-select current Sunday
                </p>
                <button
                  onClick={toggleAutoSunday}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    autoSundayEnabled
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-500'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${autoSundayEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  {autoSundayEnabled ? 'Auto ON' : 'Auto OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateSelector