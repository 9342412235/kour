import { useEffect, useState } from 'react'
import { X, Send } from 'lucide-react'
import { Pill, statusTone } from './ui'
import api from '../lib/api'

export default function CrmPage() {
  const [customers, setCustomers] = useState([])
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const load = async (q = '') => {
    try {
      const data = await api.get(`/crm/customers${q ? `?search=${encodeURIComponent(q)}` : ''}`)
      setCustomers(data)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load customers')
    }
  }

  useEffect(() => { load() }, [])

  const onSearch = (e) => {
    e.preventDefault()
    load(search)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl mb-1">CRM</h1>
        <p className="text-sm text-muted">Customer profiles, lifetime value, support history, and relationship notes.</p>
      </div>

      <form onSubmit={onSearch} className="mb-6 flex gap-2 max-w-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="flex-1 border border-line px-3 py-2 text-sm bg-bg"
        />
        <button className="border border-line px-4 py-2 text-sm">Search</button>
      </form>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted eyebrow">
              <th className="p-4">Customer</th><th className="p-4">Orders</th><th className="p-4">Lifetime value</th>
              <th className="p-4">Last order</th><th className="p-4">Open tickets</th><th className="p-4">Status</th><th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr><td colSpan={7} className="p-4 text-muted text-center">No customers found.</td></tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="p-4">
                  <p>{c.name}</p>
                  <p className="text-xs text-muted">{c.email}</p>
                </td>
                <td className="p-4">{c.orderCount}</td>
                <td className="p-4">${c.totalSpent.toFixed(2)}</td>
                <td className="p-4 text-muted">{c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : '—'}</td>
                <td className="p-4">{c.openTickets}</td>
                <td className="p-4"><Pill tone={statusTone(c.status)}>{c.status}</Pill></td>
                <td className="p-4"><button onClick={() => setSelectedId(c.id)} className="eyebrow hover:opacity-60">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedId && <CustomerDrawer id={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  )
}

function CustomerDrawer({ id, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setData(await api.get(`/crm/customers/${id}`))
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load customer')
    }
  }

  useEffect(() => { load() }, [id])

  const addNote = async (e) => {
    e.preventDefault()
    if (!note.trim()) return
    setSaving(true)
    try {
      await api.post(`/crm/customers/${id}/notes`, { note })
      setNote('')
      await load()
    } catch (err) {
      setError(err.message || 'Failed to add note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="bg-bg border-l border-line w-full max-w-lg h-full overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl">{data?.name || 'Customer'}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink"><X size={18} /></button>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {!data && !error && <p className="text-sm text-muted">Loading…</p>}

        {data && (
          <div className="space-y-8 text-sm">
            <div>
              <p className="eyebrow text-muted mb-1">Contact</p>
              <p>{data.email}</p>
              <p className="text-muted text-xs">Customer since {new Date(data.joined).toLocaleDateString()}</p>
            </div>

            <div>
              <p className="eyebrow text-muted mb-2">Orders ({data.orders.length})</p>
              <div className="border border-line divide-y divide-line">
                {data.orders.length === 0 && <p className="p-3 text-muted text-xs">No orders yet.</p>}
                {data.orders.map((o) => (
                  <div key={o.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p>{o.orderNumber}</p>
                      <p className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p>${o.total.toFixed(2)}</p>
                      <Pill tone={statusTone(o.status)}>{o.status}</Pill>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow text-muted mb-2">Support tickets ({data.tickets.length})</p>
              <div className="border border-line divide-y divide-line">
                {data.tickets.length === 0 && <p className="p-3 text-muted text-xs">No tickets raised.</p>}
                {data.tickets.map((t) => (
                  <div key={t.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p>{t.subject}</p>
                      <p className="text-xs text-muted">{t.ticketNo} · {t.assignee}</p>
                    </div>
                    <Pill tone={statusTone(t.status)}>{t.status}</Pill>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow text-muted mb-2">Relationship notes</p>
              <form onSubmit={addNote} className="flex gap-2 mb-3">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add an internal note…"
                  className="flex-1 border border-line px-3 py-2 text-sm bg-bg"
                />
                <button disabled={saving} className="bg-ink text-bg px-3 py-2 disabled:opacity-50">
                  <Send size={14} />
                </button>
              </form>
              <div className="space-y-3">
                {data.notes.length === 0 && <p className="text-muted text-xs">No notes yet.</p>}
                {data.notes.map((n) => (
                  <div key={n.id} className="border border-line p-3">
                    <p>{n.note}</p>
                    <p className="text-xs text-muted mt-1">{n.author} · {new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
