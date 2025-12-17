import React, { useState, useRef, useEffect } from 'react'
import { Rnd } from 'react-rnd'
import { useApp } from '../context/AppContext'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  ChevronRight,
  Minimize2,
  Maximize2,
  Volume2,
  ExternalLink,
  ArrowRightCircle
} from 'lucide-react'

// Extended FAQ Data with Actions
const getFaqKnowledge = (navigate) => [
  // Attendance
  {
    keywords: ['mark', 'present', 'absent', 'attendance', 'record'],
    category: 'attendance',
    answer: 'To mark attendance: Find the member on the Dashboard, then tap "Present" (green) or "Absent" (red) next to their name.',
    action: { label: 'Go to Dashboard', onClick: () => navigate('dashboard') }
  },
  { keywords: ['change', 'date', 'sunday', 'select date'], category: 'attendance', answer: 'To change the attendance date: Tap on the date displayed in the Dashboard header to open the date picker.' },
  { keywords: ['bulk', 'multiple', 'select all', 'group'], category: 'attendance', answer: 'To mark multiple members: Long-press a member to select, then tap others. Use the top buttons to mark all selected.' },

  // Members
  {
    keywords: ['add', 'new member', 'create member'],
    category: 'members',
    answer: 'To add a new member: Go to the Dashboard and tap the "+" button.',
    action: { label: 'Add Member', onClick: () => navigate('dashboard', { openModal: 'addMember' }) }
  },
  { keywords: ['edit', 'update', 'modify'], category: 'members', answer: 'To edit a member: Tap their name on the Dashboard to expand, then tap "Edit".' },

  // Navigation
  {
    keywords: ['admin', 'admin panel', 'settings'],
    category: 'navigation',
    answer: 'The Admin Panel provides advanced settings and reports.',
    action: { label: 'Open Admin Panel', onClick: () => navigate('admin') }
  },
  {
    keywords: ['analytics', 'stats', 'report'],
    category: 'analytics',
    answer: 'The Analytics view shows attendance trends over time.',
    action: { label: 'View Analytics', onClick: () => navigate('analytics') }
  },

  // General
  { keywords: ['hello', 'hi', 'hey'], category: 'greeting', answer: 'Hello! 👋 I\'m your TMH Assistant. I can help you navigate the app or answer questions. Try asking "How to mark attendance?" or "Open Admin Panel".' },
]

const suggestedQuestions = [
  'How do I mark attendance?',
  'Add a new member',
  'Go to Admin Panel',
  'Show Analytics',
  'What is this app?'
]

const AIChatAssistant = ({ isOpen, onClose, onNavigate }) => {
  const { setDashboardTab, setAndSaveAttendanceDate } = useApp()

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hi! 👋 I\'m your TMH Assistant. You can ask me questions, or tell me to go somewhere (e.g., "Go to Admin"). I can also read answers aloud!',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Speech Synthesis
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() // Stop previous
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Enhanced navigate wrapper
  const handleNavigate = (view, options) => {
    if (onNavigate) onNavigate(view, options)
    // If specific tab requested
    if (view === 'dashboard' && options?.tab) {
      setDashboardTab(options.tab)
    }
  }

  // Find Answer Logic
  const findAnswer = (question) => {
    const questionLower = question.toLowerCase()
    const words = questionLower.split(/\s+/)

    // Check for direct navigation commands
    if (questionLower.includes('go to') || questionLower.includes('open')) {
      if (questionLower.includes('admin')) return { text: 'Opening Admin Panel...', action: { label: 'Open Admin', onClick: () => handleNavigate('admin') } }
      if (questionLower.includes('dashboard') || questionLower.includes('home')) return { text: 'Taking you to Dashboard...', action: { label: 'Go to Dashboard', onClick: () => handleNavigate('dashboard') } }
      if (questionLower.includes('analytics')) return { text: 'Opening Analytics...', action: { label: 'View Analytics', onClick: () => handleNavigate('analytics') } }
      if (questionLower.includes('settings')) return { text: 'Opening Settings...', action: { label: 'Open Settings', onClick: () => handleNavigate('settings') } }
    }

    const education = getFaqKnowledge(handleNavigate)
    let bestMatch = null
    let bestScore = 0

    for (const faq of education) {
      let score = 0
      for (const keyword of faq.keywords) {
        if (questionLower.includes(keyword.toLowerCase())) {
          score += keyword.length
        }
        for (const word of words) {
          if (keyword.toLowerCase().includes(word) && word.length > 2) {
            score += 1
          }
        }
      }
      if (score > bestScore) {
        bestScore = score
        bestMatch = faq
      }
    }

    if (bestScore >= 3 && bestMatch) {
      return { text: bestMatch.answer, action: bestMatch.action }
    }

    return {
      text: "I'm not sure about that. Try asking to 'Go to Admin' or 'How to mark attendance'.",
      action: null
    }
  }

  const handleSend = () => {
    if (!inputValue.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI delay
    setTimeout(() => {
      const response = findAnswer(userMessage.text)
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: response.text,
        action: response.action,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)

      // Auto-speak usage tip occasionally? No, potentially annoying.
    }, 600)
  }

  const handleQuickQuestion = (question) => {
    setInputValue(question)
    setTimeout(() => handleSend(), 100)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  // Calculate default position (bottom right, but with margin)
  // Note: react-rnd handles absolute positioning
  // We use a safe check for window to avoid SSR issues if any, though this is SPA
  const defaultPosition = {
    x: typeof window !== 'undefined' && window.innerWidth - 420 > 0 ? window.innerWidth - 420 : 20,
    y: typeof window !== 'undefined' && window.innerHeight - 600 > 0 ? window.innerHeight - 600 : 80
  }

  return (
    <Rnd
      default={{
        x: defaultPosition.x,
        y: defaultPosition.y,
        width: 380,
        height: 550
      }}
      minWidth={300}
      minHeight={400}
      bounds="window"
      className="z-50 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      dragHandleClassName="chat-header"
      enableResizing={{
        top: false, right: true, bottom: true, left: true,
        topRight: false, bottomRight: true, bottomLeft: true, topLeft: true
      }}
    >
      {/* Header - Draggable */}
      <div className="chat-header bg-gradient-to-r from-blue-500 to-purple-600 p-4 flex items-center justify-between cursor-move select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">TMH Assistant</h3>
            <p className="text-[10px] text-white/70">Drag to move • Resize corners</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
            title="Close"
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag on close click
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {messages.map((message) => (
          <div key={message.id} className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex gap-2 max-w-[90%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900'
                }`}>
                {message.type === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${message.type === 'user'
                  ? 'bg-blue-500 text-white rounded-tr-none'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'
                }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>

                {/* Action Button (Bot Only) */}
                {message.action && (
                  <button
                    onClick={message.action.onClick}
                    className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors w-full"
                  >
                    <ArrowRightCircle className="w-3.5 h-3.5" />
                    {message.action.label}
                  </button>
                )}
              </div>
            </div>

            {/* Speak Button (Bot Only) */}
            {message.type === 'bot' && (
              <button
                onClick={() => speak(message.text)}
                className="ml-11 mt-1 text-gray-400 hover:text-purple-500 transition-colors p-1"
                title="Read aloud"
              >
                <Volume2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2 items-center ml-1">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-full">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips */}
      {messages.length < 4 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleQuickQuestion(q)}
                className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300 hover:border-purple-400 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AI or say 'Go to...'"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-200 dark:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Rnd>
  )
}

export default AIChatAssistant
