import { useEffect, useState } from 'react'
import { Receipt, FileText } from 'lucide-react'
import api from '../lib/api'

export default function InvoicePage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState('')

  useEffect(() => {
    api.get('/tax-settings')
      .then((data) => setSettings(data.tax))
      .catch((err) => setError(err.message || 'Failed to load invoice settings'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-sm text-muted">Loading…</div>
  if (error)   return <div className="p-8 text-sm text-red-600">{error}</div>
  if (!settings) return null

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-xl mb-1">Invoicing</h2>
        <p className="text-sm text-muted">Current invoicing configuration applied to all orders. Contact your admin to change these settings.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <InfoCard icon={<FileText size={16} />} label="Invoice prefix" value={settings.invoicePrefix || 'INV'} />
      </div>

      {settings.invoiceNotes && (
        <div className="border border-line p-4 text-sm">
          <p className="eyebrow text-muted mb-1 text-xs">Invoice footer notes</p>
          <p className="text-ink whitespace-pre-wrap">{settings.invoiceNotes}</p>
        </div>
      )}

      <div className="border border-line p-4 bg-surface text-sm space-y-1.5">
        <p className="font-medium text-ink flex items-center gap-2"><Receipt size={14} /> How invoices work</p>
        <p className="text-muted">Every order auto-generates an invoice number ({settings.invoicePrefix || 'INV'}-XXXXX) at checkout.</p>
        <p className="text-muted">Customers can download the PDF from their order history.</p>
        <p className="text-muted">You can download any invoice from the orders list on this dashboard.</p>
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
