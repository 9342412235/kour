import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'

const REQUIRED_ROLE = 'admin'

function Gate({ children }) {
  const { user, role, authLoading, logout } = useApp()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role !== REQUIRED_ROLE) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center border border-line p-8">
          <h1 className="font-display text-2xl mb-2">Access denied</h1>
          <p className="text-sm text-muted mb-6">
            This dashboard is for the <strong>Admin</strong> role. Your account role is{' '}
            <strong>{role}</strong>.
          </p>
          <button
            onClick={logout}
            className="bg-ink text-bg px-4 py-2 text-sm"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard/*"
        element={
          <Gate>
            <AdminDashboard />
          </Gate>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
