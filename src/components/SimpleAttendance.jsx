import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Search, UserPlus, ArrowLeft, X, Users, Pencil, ChevronDown } from 'lucide-react'

const TABLE = 'February_2026'
const LEVELS = ['JHS1','JHS2','JHS3','SHS1','SHS2','SHS3','COMPLETED','UNIVERSITY']

function ComboSelect({ value, onChange, options, placeholder = 'Type or select...' }) {
  const [open, setOpen] = useState(false)
  const [inputVal, setInputVal] = useState(value || '')
  const ref = React.useRef(null)

  React.useEffect(() => { setInputVal(value || '') }, [value])

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(o => o.toLowerCase().includes((inputVal || '').toLowerCase()))

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center rounded-xl overflow-hidden" style={{ backgroundColor: '#f0eeea' }}>
        <input
          type="text"
          value={inputVal}
          onChange={e => { setInputVal(e.target.value); onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 text-sm bg-transparent focus:outline-none"
        />
        <button type="button" onClick={() => setOpen(!open)} className="px-2 py-2.5 text-gray-400">
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-xl shadow-lg border border-gray-200 bg-white z-50 max-h-48 overflow-y-auto">
          {filtered.map(o => (
            <button
              key={o}
              type="button"
              onClick={() => { onChange(o); setInputVal(o); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${
                value === o ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const SUNDAYS = [
  { key: 'attendance_2026_02_01', label: 'Feb 1' },
  { key: 'attendance_2026_02_08', label: 'Feb 8' },
  { key: 'attendance_2026_02_15', label: 'Feb 15' },
  { key: 'attendance_2026_02_22', label: 'Feb 22' },
]

export default function SimpleAttendance({ onBack }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const toastTimer = React.useRef(null)

  const showToast = (message, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, type })
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addGender, setAddGender] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [addAge, setAddAge] = useState('')
  const [addLevel, setAddLevel] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addAttendance, setAddAttendance] = useState(null)
  const [activeSunday, setActiveSunday] = useState(SUNDAYS[2].key)
  const [expandedId, setExpandedId] = useState(null)
  const [filterMode, setFilterMode] = useState('all')
  const [visibleCount, setVisibleCount] = useState(20)
  const [editingMember, setEditingMember] = useState(null)
  const [editName, setEditName] = useState('')
  const [editAge, setEditAge] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editLevel, setEditLevel] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current) }
  }, [])

  // Fix scrolling in Chromium browsers (Brave, Edge) - override global CSS that blocks trackpad/touchpad scroll
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevBodyOverscroll = body.style.overscrollBehavior
    const prevBodyTouchAction = body.style.touchAction

    html.style.overflow = 'auto'
    body.style.overflow = 'auto'
    body.style.overscrollBehavior = 'auto'
    body.style.touchAction = 'pan-y'

    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      body.style.overscrollBehavior = prevBodyOverscroll
      body.style.touchAction = prevBodyTouchAction
    }
  }, [])

  // Load all members from February_2026
  const loadMembers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('Full Name', { ascending: true })
        .limit(2000)

      if (error) throw error
      setMembers(data || [])
    } catch (err) {
      console.error('Load error:', err)
      showToast('Failed to load members', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadMembers() }, [loadMembers])

  // Mark attendance
  const markAttendance = async (memberId, sundayKey, value) => {
    const loadingKey = `${memberId}_${sundayKey}`
    setSaving(p => ({ ...p, [loadingKey]: true }))
    try {
      // Toggle: if already this value, clear it
      const member = members.find(m => m.id === memberId)
      const current = member?.[sundayKey]
      const dbVal = current === (value ? 'Present' : 'Absent') ? null : (value ? 'Present' : 'Absent')

      const { error } = await supabase
        .from(TABLE)
        .update({ [sundayKey]: dbVal })
        .eq('id', memberId)

      if (error) throw error

      // Update local state
      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, [sundayKey]: dbVal } : m
      ))
    } catch (err) {
      console.error('Mark error:', err)
      showToast('Failed to save', 'error')
    } finally {
      setSaving(p => ({ ...p, [loadingKey]: false }))
    }
  }

  // Add member
  const handleAdd = async (e) => {
    e.preventDefault()
    if (!addName.trim()) { showToast('Name is required', 'error'); return }
    setAddLoading(true)
    try {
      const row = {
        'Full Name': addName.trim(),
        'Gender': addGender || null,
        'Phone Number': addPhone || null,
        'Age': addAge || null,
        'Current Level': addLevel || null,
        ...(addAttendance !== null ? { [activeSunday]: addAttendance ? 'Present' : 'Absent' } : {}),
      }
      const { data, error } = await supabase
        .from(TABLE)
        .insert([row])
        .select()

      if (error) throw error
      setMembers(prev => [...prev, data[0]].sort((a, b) =>
        (a['Full Name'] || '').localeCompare(b['Full Name'] || '')
      ))
      setAddName(''); setAddGender(''); setAddPhone(''); setAddAge(''); setAddLevel(''); setAddAttendance(null)
      setShowAdd(false)
      showToast(`${addName.trim()} added!`)
    } catch (err) {
      console.error('Add error:', err)
      showToast('Failed to add member', 'error')
    } finally {
      setAddLoading(false)
    }
  }

  // Edit member
  const startEdit = (member) => {
    setEditingMember(member)
    setEditName(member['Full Name'] || '')
    setEditAge(member['Age'] || '')
    setEditPhone(member['Phone Number'] || '')
    setEditLevel(member['Current Level'] || '')
  }

  const saveEdit = async () => {
    if (!editingMember || !editName.trim()) return
    setEditSaving(true)
    try {
      const updates = { 'Full Name': editName.trim(), 'Age': editAge || null, 'Phone Number': editPhone || null, 'Current Level': editLevel || null }
      const { error } = await supabase
        .from(TABLE)
        .update(updates)
        .eq('id', editingMember.id)

      if (error) throw error

      setMembers(prev => prev.map(m =>
        m.id === editingMember.id ? { ...m, ...updates } : m
      ).sort((a, b) => (a['Full Name'] || '').localeCompare(b['Full Name'] || '')))
      setEditingMember(null)
      showToast('Saved!')
    } catch (err) {
      console.error('Edit error:', err)
      showToast('Failed to save', 'error')
    } finally {
      setEditSaving(false)
    }
  }

  // Filter by search + attendance filter
  let filtered = search.trim()
    ? members.filter(m => (m['Full Name'] || '').toLowerCase().includes(search.toLowerCase()))
    : members

  // Counts based on search-filtered list (before attendance filter)
  const presentCount = filtered.filter(m => m[activeSunday] === 'Present').length
  const absentCount = filtered.filter(m => m[activeSunday] === 'Absent').length
  const unmarkedCount = filtered.length - presentCount - absentCount

  // Apply attendance filter after counting
  if (filterMode === 'present') filtered = filtered.filter(m => m[activeSunday] === 'Present')
  else if (filterMode === 'absent') filtered = filtered.filter(m => m[activeSunday] === 'Absent')

  const hasMore = filtered.length > visibleCount
  const visible = filtered.slice(0, visibleCount)

  return (
    <div className="min-h-screen text-gray-800" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflowY: 'auto', overscrollBehavior: 'auto', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', backgroundColor: '#f8f7f4', colorScheme: 'light' }}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-full text-sm font-medium shadow-lg ${
          toast.type === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-gray-800 text-white'
        }`}>
          {toast.type !== 'error' && <span className="mr-1.5">✓</span>}
          {toast.type === 'error' && <span className="mr-1.5">✗</span>}
          {toast.message}
        </div>
      )}

      {/* Top Bar - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-30 border-b shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e8e6e1' }}>
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold">February 2026</h1>
            <p className="text-xs text-gray-500">{members.length} members</p>
          </div>
        </div>

        {/* Sunday Tabs */}
        <div className="max-w-6xl mx-auto px-4 lg:px-8 pb-2 sm:pb-3 flex gap-1.5 sm:gap-2 lg:gap-3 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          {SUNDAYS.map(s => {
            const isActive = activeSunday === s.key
            const p = members.filter(m => m[s.key] === 'Present').length
            const a = members.filter(m => m[s.key] === 'Absent').length
            return (
              <button
                key={s.key}
                onClick={() => { setActiveSunday(s.key); setFilterMode('all'); setVisibleCount(20) }}
                className={`flex-shrink-0 px-3 sm:px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl text-xs sm:text-sm lg:text-base font-medium transition-all cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={!isActive ? { backgroundColor: '#f0eeea' } : {}}
              >
                {s.label}
                {(p > 0 || a > 0) && (
                  <span className="ml-1.5 text-xs opacity-80">
                    {p}✓ {a}✗
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Summary */}
        <div className="max-w-6xl mx-auto px-4 lg:px-8 pb-1.5 sm:pb-2 flex gap-3 sm:gap-4 text-[11px] sm:text-xs lg:text-sm">
          <button
            onClick={() => { setFilterMode(filterMode === 'present' ? 'all' : 'present'); setVisibleCount(20) }}
            className={`font-medium cursor-pointer transition-all px-2 py-0.5 rounded-lg ${filterMode === 'present' ? 'bg-green-100 ring-1 ring-green-400 text-green-700' : 'text-green-600'}`}
          >
            ✓ {presentCount} Present
          </button>
          <button
            onClick={() => { setFilterMode(filterMode === 'absent' ? 'all' : 'absent'); setVisibleCount(20) }}
            className={`font-medium cursor-pointer transition-all px-2 py-0.5 rounded-lg ${filterMode === 'absent' ? 'bg-red-100 ring-1 ring-red-400 text-red-700' : 'text-red-500'}`}
          >
            ✗ {absentCount} Absent
          </button>
          <span className="text-gray-400">○ {unmarkedCount}</span>
          {search && <span className="text-blue-500 ml-auto">{filtered.length} found</span>}
        </div>
      </div>

      {/* Members List - top padding for fixed header, bottom padding for sticky search bar */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-36 sm:pt-40 pb-24">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-20">
            <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {search ? 'No members match your search' : 'No members yet'}
            </p>
          </div>
        ) : (
          visible.map(member => {
            const status = member[activeSunday]
            const isPresent = status === 'Present'
            const isAbsent = status === 'Absent'
            const isSaving = saving[`${member.id}_${activeSunday}`]
            const isExpanded = expandedId === member.id

            return (
              <div
                key={member.id}
                className={`rounded-xl border transition-all ${
                  isPresent ? 'border-green-300' :
                  isAbsent ? 'border-red-300' :
                  'border-gray-200'
                }`}
                style={{ backgroundColor: '#ffffff' }}
              >
                {/* Main Row */}
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 lg:py-4">
                  {/* Status indicator */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    isPresent ? 'bg-green-500' : isAbsent ? 'bg-red-500' : 'bg-gray-300'
                  }`} />

                  {/* Name + info */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : member.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="font-medium text-sm lg:text-base truncate">{member['Full Name']}</p>
                    <p className="text-xs lg:text-sm text-gray-400 truncate">
                      {member['Gender'] || '—'} · {member['Age'] ? `${member['Age']}y` : '—'} · {member['Current Level'] || '—'}
                    </p>
                  </button>

                  {/* Edit button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(member) }}
                    className="p-1.5 lg:p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors flex-shrink-0 cursor-pointer"
                    title="Edit member"
                  >
                    <Pencil className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  </button>

                  {/* Present / Absent buttons */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => markAttendance(member.id, activeSunday, true)}
                      disabled={isSaving}
                      className={`min-w-[36px] sm:min-w-[40px] px-2.5 sm:px-3 lg:px-4 py-2 sm:py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
                        isPresent
                          ? 'bg-green-600 text-white ring-2 ring-green-300 shadow-md'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      } ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {isSaving ? '...' : 'P'}
                    </button>
                    <button
                      onClick={() => markAttendance(member.id, activeSunday, false)}
                      disabled={isSaving}
                      className={`min-w-[36px] sm:min-w-[40px] px-2.5 sm:px-3 lg:px-4 py-2 sm:py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
                        isAbsent
                          ? 'bg-red-600 text-white ring-2 ring-red-300 shadow-md'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      } ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {isSaving ? '...' : 'A'}
                    </button>
                  </div>
                </div>

                {/* Expanded: all Sundays */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2 font-medium">All Sundays:</p>
                    <div className="space-y-1.5">
                      {SUNDAYS.map(s => {
                        const val = member[s.key]
                        const p = val === 'Present'
                        const a = val === 'Absent'
                        const sKey = `${member.id}_${s.key}`
                        const isSav = saving[sKey]
                        return (
                          <div key={s.key} className="flex items-center rounded-lg px-3 py-2" style={{ backgroundColor: '#f5f3ef' }}>
                            <span className="text-xs font-medium text-gray-600 w-14">{s.label}</span>
                            <div className="flex gap-2 ml-auto">
                              <button
                                onClick={() => markAttendance(member.id, s.key, true)}
                                disabled={isSav}
                                className={`min-w-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  p ? 'bg-green-600 text-white shadow' : 'bg-green-100 text-green-700'
                                } ${isSav ? 'opacity-50' : ''}`}
                              >
                                P
                              </button>
                              <button
                                onClick={() => markAttendance(member.id, s.key, false)}
                                disabled={isSav}
                                className={`min-w-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  a ? 'bg-red-600 text-white shadow' : 'bg-red-100 text-red-700'
                                } ${isSav ? 'opacity-50' : ''}`}
                              >
                                A
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {member['Phone Number'] && (
                      <p className="text-xs text-gray-400 mt-2">📞 {member['Phone Number']}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
       </div>
       {hasMore && (
         <button
           onClick={() => setVisibleCount(prev => prev + 20)}
           className="w-full mt-3 py-3 rounded-xl text-sm font-medium text-blue-600 transition-all active:scale-[0.98] cursor-pointer"
           style={{ backgroundColor: '#eef0ff' }}
         >
           Show More ({filtered.length - visibleCount} remaining)
         </button>
       )}
      </div>

      {/* Sticky Search Bar + Add Button at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', backgroundColor: '#ffffff', borderTop: '1px solid #e8e6e1' }}>
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-3 flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={e => { setSearch(e.target.value); setVisibleCount(20) }}
              className="w-full pl-10 pr-4 py-2.5 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ backgroundColor: '#f0eeea' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setEditingMember(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit Member</h2>
              <button onClick={() => setEditingMember(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: '#f0eeea' }}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input
                    type="number"
                    value={editAge}
                    onChange={e => setEditAge(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: '#f0eeea' }}
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: '#f0eeea' }}
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Level</label>
                <ComboSelect
                  value={editLevel}
                  onChange={setEditLevel}
                  options={LEVELS}
                  placeholder="Type or select level..."
                />
              </div>
              <button
                onClick={saveEdit}
                disabled={editSaving || !editName.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors"
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold">Add Member</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: '#f0eeea' }}
                  placeholder="Enter full name"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <div className="flex gap-2">
                    {['Male', 'Female'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setAddGender(addGender === g ? '' : g)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          addGender === g
                            ? 'bg-blue-600 text-white ring-2 ring-blue-300 shadow-md'
                            : 'text-gray-600'
                        }`}
                        style={addGender !== g ? { backgroundColor: '#f0eeea' } : {}}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input
                    type="number"
                    value={addAge}
                    onChange={e => setAddAge(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: '#f0eeea' }}
                    placeholder="Age"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={addPhone}
                  onChange={e => setAddPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: '#f0eeea' }}
                  placeholder="0XX XXX XXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Level</label>
                <ComboSelect
                  value={addLevel}
                  onChange={setAddLevel}
                  options={LEVELS}
                  placeholder="Type or select level..."
                />
              </div>
              {/* Attendance for active Sunday */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {SUNDAYS.find(s => s.key === activeSunday)?.label} Attendance
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAddAttendance(addAttendance === true ? null : true)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      addAttendance === true
                        ? 'bg-green-600 text-white ring-2 ring-green-300 shadow-md'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    ✓ Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddAttendance(addAttendance === false ? null : false)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      addAttendance === false
                        ? 'bg-red-600 text-white ring-2 ring-red-300 shadow-md'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    ✗ Absent
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={addLoading || !addName.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors"
              >
                {addLoading ? 'Adding...' : 'Add Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
