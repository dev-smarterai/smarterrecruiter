"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

// Base inline editable text component
interface InlineEditableTextProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
  className?: string
  isRecentlyUpdated?: boolean
  onSave?: (value: string) => void
}

export function InlineEditableText({ 
  value, 
  onChange, 
  placeholder = "Click to edit...", 
  multiline = false,
  className = "",
  isRecentlyUpdated = false,
  onSave
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (multiline) {
        // Auto-resize textarea
        const textarea = inputRef.current as HTMLTextAreaElement
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
      }
    }
  }, [isEditing, multiline])

  const handleSave = () => {
    onChange(editValue)
    if (onSave) {
      onSave(editValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Enter' && multiline && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input'
    return (
      <InputComponent
        ref={inputRef as any}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none",
          className
        )}
        style={multiline ? { minHeight: '60px' } : {}}
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-opacity-80 transition-all duration-200 rounded px-1 py-0.5 -mx-1 -my-0.5",
        isRecentlyUpdated && "animate-pulse bg-blue-100",
        !value && "text-gray-400 italic",
        className
      )}
      title="Click to edit"
    >
      {value || placeholder}
    </div>
  )
}

// Inline editable list component
interface InlineEditableListProps {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  bulletColor?: string
  className?: string
  isRecentlyUpdated?: boolean
  onSave?: (items: string[]) => void
}

export function InlineEditableList({ 
  items, 
  onChange, 
  placeholder = "Click to add items...",
  bulletColor = "text-blue-500",
  className = "",
  isRecentlyUpdated = false,
  onSave
}: InlineEditableListProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(items.join('\n'))
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(items.join('\n'))
  }, [items])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [isEditing])

  const handleSave = () => {
    const newItems = editValue
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0)
    
    onChange(newItems)
    if (onSave) {
      onSave(newItems)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(items.join('\n'))
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder="Enter each item on a new line... (Shift+Enter for new line, Enter to save)"
        className={cn(
          "w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none",
          className
        )}
        style={{ minHeight: '80px' }}
      />
    )
  }

  const displayItems = items.filter(item => item.trim().length > 0)

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-opacity-80 transition-all duration-200 rounded px-1 py-0.5 -mx-1 -my-0.5",
        isRecentlyUpdated && "animate-pulse bg-blue-100",
        className
      )}
      title="Click to edit"
    >
      {displayItems.length > 0 ? (
        <ul className="space-y-1">
          {displayItems.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className={cn(bulletColor, "mr-1 text-xs")}>•</span>
              <span className="text-gray-600 text-xs">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-gray-400 italic text-xs">{placeholder}</span>
      )}
    </div>
  )
}

// Inline editable skills component
interface InlineEditableSkillsProps {
  skills: string[]
  onChange: (skills: string[]) => void
  placeholder?: string
  className?: string
  isRecentlyUpdated?: boolean
  onSave?: (skills: string[]) => void
}

export function InlineEditableSkills({ 
  skills, 
  onChange, 
  placeholder = "Click to add skills...",
  className = "",
  isRecentlyUpdated = false,
  onSave
}: InlineEditableSkillsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(skills.join(', '))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(skills.join(', '))
  }, [skills])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    const newSkills = editValue
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)
    
    onChange(newSkills)
    if (onSave) {
      onSave(newSkills)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(skills.join(', '))
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder="Enter skills separated by commas..."
        className={cn(
          "w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          className
        )}
      />
    )
  }

  const displaySkills = skills.filter(skill => skill.trim().length > 0)

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-opacity-80 transition-all duration-200 rounded px-1 py-0.5 -mx-1 -my-0.5",
        isRecentlyUpdated && "animate-pulse bg-blue-100",
        className
      )}
      title="Click to edit"
    >
      {displaySkills.length > 0 ? (
        <ul className="space-y-1">
          {displaySkills.map((skill, index) => (
            <li key={index} className="flex items-start">
              <span className="text-yellow-500 mr-1 text-xs">•</span>
              <span className="text-gray-600 text-xs">{skill}</span>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-gray-400 italic text-xs">{placeholder}</span>
      )}
    </div>
  )
}

// Inline editable select component
interface InlineEditableSelectProps {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  isRecentlyUpdated?: boolean
  onSave?: (value: string) => void
}

export function InlineEditableSelect({ 
  value, 
  options,
  onChange, 
  placeholder = "Click to select...",
  className = "",
  isRecentlyUpdated = false,
  onSave
}: InlineEditableSelectProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    onChange(editValue)
    if (onSave) {
      onSave(editValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <select
        ref={selectRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          className
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  const selectedOption = options.find(opt => opt.value === value)
  const displayValue = selectedOption?.label || value

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-opacity-80 transition-all duration-200 rounded px-1 py-0.5 -mx-1 -my-0.5",
        isRecentlyUpdated && "animate-pulse bg-blue-100",
        !value && "text-gray-400 italic",
        className
      )}
      title="Click to edit"
    >
      {displayValue || placeholder}
    </div>
  )
} 