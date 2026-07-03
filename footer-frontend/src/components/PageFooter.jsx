import { Link } from 'react-router-dom'

const CLIENT_URL = import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173'

export default function PageFooter() {
  return (
    <footer className="border-t border-line mt-24 py-8 px-6 md:px-16">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-muted">
        <a href={CLIENT_URL} className="eyebrow text-ink hover:opacity-60 transition-opacity">
          THE KOUR
        </a>
        <div className="flex flex-wrap gap-5">
          <Link to="/privacy"       className="hover:text-ink transition-colors">Privacy Policy</Link>
          <Link to="/shipping"      className="hover:text-ink transition-colors">Shipping</Link>
          <Link to="/returns"       className="hover:text-ink transition-colors">Returns</Link>
          <Link to="/accessibility" className="hover:text-ink transition-colors">Accessibility</Link>
        </div>

        <span>© 2025 TheKour.com</span>
      </div>
    </footer>
  )
}
