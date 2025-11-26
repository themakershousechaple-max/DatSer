import React, { useState, useEffect } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { toast } from 'react-toastify'

const MissingDataModal = ({ member, missingFields, missingDates, pendingAttendanceAction, selectedAttendanceDate, onClose, onSave }) => {
    const { updateMember, markAttendance, selectedAttendanceDate: contextAttendanceDate } = useApp()
    const [formData, setFormData] = useState({})
    const [attendanceData, setAttendanceData] = useState({})
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [hasAttemptedSave, setHasAttemptedSave] = useState(false)

    // Initialize form data with member's current values
    useEffect(() => {
        const initialData = {}
        if (missingFields.includes('Phone Number')) {
            initialData.phoneNumber = member['Phone Number'] || ''
        }
        if (missingFields.includes('Gender')) {
            initialData.gender = member['Gender'] || ''
        }
        if (missingFields.includes('Age')) {
            initialData.age = member['Age'] || ''
        }
        if (missingFields.includes('Current Level')) {
            initialData.currentLevel = member['Current Level'] || ''
        }
        if (missingFields.includes('Parent Name 1')) {
            initialData.parentName1 = member['parent_name_1'] || ''
        }
        if (missingFields.includes('Parent Phone 1')) {
            initialData.parentPhone1 = member['parent_phone_1'] || ''
        }
        setFormData(initialData)

        // Initialize attendance data
        const initialAttendance = {}
        missingDates.forEach(date => {
            initialAttendance[date.toISOString().split('T')[0]] = null
        })
        setAttendanceData(initialAttendance)
    }, [member, missingFields, missingDates])

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error when user makes changes
        if (saveError) setSaveError(null)
    }

    const handleAttendanceChange = (dateKey, status) => {
        setAttendanceData(prev => ({ ...prev, [dateKey]: status }))
        // Clear error when user makes changes
        if (saveError) setSaveError(null)
    }

    // Check if all required fields are filled
    const isFormComplete = () => {
        // Check member fields
        for (const field of missingFields) {
            if (field === 'Phone Number' && (!formData.phoneNumber || formData.phoneNumber.length !== 10)) {
                return false
            }
            if (field === 'Gender' && (!formData.gender || formData.gender === '')) {
                return false
            }
            if (field === 'Age' && (!formData.age || formData.age === '')) {
                return false
            }
            if (field === 'Current Level' && (!formData.currentLevel || formData.currentLevel === '')) {
                return false
            }
            if (field === 'Parent Name 1' && (!formData.parentName1 || formData.parentName1 === '')) {
                return false
            }
            if (field === 'Parent Phone 1' && (!formData.parentPhone1 || formData.parentPhone1.length !== 10)) {
                return false
            }
        }

        // Check attendance dates
        for (const dateKey of Object.keys(attendanceData)) {
            if (attendanceData[dateKey] === null) {
                return false
            }
        }

        return true
    }

    // Helper to check if a specific field is invalid
    const isFieldInvalid = (field) => {
        if (!hasAttemptedSave) return false

        if (field === 'Phone Number') return !formData.phoneNumber || formData.phoneNumber.length !== 10
        if (field === 'Gender') return !formData.gender || formData.gender === ''
        if (field === 'Age') return !formData.age || formData.age === ''
        if (field === 'Current Level') return !formData.currentLevel || formData.currentLevel === ''
        if (field === 'Parent Name 1') return !formData.parentName1 || formData.parentName1 === ''
        if (field === 'Parent Phone 1') return !formData.parentPhone1 || formData.parentPhone1.length !== 10

        return false
    }

    const handleSave = async () => {
        setHasAttemptedSave(true)

        console.log('=== SAVE BUTTON CLICKED ===')
        console.log('Form complete?', isFormComplete())

        if (!isFormComplete()) {
            console.log('Form not complete, showing error')
            toast.error('Please fill in all highlighted fields')
            return
        }

        setIsSaving(true)
        setSaveError(null)
        console.log('Starting save process...')

        try {
            // Update member fields if any are missing
            if (missingFields.length > 0) {
                const updates = {}
                if (missingFields.includes('Phone Number')) {
                    updates['Phone Number'] = formData.phoneNumber
                }
                if (missingFields.includes('Gender')) {
                    updates['Gender'] = formData.gender
                }
                if (missingFields.includes('Age')) {
                    updates['Age'] = formData.age
                }
                if (missingFields.includes('Current Level')) {
                    updates['Current Level'] = formData.currentLevel
                }
                if (missingFields.includes('Parent Name 1')) {
                    updates.parent_name_1 = formData.parentName1
                }
                if (missingFields.includes('Parent Phone 1')) {
                    updates.parent_phone_1 = formData.parentPhone1
                }

                console.log('Updating member with:', updates)
                await updateMember(member.id, updates)
                console.log('Member updated successfully')
            }

            // Update attendance for missing dates
            for (const dateKey of Object.keys(attendanceData)) {
                const status = attendanceData[dateKey]
                if (status !== null) {
                    console.log(`Marking attendance for ${dateKey}: ${status}`)
                    await markAttendance(member.id, new Date(dateKey), status)
                }
            }

            console.log('All updates complete!')
            toast.success('Missing data saved successfully!')
            onSave()
            onClose()
        } catch (error) {
            console.error('Error saving missing data:', error)
            const errorMsg = error.message || 'Unknown error occurred'
            setSaveError(errorMsg)
            toast.error(`Failed to save data: ${errorMsg}`)
        } finally {
            setIsSaving(false)
        }
    }

    const handleSkip = async () => {
        console.log('=== SKIP BUTTON CLICKED ===')
        console.log('Pending attendance action:', pendingAttendanceAction)

        // If there's a pending attendance action, save it immediately
        if (pendingAttendanceAction) {
            const { memberId, present } = pendingAttendanceAction
            const dateToUse = selectedAttendanceDate || contextAttendanceDate

            setIsSaving(true)
            setSaveError(null)
            console.log(`Saving pending attendance: ${present ? 'Present' : 'Absent'} for member ${memberId}`)

            try {
                // Save the original Present/Absent selection that triggered the modal
                if (dateToUse) {
                    await markAttendance(memberId, dateToUse, present)
                    console.log(`Attendance saved: ${present}`)
                    toast.success(`Marked as ${present ? 'present' : 'absent'}!`, {
                        style: {
                            background: present ? '#10b981' : '#ef4444',
                            color: '#ffffff'
                        }
                    })
                } else {
                    console.warn('No attendance date available')
                    toast.error('No attendance date selected')
                }
                onSave()
                onClose()
            } catch (error) {
                console.error('Error saving pending attendance:', error)
                const errorMsg = error.message || 'Unknown error occurred'
                setSaveError(errorMsg)
                toast.error(`Failed to save attendance: ${errorMsg}`)
            } finally {
                setIsSaving(false)
            }
            return
        }

        // If no pending action, just close
        console.log('No pending attendance action, closing modal')
        toast.info('No attendance to save')
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-200 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Complete Missing Information
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {saveError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-medium mb-1">
                                <AlertCircle className="w-4 h-4" />
                                <span>Error Saving Data</span>
                            </div>
                            <p className="text-sm text-red-700 dark:text-red-300 break-words">
                                {saveError}
                            </p>
                        </div>
                    )}

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                            📋 Complete Missing Information for <strong>{member['Full Name'] || member.full_name}</strong>
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            {missingDates.length > 0 && (
                                <span className="block mb-1">
                                    ✅ <strong>Past Sundays:</strong> If you were in church, select <span className="text-green-600 dark:text-green-400 font-semibold">Present (Green)</span>. If not, select <span className="text-red-600 dark:text-red-400 font-semibold">Absent (Red)</span>.
                                </span>
                            )}
                            {missingFields.length > 0 && (
                                <span className="block">
                                    📝 <strong>Required Fields:</strong> Please fill in all missing information below.
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Missing Member Fields */}
                    {missingFields.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Member Information</h3>

                            {missingFields.includes('Phone Number') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Phone Number * (10 digits)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="tel"
                                            value={formData.phoneNumber || ''}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                                                handleInputChange('phoneNumber', value)
                                            }}
                                            maxLength="10"
                                            className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white ${isFieldInvalid('Phone Number')
                                                ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10'
                                                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                                                }`}
                                            placeholder="Enter 10-digit phone number"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleInputChange('phoneNumber', '0000000000')}
                                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            No Phone
                                        </button>
                                    </div>
                                    {formData.phoneNumber && formData.phoneNumber.length !== 10 && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Must be exactly 10 digits</p>
                                    )}
                                    {isFieldInvalid('Phone Number') && !formData.phoneNumber && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Phone number is required</p>
                                    )}
                                </div>
                            )}

                            {missingFields.includes('Gender') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Gender *
                                    </label>
                                    <select
                                        value={formData.gender || ''}
                                        onChange={(e) => handleInputChange('gender', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white ${isFieldInvalid('Gender')
                                            ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10'
                                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                                            }`}
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                    {isFieldInvalid('Gender') && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Gender is required</p>
                                    )}
                                </div>
                            )}

                            {missingFields.includes('Age') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Age *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.age || ''}
                                        onChange={(e) => handleInputChange('age', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white ${isFieldInvalid('Age')
                                            ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10'
                                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                                            }`}
                                        placeholder="Enter age"
                                    />
                                    {isFieldInvalid('Age') && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Age is required</p>
                                    )}
                                </div>
                            )}

                            {missingFields.includes('Current Level') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Current Level *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.currentLevel || ''}
                                        onChange={(e) => handleInputChange('currentLevel', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white ${isFieldInvalid('Current Level')
                                            ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10'
                                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                                            }`}
                                        placeholder="e.g., JHS1, SHS2, Primary 3"
                                    />
                                    {isFieldInvalid('Current Level') && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Current level is required</p>
                                    )}
                                </div>
                            )}

                            {missingFields.includes('Parent Name 1') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Parent/Guardian Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.parentName1 || ''}
                                        onChange={(e) => handleInputChange('parentName1', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white ${isFieldInvalid('Parent Name 1')
                                            ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10'
                                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                                            }`}
                                        placeholder="Enter parent/guardian name"
                                    />
                                    {isFieldInvalid('Parent Name 1') && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Parent name is required</p>
                                    )}
                                </div>
                            )}

                            {missingFields.includes('Parent Phone 1') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Parent/Guardian Phone * (10 digits)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="tel"
                                            value={formData.parentPhone1 || ''}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                                                handleInputChange('parentPhone1', value)
                                            }}
                                            maxLength="10"
                                            className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white ${isFieldInvalid('Parent Phone 1')
                                                ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10'
                                                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                                                }`}
                                            placeholder="Enter 10-digit phone number"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleInputChange('parentPhone1', '0000000000')}
                                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            No Phone
                                        </button>
                                    </div>
                                    {formData.parentPhone1 && formData.parentPhone1.length !== 10 && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Must be exactly 10 digits</p>
                                    )}
                                    {isFieldInvalid('Parent Phone 1') && !formData.parentPhone1 && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Parent phone is required</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Missing Attendance Dates */}
                    {missingDates.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Past Sunday Attendance</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Please mark attendance for the following past Sundays:
                            </p>

                            <div className="space-y-3">
                                {missingDates.map(date => {
                                    const dateKey = date.toISOString().split('T')[0]
                                    const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                    const isMissing = hasAttemptedSave && attendanceData[dateKey] === null

                                    return (
                                        <div key={dateKey} className={`flex items-center justify-between p-3 rounded-lg ${isMissing
                                            ? 'bg-red-50 dark:bg-red-900/10 border border-red-300 dark:border-red-700'
                                            : 'bg-gray-50 dark:bg-gray-700'
                                            }`}>
                                            <span className={`text-sm font-medium ${isMissing ? 'text-red-800 dark:text-red-200' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {dateLabel} {isMissing && '(Required)'}
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAttendanceChange(dateKey, true)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${attendanceData[dateKey] === true
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900'
                                                        }`}
                                                >
                                                    Present
                                                </button>
                                                <button
                                                    onClick={() => handleAttendanceChange(dateKey, false)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${attendanceData[dateKey] === false
                                                        ? 'bg-red-600 text-white'
                                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900'
                                                        }`}
                                                >
                                                    Absent
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with Save button */}
                <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
                    <button
                        onClick={handleSkip}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                        disabled={isSaving}
                        title="Save attendance and skip member information"
                    >
                        Skip
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${isSaving
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                                : 'bg-primary-600 hover:bg-primary-700 text-white'
                                }`}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MissingDataModal
