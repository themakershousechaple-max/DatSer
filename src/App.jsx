import React, { useState, useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Components
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import MemberModal from './components/MemberModal'
import AttendanceAnalytics from './components/AttendanceAnalytics'
import AdminAuth from './components/AdminAuth'
import AdminPanel from './components/AdminPanel'
import ErrorBoundary from './components/ErrorBoundary'
import LoginPage from './components/LoginPage'
import DecemberQuickView from './components/DecemberQuickView'
import WorkspaceSettingsModal from './components/WorkspaceSettingsModal'
import DeleteAccountModal from './components/DeleteAccountModal'
import ExportDataModal from './components/ExportDataModal'
import SettingsPage from './components/SettingsPage'
import OnboardingWizard from './components/OnboardingWizard'
import MonthModal from './components/MonthModal'
import AIChatAssistant from './components/AIChatAssistant'

// Context
import { AppProvider, useApp } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'

// Main app content - only shown when authenticated
function AppContent({ isMobile }) {

  const { preferences } = useAuth()
  const { members, loading: appLoading } = useApp()
  const [currentView, setCurrentView] = useState('dashboard')
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('tmht_admin_session') === 'true'
  })
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showMonthModal, setShowMonthModal] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)

  // Onboarding wizard for new users
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingAutoChecked, setOnboardingAutoChecked] = useState(false)

  // Global modals - accessible from profile dropdown anywhere
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [showExportData, setShowExportData] = useState(false)

  // Handle navigation from onboarding wizard
  const handleOnboardingNavigate = (view, options) => {
    setCurrentView(view)
    if (options?.openModal === 'addMember') {
      setTimeout(() => setShowMemberModal(true), 100)
    }
  }

  // Expose modal openers globally via window for profile dropdown
  useEffect(() => {
    window.openWorkspaceSettings = () => setShowWorkspaceSettings(true)
    window.openDeleteAccount = () => setShowDeleteAccount(true)
    window.openExportData = () => setShowExportData(true)
    window.openSettings = () => setCurrentView('settings')
    window.openOnboarding = () => setShowOnboarding(true)
    return () => {
      delete window.openWorkspaceSettings
      delete window.openDeleteAccount
      delete window.openExportData
      delete window.openSettings
      delete window.openOnboarding
    }
  }, [])

  // Auto-show onboarding only for new users without data/workspace
  useEffect(() => {
    if (appLoading || onboardingAutoChecked) return
    const onboardingComplete = localStorage.getItem('onboardingComplete')
    const hasWorkspace = !!preferences?.workspace_name
    const hasMembers = (members?.length || 0) > 0
    const shouldShow = !onboardingComplete && (!hasWorkspace || !hasMembers)
    setShowOnboarding(shouldShow)
    setOnboardingAutoChecked(true)
  }, [appLoading, onboardingAutoChecked, members, preferences])

  return (
    <div className={`min-app-vh bg-gray-50 dark:bg-gray-900 transition-colors duration-200 ios-overscroll-none ${isMobile ? 'mobile-toast-top' : ''}`}>
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        onAddMember={() => setShowMemberModal(true)}
        onCreateMonth={() => setShowMonthModal(true)}
        onToggleAIChat={() => setShowAIChat(prev => !prev)}
      />

      <main className={`container mx-auto px-4 py-8 pt-28 sm:pt-24 md:pt-20`}>
        {currentView === 'dashboard' && (
          <Dashboard isAdmin={isAdmin} />
        )}

        {currentView === 'analytics' && (
          <AttendanceAnalytics />
        )}

        {currentView === 'admin' && (
          <AdminPanel
            setCurrentView={setCurrentView}
            onLogout={() => {
              localStorage.removeItem('tmht_admin_session')
              setIsAdmin(false)
              setCurrentView('dashboard')
            }}
          />
        )}

        {currentView === 'settings' && (
          <SettingsPage onBack={() => setCurrentView('dashboard')} />
        )}
      </main>

      {showMemberModal && (
        <MemberModal
          isOpen={showMemberModal}
          onClose={() => setShowMemberModal(false)}
        />
      )}

      {showMonthModal && (
        <MonthModal
          isOpen={showMonthModal}
          onClose={() => setShowMonthModal(false)}
        />
      )}

      {/* Global Modals - accessible from profile dropdown */}
      <WorkspaceSettingsModal
        isOpen={showWorkspaceSettings}
        onClose={() => setShowWorkspaceSettings(false)}
      />

      <DeleteAccountModal
        isOpen={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
      />

      <ExportDataModal
        isOpen={showExportData}
        onClose={() => setShowExportData(false)}
      />

      {/* Onboarding Wizard for new users */}
      <OnboardingWizard
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onNavigate={handleOnboardingNavigate}
      />

      {/* AI Chat Assistant */}
      <AIChatAssistant
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
      />

      <ToastContainer
        position={isMobile ? 'top-center' : 'bottom-right'}
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={isMobile
          ? { top: 'calc(env(safe-area-inset-top) + 8px)' }
          : { bottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
      />
    </div>
  )
}

// Auth wrapper - shows login or app based on auth state
function AuthenticatedApp({ isMobile }) {
  const { isAuthenticated, loading } = useAuth()

  // Show loading spinner while checking auth
  if (loading) {

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated -> show login page
  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <AppProvider>
      <AppContent isMobile={isMobile} />
    </AppProvider>
  )
}

function App() {
  const [isMobile, setIsMobile] = useState(false)

  // iOS keyboard-aware offset and robust mobile detection
  useEffect(() => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (isIOS) {
      document.documentElement.classList.add('is-ios')
    }

    // Mobile detection via UA + input modality + viewport width
    const coarseMedia = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null
    const widthMedia = window.matchMedia ? window.matchMedia('(max-width: 768px)') : null
    const uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    const computeMobile = () => uaMobile || (coarseMedia?.matches ?? false) || (widthMedia?.matches ?? false)
    setIsMobile(computeMobile())

    const onMediaChange = () => setIsMobile(computeMobile())
    coarseMedia?.addEventListener('change', onMediaChange)
    widthMedia?.addEventListener('change', onMediaChange)

    // Keyboard offset for iOS
    const vv = window.visualViewport
    const applyOffset = () => {
      if (!vv) return
      // Use full difference between layout viewport and visual viewport height.
      // This closely matches keyboard height across iOS Safari and Android Chrome.
      const diff = Math.max(0, window.innerHeight - vv.height)
      document.documentElement.style.setProperty('--keyboard-offset', `${diff}px`)
    }
    vv?.addEventListener('resize', applyOffset)
    vv?.addEventListener('scroll', applyOffset)
    applyOffset()

    return () => {
      vv?.removeEventListener('resize', applyOffset)
      vv?.removeEventListener('scroll', applyOffset)
      coarseMedia?.removeEventListener('change', onMediaChange)
      widthMedia?.removeEventListener('change', onMediaChange)
    }
  }, [])

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <AuthenticatedApp isMobile={isMobile} />
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
