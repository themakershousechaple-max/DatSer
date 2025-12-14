import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Calendar, ChevronRight, Plus, Search, ChevronDown, ChevronUp, X, Pencil } from 'lucide-react'

// December 2025 Sundays
const DECEMBER_2025_SUNDAYS = [
  new Date(2025, 11, 7),
  new Date(2025, 11, 14),
  new Date(2025, 11, 21),
  new Date(2025, 11, 28)
]

const DecemberQuickView = ({ onOpenFullApp, showPreview, onTogglePreview }) => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCount, setShowCount] = useState(20)
  const [selectedDate, setSelectedDate] = useState(DECEMBER_2025_SUNDAYS[1]) // Dec 14
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    gender: '',
    age: '',
    level: ''
  })
  const [saving, setSaving] = useState(false)
  const [markingId, setMarkingId] = useState(null)
  const [editingMember, setEditingMember] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Get attendance column name for a date
  const getAttendanceColumn = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `attendance_${y}_${m}_${d}`
  }

  const attendanceColumn = getAttendanceColumn(selectedDate)

  // Fetch members from December_2025 table
  const fetchMembers = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('December_2025')
        .select('*')
        .order('Full Name', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (err) {
      console.error('Error fetching members:', err)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // Mark attendance - update column directly in December_2025 table
  const handleMark = async (memberId, present) => {
    if (!isSupabaseConfigured || !supabase) return

    setMarkingId(memberId)
    try {
      const value = present ? 'Present' : 'Absent'
      const { error } = await supabase
        .from('December_2025')
        .update({ [attendanceColumn]: value })
        .eq('id', memberId)

      if (error) throw error

      // Update local state
      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, [attendanceColumn]: value } : m
      ))
    } catch (err) {
      console.error('Error marking attendance:', err)
      alert('Failed to save. Please try again.')
    } finally {
      setMarkingId(null)
    }
  }

  // Add new member - auto marks as Present for Dec 14
  const handleAddMember = async () => {
    if (!newMember.name.trim() || !isSupabaseConfigured || !supabase) return

    setSaving(true)
    try {
      // Dec 14 attendance column
      const dec14Column = 'attendance_2025_12_14'

      const memberData = {
        'Full Name': newMember.name.trim(),
        'Phone Number': newMember.phone ? parseInt(newMember.phone) : null,
        'Gender': newMember.gender || null,
        'Age': newMember.age || null,
        'Current Level': newMember.level || null,
        [dec14Column]: 'Present' // Auto-mark as Present for Dec 14
      }

      const { data, error } = await supabase
        .from('December_2025')
        .insert(memberData)
        .select()
        .single()

      if (error) throw error

      // Add to local state
      setMembers(prev => [...prev, data].sort((a, b) =>
        (a['Full Name'] || '').localeCompare(b['Full Name'] || '')
      ))
      setNewMember({ name: '', phone: '', gender: '', age: '', level: '' })
      setShowAddModal(false)
    } catch (err) {
      console.error('Error adding member:', err)
      alert('Failed to add member. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Edit member
  const handleEditMember = async () => {
    if (!editingMember || !isSupabaseConfigured || !supabase) return

    setSaving(true)
    try {
      const memberData = {
        'Full Name': editingMember['Full Name']?.trim() || '',
        'Phone Number': editingMember['Phone Number'] || null,
        'Gender': editingMember['Gender'] || null,
        'Age': editingMember['Age'] || null,
        'Current Level': editingMember['Current Level'] || null
      }

      const { error } = await supabase
        .from('December_2025')
        .update(memberData)
        .eq('id', editingMember.id)

      if (error) throw error

      // Update local state
      setMembers(prev => prev.map(m =>
        m.id === editingMember.id ? { ...m, ...memberData } : m
      ).sort((a, b) => (a['Full Name'] || '').localeCompare(b['Full Name'] || '')))

      setEditingMember(null)
      setShowEditModal(false)
    } catch (err) {
      console.error('Error updating member:', err)
      alert('Failed to update member. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Open edit modal
  const openEditModal = (member) => {
    setEditingMember({ ...member })
    setShowEditModal(true)
  }

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!members) return []
    if (!searchTerm.trim()) return members
    const term = searchTerm.toLowerCase()
    return members.filter(m => {
      const name = (m['Full Name'] || '').toLowerCase()
      return name.includes(term)
    })
  }, [members, searchTerm])

  // Show only first N members
  const displayedMembers = useMemo(() => {
    return filteredMembers.slice(0, showCount)
  }, [filteredMembers, showCount])

  const hasMore = filteredMembers.length > showCount

  // Get attendance status from member's attendance column
  const getStatus = (member) => {
    const value = member[attendanceColumn]
    if (value === 'Present') return true
    if (value === 'Absent') return false
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-32">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">December Attendance</h1>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">{filteredMembers.length} members</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenFullApp}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors shadow-sm"
                title="Skip preview and go to full app"
              >
                <span className="hidden sm:inline">Skip to Full App</span>
                <span className="sm:hidden">Skip</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenFullApp}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                Open Full App
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Conditionally render preview content */}
        {showPreview && (
          <>
            {/* Date selector */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-2 text-sm lg:text-base font-semibold text-gray-700 dark:text-gray-200">
                <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />
                Sundays in December 2025
              </div>
              <div className="flex flex-wrap gap-2">
                {DECEMBER_2025_SUNDAYS.map((d) => {
                  const col = getAttendanceColumn(d)
                  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  const isSelected = attendanceColumn === col
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`px-3 py-1.5 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-semibold border transition-colors ${isSelected
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Members grid - 3 columns on large screens */}
            {loading ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <div className="text-sm text-gray-600 dark:text-gray-400">Loading members...</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayedMembers.map((m) => {
                    const name = m['Full Name'] || 'Member'
                    const status = getStatus(m)
                    const isMarking = markingId === m.id
                    return (
                      <div
                        key={m.id}
                        className={`bg-white dark:bg-gray-800 border rounded-xl p-3 lg:p-4 ${status === true ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                          status === false ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                            'border-gray-200 dark:border-gray-700'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white truncate">{name}</div>
                              {status !== null && status !== undefined && (
                                <div className={`text-xs lg:text-sm font-medium ${status ? 'text-green-600' : 'text-red-600'}`}>
                                  {status ? '✓ Present' : '✗ Absent'}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => openEditModal(m)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMark(m.id, true)}
                              disabled={isMarking}
                              className={`px-2 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs lg:text-sm font-bold transition-colors disabled:opacity-50 ${status === true
                                ? 'bg-green-800 text-white ring-2 ring-green-400'
                                : 'bg-green-700 hover:bg-green-800 text-white'
                                }`}
                            >
                              {isMarking ? '...' : 'P'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMark(m.id, false)}
                              disabled={isMarking}
                              className={`px-2 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs lg:text-sm font-bold transition-colors disabled:opacity-50 ${status === false
                                ? 'bg-red-800 text-white ring-2 ring-red-400'
                                : 'bg-red-700 hover:bg-red-800 text-white'
                                }`}
                            >
                              {isMarking ? '...' : 'A'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Show More button */}
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setShowCount(prev => prev + 20)}
                    className="w-full mt-3 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm lg:text-base font-medium"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Show More ({filteredMembers.length - showCount} remaining)
                  </button>
                )}

                {filteredMembers.length === 0 && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center text-sm lg:text-base text-gray-600 dark:text-gray-400">
                    {searchTerm ? 'No members match your search.' : 'No members found.'}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Fixed bottom bar - only show when preview is visible */}
      {showPreview && (
        <div className="fixed bottom-4 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 mx-4 rounded-2xl shadow-lg">
          <div className="max-w-5xl mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowCount(20)
                }}
                placeholder="Search members..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm lg:text-base transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New Member</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Full Name */}
              <input
                type="text"
                value={newMember.name}
                onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full Name *"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />

              {/* Phone Number */}
              <input
                type="tel"
                value={newMember.phone}
                onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                placeholder="Phone Number"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              {/* Gender */}
              <select
                value={newMember.gender}
                onChange={(e) => setNewMember(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              {/* Age */}
              <input
                type="text"
                value={newMember.age}
                onChange={(e) => setNewMember(prev => ({ ...prev, age: e.target.value }))}
                placeholder="Age"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              {/* Current Level */}
              <select
                value={newMember.level}
                onChange={(e) => setNewMember(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Level</option>
                <option value="JHS1">JHS 1</option>
                <option value="JHS2">JHS 2</option>
                <option value="JHS3">JHS 3</option>
                <option value="SHS1">SHS 1</option>
                <option value="SHS2">SHS 2</option>
                <option value="SHS3">SHS 3</option>
                <option value="COMPLETED">Completed</option>
                <option value="UNIVERSITY">University</option>
              </select>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setNewMember({ name: '', phone: '', gender: '', age: '', level: '' })
                  setShowAddModal(false)
                }}
                className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={!newMember.name.trim() || saving}
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Member</h2>
              <button onClick={() => { setEditingMember(null); setShowEditModal(false) }} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Full Name */}
              <input
                type="text"
                value={editingMember['Full Name'] || ''}
                onChange={(e) => setEditingMember(prev => ({ ...prev, 'Full Name': e.target.value }))}
                placeholder="Full Name *"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              {/* Phone Number */}
              <input
                type="tel"
                value={editingMember['Phone Number'] || ''}
                onChange={(e) => setEditingMember(prev => ({ ...prev, 'Phone Number': e.target.value.replace(/\D/g, '') ? parseInt(e.target.value.replace(/\D/g, '')) : null }))}
                placeholder="Phone Number"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              {/* Gender */}
              <select
                value={editingMember['Gender'] || ''}
                onChange={(e) => setEditingMember(prev => ({ ...prev, 'Gender': e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              {/* Age */}
              <input
                type="text"
                value={editingMember['Age'] || ''}
                onChange={(e) => setEditingMember(prev => ({ ...prev, 'Age': e.target.value }))}
                placeholder="Age"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              {/* Current Level */}
              <select
                value={editingMember['Current Level'] || ''}
                onChange={(e) => setEditingMember(prev => ({ ...prev, 'Current Level': e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Level</option>
                <option value="JHS1">JHS 1</option>
                <option value="JHS2">JHS 2</option>
                <option value="JHS3">JHS 3</option>
                <option value="SHS1">SHS 1</option>
                <option value="SHS2">SHS 2</option>
                <option value="SHS3">SHS 3</option>
                <option value="COMPLETED">Completed</option>
                <option value="UNIVERSITY">University</option>
              </select>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setEditingMember(null); setShowEditModal(false) }}
                className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditMember}
                disabled={!editingMember['Full Name']?.trim() || saving}
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DecemberQuickView
