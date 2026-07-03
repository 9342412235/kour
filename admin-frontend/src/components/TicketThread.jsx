import { useEffect, useRef, useState } from 'react'
import { X, Send, ArrowUpCircle, Trash2 } from 'lucide-react'
import { Pill, statusTone } from './ui'
import api from '../lib/api'

const ROLE_LABEL = { customer: 'Customer', support: 'Support agent', admin: 'Admin' }
const ROLE_ALIGN = { customer: 'items-start', support: 'items-end', admin: 'items-end' }
const ROLE_BUBBLE = {
  customer: 'bg-surface text-ink',
  support: 'bg-ink text-bg',
  admin: 'bg-amber-600 text-white',
}

// viewerRole: 'customer' | 'support' | 'admin' — controls which staff
// controls (status, priority, escalate, resolve escalation, delete) are shown.
export default function TicketThread({ ticketId, viewerRole, currentUserId, onClose, onChanged }) {
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const load = async () => {
    try {
      const [t, m] = await Promise.all([
        api.get(`/tickets/${ticketId}`),
        api.get(`/tickets/${ticketId}/messages`),
      ])
      setTicket(t)
      setMessages(m)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load ticket')
    }
  }

  useEffect(() => { load() }, [ticketId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      await api.post(`/tickets/${ticketId}/messages`, { body: reply.trim() })
      setReply('')
      await load()
    } catch (err) {
      setError(err.message || 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Delete this reply?')) return
    try {
      await api.delete(`/tickets/${ticketId}/messages/${messageId}`)
      await load()
    } catch (err) {
      setError(err.message || 'Failed to delete reply')
    }
  }

  const deleteTicket = async () => {
    if (!window.confirm(`Delete ticket ${ticket?.ticketNo}? This can't be undone.`)) return
    try {
      await api.delete(`/tickets/${ticketId}`)
      onChanged?.()
      onClose?.()
    } catch (err) {
      setError(err.message || 'Failed to delete ticket')
    }
  }

  const setField = async (field, value) => {
    try {
      await api.patch(`/tickets/${ticketId}`, { [field]: value })
      await load()
      onChanged?.()
    } catch (err) {
      setError(err.message || 'Update failed')
    }
  }

  const escalate = async () => {
    try {
      await api.post(`/tickets/${ticketId}/escalate`)
      await load()
      onChanged?.()
    } catch (err) {
      setError(err.message || 'Escalation failed')
    }
  }

  const isStaff = viewerRole === 'support' || viewerRole === 'admin'

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="bg-bg border-l border-line w-full max-w-lg h-full flex flex-col">
        <div className="p-5 border-b border-line flex items-start justify-between">
          <div>
            <p className="eyebrow text-muted mb-1">{ticket?.ticketNo}</p>
            <h2 className="font-display text-xl">{ticket?.subject}</h2>
            {ticket?.escalated && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 mt-1">
                <ArrowUpCircle size={12} /> Escalated to admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isStaff && (
              <button onClick={deleteTicket} aria-label="Delete ticket" className="text-muted hover:text-red-600">
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={onClose} className="text-muted hover:text-ink"><X size={18} /></button>
          </div>
        </div>

        {ticket && (
          <div className="px-5 py-3 border-b border-line flex flex-wrap items-center gap-3 text-xs">
            <Pill tone={statusTone(ticket.status)}>{ticket.status}</Pill>
            <span className="text-muted">Priority: {ticket.priority}</span>
            <span className="text-muted">Customer: {ticket.customer}</span>
            <span className="text-muted">Assignee: {ticket.assignee}</span>

            {isStaff && (
              <div className="flex items-center gap-2 ml-auto">
                <select
                  defaultValue=""
                  onChange={(e) => { if (e.target.value) setField('status', e.target.value) }}
                  className="border border-line bg-bg px-2 py-1 text-xs"
                >
                  <option value="" disabled>Set status…</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                {viewerRole === 'support' && !ticket.escalated && (
                  <button onClick={escalate} className="border border-line px-2 py-1 flex items-center gap-1">
                    <ArrowUpCircle size={12} /> Escalate to admin
                  </button>
                )}
                {viewerRole === 'admin' && ticket.escalated && (
                  <button onClick={() => setField('escalated', false)} className="border border-line px-2 py-1">
                    Resolve escalation
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {messages.length === 0 && <p className="text-sm text-muted">No replies yet — start the conversation below.</p>}
          {messages.map((m) => {
            const canDelete = m.authorId === currentUserId || viewerRole === 'admin'
            return (
              <div key={m.id} className={`flex flex-col ${ROLE_ALIGN[m.authorRole] || 'items-start'}`}>
                <span className="text-[11px] text-muted mb-1 flex items-center gap-2">
                  {m.authorName || 'Unknown'} · {ROLE_LABEL[m.authorRole] || m.authorRole}
                  {canDelete && (
                    <button onClick={() => deleteMessage(m.id)} aria-label="Delete reply" className="text-muted hover:text-red-600">
                      <Trash2 size={11} />
                    </button>
                  )}
                </span>
                <div className={`max-w-[80%] px-3 py-2 text-sm ${ROLE_BUBBLE[m.authorRole] || 'bg-surface'}`}>
                  {m.body}
                </div>
                <span className="text-[10px] text-muted mt-1">{new Date(m.createdAt).toLocaleString()}</span>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="p-4 border-t border-line flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type a reply…"
            className="flex-1 border border-line px-3 py-2 text-sm bg-bg"
          />
          <button disabled={sending} className="bg-ink text-bg px-3 py-2 disabled:opacity-50">
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  )
}
