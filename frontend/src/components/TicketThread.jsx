import { useEffect, useRef, useState } from 'react'
import { X, Send } from 'lucide-react'
import { Pill, statusTone } from './ui'
import api from '../lib/api'

const ROLE_LABEL = { customer: 'You', support: 'Support agent', admin: 'Admin' }

export default function TicketThread({ ticketId, onClose }) {
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 text-black">
      <div className="bg-white border-l border-neutral-200 w-full max-w-md h-full flex flex-col">
        <div className="p-5 border-b border-neutral-200 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">{ticket?.ticketNo}</p>
            <h2 className="font-serif text-xl">{ticket?.subject}</h2>
            {ticket && <Pill tone={statusTone(ticket.status)}>{ticket.status}</Pill>}
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-black"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {error && <p className="text-red-600 text-xs">{error}</p>}
          {ticket?.description && (
            <div className="flex flex-col items-start">
              <span className="text-[11px] text-neutral-400 mb-1">You · Original request</span>
              <div className="max-w-[85%] px-3 py-2 bg-neutral-100">{ticket.description}</div>
            </div>
          )}
          {messages.map((m) => {
            const mine = m.authorRole === 'customer'
            return (
              <div key={m.id} className={`flex flex-col ${mine ? 'items-start' : 'items-end'}`}>
                <span className="text-[11px] text-neutral-400 mb-1">{ROLE_LABEL[m.authorRole] || m.authorRole}</span>
                <div className={`max-w-[85%] px-3 py-2 ${mine ? 'bg-neutral-100' : 'bg-black text-white'}`}>
                  {m.body}
                </div>
                <span className="text-[10px] text-neutral-400 mt-1">{new Date(m.createdAt).toLocaleString()}</span>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="p-4 border-t border-neutral-200 flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type a reply…"
            className="flex-1 border border-neutral-200 px-3 py-2 text-sm outline-none"
          />
          <button disabled={sending} className="bg-black text-white px-3 py-2 disabled:opacity-50">
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  )
}
