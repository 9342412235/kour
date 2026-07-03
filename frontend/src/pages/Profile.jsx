import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../lib/api'

export default function Profile() {
  const { user, role, authLoading, updateProfile, refreshUser } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (authLoading) return <div className="px-5 py-24 text-center text-sm text-muted">Loading…</div>
  if (!user) { navigate('/login'); return null }

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (newPassword && newPassword.length < 8) {
      setError('New password must be at least 8 characters long')
      return
    }
    if (newPassword && user.hasPassword && !currentPassword) {
      setError('Please enter your current password to set a new one')
      return
    }

    setSubmitting(true)
    try {
      // Upload the raw avatar file first, if one was chosen.
      if (avatarFile) {
        const formData = new FormData()
        formData.append('avatar', avatarFile)
        await api.upload('/users/me/avatar', formData)
        if (refreshUser) await refreshUser()
      }

      const payload = { name }
      if (newPassword) {
        payload.newPassword = newPassword
        payload.currentPassword = currentPassword
      }
      await updateProfile(payload)

      setSuccess('Profile updated successfully.')
      setAvatarFile(null)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || 'Could not update profile.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-5 md:px-10 py-16 max-w-lg mx-auto">
      <p className="eyebrow text-muted mb-2">Account</p>
      <h1 className="font-display text-3xl mb-3">Edit profile</h1>
      <p className="text-sm text-muted mb-8">Update your display name, profile picture, and password.</p>

      {error && <p className="text-sm text-red-600 mb-6">{error}</p>}
      {success && <p className="text-sm mb-6">{success}</p>}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar preview" className="w-16 h-16 rounded-full object-cover border border-line" />
          ) : (
            <div className="w-16 h-16 rounded-full border border-line flex items-center justify-center text-muted text-xs">
              No photo
            </div>
          )}
          <div>
            <label className="eyebrow text-muted block mb-1.5">Profile picture</label>
            <input type="file" accept="image/*" onChange={onAvatarChange} className="text-sm" />
          </div>
        </div>

        <div>
          <label className="eyebrow text-muted block mb-1.5">Email</label>
          <input
            disabled
            value={user.email}
            className="w-full border border-line px-4 py-2.5 text-sm bg-surface text-muted"
          />
        </div>
        <div>
          <label className="eyebrow text-muted block mb-1.5">Full name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-line px-4 py-2.5 text-sm outline-none bg-transparent"
          />
        </div>

        <div className="pt-4 border-t border-line">
          <p className="eyebrow text-muted mb-3">
            {user.hasPassword ? 'Change password' : 'Set a password'}
          </p>
          {user.hasPassword && (
            <div className="mb-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full border border-line px-4 py-2.5 text-sm outline-none bg-transparent"
              />
            </div>
          )}
          <div className="mb-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (leave blank to keep current)"
              className="w-full border border-line px-4 py-2.5 text-sm outline-none bg-transparent"
            />
          </div>
          <div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full border border-line px-4 py-2.5 text-sm outline-none bg-transparent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink text-bg py-3 text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
