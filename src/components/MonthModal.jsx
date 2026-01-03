import React, { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { X, Calendar, Plus } from 'lucide-react'
import { toast } from 'react-toastify'

const MonthModal = ({ isOpen, onClose }) => {
  const { createNewMonth, members = [], filteredMembers = [] } = useApp()
  const { isDarkMode } = useTheme()
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const [copyMode, setCopyMode] = useState('all')
  const [selectedMemberIds, setSelectedMemberIds] = useState([])
  const [memberSearch, setMemberSearch] = useState('')

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

  const baseMembers = useMemo(() => {
    if (filteredMembers && filteredMembers.length > 0) return filteredMembers
    return members || []
  }, [filteredMembers, members])

  const searchableMembers = useMemo(() => {
    const term = memberSearch.trim().toLowerCase()
    if (!term) return baseMembers
    return baseMembers.filter(member => {
      const name = (
        member?.full_name ||
        member?.['full_name'] ||
        member?.['Full Name'] ||
        ''
      ).toString().toLowerCase()
      return name.includes(term)
    })
  }, [baseMembers, memberSearch])

  const memberOptions = useMemo(() => searchableMembers.slice(0, 100), [searchableMembers])

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
    if (copyMode === 'custom' && selectedMemberIds.length === 0) {
      toast.error('Select at least one member or choose another copy option')
      return
    }

    setLoading(true)
    try {
      const monthName = months.find(m => m.value === parseInt(selectedMonth))?.label
      const sundays = getSundaysInMonth(parseInt(selectedMonth), selectedYear)

      await createNewMonth({
        month: parseInt(selectedMonth),
        year: selectedYear,
        monthName,
        sundays,
        copyMode,
        selectedMemberIds
      })

      // Reset form and close modal
      setSelectedMonth('')
      setSelectedYear(new Date().getFullYear())
      setCopyMode('all')
      setSelectedMemberIds([])
      setMemberSearch('')
      setShowMonthDropdown(false)
      setShowYearDropdown(false)
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

  /* Animation Logic */
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let timeoutId
    if (isOpen) {
      setIsVisible(true)
    } else {
      timeoutId = setTimeout(() => setIsVisible(false), 200) // Match duration-200
    }
    return () => clearTimeout(timeoutId)
  }, [isOpen])

  if (!isOpen && !isVisible) return null

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60] duration-200 
        ${isOpen ? 'animate-in fade-in' : 'animate-out fade-out'}`}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl mx-4 overflow-visible no-scrollbar transition-colors duration-200 shadow-2xl
        ${isOpen ? 'animate-in zoom-in-95' : 'animate-out zoom-out-95'}`}
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 2rem)'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between px-4 py-4 sm:p-6 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-t-2xl">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Create New Month</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Pick the month/year and decide how much data to carry forward.</p>
          </div>
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
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${isActive
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
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${isActive
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

          {/* Preview Sundays - Moved logic here to avoid early return issue */}
          {(selectedMonth && selectedYear && getSundaysInMonth(parseInt(selectedMonth), selectedYear).length > 0) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Sunday Dates Preview ({getSundaysInMonth(parseInt(selectedMonth), selectedYear).length} dates)
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto transition-colors">
                <div className="flex flex-wrap gap-2">
                  {getSundaysInMonth(parseInt(selectedMonth), selectedYear).map((sunday, index) => (
                    <span key={index} className="px-2 py-1 rounded-full text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">{sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Copy preferences */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              What data should carry over?
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-400 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="copyMode"
                  value="all"
                  checked={copyMode === 'all'}
                  onChange={() => setCopyMode('all')}
                  className="mt-1 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Copy everyone</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Duplicate all current members and their details into the new month.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-400 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="copyMode"
                  value="custom"
                  checked={copyMode === 'custom'}
                  onChange={() => setCopyMode('custom')}
                  className="mt-1 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Select specific people</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Choose exactly who you want to carry over. Leave blank to start with an empty list.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-400 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="copyMode"
                  value="empty"
                  checked={copyMode === 'empty'}
                  onChange={() => setCopyMode('empty')}
                  className="mt-1 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Start fresh</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Create the month with zero members so you can add new records from scratch.</p>
                </div>
              </label>
            </div>
          </div>

          {copyMode === 'custom' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select members to copy
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedMemberIds.length} selected
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full pl-3 pr-10 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                  {memberOptions.length}/{baseMembers.length}
                </span>
              </div>
              <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {memberOptions.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2">No members match that search.</p>
                )}
                {memberOptions.map(member => {
                  const memberId = member.id
                  const displayName = member?.full_name || member?.['full_name'] || member?.['Full Name'] || 'Unnamed member'
                  const selected = selectedMemberIds.includes(memberId)
                  return (
                    <label
                      key={memberId}
                      className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer ${selected ? 'bg-primary-50 dark:bg-primary-900/30' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          setSelectedMemberIds(prev =>
                            prev.includes(memberId)
                              ? prev.filter(id => id !== memberId)
                              : [...prev, memberId]
                          )
                        }}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="flex-1 text-gray-800 dark:text-gray-100 truncate">{displayName}</span>
                    </label>
                  )
                })}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tip: leave everyone unchecked to create a brand-new month with no members.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setSelectedMonth('')
                setSelectedYear(new Date().getFullYear())
                setCopyMode('all')
                setSelectedMemberIds([])
                setMemberSearch('')
                onClose()
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedMonth || !selectedYear || (copyMode === 'custom' && selectedMemberIds.length === 0)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
      </div >
    </div >
  )
}

export default MonthModal