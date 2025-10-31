import React, { useState, useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Components
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import MemberModal from './components/MemberModal'
import MonthModal from './components/MonthModal'
import MonthlyExport from './components/MonthlyExport'
import Statistics from './components/Statistics'
import AdminAuth from './components/AdminAuth'
import AdminPanel from './components/AdminPanel'
import ErrorBoundary from './components/ErrorBoundary'

// Context
import { AppProvider } from './context/AppContext'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [isAdmin, setIsAdmin] = useState(() => {
    // Check for existing admin session
    return localStorage.getItem('tmht_admin_session') === 'true'
  })
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showMonthModal, setShowMonthModal] = useState(false)

  return (
    <ErrorBoundary>
      <AppProvider>
        <div className="min-h-screen bg-gray-50">
        <Header 
          currentView={currentView}
          setCurrentView={setCurrentView}
          isAdmin={isAdmin}
          setIsAdmin={setIsAdmin}
          onAddMember={() => setShowMemberModal(true)}
          onCreateMonth={() => setShowMonthModal(true)}
        />
        
        <main className="container mx-auto px-4 py-8">
          {currentView === 'dashboard' && (
            <Dashboard />
          )}
          
          {currentView === 'statistics' && (
            <Statistics />
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
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        </div>
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App