import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

const THEMES = ['light', 'medium', 'dark']

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('kour-theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('kour-theme', theme)
  }, [theme])

  const cycle = () =>
    setTheme((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
