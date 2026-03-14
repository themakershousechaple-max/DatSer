import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Tag, Check, X, Loader2 } from 'lucide-react'

const TagSelector = ({ 
  ownerId, 
  memberId, 
  tableName, 
  currentTags = [], 
  onTagsChange,
  isDarkMode 
}) => {
  const [availableTags, setAvailableTags] = useState([])
  const [selectedTagIds, setSelectedTagIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load available tags
  useEffect(() => {
    if (ownerId) {
      fetchTags()
    }
  }, [ownerId])

  // Initialize selected tags
  useEffect(() => {
    setSelectedTagIds(new Set(currentTags.map(t => t.id)))
  }, [currentTags])

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase.rpc('get_workspace_tags', {
        p_owner_id: ownerId
      })

      if (error) throw error
      setAvailableTags(data || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = async (tagId) => {
    if (saving) return

    const isSelected = selectedTagIds.has(tagId)
    setSaving(true)

    try {
      if (isSelected) {
        // Remove tag
        const { error } = await supabase.rpc('remove_tag_from_member', {
          p_tag_id: tagId,
          p_member_id: memberId,
          p_table_name: tableName,
          p_owner_id: ownerId
        })
        if (error) throw error

        setSelectedTagIds(prev => {
          const next = new Set(prev)
          next.delete(tagId)
          return next
        })
      } else {
        // Add tag
        const { error } = await supabase.rpc('assign_tag_to_member', {
          p_tag_id: tagId,
          p_member_id: memberId,
          p_table_name: tableName,
          p_owner_id: ownerId
        })
        if (error) throw error

        setSelectedTagIds(prev => new Set(prev).add(tagId))
      }

      // Notify parent
      if (onTagsChange) {
        onTagsChange()
      }
    } catch (error) {
      console.error('Error toggling tag:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading tags...
      </div>
    )
  }

  if (availableTags.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No tags available. Create tags in the Admin Controls.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <Tag className="w-4 h-4 inline mr-1" />
        Tags
      </label>
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const isSelected = selectedTagIds.has(tag.id)
          return (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              disabled={saving}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isSelected 
                  ? 'ring-2 ring-offset-1' 
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{ 
                backgroundColor: tag.color + '20',
                color: tag.color,
                border: `1px solid ${tag.color}40`,
                ringColor: isSelected ? tag.color : 'transparent'
              }}
            >
              {isSelected && <Check className="w-3 h-3" />}
              {tag.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TagSelector
