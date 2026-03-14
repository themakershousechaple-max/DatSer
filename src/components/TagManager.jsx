import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-toastify'
import { 
  Tag, 
  Plus, 
  X, 
  Edit3, 
  Trash2, 
  Check, 
  Palette,
  Users,
  Loader2
} from 'lucide-react'

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
]

const TagManager = ({ ownerId, isDarkMode, onTagsChange }) => {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [formData, setFormData] = useState({ name: '', color: '#6366f1' })
  const [saving, setSaving] = useState(false)

  // Fetch tags when component mounts
  useEffect(() => {
    if (ownerId) {
      fetchTags()
    }
  }, [ownerId])

  const fetchTags = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_workspace_tags', {
        p_owner_id: ownerId
      })

      if (error) throw error
      setTags(data || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
      toast.error('Failed to load tags')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Tag name is required')
      return
    }

    try {
      setSaving(true)

      if (editingTag) {
        // Update existing tag
        const { error } = await supabase.rpc('update_tag', {
          p_tag_id: editingTag.id,
          p_owner_id: ownerId,
          p_name: formData.name.trim(),
          p_color: formData.color
        })

        if (error) throw error
        toast.success('Tag updated successfully')
      } else {
        // Create new tag
        const { error } = await supabase.rpc('create_tag', {
          p_owner_id: ownerId,
          p_name: formData.name.trim(),
          p_color: formData.color
        })

        if (error) throw error
        toast.success('Tag created successfully')
      }

      // Reset form and refresh tags
      setFormData({ name: '', color: '#6366f1' })
      setShowForm(false)
      setEditingTag(null)
      await fetchTags()
      
      // Notify parent component
      if (onTagsChange) {
        onTagsChange()
      }
    } catch (error) {
      console.error('Error saving tag:', error)
      toast.error(error.message || 'Failed to save tag')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (tag) => {
    setEditingTag(tag)
    setFormData({ name: tag.name, color: tag.color })
    setShowForm(true)
  }

  const handleDelete = async (tagId) => {
    if (!confirm('Are you sure you want to delete this tag? This will remove it from all members.')) {
      return
    }

    try {
      const { error } = await supabase.rpc('delete_tag', {
        p_tag_id: tagId,
        p_owner_id: ownerId
      })

      if (error) throw error
      toast.success('Tag deleted successfully')
      await fetchTags()
      
      // Notify parent component
      if (onTagsChange) {
        onTagsChange()
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error('Failed to delete tag')
    }
  }

  const cancelForm = () => {
    setFormData({ name: '', color: '#6366f1' })
    setShowForm(false)
    setEditingTag(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading tags...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tag Management
          </h3>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Tag
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tag Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter tag name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Palette className="w-4 h-4 inline mr-1" />
                Tag Color
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      formData.color === color 
                        ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' 
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-8 h-8 rounded-full cursor-pointer border-0"
                  title="Custom color"
                />
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preview
              </label>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: formData.color + '20',
                  color: formData.color,
                  border: `1px solid ${formData.color}40`
                }}
              >
                <Tag className="w-3 h-3 mr-1" />
                {formData.name || 'Tag name'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingTag ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="flex items-center gap-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tags List */}
      {tags.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No tags created yet</p>
          <p className="text-sm mt-1">Create tags to organize and filter members</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  {tag.name}
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <Users className="w-3 h-3" />
                  {tag.member_count || 0}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(tag)}
                  className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Edit tag"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Delete tag"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        Tags can be assigned to members when editing their profile. Members can be filtered by tags in the dashboard.
      </p>
    </div>
  )
}

export default TagManager
