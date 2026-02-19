import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
    Archive,
    Download,
    Trash2,
    Users,
    ChevronDown,
    ChevronUp,
    Loader2,
    X,
    AlertTriangle,
    CheckCircle,
    ExternalLink,
    FileSpreadsheet,
    Info
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { toast } from 'react-toastify'

const ArchiveMonthModal = ({ isOpen, onClose, tableName, onArchiveComplete }) => {
    const { members, deleteMonthTable, isSupabaseConfigured, dataOwnerId, monthlyTables } = useApp()
    const { user } = useApp()

    const [step, setStep] = useState('summary') // 'summary' | 'confirm' | 'archiving' | 'done'
    const [monthData, setMonthData] = useState([])
    const [loading, setLoading] = useState(true)
    const [csvBlob, setCsvBlob] = useState(null)
    const [downloaded, setDownloaded] = useState(false)
    const [showDetails, setShowDetails] = useState(false)
    const [archiveError, setArchiveError] = useState(null)

    const label = tableName ? tableName.replace('_', ' ') : ''

    // Fetch all data for this month
    useEffect(() => {
        if (!isOpen || !tableName) return
        setStep('summary')
        setDownloaded(false)
        setCsvBlob(null)
        setArchiveError(null)
        setLoading(true)

        const fetchData = async () => {
            try {
                if (!isSupabaseConfigured()) {
                    setMonthData(members || [])
                    setLoading(false)
                    return
                }

                let allRows = []
                let offset = 0
                const PAGE = 1000
                while (true) {
                    const { data, error } = await supabase
                        .from(tableName)
                        .select('*')
                        .range(offset, offset + PAGE - 1)
                    if (error) throw error
                    if (!data || data.length === 0) break
                    allRows = allRows.concat(data)
                    if (data.length < PAGE) break
                    offset += PAGE
                }
                setMonthData(allRows)
            } catch (err) {
                console.error('Failed to fetch month data for archive:', err)
                toast.error('Failed to load month data')
                setMonthData([])
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [isOpen, tableName, isSupabaseConfigured, members])

    // Compute summary stats
    const stats = useMemo(() => {
        const total = monthData.length
        const males = monthData.filter(m => {
            const g = (m.Gender || m.gender || '').toLowerCase()
            return g === 'male' || g === 'm'
        }).length
        const females = monthData.filter(m => {
            const g = (m.Gender || m.gender || '').toLowerCase()
            return g === 'female' || g === 'f'
        }).length

        // Age breakdown
        const ages = {}
        monthData.forEach(m => {
            const age = parseInt(m.Age || m.age || '0', 10)
            if (age > 0) {
                let bracket
                if (age <= 12) bracket = '12 & under'
                else if (age <= 15) bracket = '13-15'
                else if (age <= 18) bracket = '16-18'
                else if (age <= 25) bracket = '19-25'
                else bracket = '26+'
                ages[bracket] = (ages[bracket] || 0) + 1
            }
        })

        // Level breakdown
        const levels = {}
        monthData.forEach(m => {
            const level = m['Current Level'] || m.current_level || ''
            if (level) {
                levels[level] = (levels[level] || 0) + 1
            }
        })

        // Sort levels by count descending
        const sortedLevels = Object.entries(levels)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8) // Top 8

        return { total, males, females, ages, levels: sortedLevels }
    }, [monthData])

    // Generate CSV
    const generateCSV = useCallback(() => {
        const columns = [
            'Full Name', 'Gender', 'Phone Number', 'Age',
            'Current Level', 'Parent Name', 'Parent Phone Number'
        ]

        // Find all attendance date columns (they look like YYYY-MM-DD)
        const dateColumns = new Set()
        monthData.forEach(row => {
            Object.keys(row).forEach(key => {
                if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
                    dateColumns.add(key)
                }
            })
        })
        const sortedDates = [...dateColumns].sort()

        const allColumns = [...columns, ...sortedDates]

        // Format phone numbers
        const formatPhone = (val) => {
            if (!val) return ''
            const str = String(val).trim()
            const digits = str.replace(/\D/g, '')
            if (!digits) return str
            return digits.startsWith('0') ? digits : '0' + digits
        }

        // Normalize gender
        const normalizeGender = (val) => {
            if (!val) return ''
            const str = String(val).trim().toLowerCase()
            if (str === 'm' || str === 'male') return 'Male'
            if (str === 'f' || str === 'female') return 'Female'
            return val
        }

        // Summary header
        const summaryLines = [
            `# Archive: ${label}`,
            `# Total Members: ${stats.total}`,
            `# Male: ${stats.males}`,
            `# Female: ${stats.females}`,
            `# Archived on: ${new Date().toLocaleString()}`,
            ``
        ]

        // CSV header
        const csvHeader = allColumns.map(h => `"${h}"`).join(',')

        // CSV rows
        const csvRows = monthData.map(row => {
            return allColumns.map(col => {
                let v = row[col] ?? row[col.toLowerCase().replace(/ /g, '_')] ?? ''

                if (col === 'Phone Number' || col === 'Parent Phone Number') {
                    v = formatPhone(v)
                }
                if (col === 'Gender') {
                    v = normalizeGender(v)
                }

                if (typeof v === 'string') v = v.replace(/"/g, '""')
                return `"${v}"`
            }).join(',')
        })

        const csvContent = summaryLines.join('\n') + csvHeader + '\n' + csvRows.join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        setCsvBlob(blob)
        return blob
    }, [monthData, label, stats])

    // Download CSV
    const handleDownload = useCallback(() => {
        const blob = csvBlob || generateCSV()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `archive_${tableName}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        setDownloaded(true)
        toast.success('CSV downloaded successfully!')
    }, [csvBlob, generateCSV, tableName])

    // Open Google Sheets import
    const handleOpenSheets = () => {
        window.open('https://sheets.google.com/create', '_blank')
    }

    // Archive (delete from Supabase)
    const handleArchive = async () => {
        setStep('archiving')
        setArchiveError(null)
        try {
            await deleteMonthTable(tableName)
            setStep('done')
            if (onArchiveComplete) onArchiveComplete(tableName)
        } catch (err) {
            console.error('Archive failed:', err)
            setArchiveError(err?.message || 'Failed to archive month')
            setStep('confirm')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Archive className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Archive Month</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Loading month data...</p>
                        </div>
                    )}

                    {/* Summary Step */}
                    {!loading && step === 'summary' && (
                        <>
                            {/* Info Banner */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                <div className="flex gap-3">
                                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">What does archiving do?</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                            Archiving exports your data as a CSV file and removes it from the database to free up storage space.
                                            You can import the CSV into Google Sheets to keep it accessible.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Total People</div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.males}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Male</div>
                                </div>
                                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-3 text-center">
                                    <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{stats.females}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Female</div>
                                </div>
                            </div>

                            {/* Expandable Details */}
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <span>More Details</span>
                                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {showDetails && (
                                <div className="space-y-4 animate-in">
                                    {/* Age Breakdown */}
                                    {Object.keys(stats.ages).length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Age Groups</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {Object.entries(stats.ages).map(([bracket, count]) => (
                                                    <div key={bracket} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{bracket}</span>
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Level Breakdown */}
                                    {stats.levels.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Top Levels</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {stats.levels.map(([level, count]) => (
                                                    <div key={level} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{level}</span>
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="space-y-3 pt-2">
                                {/* Download CSV */}
                                <button
                                    onClick={handleDownload}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                                >
                                    <Download className="w-5 h-5" />
                                    {downloaded ? 'Download Again' : 'Download CSV'}
                                </button>

                                {/* Open Google Sheets */}
                                {downloaded && (
                                    <button
                                        onClick={handleOpenSheets}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-gray-700 border-2 border-green-500 text-green-700 dark:text-green-400 font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                    >
                                        <FileSpreadsheet className="w-5 h-5" />
                                        Open Google Sheets
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                )}

                                {/* Archive & Delete */}
                                <button
                                    onClick={() => setStep('confirm')}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    Archive & Delete from Database
                                </button>

                                {!downloaded && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 text-center flex items-center justify-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        We recommend downloading the CSV before deleting
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Confirm Step */}
                    {!loading && step === 'confirm' && (
                        <div className="space-y-4">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                                <div className="flex gap-3">
                                    <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-red-800 dark:text-red-300">Are you sure?</p>
                                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                            This will permanently delete <strong>{label}</strong> and all <strong>{stats.total} records</strong> from the database.
                                            This action cannot be undone.
                                        </p>
                                        {!downloaded && (
                                            <p className="text-sm text-red-700 dark:text-red-300 mt-2 font-medium">
                                                You haven't downloaded the CSV yet!
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {archiveError && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                    <p className="text-sm text-red-600 dark:text-red-400">{archiveError}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep('summary')}
                                    className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={handleArchive}
                                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                                >
                                    Yes, Delete Forever
                                </button>
                            </div>

                            {!downloaded && (
                                <button
                                    onClick={() => { handleDownload(); setStep('summary') }}
                                    className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download CSV First
                                </button>
                            )}
                        </div>
                    )}

                    {/* Archiving Step */}
                    {step === 'archiving' && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Archiving {label}...</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Removing data from database</p>
                        </div>
                    )}

                    {/* Done Step */}
                    {step === 'done' && (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">Archived Successfully!</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {label} has been removed from the database.
                                    {downloaded && ' Your CSV backup is saved.'}
                                </p>
                            </div>

                            <div className="w-full space-y-3 pt-2">
                                {downloaded && (
                                    <button
                                        onClick={handleOpenSheets}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                                    >
                                        <FileSpreadsheet className="w-5 h-5" />
                                        Import to Google Sheets
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ArchiveMonthModal
