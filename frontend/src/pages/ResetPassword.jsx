import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function ResetPassword() {
  const { resetPassword } = useApp()
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

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
      await resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message || 'This reset link is invalid or has expired.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-5 md:px-10 py-24 max-w-md mx-auto text-center">
      <p className="eyebrow text-muted mb-2">Almost there</p>
      <h1 className="font-display text-3xl mb-3">Choose a new password</h1>

      {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

      {done ? (
        <p className="text-sm border border-line p-6">
          Password updated. Redirecting you to sign in…
        </p>
      ) : (
        <form onSubmit={onSubmit} className="text-left space-y-4">
          <div>
            <label className="eyebrow text-muted block mb-1.5">New password</label>
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
            <label className="eyebrow text-muted block mb-1.5">Confirm new password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border border-line px-4 py-2.5 text-sm outline-none bg-transparent"
              placeholder="Repeat your new password"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-ink text-bg py-3 text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}

      <p className="text-xs text-muted mt-8">
        <Link to="/login" className="underline hover:opacity-60">Back to sign in</Link>
      </p>
    </div>
  )
}
