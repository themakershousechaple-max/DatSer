import React, { useState, useMemo } from 'react'
import {
    Search,
    ChevronDown,
    ChevronRight,
    ArrowLeft,
    HelpCircle,
    Users,
    Calendar,
    BarChart3,
    Settings,
    Play,
    ExternalLink,
    Sparkles,
    CheckCircle2,
    UserPlus,
    Edit3,
    Trash2,
    CalendarCheck,
    Filter,
    Download
} from 'lucide-react'

// FAQ Data organized by category
const faqData = [
    // Attendance Category
    {
        id: 1,
        category: 'attendance',
        question: 'How do I mark someone as present or absent?',
        answer: 'On the Dashboard, find the member you want to mark. You\'ll see "Present" (green) and "Absent" (red) buttons next to their name. Simply tap the appropriate button to record their attendance for the selected date.',
        quickAction: { type: 'navigate', label: 'Go to Dashboard', target: 'dashboard' },
        hasVideo: true
    },
    {
        id: 2,
        category: 'attendance',
        question: 'How do I change the attendance date?',
        answer: 'In the Dashboard header, you\'ll see the current date displayed. Tap on it to open the date picker, then select the Sunday you want to record attendance for. All attendance actions will apply to this selected date.',
        quickAction: { type: 'navigate', label: 'Go to Dashboard', target: 'dashboard' },
        hasVideo: true
    },
    {
        id: 3,
        category: 'attendance',
        question: 'Can I mark attendance for multiple people at once?',
        answer: 'Yes! Long-press on any member to enter selection mode. You\'ll see a green highlight appear. Then tap other members to select them. Once you\'ve selected everyone, use the "Present" or "Absent" buttons at the top to mark them all at once.',
        quickAction: null,
        hasVideo: true
    },
    {
        id: 4,
        category: 'attendance',
        question: 'What happens if I mark the wrong attendance?',
        answer: 'No worries! Just tap the opposite button to change it. For example, if you marked someone as Present but meant Absent, simply tap the "Absent" button to correct it. The change is saved immediately.',
        quickAction: null,
        hasVideo: false
    },

    // Members Category
    {
        id: 5,
        category: 'members',
        question: 'How do I add a new member?',
        answer: 'Go to the Dashboard and tap the "+" button or "Add Member" option from the menu. Fill in the member\'s name, gender, phone number, age, and current level. You can also assign tags like "Member", "Regular", or "Newcomer".',
        quickAction: { type: 'action', label: 'Add New Member', action: 'openAddMember' },
        hasVideo: true
    },
    {
        id: 6,
        category: 'members',
        question: 'How do I edit a member\'s information?',
        answer: 'Find the member on the Dashboard and tap their name to expand their card. You\'ll see an "Edit" button which opens the Edit Member modal. Here you can update their name, phone number, gender, age, level, and attendance records.',
        quickAction: { type: 'navigate', label: 'Go to Dashboard', target: 'dashboard' },
        hasVideo: true
    },
    {
        id: 7,
        category: 'members',
        question: 'How do I delete a member?',
        answer: 'Expand the member\'s card by tapping their name, then tap the "Delete" button (trash icon). You\'ll be asked to confirm before the member is permanently removed. Be careful - this action cannot be undone!',
        quickAction: null,
        hasVideo: false
    },
    {
        id: 8,
        category: 'members',
        question: 'What are member badges/tags?',
        answer: 'Badges help you categorize members. "Member" (blue) indicates official members, "Regular" (green) means they attend consistently, and "Newcomer" (amber) is for new attendees. You can filter by these badges using the filter options.',
        quickAction: null,
        hasVideo: false
    },

    // Navigation Category
    {
        id: 9,
        category: 'navigation',
        question: 'How do I switch between months?',
        answer: 'Look at the info bar below the search. You\'ll see the current month (e.g., "January 2025"). Tap on it to open the Month Picker popup. Select the month you want to view, and the data will update automatically.',
        quickAction: { type: 'action', label: 'Open Month Picker', action: 'openMonthPicker' },
        hasVideo: true
    },
    {
        id: 10,
        category: 'navigation',
        question: 'What is the difference between "All" and "Edited" tabs?',
        answer: '"All" shows every member in the database. "Edited" shows only members who have attendance recorded for any Sunday in the current month. Use "Edited" to quickly see who has been marked this month.',
        quickAction: null,
        hasVideo: false
    },
    {
        id: 11,
        category: 'navigation',
        question: 'How do I search for a member?',
        answer: 'Use the search bar at the top of the Dashboard. Type any part of the member\'s name and the list will filter in real-time. The search is case-insensitive and matches partial names.',
        quickAction: { type: 'navigate', label: 'Go to Dashboard', target: 'dashboard' },
        hasVideo: false
    },

    // Reports Category
    {
        id: 12,
        category: 'reports',
        question: 'How do I see attendance statistics?',
        answer: 'Go to the "Edited" tab to see members with attendance this month. Each member\'s card shows their attendance count. For detailed analytics, check the Statistics section in Settings.',
        quickAction: { type: 'navigate', label: 'View Edited Tab', target: 'edited' },
        hasVideo: true
    },
    {
        id: 13,
        category: 'reports',
        question: 'Can I export attendance data?',
        answer: 'Currently, attendance data is stored in your Supabase database. You can access and export it directly from your Supabase dashboard. Go to Table Editor, select your month\'s table, and use the export function.',
        quickAction: null,
        hasVideo: false
    },
    {
        id: 14,
        category: 'reports',
        question: 'How do I see who was absent on a specific Sunday?',
        answer: 'Select the date you want to check using the date picker. Then look at the "Edited" tab - members marked as Absent will have a red indicator. You can also use the filter to show only absent members.',
        quickAction: null,
        hasVideo: false
    },

    // Settings Category
    {
        id: 15,
        category: 'settings',
        question: 'How do I change my profile photo?',
        answer: 'Go to Settings and tap on your profile photo or the camera icon. You can either upload a photo from your device or choose an emoji as your avatar. Crop and adjust as needed, then save.',
        quickAction: { type: 'navigate', label: 'Go to Settings', target: 'settings' },
        hasVideo: true
    },
    {
        id: 16,
        category: 'settings',
        question: 'How do I switch between light and dark mode?',
        answer: 'The app automatically follows your device\'s system theme. To change it, adjust your device\'s display settings to Light or Dark mode, and the app will update accordingly.',
        quickAction: null,
        hasVideo: false
    },
    {
        id: 17,
        category: 'settings',
        question: 'How do I create a new month table?',
        answer: 'In Settings, look for "Create New Month" option. This creates a fresh table for a new month while keeping all your members. Attendance data starts fresh for the new month.',
        quickAction: { type: 'navigate', label: 'Go to Settings', target: 'settings' },
        hasVideo: true
    },
    {
        id: 18,
        category: 'settings',
        question: 'How do I sign out?',
        answer: 'Tap on your profile photo in the header to open the profile menu. At the bottom, you\'ll see a red "Sign Out" button. Tap it to log out of your account.',
        quickAction: null,
        hasVideo: false
    }
]

const categories = [
    { id: 'all', label: 'All', icon: HelpCircle },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'navigation', label: 'Navigation', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
]

const getCategoryIcon = (categoryId) => {
    switch (categoryId) {
        case 'attendance': return CalendarCheck
        case 'members': return Users
        case 'navigation': return Calendar
        case 'reports': return BarChart3
        case 'settings': return Settings
        default: return HelpCircle
    }
}

const HelpCenterPage = ({ onBack, onNavigate }) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [expandedQuestions, setExpandedQuestions] = useState(new Set())

    // Filter FAQs based on search and category
    const filteredFaqs = useMemo(() => {
        return faqData.filter(faq => {
            const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
            const matchesSearch = searchQuery === '' ||
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesCategory && matchesSearch
        })
    }, [searchQuery, selectedCategory])

    const toggleQuestion = (id) => {
        setExpandedQuestions(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    const handleQuickAction = (action) => {
        if (!action) return

        if (action.type === 'navigate') {
            onNavigate?.(action.target)
        } else if (action.type === 'action') {
            // Handle specific actions
            if (action.action === 'openAddMember') {
                onNavigate?.('dashboard', { openModal: 'addMember' })
            } else if (action.action === 'openMonthPicker') {
                onNavigate?.('dashboard', { openModal: 'monthPicker' })
            }
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors btn-press"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <HelpCircle className="w-6 h-6 text-blue-500" />
                                Help Center
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Find answers to common questions
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Search Bar */}
                <div className="relative animate-fade-in-up">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all input-focus"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                    {categories.map((cat) => {
                        const Icon = cat.icon
                        const isActive = selectedCategory === cat.id
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all btn-press ${isActive
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {cat.label}
                            </button>
                        )
                    })}
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between text-sm animate-fade-in">
                    <span className="text-gray-500 dark:text-gray-400">
                        {filteredFaqs.length} {filteredFaqs.length === 1 ? 'question' : 'questions'} found
                    </span>
                    {searchQuery && (
                        <span className="text-blue-500">
                            Searching for "{searchQuery}"
                        </span>
                    )}
                </div>

                {/* FAQ List */}
                <div className="space-y-3">
                    {filteredFaqs.map((faq, index) => {
                        const isExpanded = expandedQuestions.has(faq.id)
                        const CategoryIcon = getCategoryIcon(faq.category)

                        return (
                            <div
                                key={faq.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all card-hover animate-fade-in-up"
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                {/* Question Header */}
                                <button
                                    onClick={() => toggleQuestion(faq.id)}
                                    className="w-full flex items-start gap-4 p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                >
                                    <div className={`p-2 rounded-xl flex-shrink-0 ${isExpanded
                                        ? 'bg-blue-100 dark:bg-blue-900/30'
                                        : 'bg-gray-100 dark:bg-gray-700'
                                        }`}>
                                        <CategoryIcon className={`w-5 h-5 ${isExpanded
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-gray-500 dark:text-gray-400'
                                            }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 dark:text-white text-left">
                                            {faq.question}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1 capitalize">
                                            {faq.category}
                                        </p>
                                    </div>
                                    <div className={`p-1 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    </div>
                                </button>

                                {/* Answer Content */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-0 animate-fade-in">
                                        <div className="pl-14 space-y-4">
                                            {/* Answer Text */}
                                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                                {faq.answer}
                                            </p>

                                            {/* Video Placeholder */}
                                            {faq.hasVideo && (
                                                <div className="relative overflow-hidden rounded-xl aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                                                    {/* Blurred Background */}
                                                    <div className="absolute inset-0 backdrop-blur-sm bg-gray-900/30 flex flex-col items-center justify-center gap-3">
                                                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                                            <Play className="w-8 h-8 text-white ml-1" />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-white font-medium text-sm">Video Tutorial</p>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                                                <span className="text-xs text-white/80">Coming Soon</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Decorative Elements */}
                                                    <div className="absolute top-4 left-4 w-20 h-3 bg-white/20 rounded-full" />
                                                    <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-lg" />
                                                    <div className="absolute bottom-4 left-4 right-4 h-2 bg-white/20 rounded-full" />
                                                </div>
                                            )}

                                            {/* Quick Action Button */}
                                            {faq.quickAction && (
                                                <button
                                                    onClick={() => handleQuickAction(faq.quickAction)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors btn-press"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    {faq.quickAction.label}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* No Results */}
                {filteredFaqs.length === 0 && (
                    <div className="text-center py-16 animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No questions found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                            Try adjusting your search or browse a different category
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery('')
                                setSelectedCategory('all')
                            }}
                            className="mt-4 px-4 py-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-sm font-medium transition-colors btn-press"
                        >
                            Clear filters
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700 mt-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Can't find what you're looking for?
                    </p>
                    <div className="flex items-center justify-center gap-2 text-blue-500">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">More help coming soon</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HelpCenterPage
