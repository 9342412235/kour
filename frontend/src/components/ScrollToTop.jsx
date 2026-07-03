import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Scrolls the window to the top whenever the route changes. Without this,
// React Router preserves the previous scroll position, so navigating to a
// new page (e.g. clicking a product) can land the user mid-page or at the
// footer instead of the top of the new page.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' })
  }, [pathname])

  return null
}
