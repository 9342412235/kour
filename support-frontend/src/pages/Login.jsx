import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Login() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm border border-line p-8">
        <h1 className="font-display text-2xl mb-1">THE KOUR — Support</h1>
        <p className="text-sm text-muted mb-8">Sign in with your THE KOUR account.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="eyebrow text-muted block mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:border-ink"
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
              className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:border-ink"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-bg px-4 py-2.5 text-sm disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
