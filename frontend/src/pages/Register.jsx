import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Register() {
  const { register } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    setSubmitting(true)
    try {
      await register(name, email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Could not create account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-5 md:px-10 py-24 max-w-md mx-auto text-center">
      <p className="eyebrow text-muted mb-2">New here</p>
      <h1 className="font-display text-3xl mb-3">Create your account</h1>
      <p className="text-sm text-muted mb-8">
        Sign up with email and password to start shopping, or go back to sign in with Google.
      </p>

      {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

      <form onSubmit={onSubmit} className="text-left space-y-4">
        <div>
          <label className="eyebrow text-muted block mb-1.5">Full name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-line px-4 py-2.5 text-sm outline-none bg-transparent"
            placeholder="Jane Doe"
          />
        </div>
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
          <label className="eyebrow text-muted block mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-line px-4 py-2.5 text-sm outline-none bg-transparent"
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label className="eyebrow text-muted block mb-1.5">Confirm password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border border-line px-4 py-2.5 text-sm outline-none bg-transparent"
            placeholder="Repeat your password"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink text-bg py-3 text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-xs text-muted mt-8">
        Already have an account? <Link to="/login" className="underline hover:opacity-60">Sign in</Link>
      </p>
    </div>
  )
}
