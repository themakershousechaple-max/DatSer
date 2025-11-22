import React, { useState, useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Components
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import MemberModal from './components/MemberModal'
import MonthModal from './components/MonthModal'
import MonthlyExport from './components/MonthlyExport'
import AttendanceAnalytics from './components/AttendanceAnalytics'
import AdminAuth from './components/AdminAuth'
import AdminPanel from './components/AdminPanel'
import ErrorBoundary from './components/ErrorBoundary'

// Context
import { AppProvider } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [isAdmin, setIsAdmin] = useState(() => {
    // Check for existing admin session
    return localStorage.getItem('tmht_admin_session') === 'true'
  })
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showMonthModal, setShowMonthModal] = useState(false)
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
        <AppProvider>
        <div className={`min-app-vh bg-gray-50 dark:bg-gray-900 transition-colors duration-200 ios-overscroll-none ${isMobile ? 'mobile-toast-top' : ''}`}>
        <Header 
          currentView={currentView}
          setCurrentView={setCurrentView}
          isAdmin={isAdmin}
          setIsAdmin={setIsAdmin}
          onAddMember={() => setShowMemberModal(true)}
          onCreateMonth={() => setShowMonthModal(true)}
        />
        
        <main className="container mx-auto px-4 py-8 pt-36 md:pt-40">
          {currentView === 'dashboard' && (
            <Dashboard isAdmin={isAdmin} />
          )}
          
          
          {currentView === 'analytics' && (
            <AttendanceAnalytics />
          )}
          
          {currentView === 'export' && (
            <MonthlyExport />
          )}
          
          {currentView === 'admin' && !isAdmin && (
            <AdminAuth onLogin={setIsAdmin} />
          )}
          
          {currentView === 'admin' && isAdmin && (
            <AdminPanel 
              onLogout={() => {
                localStorage.removeItem('tmht_admin_session')
                setIsAdmin(false)
              }} 
            />
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
        </AppProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App