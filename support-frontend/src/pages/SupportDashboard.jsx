import { Routes, Route } from 'react-router-dom'
import { Ticket, Clock, CheckCircle2, AlertOctagon } from 'lucide-react'
import { useEffect, useState } from 'react'
import DashboardShell from '../components/DashboardShell'
import CrmPage from '../components/CrmPage'
import TicketThread from '../components/TicketThread'
import TaxPage from '../components/TaxPage'
import InvoicePage from '../components/InvoicePage'
import { StatCard, Pill, statusTone } from '../components/ui'
import { useApp } from '../context/AppContext'
import api from '../lib/api'

function useTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/tickets')
      setTickets(data)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  return { tickets, loading, error, reload: load }
}

function TicketTable({ list, onUpdate, onOpen, currentUserId }) {
  return (
    <div className="border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-muted eyebrow">
            <th className="p-4">Ticket</th><th className="p-4">Subject</th><th className="p-4">Customer</th>
            <th className="p-4">Priority</th><th className="p-4">Status</th><th className="p-4">SLA</th><th className="p-4"></th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 && (
            <tr><td colSpan={7} className="p-4 text-muted text-center">No tickets here.</td></tr>
          )}
          {list.map((t) => (
            <tr key={t.id} className={`border-b border-line last:border-0 ${t.escalated ? 'bg-amber-50' : ''}`}>
              <td className="p-4">{t.ticketNo}{t.escalated && <span className="ml-2 text-[10px] text-amber-700 uppercase">Escalated</span>}</td>
              <td className="p-4">{t.subject}</td>
              <td className="p-4 text-muted">{t.customer}</td>
              <td className="p-4"><Pill tone={t.priority === 'urgent' ? 'warning' : 'neutral'}>{t.priority}</Pill></td>
              <td className="p-4"><Pill tone={statusTone(t.status)}>{t.status}</Pill></td>
              <td className="p-4 text-muted">{t.slaDueAt ? new Date(t.slaDueAt).toLocaleString() : '—'}</td>
              <td className="p-4 flex gap-2 justify-end">
                {t.assignee === 'Unassigned' && (
                  <button onClick={() => onUpdate(t.id, { assigneeId: currentUserId })} className="eyebrow text-xs hover:opacity-60">Assign to me</button>
                )}
                <button onClick={() => onOpen(t.id)} className="eyebrow text-xs hover:opacity-60">Open</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Overview() {
  const { tickets, error, reload } = useTickets()
  const { userName, user } = useApp()
  const [openTicketId, setOpenTicketId] = useState(null)
  const mine = tickets.filter((t) => t.assignee === userName)
  const unassigned = tickets.filter((t) => t.assignee === 'Unassigned')
  const resolvedToday = tickets.filter((t) => {
    if (t.status !== 'resolved') return false
    const d = new Date(t.updatedAt)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Overview</h1>
      <p className="text-sm text-muted mb-8">Your queue, priorities, and response time.</p>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="My assigned" value={mine.length} icon={Ticket} />
        <StatCard label="Unassigned" value={unassigned.length} icon={AlertOctagon} />
        <StatCard label="Resolved today" value={resolvedToday.length} icon={CheckCircle2} />
        <StatCard label="Total open" value={tickets.filter(t => t.status !== 'resolved').length} icon={Clock} />
      </div>
      <TicketTable
        list={tickets}
        onUpdate={(id, body) => api.patch(`/tickets/${id}`, body).then(reload)}
        onOpen={setOpenTicketId}
        currentUserId={user?.id}
      />
      {openTicketId && (
        <TicketThread ticketId={openTicketId} viewerRole="support" currentUserId={user?.id} onClose={() => setOpenTicketId(null)} onChanged={reload} />
      )}
    </div>
  )
}

function AllTickets() {
  const { tickets, reload } = useTickets()
  const { user } = useApp()
  const [openTicketId, setOpenTicketId] = useState(null)
  return (
    <div>
      <h1 className="font-display text-3xl mb-1">All tickets</h1>
      <p className="text-sm text-muted mb-8">Including unassigned, sorted by priority.</p>
      <TicketTable
        list={tickets}
        onUpdate={(id, body) => api.patch(`/tickets/${id}`, body).then(reload)}
        onOpen={setOpenTicketId}
        currentUserId={user?.id}
      />
      {openTicketId && (
        <TicketThread ticketId={openTicketId} viewerRole="support" currentUserId={user?.id} onClose={() => setOpenTicketId(null)} onChanged={reload} />
      )}
    </div>
  )
}

function MyTickets() {
  const { tickets, reload } = useTickets()
  const { userName, user } = useApp()
  const [openTicketId, setOpenTicketId] = useState(null)
  const mine = tickets.filter((t) => t.assignee === userName)
  return (
    <div>
      <h1 className="font-display text-3xl mb-1">My tickets</h1>
      <p className="text-sm text-muted mb-8">Tickets currently assigned to you.</p>
      <TicketTable
        list={mine}
        onUpdate={(id, body) => api.patch(`/tickets/${id}`, body).then(reload)}
        onOpen={setOpenTicketId}
        currentUserId={user?.id}
      />
      {openTicketId && (
        <TicketThread ticketId={openTicketId} viewerRole="support" currentUserId={user?.id} onClose={() => setOpenTicketId(null)} onChanged={reload} />
      )}
    </div>
  )
}

export default function SupportDashboard() {
  return (
    <DashboardShell>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="tickets" element={<AllTickets />} />
        <Route path="my-tickets" element={<MyTickets />} />
        <Route path="crm" element={<CrmPage />} />
        <Route path="tax" element={<TaxPage />} />
        <Route path="invoice" element={<InvoicePage />} />
      </Routes>
    </DashboardShell>
  )
}
