import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null) // backend user object, or null when signed out
  const [authLoading, setAuthLoading] = useState(true)

  const role = user?.role || null
  const userName = user?.name || 'Guest'

  const refreshUser = async () => {
    try {
      const me = await api.get('/auth/me')
      setUser(me)
      return me
    } catch {
      setUser(null)
      return null
    }
  }

  // Load current session on first mount
  useEffect(() => {
    (async () => {
      try {
        const me = await api.get('/auth/me')
        setUser(me)
      } catch {
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    })()
  }, [])

  const login = async (email, password) => {
    const me = await api.post('/auth/login', { email, password })
    setUser(me)
    return me
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    setUser(null)
  }

  return (
    <AppContext.Provider
      value={{ user, role, userName, authLoading, login, logout, refreshUser }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
