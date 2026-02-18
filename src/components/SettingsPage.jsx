import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
    User,
    Building2,
    Users,
    Database,
    Palette,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Lock,
    Mail,
    Download,
    Upload,
    Trash2,
    UserPlus,
    Calendar,
    Moon,
    Sun,
    Laptop,
    CheckCircle,
    Shield,
    RefreshCw,
    Pencil,
    HelpCircle,
    ChevronDown,
    X,
    Loader2,
    Search,
    ClipboardList,
    Zap,
    Eye,
    Monitor,
    RotateCcw,
    Sparkles,
    Plus,
    List
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useApp } from '../context/AppContext'
import { toast } from 'react-toastify'
import ShareAccessModal from './ShareAccessModal'
import { supabase } from '../lib/supabase'
import WorkspaceSettingsModal from './WorkspaceSettingsModal'
import DeleteAccountModal from './DeleteAccountModal'
import ExportDataModal from './ExportDataModal'
import ProfilePhotoEditor from './ProfilePhotoEditor'
import HelpCenterPage from './HelpCenterPage'
import ActivityLogViewer from './ActivityLogViewer'
import ExportCenterPage from './ExportCenterPage'
import ConfirmModal from './ConfirmModal'
import AdminControlsModal from './AdminControlsModal'

const SettingsPage = ({ onBack, navigateToSection }) => {
    const { user, signOut, preferences } = useAuth()
    const { isDarkMode, toggleTheme, themeMode, setThemeMode, fontSize, setFontSize, fontFamily, setFontFamily, commandKEnabled, setCommandKEnabled } = useTheme()
    const { members, monthlyTables, currentTable, setCurrentTable, isSupabaseConfigured, createNewMonth, deleteMonthTable, isCollaborator, dataOwnerId } = useApp()

    const [activeSection, setActiveSection] = useState(null) // null = show main list
    const [showHelpCenter, setShowHelpCenter] = useState(false)

    // Handle navigation from command palette
    useEffect(() => {
        if (navigateToSection) {
            setActiveSection(navigateToSection)
        }
    }, [navigateToSection])

    // Auto-Sunday settings
    const [autoSundayEnabled, setAutoSundayEnabled] = useState(() => {
        return localStorage.getItem('autoSundayEnabled') === 'true'
    })
    const [autoAllDatesEnabled, setAutoAllDatesEnabled] = useState(() => {
        return localStorage.getItem('autoAllDatesEnabled') === 'true'
    })
    useEffect(() => {
        const scrollToTop = () => {
            try {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
            } catch {
                window.scrollTo(0, 0)
            }
        }
        scrollToTop()
        const raf1 = requestAnimationFrame(() => {
            const raf2 = requestAnimationFrame(scrollToTop)
            return () => cancelAnimationFrame(raf2)
        })
        return () => cancelAnimationFrame(raf1)
    }, [activeSection, showHelpCenter])

    // Accessibility settings state
    const [animationsEnabled, setAnimationsEnabled] = useState(() => {
        const saved = localStorage.getItem('animationsEnabled')
        return saved !== 'false' // Default to true
    })

    const [reducedMotion, setReducedMotion] = useState(() => {
        const saved = localStorage.getItem('reducedMotion')
        return saved === 'true'
    })

    const [highContrast, setHighContrast] = useState(() => {
        const saved = localStorage.getItem('highContrast')
        return saved === 'true'
    })

    const [focusVisible, setFocusVisible] = useState(() => {
        const saved = localStorage.getItem('focusVisible')
        return saved !== 'false' // Default to true
    })

    const [performanceMode, setPerformanceMode] = useState(() => {
        const saved = localStorage.getItem('performanceMode')
        return saved === 'true'
    })

    // Auto-Sunday toggle handlers
    const toggleAutoSunday = () => {
        const newValue = !autoSundayEnabled
        setAutoSundayEnabled(newValue)
        localStorage.setItem('autoSundayEnabled', newValue.toString())
        if (newValue) {
            toast.success('Auto-Sunday enabled: will auto-select current Sunday')
        } else {
            toast.info('Auto-Sunday disabled')
        }
    }

    const toggleAutoAllDates = () => {
        const newValue = !autoAllDatesEnabled
        setAutoAllDatesEnabled(newValue)
        localStorage.setItem('autoAllDatesEnabled', newValue.toString())
        if (newValue) {
            toast.success('Auto-All-Dates enabled: will auto-mark all dates to present day')
        } else {
            toast.info('Auto-All-Dates disabled')
        }
    }
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [collaborators, setCollaborators] = useState([])
    const [fetchingCollaborators, setFetchingCollaborators] = useState(false)
    const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false)
    const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false)
    const [isExportModalOpen, setIsExportModalOpen] = useState(false)
    const [showExportCenter, setShowExportCenter] = useState(false)
    const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false)
    const [isAdminControlsOpen, setIsAdminControlsOpen] = useState(false)
    const [deletingCollaboratorId, setDeletingCollaboratorId] = useState(null)
    const [pendingRemoval, setPendingRemoval] = useState(null)
    const [monthViewMode, setMonthViewMode] = useState('list') // 'list' | 'calendar'
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [showMonthDropdown, setShowMonthDropdown] = useState(false)
    const [deletingTable, setDeletingTable] = useState(null)
    const [deletePrompt, setDeletePrompt] = useState({
        isOpen: false,
        tableName: null,
        label: ''
    })

    // Lightweight usage snapshot (static/mock-friendly for free-plan awareness)
    const usageMetrics = useMemo(() => ([
        { label: 'Egress', used: 5.177, limit: 5, unit: 'GB' },
        { label: 'Database Size', used: 0.037, limit: 0.5, unit: 'GB' },
        { label: 'Realtime Connections', used: 12, limit: 200, unit: 'conns' },
    ]), [])

    const usagePercent = (used, limit) => {
        if (!limit || limit <= 0) return 0
        return Math.min(100, Math.round((used / limit) * 100))
    }

    // Apply accessibility settings
    useEffect(() => {
        localStorage.setItem('animationsEnabled', String(animationsEnabled))
        localStorage.setItem('reducedMotion', String(reducedMotion))
        localStorage.setItem('highContrast', String(highContrast))
        localStorage.setItem('focusVisible', String(focusVisible))
        localStorage.setItem('performanceMode', String(performanceMode))

        // Apply to document
        document.documentElement.classList.toggle('animations-disabled', !animationsEnabled)
        document.documentElement.classList.toggle('reduced-motion', reducedMotion)
        document.documentElement.classList.toggle('high-contrast', highContrast)
        document.documentElement.classList.toggle('focus-visible', focusVisible)
        document.documentElement.classList.toggle('performance-mode', performanceMode)

        // Add custom CSS for performance mode
        if (performanceMode) {
            document.documentElement.style.setProperty('--transition-duration', '0ms')
            document.documentElement.style.setProperty('--animation-duration', '0ms')
        } else {
            document.documentElement.style.setProperty('--transition-duration', '')
            document.documentElement.style.setProperty('--animation-duration', '')
        }
    }, [animationsEnabled, reducedMotion, highContrast, focusVisible, performanceMode])
    const [removeDelay, setRemoveDelay] = useState(0)
    const [isRemovingCollaborator, setIsRemovingCollaborator] = useState(false)
    const [isExportingCollaborator, setIsExportingCollaborator] = useState(false)
    const removeTimerRef = useRef(null)
    const removeCountdownRef = useRef(null)
    const [removeCountdownMs, setRemoveCountdownMs] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')

    // Fetch collaborators for Team section display
    useEffect(() => {
        const fetchCollaborators = async () => {
            console.log('🔍 SettingsPage: fetchCollaborators STARTED')
            console.log('User ID:', user?.id)
            console.log('isSupabaseConfigured:', isSupabaseConfigured)

            if (!user?.id || !isSupabaseConfigured) {
                console.log('⚠️ Skipping fetch - no user ID or Supabase not configured')
                return
            }

            setFetchingCollaborators(true)
            try {
                console.log('📡 Querying collaborators table with owner_id:', user.id)
                const { data, error } = await supabase
                    .from('collaborators')
                    .select('*')
                    .eq('owner_id', user.id)
                    .order('created_at', { ascending: false })

                console.log('📊 Query result:', {
                    dataCount: data?.length || 0,
                    error: error?.message,
                    data: data
                })

                if (!error && data) {
                    console.log(`✅ Found ${data.length} collaborators`)
                    setCollaborators(data)
                } else if (error) {
                    console.error('❌ Error fetching collaborators:', error)
                }
            } catch (err) {
                console.error('❌ Exception in fetchCollaborators:', err)
            } finally {
                setFetchingCollaborators(false)
                console.log('🔍 fetchCollaborators COMPLETE')
            }
        }
        fetchCollaborators()
    }, [user?.id, isSupabaseConfigured])

    // Refresh collaborators when modal closes
    const handleShareModalClose = async () => {
        setIsShareModalOpen(false)
        if (user && isSupabaseConfigured) {
            try {
                const { data } = await supabase
                    .from('collaborators')
                    .select('*')
                    .eq('owner_id', user.id)
                    .order('created_at', { ascending: false })
                if (data) setCollaborators(data)
            } catch (err) {
                console.error('Error refreshing collaborators:', err)
            }
        }
    }

    const requestDeleteTable = (tableName) => {
        if (!tableName) return
        setDeletePrompt({
            isOpen: true,
            tableName,
            label: tableName.replace('_', ' ')
        })
    }

    const handleDeleteTable = async () => {
        const tableName = deletePrompt.tableName
        if (!tableName) return
        try {
            setDeletingTable(tableName)
            await deleteMonthTable(tableName)
        } catch (error) {
            console.error('Failed to delete month table:', error)
        } finally {
            setDeletingTable(null)
            setDeletePrompt({ isOpen: false, tableName: null, label: '' })
        }
    }

    const handleSignOut = async () => {
        try {
            await signOut()
            toast.success('Signed out successfully')
        } catch (error) {
            toast.error('Failed to sign out')
        }
    }

    const handleDeleteCollaborator = (collaboratorId) => {
        if (!user || !isSupabaseConfigured) {
            toast.error('Not authorized')
            return
        }
        const target = collaborators.find(c => c.id === collaboratorId)
        setPendingRemoval(target || null)
        setRemoveDelay(0)
    }

    const performCollaboratorDeletion = async (target) => {
        setDeletingCollaboratorId(target.id)
        try {
            const { error } = await supabase
                .from('collaborators')
                .delete()
                .eq('id', target.id)
                .eq('owner_id', user.id)
            if (error) throw error
            setCollaborators(prev => prev.filter(c => c.id !== target.id))
            toast.success(`Removed access for ${target.email}`)
        } catch (err) {
            console.error('Error deleting collaborator:', err)
            toast.error('Failed to remove collaborator from database')
        } finally {
            setDeletingCollaboratorId(null)
            setIsRemovingCollaborator(false)
            setPendingRemoval(null)
        }
    }

    const confirmRemoveCollaborator = async () => {
        if (!pendingRemoval) return
        setIsRemovingCollaborator(true)
        if (removeDelay > 0) {
            toast.info(`Will remove ${pendingRemoval.email} in ${removeDelay} minutes`)
        }
        const totalMs = removeDelay * 60 * 1000
        setRemoveCountdownMs(totalMs)
        const start = Date.now()
        if (removeCountdownRef.current) clearInterval(removeCountdownRef.current)
        removeCountdownRef.current = setInterval(() => {
            const elapsed = Date.now() - start
            const remaining = Math.max(totalMs - elapsed, 0)
            setRemoveCountdownMs(remaining)
        }, 1000)
        removeTimerRef.current = setTimeout(() => performCollaboratorDeletion(pendingRemoval), totalMs || 0)
    }

    const handleExportCollaboratorData = async () => {
        setIsExportingCollaborator(true)
        try {
            toast.info('Export collaborator data: please export from Supabase (not implemented here).')
        } finally {
            setIsExportingCollaborator(false)
        }
    }

    const closeRemoveModal = () => {
        if (removeTimerRef.current) clearTimeout(removeTimerRef.current)
        if (removeCountdownRef.current) clearInterval(removeCountdownRef.current)
        setPendingRemoval(null)
        setIsRemovingCollaborator(false)
        setRemoveCountdownMs(0)
    }

    useEffect(() => {
        return () => {
            if (removeTimerRef.current) clearTimeout(removeTimerRef.current)
            if (removeCountdownRef.current) clearInterval(removeCountdownRef.current)
        }
    }, [])

    // Get preview text for each section
    const getSectionPreview = (sectionId) => {
        switch (sectionId) {
            case 'account':
                return user?.email || 'Manage your account'
            case 'workspace':
                return preferences?.workspace_name || 'TMH Teen Ministry'
            case 'team':
                return `${collaborators.length} collaborator${collaborators.length !== 1 ? 's' : ''}`
            case 'data':
                return `${members?.length || 0} members`
            case 'appearance':
                return themeMode === 'system' ? 'Auto' : themeMode === 'dark' ? 'Dark' : 'Light'
            case 'accessibility':
                return performanceMode ? 'Performance Mode' : animationsEnabled ? 'Animations On' : 'Reduced'
            case 'help':
                return 'Get help & support'
            case 'danger':
                return 'Delete account'
            default:
                return ''
        }
    }

    // Helper function to get month display name from table name
    const getMonthDisplayName = (tableName) => {
        // Convert table name like "October_2025" to "October 2025"
        return tableName.replace('_', ' ')
    }

    const calendarCurrentYear = new Date().getFullYear()

    // Helper to group tables by year
    const groupTablesByYear = useMemo(() => {
        const grouped = {}
        monthlyTables.forEach(table => {
            const [month, year] = table.split('_')
            if (!grouped[year]) grouped[year] = []
            grouped[year].push({ month, table })
        })
        return grouped
    }, [monthlyTables])

    const availableYears = useMemo(() => {
        const years = new Set(Object.keys(groupTablesByYear).map(year => parseInt(year, 10)))
        years.add(calendarCurrentYear)
        years.add(calendarCurrentYear + 1)
        return Array.from(years).sort((a, b) => a - b)
    }, [groupTablesByYear, calendarCurrentYear])

    useEffect(() => {
        if (availableYears.length === 0) return
        if (!availableYears.includes(selectedYear)) {
            setSelectedYear(availableYears[availableYears.length - 1])
        }
    }, [availableYears, selectedYear])

    useEffect(() => {
        setShowMonthDropdown(false)
    }, [monthViewMode])

    // Helper to get Sundays for a month
    const getSundaysInMonth = (monthName, year) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        const monthIdx = months.indexOf(monthName)
        if (monthIdx === -1) return []
        const sundays = []
        const date = new Date(year, monthIdx, 1)
        while (date.getDay() !== 0) date.setDate(date.getDate() + 1)
        while (date.getMonth() === monthIdx) {
            sundays.push(new Date(date))
            date.setDate(date.getDate() + 7)
        }
        return sundays
    }

    // Quick create month helper
    const handleQuickCreateMonth = async (monthName, year) => {
        try {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            const monthIdx = months.indexOf(monthName)
            if (monthIdx === -1) return
            const sundays = getSundaysInMonth(monthName, year)
            await createNewMonth({
                month: monthIdx + 1,
                year,
                monthName,
                sundays,
                copyMode: 'empty'
            })
        } catch (err) {
            console.error('Quick create month failed:', err)
        }
    }

    const renderAccountSection = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Account Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account information and security</p>
            </div>

            {/* Profile Card */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                        {(() => {
                            const localAvatar = typeof window !== 'undefined' ? localStorage.getItem('user_avatar_url') : null
                            const avatarUrl = localAvatar || user?.user_metadata?.avatar_url
                            return avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Profile"
                                    className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-md"
                                />
                            ) : (
                                <div className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                                    {user?.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                            )
                        })()}
                        {/* Edit photo button - available for all users */}
                        <button
                            onClick={() => setIsPhotoEditorOpen(true)}
                            className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors btn-press"
                            title="Change photo"
                        >
                            <Pencil className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{user?.email}</span>
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {user?.app_metadata?.provider === 'google' ? '🔒 Signed in with Google' : '🔒 Email authentication'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Security
                </h4>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    Password
                                    {window.__needsPasswordSetup && (
                                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                                            Action needed
                                        </span>
                                    )}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {user?.app_metadata?.provider === 'google'
                                        ? 'Managed by Google'
                                        : window.__needsPasswordSetup
                                        ? 'Set up a password for email login'
                                        : 'Change your password'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (user?.app_metadata?.provider === 'google') {
                                    toast.info('Your account is secured via Google. Manage it at myaccount.google.com')
                                } else if (window.__needsPasswordSetup && window.__openSetPassword) {
                                    window.__openSetPassword()
                                } else {
                                    toast.info('Password reset link sent to your email')
                                }
                            }}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                window.__needsPasswordSetup
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {user?.app_metadata?.provider === 'google' ? 'View' : window.__needsPasswordSetup ? 'Set Up' : 'Change'}
                        </button>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Sign Out</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sign out of your account</p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderWorkspaceSection = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Workspace Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure your workspace and organization</p>
            </div>

            {/* Current Workspace */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm opacity-80">Current Workspace</p>
                        <h4 className="font-semibold text-lg">{preferences?.workspace_name || 'TMH Teen Ministry'}</h4>
                    </div>
                </div>
            </div>

            {/* Workspace Options */}
            <div className="space-y-3">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                    {/* Auto-Sunday Settings */}
                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">Automation Settings</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Configure auto-selection and attendance behavior</p>
                            </div>
                        </div>

                        {/* Auto-Sunday Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <label className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    Auto-Sunday
                                    {autoSundayEnabled && (
                                        <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">Active</span>
                                    )}
                                </label>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Automatically select the current Sunday when opening the app
                                </p>
                            </div>
                            <button
                                onClick={toggleAutoSunday}
                                disabled={isCollaborator && !autoSundayEnabled}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isCollaborator && !autoSundayEnabled
                                        ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                                        : autoSundayEnabled
                                            ? 'bg-primary-600'
                                            : 'bg-gray-200 dark:bg-gray-600'
                                    }`}
                                title={isCollaborator && !autoSundayEnabled ? 'Auto-Sunday is managed by workspace admin' : 'Toggle Auto-Sunday'}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSundayEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Auto-All-Dates Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <label className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    Auto-All-Dates
                                    {autoAllDatesEnabled && (
                                        <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">Active</span>
                                    )}
                                </label>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    When enabled, automatically mark all dates up to today as present
                                </p>
                            </div>
                            <button
                                onClick={toggleAutoAllDates}
                                disabled={isCollaborator && !autoAllDatesEnabled}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isCollaborator && !autoAllDatesEnabled
                                        ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                                        : autoAllDatesEnabled
                                            ? 'bg-primary-600'
                                            : 'bg-gray-200 dark:bg-gray-600'
                                    }`}
                                title={isCollaborator && !autoAllDatesEnabled ? 'Auto-All-Dates is managed by workspace admin' : 'Toggle Auto-All-Dates'}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoAllDatesEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Collaborator Notice */}
                        {isCollaborator && (!autoSundayEnabled || !autoAllDatesEnabled) && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-amber-700 dark:text-amber-300">
                                        <p className="font-medium mb-1">Workspace Admin Control</p>
                                        <p>Automation settings are managed by the workspace administrator. Contact your admin to enable these features.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsWorkspaceModalOpen(true)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-gray-900 dark:text-white">Edit Workspace</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Change name and preferences</p>
                            </div>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
                    </button>

                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Current Month</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Select active month database</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setMonthViewMode(monthViewMode === 'list' ? 'calendar' : 'list')}
                                className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300 flex items-center gap-1"
                            >
                                {monthViewMode === 'list' ? <Eye className="w-3 h-3" /> : <List className="w-3 h-3" />}
                                {monthViewMode === 'list' ? 'Calendar' : 'List'}
                            </button>
                        </div>

                        {monthViewMode === 'list' ? (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowMonthDropdown(prev => !prev)}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-300">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Active Month</p>
                                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                {currentTable ? currentTable.replace('_', ' ') : 'Select month'}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronDown
                                        className={`w-5 h-5 text-gray-500 dark:text-gray-300 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {showMonthDropdown && (
                                    <div className="absolute left-0 right-0 mt-2 z-30 max-h-72 overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl">
                                        {monthlyTables && monthlyTables.length > 0 ? (
                                            monthlyTables.map(table => {
                                                const isActive = currentTable === table
                                                return (
                                                    <button
                                                        key={table}
                                                        type="button"
                                                        onClick={() => {
                                                            setCurrentTable(table)
                                                            setShowMonthDropdown(false)
                                                        }}
                                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${isActive
                                                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                                                                : 'text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                            }`}
                                                    >
                                                        <span>{table.replace('_', ' ')}</span>
                                                        <div className="flex items-center gap-2">
                                                            {isActive && (
                                                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-200">Current</span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    requestDeleteTable(table)
                                                                }}
                                                                className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                                                disabled={deletingTable === table}
                                                                title={`Delete ${table.replace('_', ' ')}`}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </button>
                                                )
                                            })
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No months available</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Year Tabs */}
                                <div className="flex flex-wrap gap-2">
                                    {availableYears.map(year => (
                                        <button
                                            key={year}
                                            onClick={() => setSelectedYear(year)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedYear === year
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            {year}
                                        </button>
                                    ))}
                                </div>

                                {/* Calendar Grid for Selected Year */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => {
                                        const table = groupTablesByYear[selectedYear]?.find(m => m.month === month)?.table
                                        const exists = Boolean(table)
                                        const sundays = getSundaysInMonth(month, selectedYear)
                                        const isCurrent = table === currentTable
                                        return (
                                            <div
                                                key={month}
                                                onClick={() => {
                                                    if (exists) {
                                                        setCurrentTable(table)
                                                    } else {
                                                        handleQuickCreateMonth(month, selectedYear)
                                                    }
                                                }}
                                                className={`relative p-4 rounded-2xl border transition-all cursor-pointer shadow-sm backdrop-blur-sm ${isCurrent
                                                        ? 'border-blue-400 bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-700/20'
                                                        : exists
                                                            ? 'border-green-200/70 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 hover:border-green-400'
                                                            : 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/60 dark:bg-gray-800/40 hover:border-gray-400 dark:hover:border-gray-500'
                                                    } hover:-translate-y-1 hover:shadow-lg`}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Month</p>
                                                        <p className={`text-lg font-semibold ${isCurrent
                                                                ? 'text-blue-700 dark:text-blue-200'
                                                                : exists
                                                                    ? 'text-emerald-800 dark:text-emerald-200'
                                                                    : 'text-gray-600 dark:text-gray-300'
                                                            }`}>
                                                            {month}
                                                        </p>
                                                    </div>
                                                    {exists ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${isCurrent
                                                                    ? 'bg-blue-500/20 text-blue-700 dark:text-blue-200'
                                                                    : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-200'
                                                                }`}>
                                                                {isCurrent ? 'Active' : 'Saved'}
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    requestDeleteTable(table)
                                                                }}
                                                                className={`p-1.5 rounded-full ${deletingTable === table
                                                                    ? 'bg-red-200/80 text-red-700 cursor-wait'
                                                                    : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40'
                                                                    } transition-colors`}
                                                                disabled={deletingTable === table}
                                                                title={`Delete ${month} ${selectedYear}`}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleQuickCreateMonth(month, selectedYear)
                                                            }}
                                                            className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1"
                                                            title={`Create ${month} ${selectedYear}`}
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                            Create
                                                        </button>
                                                    )}
                                                </div>
                                                {/* Sunday badges */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    {sundays.slice(0, 12).map((sunday, i) => (
                                                        <div
                                                            key={`${month}-${i}`}
                                                            className={`rounded-xl px-2 py-2 flex flex-col items-center text-center shadow-inner ${exists
                                                                    ? isCurrent
                                                                        ? 'bg-white/80 dark:bg-white/10 text-blue-700 dark:text-blue-200 border border-blue-200/60 dark:border-blue-400/30'
                                                                        : 'bg-white/80 dark:bg-white/5 text-emerald-700 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-400/30'
                                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border border-dashed border-gray-300 dark:border-gray-600'
                                                                }`}
                                                            title={sunday.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                        >
                                                            <span className="text-[10px] uppercase tracking-wide opacity-70">Sun</span>
                                                            <span className="text-sm font-semibold leading-tight">{sunday.getDate()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                                                    {exists ? 'Tap to switch to this month.' : 'Tap to create a fresh month with no data.'}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] grid-animate">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{members?.length || 0}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Members</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{monthlyTables?.length || 0}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Databases</p>
                </div>
            </div>
        </div>
    )

    const renderTeamSection = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Team & Sharing</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage who has access to your workspace</p>
            </div>

            {/* Admin Controls Card - Only for owners */}
            {!isCollaborator && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                            <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">Admin Controls</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Set sticky month and Sunday dates for all collaborators</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAdminControlsOpen(true)}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Lock className="w-4 h-4" />
                        Admin Controls
                    </button>
                </div>
            )}

            {/* Share Access Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Invite Team Members</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Share access to your workspace with others</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <UserPlus className="w-4 h-4" />
                    Share Access
                </button>
            </div>

            {/* Always Visible Collaborators List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    People with Access ({collaborators.length})
                </h4>
                {fetchingCollaborators ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                ) : collaborators.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No collaborators yet</p>
                        <p className="text-xs mt-1">Click "Share Access" to invite someone</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {collaborators.map((collaborator) => (
                            <div
                                key={collaborator.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg w-full"
                            >
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                        {collaborator.email.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {collaborator.email}
                                    </p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${collaborator.status === 'accepted'
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : collaborator.status === 'rejected'
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                        }`}>
                                        {collaborator.status === 'accepted' ? 'Accepted' : collaborator.status === 'rejected' ? 'Rejected' : 'Pending'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDeleteCollaborator(collaborator.id)}
                                    disabled={deletingCollaboratorId === collaborator.id}
                                    className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60"
                                >
                                    {deletingCollaboratorId === collaborator.id ? 'Removing...' : 'Remove'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Permissions Info */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Permission Levels
                </h4>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600 dark:text-gray-400"><strong>Owner:</strong> Full access, can delete workspace</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600 dark:text-gray-400"><strong>Editor:</strong> Can view and edit data</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400"><strong>Viewer:</strong> Read-only access</span>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderDataSection = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Data Management</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Export, import, and manage your data</p>
            </div>

            {/* Export/Import */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                <button
                    onClick={() => setActiveSection('export')}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">Export Center</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Select months, preview, reorder columns, export CSV</p>
                        </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
                </button>

                <button
                    onClick={() => toast.info('Import feature coming soon!')}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">Import Data</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Import members from CSV</p>
                        </div>
                    </div>
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded">Soon</span>
                </button>

                <button
                    onClick={() => toast.info('Cleanup duplicates in Dashboard → Duplicates tab')}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <RefreshCw className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">Clean Duplicates</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Find and merge duplicate members</p>
                        </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
                </button>
            </div>

            {/* Storage Info */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Storage Used</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{members?.length || 0} records</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((members?.length || 0) / 1000 * 100, 100)}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Free tier: Up to 1,000 members</p>
            </div>
        </div>
    )

    const renderAppearanceSection = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Appearance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customize how Datsar looks</p>
            </div>


            {/* Theme Selection */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</h4>
                <div className="grid grid-cols-3 gap-3 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] grid-animate">
                    {/* System Mode (Custom Slash) */}
                    <button
                        onClick={() => setThemeMode('system')}
                        className={`group p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${themeMode === 'system'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <div
                            className="w-16 h-16 rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #ffffff 50%, #111827 50%)'
                            }}
                        />
                        <span className={`text-sm font-medium ${themeMode === 'system' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>System mode</span>
                    </button>

                    {/* Dark Mode (Black) */}
                    <button
                        onClick={() => setThemeMode('dark')}
                        className={`group p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${themeMode === 'dark'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-700 shadow-sm" />
                        <span className={`text-sm font-medium ${themeMode === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>Dark mode</span>
                    </button>

                    {/* Light Mode (White) */}
                    <button
                        onClick={() => setThemeMode('light')}
                        className={`group p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${themeMode === 'light'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm" />
                        <span className={`text-sm font-medium ${themeMode === 'light' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>Light mode</span>
                    </button>

                </div>
            </div>
        </div>
    )

    const renderAccessibilitySection = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Accessibility</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Performance and accessibility settings</p>
            </div>

            {/* Performance Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Performance</h4>
                </div>

                <div className="space-y-4">
                    {/* Performance Mode */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium text-gray-900 dark:text-white">Performance Mode</label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Disable all animations for maximum speed</p>
                        </div>
                        <button
                            onClick={() => setPerformanceMode(!performanceMode)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${performanceMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${performanceMode ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Animations Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium text-gray-900 dark:text-white">Animations</label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Enable visual animations and transitions</p>
                        </div>
                        <button
                            onClick={() => setAnimationsEnabled(!animationsEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${animationsEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${animationsEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Reduced Motion */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium text-gray-900 dark:text-white">Reduced Motion</label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Minimize animations for users with motion sensitivity</p>
                        </div>
                        <button
                            onClick={() => setReducedMotion(!reducedMotion)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${reducedMotion ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${reducedMotion ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Visual Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Eye className="w-5 h-5 text-blue-500" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Visual</h4>
                </div>

                <div className="space-y-4">
                    {/* High Contrast */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium text-gray-900 dark:text-white">High Contrast</label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Increase contrast for better visibility</p>
                        </div>
                        <button
                            onClick={() => setHighContrast(!highContrast)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${highContrast ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${highContrast ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Focus Visible */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium text-gray-900 dark:text-white">Focus Indicators</label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Show clear focus outlines for keyboard navigation</p>
                        </div>
                        <button
                            onClick={() => setFocusVisible(!focusVisible)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${focusVisible ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${focusVisible ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Command Menu Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-5 h-5 text-green-500" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Command Menu</h4>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium text-gray-900 dark:text-white">Enable Command Menu</label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Press {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'} + K to open quick navigation
                            </p>
                        </div>
                        <button
                            onClick={() => setCommandKEnabled(!commandKEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${commandKEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${commandKEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {commandKEnabled && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">💡 Pro Tip</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                Use Command Menu to quickly navigate to any page, search members, or access settings without clicking through menus.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Typography Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Monitor className="w-5 h-5 text-purple-500" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Typography</h4>
                </div>

                <div className="space-y-4">
                    {/* Font Size */}
                    <div>
                        <label className="font-medium text-gray-900 dark:text-white mb-2 block">Font Size</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {[
                                { label: 'Small', value: '14' },
                                { label: 'Medium', value: '16' },
                                { label: 'Large', value: '18' },
                                { label: 'Extra Large', value: '20' },
                                { label: 'XXL', value: '24' }
                            ].map((size) => (
                                <button
                                    key={size.value}
                                    onClick={() => setFontSize(size.value)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${fontSize === size.value
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {size.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Family */}
                    <div>
                        <label className="font-medium text-gray-900 dark:text-white mb-2 block">Font Family</label>
                        <div className="space-y-2">
                            {[
                                { value: 'OpenDyslexic', label: 'OpenDyslexic (Default)', description: 'Dyslexia-friendly' },
                                { value: 'system-ui', label: 'System', description: 'OS default' },
                                { value: 'Georgia, serif', label: 'Georgia', description: 'Serif, readable' },
                                { value: 'Courier New, monospace', label: 'Courier New', description: 'Monospace' }
                            ].map((font) => (
                                <button
                                    key={font.value}
                                    onClick={() => setFontFamily(font.value)}
                                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${fontFamily === font.value
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    style={{ fontFamily: font.value }}
                                >
                                    {font.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        onClick={() => {
                            setPerformanceMode(true)
                            setAnimationsEnabled(false)
                            setReducedMotion(true)
                        }}
                        className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Zap className="w-4 h-4" />
                        Maximum Performance
                    </button>
                    <button
                        onClick={() => {
                            setPerformanceMode(false)
                            setAnimationsEnabled(true)
                            setReducedMotion(false)
                            setHighContrast(false)
                        }}
                        className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        Full Animations
                    </button>
                    <button
                        onClick={() => {
                            setHighContrast(true)
                            setFontSize('20')
                            setFocusVisible(true)
                        }}
                        className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Eye className="w-4 h-4" />
                        High Visibility
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem('animationsEnabled')
                            localStorage.removeItem('reducedMotion')
                            localStorage.removeItem('highContrast')
                            localStorage.removeItem('focusVisible')
                            localStorage.removeItem('performanceMode')
                            localStorage.removeItem('fontSize')
                            localStorage.removeItem('fontFamily')
                            window.location.reload()
                        }}
                        className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset All Settings
                    </button>
                </div>
            </div>
        </div>
    )

    const renderDangerSection = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-1">Danger Zone</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Irreversible and destructive actions</p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-red-700 dark:text-red-400">Delete Account</h4>
                        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-3">
                            Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <button
                            onClick={() => setIsDeleteAccountOpen(true)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderContent = () => {
        switch (activeSection) {
            case 'account': return renderAccountSection()
            case 'workspace': return renderWorkspaceSection()
            case 'team': return renderTeamSection()
            case 'data': return renderDataSection()
            case 'export': return <ExportCenterPage onBack={() => setActiveSection(null)} />
            case 'appearance': return renderAppearanceSection()
            case 'accessibility': return renderAccessibilitySection()
            case 'activity': return <ActivityLogViewer />
            case 'danger': return renderDangerSection()
            default: return renderAccountSection()
        }
    }



    // Section definitions with enhanced content for search
    const sections = [
        {
            id: 'account',
            label: 'Account',
            icon: User,
            color: 'blue',
            content: 'Manage your profile picture, email address, full name, password, and personal account settings. Update your avatar, change your email, modify your display name, and secure your account with password changes.',
            keywords: 'profile email avatar name personal information password security login sign in'
        },
        {
            id: 'workspace',
            label: 'Workspace',
            icon: Building2,
            color: 'purple',
            content: 'Configure your workspace name, organization settings, and ministry information. Set up your church or organization name and manage workspace preferences.',
            keywords: 'organization company ministry name settings workspace configuration'
        },
        {
            id: 'team',
            label: 'Team & Sharing',
            icon: Users,
            color: 'green',
            content: 'Add team members, invite collaborators, manage permissions, and control access to your workspace. Share your data with trusted team members and manage user roles.',
            keywords: 'collaborators sharing access members users permissions invitations team management'
        },
        {
            id: 'data',
            label: 'Data Management',
            icon: Database,
            color: 'orange',
            content: 'Export member data, import CSV files, backup your information, and manage member databases. Download attendance records, member lists, and save your data securely.',
            keywords: 'export import backup members data storage csv download upload database'
        },
        {
            id: 'appearance',
            label: 'Appearance',
            icon: Palette,
            color: 'pink',
            content: 'Customize theme, colors, and display settings. Switch between dark and light modes, adjust visual preferences, and personalize your interface.',
            keywords: 'theme dark light colors display visual interface'
        },
        {
            id: 'accessibility',
            label: 'Accessibility',
            icon: Zap,
            color: 'yellow',
            content: 'Performance and accessibility settings. Control animations, reduce motion, adjust font size and family, enable high contrast mode, and optimize for screen readers and keyboard navigation.',
            keywords: 'accessibility performance animations reduced motion font size high contrast focus keyboard screen reader'
        },
        {
            id: 'help',
            label: 'Help Center',
            icon: HelpCircle,
            color: 'cyan',
            content: 'Get help and support, read documentation, view tutorials, and find answers to frequently asked questions. Learn how to use all features and troubleshoot issues.',
            keywords: 'support documentation tutorial guide FAQ help instructions getting started'
        },
        {
            id: 'activity',
            label: 'Activity Log',
            icon: ClipboardList,
            color: 'indigo',
            content: 'View a history of actions taken in your workspace. Monitor member additions, deletions, updates, and other important events.',
            keywords: 'audit logs history updates tracking activity actions events'
        },
        {
            id: 'danger',
            label: 'Danger Zone',
            icon: AlertTriangle,
            color: 'red',
            danger: true,
            content: 'Delete your account, remove all data, and perform destructive actions. Permanently erase your account and all associated information.',
            keywords: 'delete remove account danger destructive reset erase data clean slate'
        }
    ]

    // define all granular searchable items
    const allSearchableItems = useMemo(() => [
        // --- Account Section ---
        {
            id: 'profile_photo',
            section: 'account',
            label: 'Profile Photo',
            description: 'Change your profile picture',
            keywords: 'avatar image photo picture upload face',
            icon: User,
            action: () => { setActiveSection('account'); setIsPhotoEditorOpen(true) }
        },
        {
            id: 'account_name',
            section: 'account',
            label: 'Account Name',
            description: `Display name: ${user?.user_metadata?.full_name || 'User'}`,
            keywords: 'name full username display personal info',
            icon: User,
            action: () => setActiveSection('account')
        },
        {
            id: 'account_email',
            section: 'account',
            label: 'Email Address',
            description: `Current email: ${user?.email}`,
            keywords: 'email address mail contact',
            icon: Mail,
            action: () => setActiveSection('account')
        },
        {
            id: 'password',
            section: 'account',
            label: 'Password',
            description: 'Change or reset your password',
            keywords: 'password security reset change login',
            icon: Lock,
            action: () => setActiveSection('account')
        },
        {
            id: 'sign_out',
            section: 'account',
            label: 'Sign Out',
            description: 'Log out of your account',
            keywords: 'logout signout exit leave disconnect',
            icon: null, // special case, uses red styling
            isDestructive: true,
            action: handleSignOut
        },

        // --- Workspace Section ---
        {
            id: 'edit_workspace',
            section: 'workspace',
            label: 'Edit Workspace',
            description: 'Change workspace name and preferences',
            keywords: 'workspace name organization ministry rename',
            icon: Building2,
            action: () => { setActiveSection('workspace'); setIsWorkspaceModalOpen(true) }
        },
        {
            id: 'current_month',
            section: 'workspace',
            label: 'Current Month Database',
            description: `Active: ${currentTable?.replace('_', ' ') || 'None'}`,
            keywords: 'month database table select switch change',
            icon: Calendar,
            action: () => setActiveSection('workspace')
        },
        {
            id: 'workspace_stats',
            section: 'workspace',
            label: 'Workspace Stats',
            description: 'View total members and databases',
            keywords: 'stats statistics count numbers total',
            icon: Building2,
            action: () => setActiveSection('workspace')
        },

        // --- Team Section ---
        {
            id: 'invite_team',
            section: 'team',
            label: 'Invite Team Members',
            description: 'Share access with new collaborators',
            keywords: 'invite add share team member collaborator friend access',
            icon: UserPlus,
            action: () => { setActiveSection('team'); setIsShareModalOpen(true) }
        },
        {
            id: 'manage_team',
            section: 'team',
            label: 'Manage Team',
            description: 'View, manage, and remove collaborators',
            keywords: 'team list collaborators remove delete permissions roles',
            icon: Users,
            action: () => setActiveSection('team')
        },

        // --- Data Section ---
        {
            id: 'export_data',
            section: 'data',
            label: 'Export Data',
            description: 'Download your data as CSV',
            keywords: 'export download save backup csv excel',
            icon: Download,
            action: () => { setActiveSection('data'); setIsExportModalOpen(true) }
        },
        {
            id: 'import_data',
            section: 'data',
            label: 'Import Data',
            description: 'Import members from CSV (Coming Soon)',
            keywords: 'import upload restore csv add bulk',
            icon: Upload,
            action: () => { setActiveSection('data'); toast.info('Import feature coming soon!') }
        },
        {
            id: 'clean_duplicates',
            section: 'data',
            label: 'Clean Duplicates',
            description: 'Find and merge duplicate members',
            keywords: 'duplicates clean fix merge cleanup',
            icon: RefreshCw,
            action: () => { setActiveSection('data'); toast.info('Cleanup duplicates in Dashboard → Duplicates tab') }
        },

        // --- Appearance Section ---
        {
            id: 'theme_light',
            section: 'appearance',
            label: 'Light Mode',
            description: 'Switch to light theme',
            keywords: 'light day white bright theme',
            icon: Sun,
            action: () => { setActiveSection('appearance'); setThemeMode('light') }
        },
        {
            id: 'theme_dark',
            section: 'appearance',
            label: 'Dark Mode',
            description: 'Switch to dark theme',
            keywords: 'dark night black dim theme',
            icon: Moon,
            action: () => { setActiveSection('appearance'); setThemeMode('dark') }
        },
        {
            id: 'theme_auto',
            section: 'appearance',
            label: 'Auto Theme',
            description: 'Sync with system settings',
            keywords: 'system auto default theme',
            icon: Laptop,
            action: () => { setActiveSection('appearance'); setThemeMode('system') }
        },
        {
            id: 'font_size',
            section: 'appearance',
            label: 'Font Size',
            description: `Current size: ${fontSize}px`,
            keywords: 'font text size bigger smaller large small scale',
            icon: null, // text icon?
            action: () => setActiveSection('appearance')
        },
        {
            id: 'font_family',
            section: 'appearance',
            label: 'Font Family',
            description: 'Change text font style',
            keywords: 'font family style type typography',
            icon: null,
            action: () => setActiveSection('appearance')
        },

        // --- Help & Danger ---
        {
            id: 'help_center',
            section: 'help',
            label: 'Help Center',
            description: 'View documentation and support',
            keywords: 'help support guide docs tutorial manual faq',
            icon: HelpCircle,
            action: () => setShowHelpCenter(true)
        },
        {
            id: 'delete_account',
            section: 'danger',
            label: 'Delete Account',
            description: 'Permanently remove your account',
            keywords: 'delete remove destroy account danger kill',
            icon: Trash2,
            isDestructive: true,
            action: () => setIsDeleteAccountOpen(true)
        }
    ], [user, currentTable, fontSize, handleSignOut, setActiveSection])

    // Filter items based on search query
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return []

        const query = searchQuery.toLowerCase().trim()

        return allSearchableItems.filter(item => {
            // Check direct matches
            const labelMatch = item.label.toLowerCase().includes(query)
            const descMatch = item.description.toLowerCase().includes(query)
            const keywordMatch = item.keywords.toLowerCase().includes(query)

            return labelMatch || descMatch || keywordMatch
        })
    }, [searchQuery, allSearchableItems])

    const getIconBgColor = (color) => {
        const colors = {
            blue: 'bg-blue-100 dark:bg-blue-900/30',
            purple: 'bg-purple-100 dark:bg-purple-900/30',
            green: 'bg-green-100 dark:bg-green-900/30',
            orange: 'bg-orange-100 dark:bg-orange-900/30',
            pink: 'bg-pink-100 dark:bg-pink-900/30',
            cyan: 'bg-cyan-100 dark:bg-cyan-900/30',
            red: 'bg-red-100 dark:bg-red-900/30'
        }
        return colors[color] || colors.blue
    }

    const getIconColor = (color) => {
        const colors = {
            blue: 'text-blue-600 dark:text-blue-400',
            purple: 'text-purple-600 dark:text-purple-400',
            green: 'text-green-600 dark:text-green-400',
            orange: 'text-orange-600 dark:text-orange-400',
            pink: 'text-pink-600 dark:text-pink-400',
            cyan: 'text-cyan-600 dark:text-cyan-400',
            red: 'text-red-600 dark:text-red-400'
        }
        return colors[color] || colors.blue
    }

    // Show Help Center Page
    if (showHelpCenter) {
        return (
            <HelpCenterPage
                onBack={() => setShowHelpCenter(false)}
                onNavigate={(target, options) => {
                    setShowHelpCenter(false)
                    if (target === 'dashboard' || target === 'settings') {
                        onBack?.()
                    }
                }}
            />
        )
    }

    // Render main settings list (when no section is active)
    const renderMainList = () => (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="fixed top-[76px] md:top-[48px] left-0 right-0 z-50 w-full bg-gray-100/95 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="max-w-4xl mx-auto w-full px-4 py-4 flex items-center gap-4 font-[var(--font-family)]">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 pt-[52px] md:pt-[60px] space-y-3">
                {/* Search Bar */}
                <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search settings... (e.g., 'change profile picture', 'make text bigger')"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Usage / Free plan awareness */}
                <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-blue-200/70 dark:border-blue-900/50 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-500" />
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Usage (stay under free limits)</p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">Target: 0.5 cap</span>
                    </div>
                    <div className="space-y-3">
                        {usageMetrics.map((m) => {
                            const pct = usagePercent(m.used, m.limit)
                            const over = pct >= 100
                            return (
                                <div key={m.label} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{m.label}</span>
                                        <span className={`${over ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-700 dark:text-gray-200'}`}>
                                            {m.used} / {m.limit} {m.unit} ({pct}%)
                                        </span>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden border border-gray-200 dark:border-gray-600">
                                        <div
                                            className={`h-full transition-all ${over ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                        />
                                    </div>
                                    {over && (
                                        <p className="text-[11px] text-red-600 dark:text-red-400">
                                            Tip: trim large downloads and disable extra polling to reduce egress.
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Reduce egress by caching on the client, avoiding large exports, and serving files via CDN/Storage with caching.
                        </p>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                            {(() => {
                                const localAvatar = typeof window !== 'undefined' ? localStorage.getItem('user_avatar_url') : null
                                const avatarUrl = localAvatar || user?.user_metadata?.avatar_url
                                return avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Profile"
                                        className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-md"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                                        {user?.email?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )
                            })()}
                            <button
                                onClick={() => setIsPhotoEditorOpen(true)}
                                className="absolute -bottom-1 -right-1 p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
                            >
                                <Pencil className="w-2.5 h-2.5" />
                            </button>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={() => setActiveSection('account')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Tutorial / Onboarding */}
                <button
                    onClick={() => window.openOnboarding?.()}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                    <div className="p-2 bg-white/20 rounded-lg">
                        <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="font-semibold">Show Tutorial</p>
                        <p className="text-sm text-white/80">Replay the getting started guide</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/70" />
                </button>

                {/* Content Area: Either Search Results or Section List */}
                <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                    {searchQuery ? (
                        /* Search Results */
                        searchResults.length > 0 ? (
                            searchResults.map((item) => {
                                const Icon = item.icon || Search
                                const sectionColor = sections.find(s => s.id === item.section)?.color || 'blue'

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            item.action()
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
                                    >
                                        <div className={`p-2 rounded-lg ${item.isDestructive ? 'bg-red-100 dark:bg-red-900/30' : getIconBgColor(sectionColor)}`}>
                                            <Icon className={`w-5 h-5 ${item.isDestructive ? 'text-red-600 dark:text-red-400' : getIconColor(sectionColor)}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className={`font-medium ${item.isDestructive ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {item.label}
                                                </p>
                                                {/* Section Badge */}
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 truncate">
                                                    {sections.find(s => s.id === item.section)?.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                                                {item.description}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    </button>
                                )
                            })
                        ) : (
                            /* No Results */
                            <div className="p-8 text-center flex flex-col items-center justify-center">
                                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                                    <Search className="w-6 h-6 text-gray-400" />
                                </div>
                                <p className="text-gray-900 dark:text-white font-medium mb-1">No settings found</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No results for "{searchQuery}". Try different keywords.
                                </p>
                            </div>
                        )
                    ) : (
                        /* Default Section List */
                        sections.filter(s => s.id !== 'danger').map((section) => {
                            const Icon = section.icon
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => {
                                        if (section.id === 'help') {
                                            setShowHelpCenter(true)
                                        } else {
                                            setActiveSection(section.id)
                                        }
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                                >
                                    <div className={`p-2 rounded-lg ${getIconBgColor(section.color)}`}>
                                        <Icon className={`w-5 h-5 ${getIconColor(section.color)}`} />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white">{section.label}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                                            {getSectionPreview(section.id)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {section.id === 'account' && window.__needsPasswordSetup && (
                                            <span className="relative flex h-5 w-5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold">1</span>
                                            </span>
                                        )}
                                        {section.highlight && (
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                                New
                                            </span>
                                        )}
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>

                {/* Danger Zone - Separate Card (Only show if no search or if matching) */}
                {!searchQuery && (
                    <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 overflow-hidden mt-4">
                        <button
                            onClick={() => setActiveSection('danger')}
                            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
                        >
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-medium text-red-600 dark:text-red-400">Danger Zone</p>
                                <p className="text-sm text-red-500/70 dark:text-red-400/70 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors">Delete account</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" />
                        </button>
                    </div>
                )}

                {/* Sign Out Button */}
                <button
                    onClick={handleSignOut}
                    className="w-full mt-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </div>
    )

    // Render detail view (when a section is active)
    const renderDetailView = () => {
        const currentSection = sections.find(s => s.id === activeSection)
        const Icon = currentSection?.icon || User

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Sticky Header - stays visible when scrolling */}
                <div className="fixed top-[76px] md:top-[48px] left-0 right-0 z-50 w-full bg-gray-100/95 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="max-w-4xl mx-auto w-full px-4 py-3 font-[var(--font-family)]">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setActiveSection(null)}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </button>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className={`p-1.5 rounded-lg ${getIconBgColor(currentSection?.color || 'blue')}`}>
                                    <Icon className={`w-4 h-4 ${getIconColor(currentSection?.color || 'blue')}`} />
                                </div>
                                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{currentSection?.label || 'Settings'}</h1>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 pt-[48px] md:pt-[56px] pb-4 space-y-4">
                    {renderContent()}
                </div>
            </div>
        )
    }

    // Main render
    return (
        <>
            {activeSection === null ? renderMainList() : renderDetailView()}

            {/* Modals */}
            <ShareAccessModal
                isOpen={isShareModalOpen}
                onClose={handleShareModalClose}
                user={user}
            />
            <WorkspaceSettingsModal
                isOpen={isWorkspaceModalOpen}
                onClose={() => setIsWorkspaceModalOpen(false)}
            />
            <DeleteAccountModal
                isOpen={isDeleteAccountOpen}
                onClose={() => setIsDeleteAccountOpen(false)}
            />
            <ExportDataModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />
            <ProfilePhotoEditor
                isOpen={isPhotoEditorOpen}
                onClose={() => setIsPhotoEditorOpen(false)}
                user={user}
            />

            {isAdminControlsOpen && (
                <AdminControlsModal
                    isOpen={isAdminControlsOpen}
                    onClose={() => setIsAdminControlsOpen(false)}
                />
            )}

            <ConfirmModal
                isOpen={deletePrompt.isOpen}
                onClose={() => setDeletePrompt({ isOpen: false, tableName: null, label: '' })}
                onConfirm={handleDeleteTable}
                title="Delete Month"
                confirmText={deletingTable ? 'Deleting...' : 'Delete'}
                confirmButtonClass={`bg-red-600 hover:bg-red-700 text-white ${deletingTable ? 'opacity-70 cursor-not-allowed' : ''}`}
                cancelText="Cancel"
                cancelButtonClass="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
                <p className="text-base text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete <strong>{deletePrompt.label}</strong>? This will permanently remove the month's table and its data.
                </p>
                <p className="text-sm text-red-500 mt-3">
                    This action cannot be undone.
                </p>
            </ConfirmModal>

            {/* Remove Collaborator Modal */}
            {pendingRemoval && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        {/* Header */}
                        <div className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
                                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">Remove access?</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{pendingRemoval.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeRemoveModal}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-4 space-y-4">
                            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-yellow-900/30 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
                                <p className={`text-sm ${isDarkMode ? 'text-yellow-100' : 'text-yellow-800'}`}>
                                    This removes their workspace access. It does not delete their Supabase account.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Wait time</p>
                                <div className="flex items-center gap-3">
                                    {[0, 5, 10].map((m) => (
                                        <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="radio"
                                                name="removeDelay"
                                                value={m}
                                                checked={removeDelay === m}
                                                onChange={() => setRemoveDelay(m)}
                                                disabled={isRemovingCollaborator}
                                            />
                                            <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                                                {m === 0 ? 'No wait' : `${m} minutes`}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {isRemovingCollaborator && removeDelay > 0 && (
                                    <p className={`text-xs ${isDarkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>
                                        Scheduled... time left: {Math.ceil(removeCountdownMs / 1000)}s
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Export this collaborator’s data</p>
                                <button
                                    onClick={handleExportCollaboratorData}
                                    disabled={isExportingCollaborator}
                                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-60"
                                >
                                    {isExportingCollaborator ? 'Preparing...' : 'Export to CSV (placeholder)'}
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`px-6 py-4 flex gap-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <button
                                onClick={closeRemoveModal}
                                disabled={isRemovingCollaborator}
                                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} disabled:opacity-50`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemoveCollaborator}
                                disabled={isRemovingCollaborator}
                                className={`flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${isRemovingCollaborator ? 'bg-gray-400 text-gray-700' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                            >
                                {isRemovingCollaborator ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Removing...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        {removeDelay ? 'Schedule Remove' : 'Remove Now'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default SettingsPage
