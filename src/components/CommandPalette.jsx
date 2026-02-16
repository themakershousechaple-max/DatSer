import React, { useState, useEffect, useRef } from 'react'
import { Search, UserPlus, Settings, Moon, Sun, Download, Home, X, Users, LogOut, Zap, Eye, Monitor, Palette, Building2, Database, TrendingUp, HelpCircle, AlertTriangle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const CommandPalette = ({ setCurrentView, onAddMember, isExecutive = false, onNavigateToSettingsSection }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef(null)

    const { isDarkMode, toggleTheme, commandKEnabled } = useTheme()
    const { signOut } = useAuth()

    // Toggle open on Ctrl+K or Cmd+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!commandKEnabled) return
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(prev => !prev)
            }
            if (e.key === 'Escape') {
                setIsOpen(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50)
        } else {
            setQuery('')
            setSelectedIndex(0)
        }
    }, [isOpen])

    const actions = [
        // Navigation Actions
        {
            id: 'dashboard',
            label: 'Go to Dashboard',
            icon: Home,
            category: 'navigation',
            shortcut: 'D',
            action: () => {
                setCurrentView('dashboard')
                setIsOpen(false)
            }
        },
        ...(isExecutive ? [{
            id: 'exec',
            label: 'Executive Attendance',
            icon: Monitor,
            category: 'navigation',
            shortcut: 'X',
            action: () => {
                setCurrentView('exec')
                setIsOpen(false)
            }
        }] : []),
        {
            id: 'analytics',
            label: 'View Analytics',
            icon: TrendingUp,
            category: 'navigation',
            shortcut: 'A',
            action: () => {
                setCurrentView('analytics')
                setIsOpen(false)
            }
        },
        {
            id: 'admin',
            label: 'Admin Panel',
            icon: Users,
            category: 'navigation',
            shortcut: 'M',
            action: () => {
                setCurrentView('admin')
                setIsOpen(false)
            }
        },
        
        // Settings Actions
        {
            id: 'settings',
            label: 'Open Settings',
            icon: Settings,
            category: 'settings',
            shortcut: 'S',
            action: () => {
                setCurrentView('settings')
                setIsOpen(false)
            }
        },
        // Account Settings
        {
            id: 'settings-account',
            label: 'Settings → Account',
            icon: Users,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('account')
                setIsOpen(false)
            }
        },
        {
            id: 'settings-profile',
            label: 'Settings → Profile Picture',
            icon: Users,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('account')
                setIsOpen(false)
            }
        },
        {
            id: 'settings-password',
            label: 'Settings → Change Password',
            icon: Users,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('account')
                setIsOpen(false)
            }
        },
        // Workspace Settings
        {
            id: 'settings-workspace',
            label: 'Settings → Workspace',
            icon: Building2,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('workspace')
                setIsOpen(false)
            }
        },
        {
            id: 'settings-month',
            label: 'Settings → Select Month',
            icon: Building2,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('workspace')
                setIsOpen(false)
            }
        },
        // Team Settings
        {
            id: 'settings-team',
            label: 'Settings → Team & Collaborators',
            icon: Users,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('team')
                setIsOpen(false)
            }
        },
        {
            id: 'settings-share',
            label: 'Settings → Share Access',
            icon: Users,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('team')
                setIsOpen(false)
            }
        },
        // Appearance Settings
        {
            id: 'settings-appearance',
            label: 'Settings → Appearance',
            icon: Palette,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('appearance')
                setIsOpen(false)
            }
        },
        {
            id: 'settings-theme',
            label: 'Settings → Theme',
            icon: Palette,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('appearance')
                setIsOpen(false)
            }
        },
        {
            id: 'settings-font',
            label: 'Settings → Font Size & Family',
            icon: Palette,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('appearance')
                setIsOpen(false)
            }
        },
        // Accessibility Settings
        {
            id: 'settings-accessibility',
            label: 'Settings → Accessibility',
            icon: Zap,
            category: 'settings',
            shortcut: 'K',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('accessibility')
                setIsOpen(false)
            }
        },
        {
            id: 'settings-dyslexic-font',
            label: 'Settings → Dyslexic Font',
            icon: Zap,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('accessibility')
                setIsOpen(false)
            }
        },
        // Data Management Settings
        {
            id: 'settings-data',
            label: 'Settings → Data Management',
            icon: Database,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('data')
                setIsOpen(false)
            }
        },
        {
            id: 'settings-export',
            label: 'Settings → Export Data',
            icon: Download,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('data')
                setIsOpen(false)
            }
        },
        {
            id: 'settings-import',
            label: 'Settings → Import Data',
            icon: Database,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('data')
                setIsOpen(false)
            }
        },
        // Help & Support
        {
            id: 'settings-help',
            label: 'Settings → Help Center',
            icon: HelpCircle,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('help')
                setIsOpen(false)
            }
        },
        {
            id: 'settings-activity',
            label: 'Settings → Activity Log',
            icon: Database,
            category: 'settings',
            action: () => {
                setCurrentView('settings')
                if (onNavigateToSettingsSection) onNavigateToSettingsSection('activity')
                setIsOpen(false)
            }
        },
        
        // Quick Actions
        {
            id: 'add-member',
            label: 'Add New Member',
            icon: UserPlus,
            category: 'actions',
            shortcut: 'N',
            action: () => {
                if (onAddMember) onAddMember()
                setIsOpen(false)
            }
        },
        {
            id: 'export-data',
            label: 'Export Data',
            icon: Download,
            category: 'actions',
            shortcut: 'E',
            action: () => {
                setCurrentView('settings')
                // In a real app, you'd pass a parameter to open the data section
                setIsOpen(false)
            }
        },
        
        // Theme Actions
        {
            id: 'theme',
            label: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
            icon: isDarkMode ? Sun : Moon,
            category: 'theme',
            shortcut: 'T',
            action: () => {
                toggleTheme()
                setIsOpen(false)
            }
        },
        
        // Help Actions
        {
            id: 'help',
            label: 'Help Center',
            icon: HelpCircle,
            category: 'help',
            shortcut: 'H',
            action: () => {
                setCurrentView('settings')
                // In a real app, you'd pass a parameter to open the help section
                setIsOpen(false)
            }
        },
        
        // Account Actions
        {
            id: 'logout',
            label: 'Log Out',
            icon: LogOut,
            category: 'account',
            shortcut: 'L',
            action: () => {
                signOut()
                setIsOpen(false)
            }
        }
    ]

    const filteredActions = actions.filter(action =>
        action.label.toLowerCase().includes(query.toLowerCase())
    )
    
    // Group actions by category
    const groupedActions = filteredActions.reduce((groups, action) => {
        if (!groups[action.category]) {
            groups[action.category] = []
        }
        groups[action.category].push(action)
        return groups
    }, {})
    
    const categoryTitles = {
        navigation: 'Navigation',
        settings: 'Settings',
        actions: 'Quick Actions',
        theme: 'Theme',
        help: 'Help',
        account: 'Account'
    }

    const handleSelect = (action) => {
        action.action()
        setIsOpen(false)
    }

    // Handle arrow navigation
    const handleInputKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (filteredActions.length > 0) {
                setSelectedIndex(prev => (prev + 1) % filteredActions.length)
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (filteredActions.length > 0) {
                setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length)
            }
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (filteredActions[selectedIndex]) {
                handleSelect(filteredActions[selectedIndex])
            } else if (query.trim().toLowerCase().includes('setting')) {
                setCurrentView('settings')
                setIsOpen(false)
            }
        }
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
        >
            <div
                className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-lg h-10"
                        placeholder="Type a command or search..."
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value)
                            setSelectedIndex(0)
                        }}
                        onKeyDown={handleInputKeyDown}
                    />
                    <button
                        onClick={() => setIsOpen(false)}
                        className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 rounded"
                    >
                        ESC
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto py-2">
                    {filteredActions.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No results found.
                        </div>
                    ) : (
                        <div className="px-2">
                            {Object.entries(groupedActions).map(([category, categoryActions], categoryIndex) => {
                                const categoryStartIndex = Object.values(groupedActions)
                                    .slice(0, categoryIndex)
                                    .reduce((sum, actions) => sum + actions.length, 0)
                                
                                return (
                                    <div key={category} className="mb-4">
                                        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 py-2">
                                            {categoryTitles[category] || category}
                                        </div>
                                        {categoryActions.map((action, index) => {
                                            const globalIndex = categoryStartIndex + index
                                            return (
                                                <button
                                                    key={action.id}
                                                    onClick={() => handleSelect(action)}
                                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                    className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors text-left
                            ${globalIndex === selectedIndex
                                                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <action.icon className={`w-5 h-5 ${globalIndex === selectedIndex ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                                                        <span className="font-medium">{action.label}</span>
                                                    </div>
                                                    {action.shortcut && (
                                                        <span className={`text-xs px-1.5 py-0.5 rounded border
                              ${globalIndex === selectedIndex
                                                            ? 'bg-white dark:bg-gray-800 border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400'
                                                            : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500'
                                                        }`}>
                                                            {action.shortcut}
                                                        </span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 flex justify-between">
                    <span>Use arrow keys to navigate • Type letters to jump to actions</span>
                    <span>DatSer v1.2</span>
                </div>
            </div>
        </div>
    )
}

export default CommandPalette
