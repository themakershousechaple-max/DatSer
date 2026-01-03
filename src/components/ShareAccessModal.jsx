import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { X, UserPlus, Mail, Trash2, Users, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-toastify'
import { supabase } from '../lib/supabase'

const ShareAccessModal = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const { isDarkMode } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collaborators, setCollaborators] = useState([])
  const [fetchingCollaborators, setFetchingCollaborators] = useState(false)
  const [error, setError] = useState('')

  // Fetch existing collaborators when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchCollaborators()
    }
  }, [isOpen, user])

  const fetchCollaborators = async () => {
    if (!user) return
    
    setFetchingCollaborators(true)
    setError('')
    
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCollaborators(data || [])
    } catch (err) {
      console.error('Error fetching collaborators:', err)
      setError('Failed to load collaborators')
    } finally {
      setFetchingCollaborators(false)
    }
  }

  const handleAddCollaborator = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    // Password validation
    if (!password.trim() || password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    // Check if already added
    if (collaborators.some(c => c.email.toLowerCase() === email.trim().toLowerCase())) {
      toast.warning('This email has already been added')
      return
    }

    setLoading(true)
    setError('')

    try {
      const collaboratorEmail = email.trim().toLowerCase()
      
      // First, create the auth user via Edge Function (email = password)
      const { data: { session } } = await supabase.auth.getSession()
      try {
        const createUserResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-collaborator-user`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ 
              email: collaboratorEmail, 
              password: password.trim(),
              appUrl: window.location.origin + '/DatSer/'
            })
          }
        )
        
        const createUserResult = await createUserResponse.json()
        console.log('Edge function response:', createUserResponse.status, createUserResult)
        if (!createUserResponse.ok) {
          console.error('Edge function error:', createUserResult.error)
          toast.error(`Failed to create user: ${createUserResult.error || 'Unknown error'}`)
          setLoading(false)
          return
        }
        if (createUserResult.error) {
          console.warn('Could not create auth user:', createUserResult.error)
          toast.error(`Failed to create user: ${createUserResult.error}`)
          setLoading(false)
          return
        } else if (createUserResult.alreadyExists) {
          console.log('User already exists in auth, password updated')
        } else {
          console.log('Auth user created successfully:', createUserResult.userId)
        }
        
        // Log magic link for debugging (in production, this would be emailed)
        if (createUserResult.magicLink) {
          console.log('Magic link generated (backup login method):', createUserResult.magicLink)
        }
      } catch (createUserErr) {
        console.warn('Could not create auth user:', createUserErr)
        toast.error('Failed to create user account')
        setLoading(false)
        return
      }

      // Add to collaborators table
      const { data, error } = await supabase
        .from('collaborators')
        .insert([
          {
            owner_id: user.id,
            email: collaboratorEmail,
            status: 'pending'
          }
        ])
        .select()
        .single()

      if (error) throw error

      // Send invitation email via Edge Function
      const appUrl = window.location.origin + '/DatSer/'
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-collaborator-invite`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({
              email: collaboratorEmail,
              inviterName: user.email,
              appUrl: appUrl
            })
          }
        )
        
        const result = await response.json()
        if (result.success) {
          toast.success(`Invitation sent to ${email}! They can login with their email as password.`)
        } else if (result.error) {
          console.warn('Email sending failed:', result.error)
          toast.success(`Collaborator added! They can login with their email as password.`)
        }
      } catch (emailErr) {
        console.warn('Could not send invitation email:', emailErr)
        toast.success(`Collaborator added! They can login with their email as password.`)
      }

      setCollaborators(prev => [data, ...prev])
      setEmail('')
      setPassword('')
    } catch (err) {
      console.error('Error adding collaborator:', err)
      if (err.code === '23505') {
        toast.error('This email has already been invited')
      } else {
        toast.error('Failed to add collaborator. Please try again.')
      }
      setError('Failed to add collaborator')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCollaborator = async (collaboratorId, collaboratorEmail) => {
    try {
      const { error } = await supabase
        .from('collaborators')
        .delete()
        .eq('id', collaboratorId)
        .eq('owner_id', user.id)

      if (error) throw error

      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId))
      toast.success(`Removed ${collaboratorEmail}`)
    } catch (err) {
      console.error('Error removing collaborator:', err)
      toast.error('Failed to remove collaborator')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            Accepted
          </span>
        )
      case 'rejected':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            Rejected
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            Pending
          </span>
        )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="shadow-2xl ring-1 max-w-md w-full mx-4 max-h-[90vh] flex flex-col transition-all duration-300 bg-white dark:bg-gray-800 ring-gray-200 dark:ring-gray-700 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Share Access</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add people by email to give them access to your database. They'll be able to view and edit all data.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Add Collaborator Form */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add collaborator
            </label>
            <form onSubmit={handleAddCollaborator} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set password for this user"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                {loading ? 'Adding...' : 'Add Collaborator'}
              </button>
            </form>
          </div>

          {/* Collaborators List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <Users className="w-4 h-4 inline mr-1.5" />
                People with access ({collaborators.length})
              </label>
            </div>

            {fetchingCollaborators ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No collaborators yet</p>
                <p className="text-xs mt-1">Add someone using the form above</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {collaborator.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {collaborator.email}
                        </p>
                        <div className="flex items-center space-x-2 mt-0.5">
                          {getStatusBadge(collaborator.status)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCollaborator(collaborator.id, collaborator.email)}
                      className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove collaborator"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareAccessModal
