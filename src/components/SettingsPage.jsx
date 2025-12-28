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
    Loader2
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

const SettingsPage = ({ onBack }) => {
    const { user, signOut, preferences } = useAuth()
    const { isDarkMode, toggleTheme, themeMode, setThemeMode } = useTheme()
    const { members, monthlyTables, currentTable, setCurrentTable, isSupabaseConfigured } = useApp()

    const [activeSection, setActiveSection] = useState(null) // null = show main list
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [collaborators, setCollaborators] = useState([])
    const [fetchingCollaborators, setFetchingCollaborators] = useState(false)
    const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false)
    const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false)
    const [isExportModalOpen, setIsExportModalOpen] = useState(false)
    const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false)
    const [showHelpCenter, setShowHelpCenter] = useState(false)
    const [deletingCollaboratorId, setDeletingCollaboratorId] = useState(null)
    const [pendingRemoval, setPendingRemoval] = useState(null)
    const [removeDelay, setRemoveDelay] = useState(0)
    const [isRemovingCollaborator, setIsRemovingCollaborator] = useState(false)
    const [isExportingCollaborator, setIsExportingCollaborator] = useState(false)
    const removeTimerRef = useRef(null)
    const removeCountdownRef = useRef(null)
    const [removeCountdownMs, setRemoveCountdownMs] = useState(0)

    // Fetch collaborators for Team section display
    useEffect(() => {
        const fetchCollaborators = async () => {
            if (!user || !isSupabaseConfigured) return
            setFetchingCollaborators(true)
            try {
                const { data, error } = await supabase
                    .from('collaborators')
                    .select('*')
                    .eq('owner_id', user.id)
                    .order('created_at', { ascending: false })
                if (!error && data) {
                    setCollaborators(data)
                }
            } catch (err) {
                console.error('Error fetching collaborators:', err)
            } finally {
                setFetchingCollaborators(false)
            }
        }
        fetchCollaborators()
    }, [user, isSupabaseConfigured])

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
            case 'help':
                return 'Get help & support'
            case 'danger':
                return 'Delete account'
            default:
                return ''
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
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Password</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {user?.app_metadata?.provider === 'google'
                                    ? 'Managed by Google'
                                    : 'Change your password'}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                if (user?.app_metadata?.provider === 'google') {
                                    toast.info('Your account is secured via Google. Manage it at myaccount.google.com')
                                } else {
                                    toast.info('Password reset link sent to your email')
                                }
                            }}
                            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            {user?.app_metadata?.provider === 'google' ? 'View' : 'Change'}
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
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Current Month</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Select active month database</p>
                            </div>
                        </div>
                        <div className="relative group">
                            <select
                                value={currentTable || ''}
                                onChange={(e) => setCurrentTable(e.target.value)}
                                className="w-full p-3 pl-4 pr-10 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                            >
                                {monthlyTables?.map(table => (
                                    <option key={table} value={table} className="bg-white dark:bg-gray-800 py-2">
                                        {table.replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors">
                                <ChevronDown className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
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
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        collaborator.status === 'accepted'
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
                    onClick={() => setIsExportModalOpen(true)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Download your data as CSV</p>
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
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => setThemeMode('light')}
                        className={`p-4 rounded-xl border-2 transition-all ${themeMode === 'light'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <Sun className="w-6 h-6 text-yellow-500" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">Light</span>
                            {themeMode === 'light' && (
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                            )}
                        </div>
                    </button>

                    <button
                        onClick={() => setThemeMode('dark')}
                        className={`p-4 rounded-xl border-2 transition-all ${themeMode === 'dark'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-sm">
                                <Moon className="w-6 h-6 text-blue-400" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">Dark</span>
                            {themeMode === 'dark' && (
                                <CheckCircle className="w-5 h-5 text-blue-400" />
                            )}
                        </div>
                    </button>

                    <button
                        onClick={() => setThemeMode('system')}
                        className={`p-4 rounded-xl border-2 transition-all ${themeMode === 'system'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm">
                                <Laptop className="w-6 h-6 text-purple-500" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">Auto</span>
                            {themeMode === 'system' && (
                                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            )}
                        </div>
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
            case 'appearance': return renderAppearanceSection()
            case 'danger': return renderDangerSection()
            default: return renderAccountSection()
        }
    }

    // Section definitions with icons and metadata
    const sections = [
        { id: 'account', label: 'Account', icon: User, color: 'blue' },
        { id: 'workspace', label: 'Workspace', icon: Building2, color: 'purple' },
        { id: 'team', label: 'Team & Sharing', icon: Users, color: 'green' },
        { id: 'data', label: 'Data Management', icon: Database, color: 'orange' },
        { id: 'appearance', label: 'Appearance', icon: Palette, color: 'pink' },
        { id: 'help', label: 'Help Center', icon: HelpCircle, color: 'cyan', highlight: true },
        { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, color: 'red', danger: true }
    ]

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
            <div className="sticky top-0 z-10 w-full bg-gray-50 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto w-full px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 space-y-3">
                {/* Profile Card at top */}
                <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
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

                {/* Settings Sections */}
                <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                    {sections.filter(s => s.id !== 'danger').map((section) => {
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
                                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className={`p-2 rounded-lg ${getIconBgColor(section.color)}`}>
                                    <Icon className={`w-5 h-5 ${getIconColor(section.color)}`} />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white">{section.label}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{getSectionPreview(section.id)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {section.highlight && (
                                        <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                            New
                                        </span>
                                    )}
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Danger Zone - Separate Card */}
                <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 overflow-hidden mt-4">
                    <button
                        onClick={() => setActiveSection('danger')}
                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-medium text-red-600 dark:text-red-400">Danger Zone</p>
                            <p className="text-sm text-red-500/70 dark:text-red-400/70">Delete account</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-red-400" />
                    </button>
                </div>

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
                {/* Header */}
                <div className="sticky top-0 z-10 w-full bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-4xl mx-auto w-full px-4 py-4">
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-4 flex items-center gap-4 px-4 shadow-sm">
                            <button
                                onClick={() => setActiveSection(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </button>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{currentSection?.label || 'Settings'}</h1>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
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

            {/* Remove Collaborator Modal */}
            {pendingRemoval && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
