import React from 'react'
import { Check, X, Trash2 } from 'lucide-react'

/**
 * Green selection toolbar for long-press multi-selection
 */
const SelectionToolbar = ({
    selectedCount,
    onPresent,
    onAbsent,
    onCancel,
    onDelete,
    onSelectAll,
    onClearDays,
    sundayDates = [],
    selectedSundayDates = new Set(),
    onToggleSunday,
    isLoading = false,
    showSundaySelection = false
}) => {
    if (selectedCount === 0) return null

    return (
        <div className="sticky top-0 sm:top-2 z-40 bg-green-50/95 dark:bg-green-900/95 border-2 border-green-400 dark:border-green-600 rounded-xl p-3 sm:p-4 mb-2 sm:mb-3 shadow-lg backdrop-blur max-w-4xl mx-auto">
            {/* Horizontal toolbar - centered and full width */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                {/* Selection count badge */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                        {selectedCount}
                    </div>
                    <span className="text-sm font-semibold text-green-900 dark:text-green-100 whitespace-nowrap">
                        {selectedCount} selected
                    </span>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-8 bg-green-300 dark:bg-green-700" />

                {/* Action buttons - horizontal row */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPresent}
                        disabled={isLoading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-all ${isLoading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 active:scale-95'
                            } text-white`}
                    >
                        <Check className="w-4 h-4" />
                        <span>Present</span>
                    </button>
                    <button
                        onClick={onAbsent}
                        disabled={isLoading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-all ${isLoading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 active:scale-95'
                            } text-white`}
                    >
                        <X className="w-4 h-4" />
                        <span>Absent</span>
                    </button>
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            disabled={isLoading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-all ${isLoading ? 'bg-red-300 cursor-not-allowed' : 'bg-red-700 hover:bg-red-800 active:scale-95'
                                } text-white`}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                        </button>
                    )}
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    {isLoading && (
                        <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin dark:border-green-400" />
                    )}
                </div>
            </div>

            {/* Sunday Selection (optional) */}
            {showSundaySelection && sundayDates.length > 0 && (
                <div className="pt-3 border-t border-green-300 dark:border-green-700 mt-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                        <h4 className="text-xs font-semibold text-green-900 dark:text-green-100">Select Sundays:</h4>
                        <div className="flex items-center gap-2">
                            {onSelectAll && (
                                <button
                                    onClick={onSelectAll}
                                    className="px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-700 whitespace-nowrap"
                                >
                                    Select all
                                </button>
                            )}
                            {onClearDays && (
                                <button
                                    onClick={onClearDays}
                                    className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 whitespace-nowrap"
                                >
                                    Clear days
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto px-1 py-1 no-scrollbar mb-2">
                        {sundayDates.map(dateStr => {
                            const checked = selectedSundayDates.has(dateStr)
                            const label = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => onToggleSunday && onToggleSunday(dateStr)}
                                    className={`min-w-fit px-2 py-1 rounded text-xs font-medium transition-colors ${checked ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                                >
                                    {label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default SelectionToolbar
