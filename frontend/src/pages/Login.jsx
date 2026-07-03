import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { googleLoginUrl } from '../lib/api'

export default function Login() {
  const { role, authLoading, login } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const authFailed = params.get('error') === 'auth_failed'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && role) navigate('/')
  }, [authLoading, role, navigate])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-5 md:px-10 py-24 max-w-md mx-auto text-center">
      <p className="eyebrow text-muted mb-2">Welcome back</p>
      <h1 className="font-display text-3xl mb-3">Sign in to The Kour</h1>
      <p className="text-sm text-muted mb-8">
        Sign in with your email and password, or continue with Google.
      </p>

      {authFailed && (
        <p className="text-sm text-red-600 mb-6">
          Sign-in failed. Please try again.
        </p>
      )}
      {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

      <form onSubmit={onSubmit} className="text-left space-y-4 mb-6">
        <div>
          <label className="eyebrow text-muted block mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-line px-4 py-2.5 text-sm outline-none bg-transparent"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="eyebrow text-muted">Password</label>
            <Link to="/forgot-password" className="text-xs text-muted hover:opacity-60">Forgot password?</Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-line px-4 py-2.5 text-sm outline-none bg-transparent"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink text-bg py-3 text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="flex items-center gap-3 mb-6">
        <span className="flex-1 h-px bg-line" />
        <span className="text-xs text-muted">or</span>
        <span className="flex-1 h-px bg-line" />
      </div>

      <a
        href={googleLoginUrl()}
        className="flex items-center justify-center gap-3 w-full border border-line py-3 text-sm tracking-wide hover:bg-surface transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.08-1.81 2.72v2.26h2.92c1.71-1.57 2.69-3.89 2.69-6.62z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33C2.44 16.07 5.48 18 9 18z"/>
          <path fill="#FBBC05" d="M3.97 10.71c-.18-.54-.28-1.11-.28-1.71s.1-1.17.28-1.71V4.96H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 1.93.96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
        </svg>
        Continue with Google
      </a>

      <p className="text-xs text-muted mt-8">
        New here? <Link to="/register" className="underline hover:opacity-60">Create an account</Link> — it's
        created as a customer by default. Staff roles (admin, warehouse,
        support, blogger) are granted by an administrator after sign-up.
      </p>
    </div>
  )
}
