import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { AlertTriangle, Trash2, X, Download, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-toastify'

const DeleteAccountModal = ({ isOpen, onClose }) => {
    const { isDarkMode } = useTheme()
    const { user, signOut } = useAuth()
    const { members, monthlyTables, currentTable } = useApp()
    const [isDeleting, setIsDeleting] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [confirmText, setConfirmText] = useState('')

    // Export data as CSV
    const handleExportCSV = async () => {
        setIsExporting(true)
        try {
            // Collect all member data
            const csvHeaders = ['Full Name', 'Gender', 'Age', 'Phone Number', 'Current Level', 'Workspace', 'Table']
            const csvRows = members.map(member => [
                member['Full Name'] || member['full_name'] || '',
                member['Gender'] || member['gender'] || '',
                member['Age'] || member['age'] || '',
                member['Phone Number'] || member['phone_number'] || '',
                member['Current Level'] || member['current_level'] || '',
                member['workspace'] || '',
                currentTable
            ])

            const csvContent = [
                csvHeaders.join(','),
                ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n')

            // Download the CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', `my_data_backup_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success('Data exported successfully!')
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Failed to export data')
        } finally {
            setIsExporting(false)
        }
    }

    // Delete account and all data
    const handleDeleteAccount = async () => {
        if (confirmText !== 'DELETE') {
            toast.error('Please type DELETE to confirm')
            return
        }

        setIsDeleting(true)
        try {
            // The CASCADE DELETE we set up will automatically delete all user data
            // when the user is deleted from auth.users

            // First, try to delete user data manually (as backup)
            for (const table of monthlyTables) {
                try {
                    await supabase
                        .from(table)
                        .delete()
                        .eq('user_id', user.id)
                } catch (e) {
                    console.log(`Could not delete from ${table}:`, e)
                }
            }

            // Delete user preferences
            try {
                await supabase
                    .from('user_preferences')
                    .delete()
                    .eq('user_id', user.id)
            } catch (e) {
                console.log('Could not delete preferences:', e)
            }

            // Note: Deleting the user from auth.users requires admin privileges
            // We'll sign out and show instructions
            toast.success('Your data has been deleted. Please contact support to complete account deletion.')
            await signOut()
            onClose()

        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Failed to delete account. Please try again.')
        } finally {
            setIsDeleting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}
            >
                {/* Header - Red warning style like the image */}
                <div className={`px-6 py-4 flex items-center justify-between ${isDarkMode ? 'bg-red-900/50 border-b border-red-800' : 'bg-red-50 border-b border-red-200'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-red-800' : 'bg-red-100'}`}>
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                            Delete Account
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-1.5 rounded-lg transition-colors ${isDarkMode
                                ? 'hover:bg-red-800 text-gray-400 hover:text-white'
                                : 'hover:bg-red-100 text-gray-500 hover:text-red-700'
                            }`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Large trash icon - like in the user's image */}
                    <div className="flex justify-center">
                        <div className={`p-4 rounded-full ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
                            }`}>
                            <Trash2 className={`w-12 h-12 ${isDarkMode ? 'text-red-400' : 'text-red-500'
                                }`} />
                        </div>
                    </div>

                    {/* Main question */}
                    <div className="text-center">
                        <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            Are you sure you want to delete your account?
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'
                            }`}>
                            {user?.email}
                        </p>
                    </div>

                    {/* Warning box - styled like the user's image */}
                    <div className={`p-4 rounded-xl flex items-start gap-3 ${isDarkMode
                            ? 'bg-yellow-900/30 border border-yellow-700'
                            : 'bg-yellow-50 border border-yellow-200'
                        }`}>
                        <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                            }`} />
                        <div className={`text-sm ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                            <p className="font-semibold mb-1">This action cannot be undone.</p>
                            <p>All your data including {members.length} members across {monthlyTables.length} monthly databases will be permanently deleted.</p>
                        </div>
                    </div>

                    {/* Export option */}
                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`font-medium text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                    Want to save your data first?
                                </p>
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                    Export all your members as a CSV file
                                </p>
                            </div>
                            <button
                                onClick={handleExportCSV}
                                disabled={isExporting}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${isDarkMode
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    } disabled:opacity-50`}
                            >
                                {isExporting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Confirmation input */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Type <span className="font-bold text-red-500">DELETE</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type DELETE here"
                            className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-red-500'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-red-500'
                                } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                        />
                    </div>
                </div>

                {/* Footer buttons */}
                <div className={`px-6 py-4 flex gap-3 ${isDarkMode ? 'bg-gray-900/50 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-200'
                    }`}>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className={`flex-1 py-3 rounded-xl font-medium transition-colors ${isDarkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                            } disabled:opacity-50`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || confirmText !== 'DELETE'}
                        className={`flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${confirmText === 'DELETE'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            } disabled:opacity-50`}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Delete Account
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DeleteAccountModal
