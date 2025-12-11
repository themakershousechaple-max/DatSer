import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { X, Calendar, Plus } from 'lucide-react'
import { toast } from 'react-toastify'

const MonthModal = ({ isOpen, onClose }) => {
  const { createNewMonth } = useApp()
  const { isDarkMode } = useTheme()
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showYearDropdown, setShowYearDropdown] = useState(false)

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i)

  const getSundaysInMonth = (month, year) => {
    const sundays = []
    const date = new Date(year, month - 1, 1)
    
    // Find first Sunday
    while (date.getDay() !== 0) {
      date.setDate(date.getDate() + 1)
    }
    
    // Collect all Sundays in the month
    while (date.getMonth() === month - 1) {
      sundays.push(new Date(date))
      date.setDate(date.getDate() + 7)
    }
    
    return sundays
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedMonth || !selectedYear) return

    setLoading(true)
    try {
      const monthName = months.find(m => m.value === parseInt(selectedMonth))?.label
      const sundays = getSundaysInMonth(parseInt(selectedMonth), selectedYear)
      
      await createNewMonth({
        month: parseInt(selectedMonth),
        year: selectedYear,
        monthName,
        sundays
      })
      
      // Reset form and close modal
      setSelectedMonth('')
      setSelectedYear(new Date().getFullYear())
      onClose()
      
      // Success toast handled by createNewMonth
    } catch (error) {
      console.error('Error creating month:', error)
      
      // Show detailed error message
      let errorMessage = 'Error creating month. Please try again.'
      
      if (error.message) {
        errorMessage = `Error creating month: ${error.message}`
      } else if (error.error) {
        errorMessage = `Error creating month: ${error.error}`
      } else if (error.details) {
        errorMessage = `Error creating month: ${error.details}`
      }
      
      // Log full error details to console for debugging
      console.error('Full error details:', {
        message: error.message,
        error: error.error,
        details: error.details,
        code: error.code,
        hint: error.hint,
        fullError: error
      })
      
      // Error toast handled by createNewMonth
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const previewSundays = selectedMonth && selectedYear ? getSundaysInMonth(parseInt(selectedMonth), selectedYear) : []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm sm:max-w-md mx-4 overflow-visible no-scrollbar transition-colors duration-200"
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 2rem)'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 sm:p-6 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-t-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Create New Month</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-4 py-4 sm:p-6 space-y-4">
          {/* Month Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Month *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
              {/* Custom dropdown trigger */}
              <button
                type="button"
                onClick={() => setShowMonthDropdown(prev => !prev)}
                className="w-full min-w-0 pl-10 pr-10 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors flex items-center justify-between"
              >
                <span className={selectedMonth ? '' : 'text-gray-400 dark:text-gray-400'}>
                  {selectedMonth
                    ? months.find(m => m.value === parseInt(selectedMonth))?.label
                    : 'Choose month'}
                </span>
                <span className="ml-2 inline-flex items-center justify-center text-gray-400 dark:text-gray-400">
                  {/* simple chevron indicator */}
                  <svg
                    className={`w-4 h-4 transform transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </button>

              {/* Downward-opening dropdown list (scrollable inside, hidden scrollbar) */}
              {showMonthDropdown && (
                <div className="absolute left-0 right-0 mt-1 z-20 max-h-60 overflow-y-auto no-scrollbar rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
                  {months.map(month => {
                    const isActive = selectedMonth && parseInt(selectedMonth) === month.value
                    return (
                      <button
                        key={month.value}
                        type="button"
                        onClick={() => {
                          setSelectedMonth(String(month.value))
                          setShowMonthDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                            : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {month.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Year Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Year *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
              {/* Custom dropdown trigger */}
              <button
                type="button"
                onClick={() => setShowYearDropdown(prev => !prev)}
                className="w-full min-w-0 pl-10 pr-10 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors flex items-center justify-between"
              >
                <span>{selectedYear}</span>
                <span className="ml-2 inline-flex items-center justify-center text-gray-400 dark:text-gray-400">
                  {/* simple chevron indicator */}
                  <svg
                    className={`w-4 h-4 transform transition-transform ${showYearDropdown ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </button>

              {/* Downward-opening dropdown list (scrollable inside, hidden scrollbar) */}
              {showYearDropdown && (
                <div className="absolute left-0 right-0 mt-1 z-20 max-h-60 overflow-y-auto no-scrollbar rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
                  {years.map(year => {
                    const isActive = selectedYear === year
                    return (
                      <button
                        key={year}
                        type="button"
                        onClick={() => {
                          setSelectedYear(year)
                          setShowYearDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                            : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {year}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Preview Sundays */}
          {previewSundays.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Sunday Dates Preview ({previewSundays.length} dates)
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto transition-colors">
                <div className="space-y-1">
                  {previewSundays.map((sunday, index) => (
                    <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
                      {sunday.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedMonth || !selectedYear}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                'Creating...'
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Month
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MonthModal