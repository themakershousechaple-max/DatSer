import React, { useState } from 'react'
import {
    User,
    Building2,
    Users,
    Database,
    Palette,
    AlertTriangle,
    ChevronLeft,
    Lock,
    Mail,
    Download,
    Upload,
    Trash2,
    UserPlus,
    Calendar,
    Moon,
    Sun,
    CheckCircle,
    Shield,
    RefreshCw,
    FileSpreadsheet,
    Pencil,
    Camera,
    HelpCircle,
    ChevronDown
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useApp } from '../context/AppContext'
import { toast } from 'react-toastify'
import ShareAccessModal from './ShareAccessModal'
import WorkspaceSettingsModal from './WorkspaceSettingsModal'
import DeleteAccountModal from './DeleteAccountModal'
import ExportDataModal from './ExportDataModal'
import ProfilePhotoEditor from './ProfilePhotoEditor'
import HelpCenterPage from './HelpCenterPage'

const SettingsPage = ({ onBack }) => {
    const { user, signOut, preferences } = useAuth()
    const { isDarkMode, toggleTheme } = useTheme()
    const { members, monthlyTables, currentTable, setCurrentTable } = useApp()

    const [activeSection, setActiveSection] = useState('account')
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false)
    const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false)
    const [isExportModalOpen, setIsExportModalOpen] = useState(false)
    const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false)
    const [showHelpCenter, setShowHelpCenter] = useState(false)

    const sections = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'workspace', label: 'Workspace', icon: Building2 },
        { id: 'team', label: 'Team & Sharing', icon: Users },
        { id: 'data', label: 'Data Management', icon: Database },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'help', label: 'Help Center', icon: HelpCircle, highlight: true },
        { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true }
    ]

    const handleSignOut = async () => {
        try {
            await signOut()
            toast.success('Signed out successfully')
        } catch (error) {
            toast.error('Failed to sign out')
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
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => { if (isDarkMode) toggleTheme() }}
                        className={`p-4 rounded-xl border-2 transition-all ${!isDarkMode
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <Sun className="w-6 h-6 text-yellow-500" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">Light</span>
                            {!isDarkMode && (
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                            )}
                        </div>
                    </button>

                    <button
                        onClick={() => { if (!isDarkMode) toggleTheme() }}
                        className={`p-4 rounded-xl border-2 transition-all ${isDarkMode
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-sm">
                                <Moon className="w-6 h-6 text-blue-400" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">Dark</span>
                            {isDarkMode && (
                                <CheckCircle className="w-5 h-5 text-blue-400" />
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

    // Show Help Center Page
    if (showHelpCenter) {
        return (
            <HelpCenterPage
                onBack={() => setShowHelpCenter(false)}
                onNavigate={(target, options) => {
                    setShowHelpCenter(false)
                    // Navigate back to main app if needed
                    if (target === 'dashboard' || target === 'settings') {
                        onBack?.()
                    }
                }}
            />
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar */}
                    <div className="md:w-64 flex-shrink-0">
                        <nav className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {sections.map((section) => {
                                const Icon = section.icon
                                const isActive = activeSection === section.id
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
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors btn-press ${isActive
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-2 border-blue-600'
                                            : section.danger
                                                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10'
                                                : section.highlight
                                                    ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{section.label}</span>
                                        {section.highlight && (
                                            <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                                New
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        {renderContent()}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ShareAccessModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
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
        </div>
    )
}

export default SettingsPage
