import { useEffect, useState } from 'react'
import { Percent, Info } from 'lucide-react'
import api from '../lib/api'

export default function TaxPage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState('')

  useEffect(() => {
    api.get('/tax-settings')
      .then((data) => setSettings(data.tax))
      .catch((err) => setError(err.message || 'Failed to load tax settings'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-sm text-muted">Loading…</div>
  if (error)   return <div className="p-8 text-sm text-red-600">{error}</div>
  if (!settings) return null

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-xl mb-1">Tax Settings</h2>
        <p className="text-sm text-muted">Current tax configuration applied to all orders. Contact your admin to change these settings.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <InfoCard icon={<Percent size={16} />} label="Tax label" value={settings.label || '—'} />
        <InfoCard icon={<Percent size={16} />} label="Tax rate" value={`${settings.ratePercent ?? 0}%`} />
        <InfoCard icon={<Info size={16} />} label="Pricing mode" value={settings.inclusive ? 'Tax-inclusive (tax already in price)' : 'Tax added on top at checkout'} />
      </div>
    </div>
  )
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="border border-line p-4">
      <div className="flex items-center gap-2 text-muted mb-1">
        {icon}
        <span className="eyebrow text-xs">{label}</span>
      </div>
      <p className="text-ink font-medium text-sm">{value}</p>
    </div>
  )
}
