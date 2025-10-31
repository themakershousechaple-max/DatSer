import React from 'react'
import { 
  Users, 
  BarChart3, 
  Download, 
  Shield, 
  Plus,
  Search,
  Calendar
} from 'lucide-react'

const Header = ({ currentView, setCurrentView, isAdmin, setIsAdmin, onAddMember, onCreateMonth }) => {
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
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">TMHT</h1>
              <p className="text-sm text-gray-500">The Master's Heart Tabernacle</p>
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
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onAddMember}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Member</span>
            </button>
            <button
              onClick={onCreateMonth}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              title="Create New Month"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden lg:inline">New Month</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-3 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex flex-col items-center space-y-1 p-2 rounded-lg text-xs font-medium transition-colors ${
                    currentView === item.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
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