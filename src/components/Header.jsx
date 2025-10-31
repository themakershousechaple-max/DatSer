import React from 'react'
import { 
  Users, 
  BarChart3, 
  Download, 
  Shield, 
  Plus,
  Calendar,
  Moon,
  Sun
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const Header = ({ currentView, setCurrentView, isAdmin, setIsAdmin, onAddMember, onCreateMonth }) => {
  const { isDarkMode, toggleTheme } = useTheme()
  
  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Users },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
  ]

  if (isAdmin) {
    navigation.push(
      { id: 'export', label: 'Monthly Export', icon: Download },
      { id: 'admin', label: 'Admin', icon: Shield }
    )
  } else {
    navigation.push({ id: 'admin', label: 'Login', icon: Shield })
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors duration-200">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between min-h-[60px] sm:min-h-[64px]">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white leading-tight">TMHT</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-tight truncate">The Master's Heart Tabernacle</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === item.id
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>



          {/* Action Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            
            <button
              onClick={onAddMember}
              className="flex items-center space-x-1 sm:space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add Member</span>
            </button>
            <button
              onClick={onCreateMonth}
              className="flex items-center space-x-1 sm:space-x-2 bg-green-600 hover:bg-green-700 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              title="Create New Month"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden lg:inline">New Month</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex flex-col items-center space-y-1 p-1.5 rounded-md text-xs font-medium transition-colors ${
                    currentView === item.id
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="leading-tight">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header