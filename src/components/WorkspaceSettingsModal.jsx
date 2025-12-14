import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { X, Building2, Save, Info } from 'lucide-react'
import { toast } from 'react-toastify'

const WorkspaceSettingsModal = ({ isOpen, onClose }) => {
    const { isDarkMode } = useTheme()
    const { user, preferences, updatePreference } = useAuth()
    const [workspaceName, setWorkspaceName] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (isOpen && preferences) {
            setWorkspaceName(preferences.workspace_name || 'My Organization')
        }
    }, [isOpen, preferences])

    const handleSave = async () => {
        if (!workspaceName.trim()) {
            toast.error('Workspace name cannot be empty')
            return
        }

        setIsLoading(true)
        try {
            await updatePreference('workspace_name', workspaceName.trim())
            toast.success('Workspace name updated successfully!')
            onClose()
        } catch (error) {
            console.error('Error updating workspace name:', error)
            toast.error('Failed to update workspace name')
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-md rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-lg font-bold">Workspace Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Info Box */}
                    <div className={`p-4 rounded-lg flex items-start gap-3 ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
                        }`}>
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                What is a Workspace Name?
                            </p>
                            <p className="text-blue-800 dark:text-blue-200">
                                This name helps identify your data in the backend. It makes it easier to filter
                                and manage multiple organizations in Supabase.
                            </p>
                        </div>
                    </div>

                    {/* Workspace Name Input */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Workspace Name
                        </label>
                        <input
                            type="text"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            placeholder="e.g., Grace Church Youth, Teen Center NYC"
                            maxLength={50}
                            className={`w-full px-3 py-2 rounded-lg border transition-colors ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {workspaceName.length}/50 characters
                        </p>
                    </div>

                    {/* User Info */}
                    <div className={`p-3 rounded-lg text-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">Account Email</p>
                        <p className="font-medium">{user?.email}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className={`flex items-center justify-end gap-3 p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                            }`}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading || !workspaceName.trim()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isLoading || !workspaceName.trim()
                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        <Save className="w-4 h-4" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default WorkspaceSettingsModal
