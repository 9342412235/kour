import { Routes, Route, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  UserCog, Plus, X, KeyRound, DatabaseBackup, Mail,
} from 'lucide-react'
import { StatCard, Pill, statusTone } from '../components/ui'
import api from '../lib/api'

// ---------- shared data hooks ----------

function useStaff() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setItems(await api.get('/admin/management/staff'))
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load staff accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  return { items, loading, error, reload: load }
}

function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setSettings(await api.get('/admin/management/settings'))
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  return { settings, setSettings, loading, error, reload: load }
}

// Generic input used across the settings pages.
function Field({ label, ...props }) {
  return (
    <div>
      <label className="eyebrow text-muted block mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:border-ink"
      />
    </div>
  )
}

// ---------- Overview ----------

function Overview() {
  const { items: staff } = useStaff()
  const { settings } = useSettings()

  const counts = ['admin', 'warehouse', 'support', 'blogger'].map((role) => ({
    role,
    count: staff.filter((s) => s.role === role).length,
  }))

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Overview</h1>
      <p className="text-sm text-muted mb-8">Staff accounts and platform-wide configuration, at a glance.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {counts.map((c) => (
          <StatCard key={c.role} label={`${c.role} accounts`} value={c.count} icon={UserCog} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-line p-6">
          <p className="eyebrow text-muted mb-4">Maintenance mode</p>
          <div className="flex items-center gap-2 text-sm">
            <Pill tone={settings?.maintenance?.enabled ? 'filled' : 'neutral'}>
              {settings?.maintenance?.enabled ? 'Enabled' : 'Disabled'}
            </Pill>
          </div>
        </div>
        <div className="border border-line p-6">
          <p className="eyebrow text-muted mb-4">Last backup</p>
          <p className="text-sm">
            {settings?.backup?.lastBackupAt
              ? new Date(settings.backup.lastBackupAt).toLocaleString()
              : 'No backup recorded yet'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------- Staff accounts ----------

const STAFF_ROLES = ['admin', 'warehouse', 'support', 'blogger']
const ROLE_LABEL = { admin: 'Admin', warehouse: 'Warehouse', support: 'Support', blogger: 'Blogger' }

function CreateStaffModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/admin/management/staff', form)
      onCreated()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create account')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-bg border border-line p-8 w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl">New staff login</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Field label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
          <div>
            <label className="eyebrow text-muted block mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:border-ink"
            >
              {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <p className="text-xs text-muted mt-1.5">
              This email/password logs into the {form.role === 'admin' ? 'Admin' : ROLE_LABEL[form.role]} dashboard.
            </p>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-ink text-bg px-4 py-2.5 text-sm disabled:opacity-50">
            {saving ? 'Creating…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

function ResetPasswordModal({ staffMember, onClose, onSaved }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.patch(`/admin/management/staff/${staffMember.id}`, { password })
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-bg border border-line p-8 w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl">Reset password</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <p className="text-sm text-muted mb-4">{staffMember.email}</p>
        <form onSubmit={submit} className="space-y-4">
          <Field label="New password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-ink text-bg px-4 py-2.5 text-sm disabled:opacity-50">
            {saving ? 'Saving…' : 'Set new password'}
          </button>
        </form>
      </div>
    </div>
  )
}

function StaffPage() {
  const { items: staff, error, reload } = useStaff()
  const [showCreate, setShowCreate] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/admin/management/staff/${id}`, { role })
      reload()
    } catch (err) {
      alert(err.message || 'Failed to update role')
    }
  }

  const toggleStatus = async (s) => {
    try {
      await api.patch(`/admin/management/staff/${s.id}`, { status: s.status === 'active' ? 'disabled' : 'active' })
      reload()
    } catch (err) {
      alert(err.message || 'Failed to update status')
    }
  }

  const toggleTaxAccess = async (s) => {
    try {
      await api.patch(`/admin/management/staff/${s.id}`, { canViewTaxInvoices: !s.canViewTaxInvoices })
      reload()
    } catch (err) {
      alert(err.message || 'Failed to update permission')
    }
  }

  const remove = async (s) => {
    if (!confirm(`Remove the login for ${s.email}? This can't be undone.`)) return
    try {
      await api.delete(`/admin/management/staff/${s.id}`)
      reload()
    } catch (err) {
      alert(err.message || 'Failed to remove account')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl mb-1">Staff Accounts</h1>
          <p className="text-sm text-muted">
            Create the email & password staff use to sign into the Admin, Warehouse, Support, and Blog dashboards.
            Toggle "Tax & Invoices" to let a specific Admin view and edit tax settings — off by default.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-ink text-bg px-4 py-2.5 text-sm shrink-0"
        >
          <Plus size={16} /> New login
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted eyebrow">
              <th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th>
              <th className="p-4">Status</th><th className="p-4">Tax & Invoices</th><th className="p-4">Created</th><th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 && (
              <tr><td colSpan={7} className="p-4 text-muted text-center">No staff accounts yet — create the first one.</td></tr>
            )}
            {staff.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0">
                <td className="p-4">{s.name}</td>
                <td className="p-4 text-muted">{s.email}</td>
                <td className="p-4">
                  <select
                    value={s.role}
                    onChange={(e) => changeRole(s.id, e.target.value)}
                    className="bg-transparent border border-line text-xs px-2 py-1"
                  >
                    {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                </td>
                <td className="p-4"><Pill tone={statusTone(s.status)}>{s.status}</Pill></td>
                <td className="p-4">
                  {s.role === 'admin' ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(s.canViewTaxInvoices)}
                        onChange={() => toggleTaxAccess(s)}
                      />
                      <span className="text-xs text-muted">{s.canViewTaxInvoices ? 'Enabled' : 'Disabled'}</span>
                    </label>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
                <td className="p-4 text-muted">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setResetTarget(s)} className="eyebrow hover:opacity-60 flex items-center gap-1">
                      <KeyRound size={13} /> Reset
                    </button>
                    <button onClick={() => toggleStatus(s)} className="eyebrow hover:opacity-60">
                      {s.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => remove(s)} className="eyebrow hover:opacity-60 text-red-600">
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateStaffModal onClose={() => setShowCreate(false)} onCreated={reload} />}
      {resetTarget && (
        <ResetPasswordModal staffMember={resetTarget} onClose={() => setResetTarget(null)} onSaved={reload} />
      )}
    </div>
  )
}

// ---------- Settings pages (company / contact / address / notifications / maintenance / backup) ----------

function SettingsForm({ title, description, section, fields, settings, reload, extra }) {
  const [form, setForm] = useState(settings?.[section] || {})
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { setForm(settings?.[section] || {}) }, [settings, section])

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.put('/admin/management/settings', { [section]: form })
      await reload()
      setSavedAt(new Date())
    } catch (err) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (!settings) return <p className="text-sm text-muted">Loading…</p>

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">{title}</h1>
      <p className="text-sm text-muted mb-8">{description}</p>

      <form onSubmit={submit} className="max-w-xl space-y-4 border border-line p-6">
        {fields.map((f) =>
          f.type === 'checkbox' ? (
            <label key={f.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form[f.key]} onChange={set(f.key)} />
              {f.label}
            </label>
          ) : (
            <Field key={f.key} label={f.label} value={form[f.key] || ''} onChange={set(f.key)} type={f.inputType || 'text'} />
          )
        )}
        {extra && extra(form, setForm)}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-ink text-bg px-4 py-2.5 text-sm disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {savedAt && <span className="text-xs text-muted">Saved {savedAt.toLocaleTimeString()}</span>}
        </div>
      </form>
    </div>
  )
}

function CompanyPage() {
  const { settings, reload } = useSettings()
  return (
    <SettingsForm
      title="Company Information"
      description="The legal identity of the business, shown on invoices and official documents."
      section="company"
      settings={settings}
      reload={reload}
      fields={[
        { key: 'name', label: 'Company name' },
        { key: 'legalName', label: 'Legal name' },
        { key: 'registrationNumber', label: 'Registration number' },
        { key: 'taxId', label: 'Tax ID (EIN)' },
        { key: 'logoUrl', label: 'Logo URL' },
      ]}
    />
  )
}

function ContactPage() {
  const { settings, reload } = useSettings()
  return (
    <SettingsForm
      title="Contact Information"
      description="How customers and partners reach the business."
      section="contact"
      settings={settings}
      reload={reload}
      fields={[
        { key: 'email', label: 'Primary email', inputType: 'email' },
        { key: 'phone', label: 'Phone number' },
        { key: 'supportEmail', label: 'Support email', inputType: 'email' },
        { key: 'website', label: 'Website' },
      ]}
    />
  )
}

function AddressPage() {
  const { settings, reload } = useSettings()
  return (
    <SettingsForm
      title="Address Details"
      description="The registered business address."
      section="address"
      settings={settings}
      reload={reload}
      fields={[
        { key: 'line1', label: 'Address line 1' },
        { key: 'line2', label: 'Address line 2' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'postalCode', label: 'Postal code' },
        { key: 'country', label: 'Country' },
      ]}
    />
  )
}

function NotificationsPage() {
  const { settings, reload } = useSettings()
  const [smtpStatus, setSmtpStatus] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    api.get('/admin/management/settings/smtp-status').then(setSmtpStatus).catch(() => {})
  }, [])

  const sendTestEmail = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await api.post('/admin/management/settings/test-smtp')
      setTestResult({ ok: true, msg: res.message })
    } catch (err) {
      setTestResult({ ok: false, msg: err.message || 'Test failed' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div>
      <SettingsForm
        title="Email & Notification Settings"
        description="Control the sender identity and which internal events trigger a notification email."
        section="emailNotifications"
        settings={settings}
        reload={reload}
        fields={[
          { key: 'smtpFromName', label: 'Email "From" name' },
          { key: 'notifyNewOrders', label: 'Notify on new orders', type: 'checkbox' },
          { key: 'notifyLowStock', label: 'Notify on low stock', type: 'checkbox' },
          { key: 'notifyNewTickets', label: 'Notify on new support tickets', type: 'checkbox' },
          { key: 'notifyNewUsers', label: 'Notify on new customer sign-ups', type: 'checkbox' },
        ]}
      />

      {/* SMTP Configuration Panel */}
      <div className="max-w-xl mt-8 border border-line p-6 space-y-4">
        <div>
          <p className="font-display text-lg mb-1">SMTP / Nodemailer Configuration</p>
          <p className="text-xs text-muted">
            Configure in <code className="bg-surface px-1 py-0.5 text-xs">backend/.env</code>.
            For Gmail use <strong>smtp.gmail.com</strong>, port <strong>465</strong>, and a{' '}
            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer"
              className="underline underline-offset-2">16-character App Password</a>{' '}
            (not your Gmail login password).
          </p>
        </div>

        {smtpStatus && (
          <div className={`border rounded px-4 py-3 text-xs ${smtpStatus.configured ? 'border-green-300 bg-green-50 text-green-800' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
            {smtpStatus.configured ? (
              <>
                <p className="font-semibold mb-1">✓ SMTP configured</p>
                <p>Host: {smtpStatus.host}:{smtpStatus.port}</p>
                <p>User: {smtpStatus.user}</p>
                <p>From: {smtpStatus.from}</p>
                <p>App Password: {smtpStatus.passwordSet ? '•••••••••••••••• (set)' : 'NOT SET'}</p>
              </>
            ) : (
              <>
                <p className="font-semibold mb-1">⚠ SMTP not configured</p>
                <p>OTPs and notifications are logged to the server console (dev mode).</p>
                <p className="mt-1">Set SMTP_HOST, SMTP_USER and SMTP_PASS in <code>backend/.env</code> to enable real emails.</p>
              </>
            )}
          </div>
        )}

        <div>
          <p className="eyebrow text-muted text-xs mb-3">Required .env variables</p>
          <pre className="bg-surface text-xs p-3 overflow-x-auto leading-5 border border-line">{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx   # 16-char App Password
SMTP_FROM="The Kour <you@gmail.com>"`}</pre>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={sendTestEmail}
            disabled={testing || !smtpStatus?.configured}
            className="bg-ink text-bg px-4 py-2.5 text-sm disabled:opacity-40"
          >
            {testing ? 'Sending…' : 'Send test email'}
          </button>
          {!smtpStatus?.configured && (
            <span className="text-xs text-muted">Configure SMTP first to test.</span>
          )}
          {testResult && (
            <span className={`text-xs ${testResult.ok ? 'text-green-700' : 'text-red-600'}`}>
              {testResult.msg}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function MaintenancePage() {
  const { settings, reload } = useSettings()
  return (
    <SettingsForm
      title="Maintenance Mode"
      description="Temporarily take the storefront offline for visitors while keeping staff dashboards accessible."
      section="maintenance"
      settings={settings}
      reload={reload}
      fields={[
        { key: 'enabled', label: 'Maintenance mode is enabled', type: 'checkbox' },
        { key: 'message', label: 'Message shown to visitors' },
      ]}
    />
  )
}

function TaxPage() {
  const { settings, reload } = useSettings()
  return (
    <div>
      <SettingsForm
        title="Tax & Invoicing"
        description="Tax rate applied to all new orders. Invoices are auto-generated as PDFs (customers download via their order history). Configure the prefix and footer note here."
        section="tax"
        settings={settings}
        reload={reload}
        fields={[
          { key: 'label', label: 'Tax label (e.g. Sales Tax, VAT)' },
          { key: 'ratePercent', label: 'Tax rate (%)', inputType: 'number' },
          { key: 'inclusive', label: 'Prices are tax-inclusive (tax is already in the listed price)', type: 'checkbox' },
          { key: 'invoicePrefix', label: 'Invoice number prefix (e.g. INV → INV-10001)' },
          { key: 'invoiceNotes', label: 'Invoice PDF footer notes (e.g. payment terms, bank details)' },
        ]}
      />
      <div className="max-w-xl mt-6 border border-line p-5 text-xs text-muted space-y-1">
        <p className="font-medium text-ink text-sm">How invoices work</p>
        <p>Every order auto-generates an invoice number (<em>prefix-XXXXX</em>) at checkout.</p>
        <p>Customers can download the invoice PDF from their order history.</p>
        <p>Staff (Admin / Support / Warehouse) can also download any invoice from the orders list.</p>
        <p>Tax is calculated at checkout using the rate set above.</p>
      </div>
    </div>
  )
}

function BackupPage() {
  const { settings, reload } = useSettings()
  const [running, setRunning] = useState(false)
  const [history, setHistory] = useState([])

  const loadHistory = async () => {
    try {
      setHistory(await api.get('/admin/management/backups'))
    } catch {
      setHistory([])
    }
  }

  useEffect(() => { loadHistory() }, [])

  const runBackupNow = async () => {
    setRunning(true)
    try {
      await api.post('/admin/management/settings/backup-now')
      await reload()
      await loadHistory()
    } catch (err) {
      alert(err.message || 'Failed to run backup')
    } finally {
      setRunning(false)
    }
  }

  const download = (fileName) => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    window.open(`${base}/api/admin/management/backups/${encodeURIComponent(fileName)}/download`, '_blank')
  }

  return (
    <div>
      {/* Excel backup info banner */}
      <div className="max-w-xl mb-6 border border-line p-5 bg-surface text-xs text-muted space-y-1.5">
        <p className="font-medium text-ink text-sm mb-1">📊 Excel Data Backup (.xlsx)</p>
        <p>Each backup exports two sheets: <strong>Orders</strong> (order no., customer, status, subtotal, tax, total, date) and <strong>Stock</strong> (SKU, name, price, inventory, warehouse).</p>
        <p><strong>Automatic</strong> backups run on the schedule below. <strong>Manual</strong> backups can be triggered any time via "Run backup now".</p>
        <p>All files are standard Excel workbooks — open directly in Excel, Google Sheets, or LibreOffice.</p>
      </div>

      <SettingsForm
      title="Backup Settings"
      description="How often the database is backed up to Excel (.xlsx) and how long files are retained."
      section="backup"
      settings={settings}
      reload={reload}
      fields={[
        { key: 'storageLocation', label: 'Storage location note' },
      ]}
      extra={(form, setForm) => (
        <>
          <div>
            <label className="eyebrow text-muted block mb-1.5">Automatic backup frequency</label>
            <select
              value={form.frequency || 'daily'}
              onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
              className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:border-ink"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily (2 AM)</option>
              <option value="weekly">Weekly (Sunday 2 AM)</option>
              <option value="monthly">Monthly (1st of month, 2 AM)</option>
            </select>
            <p className="text-xs text-muted mt-1">Saving this immediately updates the running schedule on the server.</p>
          </div>
          <Field
            label="Retention (days) — backups older than this are auto-deleted"
            type="number"
            min="1"
            value={form.retentionDays || ''}
            onChange={(e) => setForm((f) => ({ ...f, retentionDays: Number(e.target.value) }))}
          />
          <div className="flex items-center justify-between pt-2 border-t border-line mt-2">
            <span className="text-xs text-muted">
              Last backup: {settings?.backup?.lastBackupAt ? new Date(settings.backup.lastBackupAt).toLocaleString() : 'never'}
            </span>
            <button type="button" onClick={runBackupNow} disabled={running} className="flex items-center gap-2 eyebrow hover:opacity-60 disabled:opacity-50">
              <DatabaseBackup size={14} /> {running ? 'Running…' : 'Run backup now (manual)'}
            </button>
          </div>
        </>
      )}
    />

      <div className="max-w-xl mt-8">
        <p className="eyebrow text-muted mb-3">Backup history — download Excel files</p>
        {history.length === 0 ? (
          <div className="border border-line p-6 text-sm text-muted text-center">No backups yet — automatic backups run on your chosen schedule, or click "Run backup now" above.</div>
        ) : (
          <div className="border border-line divide-y divide-line">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <span className="font-medium">{h.fileName}</span>{' '}
                  <Pill tone={h.triggeredBy === 'manual' ? 'neutral' : 'filled'}>{h.triggeredBy === 'manual' ? 'Manual' : 'Auto'}</Pill>
                  <p className="text-xs text-muted mt-1">
                    {h.status === 'success'
                      ? <span>{h.ordersCount} orders · {h.productsCount} products</span>
                      : <span className="text-red-600">{h.error}</span>}
                    {' · '}{new Date(h.createdAt).toLocaleString()}
                  </p>
                </div>
                {h.status === 'success' && (
                  <button onClick={() => download(h.fileName)} className="eyebrow text-muted hover:opacity-60 shrink-0 flex items-center gap-1">
                    <DatabaseBackup size={12} /> Download .xlsx
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      setLogs(await api.get(`/admin/management/audit-logs${filter ? `?action=${encodeURIComponent(filter)}` : ''}`))
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Logs & Audit</h1>
      <p className="text-sm text-muted mb-6">Every staff/admin action across the platform — who, what, when.</p>
      <div className="flex gap-2 mb-4 max-w-xl">
        <input className="border border-line p-2 text-sm flex-1" placeholder="Filter by action (e.g. staff, settings, order, backup)"
          value={filter} onChange={(e) => setFilter(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
        <button className="border border-line px-4 py-2 text-sm" onClick={load}>Filter</button>
      </div>
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : logs.length === 0 ? (
        <div className="border border-line p-8 text-sm text-muted text-center">No audit log entries yet.</div>
      ) : (
        <div className="border border-line divide-y divide-line">
          {logs.map((l) => (
            <div key={l.id} className="p-3 text-sm flex items-start justify-between gap-4">
              <div>
                <span className="font-medium">{l.actorName}</span>{' '}
                <span className="text-muted">({l.actorRole})</span>{' '}
                <span className="eyebrow">{l.action}</span>
                {l.entityType && <span className="text-muted"> · {l.entityType} {l.entityId?.slice?.(0, 8)}</span>}
              </div>
              <span className="text-xs text-muted whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const MGMT_TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'staff', label: 'Staff Accounts' },
  { to: 'company', label: 'Company Info' },
  { to: 'contact', label: 'Contact Info' },
  { to: 'address', label: 'Address' },
  { to: 'notifications', label: 'Email & Notifications' },
  { to: 'maintenance', label: 'Maintenance Mode' },
  { to: 'backup', label: 'Backup Settings' },
  { to: 'tax', label: 'Tax & Invoicing' },
  { to: 'audit-logs', label: 'Audit Logs' },
]

export default function ManagementPage() {
  return (
    <div>
      <div className="flex gap-2 border-b border-line mb-8 overflow-x-auto">
        {MGMT_TABS.map((t) => (
          <NavLink
            key={t.to || 'overview'}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px ${isActive ? 'border-black font-medium' : 'border-transparent text-muted'}`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="company" element={<CompanyPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="address" element={<AddressPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="backup" element={<BackupPage />} />
        <Route path="tax" element={<TaxPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Routes>
    </div>
  )
}
