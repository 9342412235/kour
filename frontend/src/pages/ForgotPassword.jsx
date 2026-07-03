import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'

const STEPS = { EMAIL: 'email', OTP: 'otp', DONE: 'done' }

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(STEPS.EMAIL)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [devCode, setDevCode] = useState(null)   // shown only in dev (no SMTP)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ── Step 1: send OTP ─────────────────────────────────────────────────────
  const sendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await api.post('/auth/forgot-password', { email })
      if (res.devCode) setDevCode(res.devCode)   // dev only (no SMTP configured)
      setStep(STEPS.OTP)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Step 2: verify OTP + set new password ────────────────────────────────
  const verifyAndReset = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/auth/verify-forgot-otp', { email, code, newPassword })
      setStep(STEPS.DONE)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-5 md:px-10 py-24 max-w-md mx-auto text-center">
      <p className="eyebrow text-muted mb-2">Trouble signing in</p>
      <h1 className="font-display text-3xl mb-3">Reset your password</h1>

      {/* ── DONE ── */}
      {step === STEPS.DONE && (
        <div className="border border-line p-6 text-sm text-left space-y-4 mt-6">
          <p className="font-medium">Password updated successfully.</p>
          <p className="text-muted">You can now sign in with your new password.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-ink text-bg py-3 text-sm tracking-wide hover:opacity-90 transition-opacity"
          >
            Back to sign in
          </button>
        </div>
      )}

      {/* ── STEP 1: enter email ── */}
      {step === STEPS.EMAIL && (
        <>
          <p className="text-sm text-muted mb-8">
            Enter the email on your account and we'll send a 6-digit code to reset your password.
          </p>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <form onSubmit={sendOtp} className="text-left space-y-4">
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
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-ink text-bg py-3 text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send verification code'}
            </button>
          </form>
        </>
      )}

      {/* ── STEP 2: enter OTP + new password ── */}
      {step === STEPS.OTP && (
        <>
          <p className="text-sm text-muted mb-2 mt-2">
            We sent a 6-digit code to <strong>{email}</strong>. Enter it below to set a new password.
          </p>
          {devCode && (
            <div className="bg-amber-50 border border-amber-200 rounded px-4 py-3 text-left text-xs text-amber-800 mb-4 mt-3">
              <strong>Dev mode</strong> (no SMTP configured) — your code is:{' '}
              <span className="font-mono font-bold text-lg tracking-widest">{devCode}</span>
            </div>
          )}
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <form onSubmit={verifyAndReset} className="text-left space-y-4 mt-4">
            <div>
              <label className="eyebrow text-muted block mb-1.5">6-digit code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-line px-4 py-2.5 text-sm outline-none bg-transparent tracking-[0.5em] font-mono"
                placeholder="000000"
              />
            </div>
            <div>
              <label className="eyebrow text-muted block mb-1.5">New password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-line px-4 py-2.5 text-sm outline-none bg-transparent"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="eyebrow text-muted block mb-1.5">Confirm new password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-line px-4 py-2.5 text-sm outline-none bg-transparent"
                placeholder="Repeat your new password"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-ink text-bg py-3 text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Updating…' : 'Set new password'}
            </button>
            <button
              type="button"
              onClick={() => { setStep(STEPS.EMAIL); setError(''); setDevCode(null) }}
              className="w-full text-sm text-muted underline underline-offset-4 hover:opacity-60"
            >
              Use a different email / resend code
            </button>
          </form>
        </>
      )}

      <p className="text-xs text-muted mt-8">
        <Link to="/login" className="underline hover:opacity-60">Back to sign in</Link>
      </p>
    </div>
  )
}
