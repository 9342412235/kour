import { Routes, Route, Link } from 'react-router-dom'
import {
  ShoppingBag, Heart, Wallet, Bell, Plus, MapPin, CreditCard,
  Tag, Star, ShieldCheck, Smartphone, History as HistoryIcon, Trash2, Pencil
} from 'lucide-react'
import DashboardShell from '../../components/DashboardShell'
import TicketThread from '../../components/TicketThread'
import { useEffect, useState } from 'react'
import { StatCard, Pill, statusTone } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import api from '../../lib/api'

function useApiList(path, initial = []) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  const reload = () => {
    setLoading(true)
    return api.get(path).then(setData).catch(() => setData(initial)).finally(() => setLoading(false))
  }
  useEffect(() => { reload() }, [path])
  return [data, { loading, reload }]
}

// 1. Overview Section
function Overview() {
  const { userName, wishlist, notificationCount } = useApp()
  const [orders] = useApiList('/orders/my')
  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status))

  return (
    <div className="text-black">
      <h1 className="text-3xl tracking-wide mb-1 font-normal text-black">Welcome back, {userName.split(' ')[0]}</h1>
      <p className="text-xs text-neutral-500 tracking-tight mb-8">Here's what's happening with your account.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Active orders" value={activeOrders.length} icon={ShoppingBag} />
        <StatCard label="Wishlist" value={wishlist.length} icon={Heart} />
        <StatCard label="Total orders" value={orders.length} icon={Wallet} />
        <StatCard label="Notifications" value={notificationCount} icon={Bell} sub="unread" />
      </div>

      <div className="border border-neutral-200 rounded-none bg-white p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-400 font-medium mb-5">Recent orders</p>
        <div className="space-y-0 divide-y divide-neutral-100">
          {orders.slice(0, 3).map((o) => (
            <div key={o.id} className="flex items-center justify-between text-xs tracking-tight py-3.5 first:pt-0 last:pb-0">
              <span className="text-neutral-800 font-medium">{o.orderNumber} <span className="text-neutral-400 font-normal ml-2">· {o.items.length} items</span></span>
              <span className="text-[11px] uppercase tracking-wider border border-neutral-800 px-2 py-0.5 text-black font-medium">{o.status}</span>
            </div>
          ))}
          {orders.length === 0 && <p className="text-xs text-neutral-400 py-3">No orders yet — start shopping!</p>}
        </div>
      </div>
    </div>
  )
}

// 2. Orders List Section
function MyOrders() {
  const [orders, { loading }] = useApiList('/orders/my')
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  const downloadInvoice = (orderId, orderNumber) => {
    window.open(`${API_URL}/api/orders/${orderId}/invoice`, '_blank', 'noopener')
  }

  return (
    <div className="text-black">
      <h1 className="font-serif text-3xl tracking-wide mb-1 font-normal text-black">My orders</h1>
      <p className="text-xs text-neutral-500 tracking-tight mb-8">Track your orders and their status.</p>

      <div className="border border-neutral-200 rounded-none divide-y divide-neutral-200 bg-white">
        {loading && <p className="p-5 text-xs text-neutral-400">Loading…</p>}
        {orders.map((o) => (
          <div key={o.id} className="p-5 hover:bg-neutral-50/50 transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-3">
              <div className="md:col-span-4">
                <p className="text-xs font-medium tracking-tight text-black">{o.orderNumber}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{o.items.length} items · {new Date(o.createdAt).toLocaleDateString()}</p>
                {o.invoiceNumber && (
                  <p className="text-[10px] text-neutral-400 mt-0.5">Invoice: {o.invoiceNumber}</p>
                )}
              </div>
              <div className="md:col-span-3">
                <span className="text-[10px] uppercase tracking-wider border border-neutral-300 px-2 py-0.5 text-neutral-600 font-medium bg-white">{o.status}</span>
              </div>
              <div className="md:col-span-3">
                <p className="text-xs font-medium text-black">${o.total.toFixed(2)}</p>
                {o.taxRatePercent > 0 && (
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    incl. {o.taxLabel || 'Tax'} ({o.taxRatePercent}%) ${o.taxAmount.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="md:col-span-2 flex md:justify-end items-center gap-3 text-[11px] uppercase tracking-wider font-medium text-neutral-400">
                <span>{o.paymentStatus}</span>
                <button
                  onClick={() => downloadInvoice(o.id, o.orderNumber)}
                  title="Download Invoice PDF"
                  className="text-[10px] uppercase tracking-wider border border-neutral-300 px-2 py-0.5 text-neutral-600 hover:bg-black hover:text-white hover:border-black transition-colors"
                >
                  Invoice
                </button>
              </div>
            </div>
            {(o.shippingAddress || o.paymentMethod || o.notes) && (
              <div className="mt-3 pt-3 border-t border-neutral-100 text-[11px] text-neutral-500 flex flex-wrap gap-x-6 gap-y-1">
                {o.shippingAddress && (
                  <span>
                    Ship to: {o.shippingAddress.line1}{o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ''}, {o.shippingAddress.city} {o.shippingAddress.postalCode}
                  </span>
                )}
                {o.paymentMethod && <span className="uppercase tracking-wider">Payment: {o.paymentMethod === 'cod' ? 'Cash on delivery' : o.paymentMethod}</span>}
                {o.notes && <span>Note: {o.notes}</span>}
              </div>
            )}
          </div>
        ))}
        {!loading && orders.length === 0 && (
          <div className="p-12 text-center text-xs text-neutral-400">You haven't placed any orders yet.</div>
        )}
      </div>
    </div>
  )
}

// 3. Wishlist Grid Section
function Wishlist() {
  const { wishlist, toggleWishlist, addToCart } = useApp()
  const [products, setProducts] = useState([])

  useEffect(() => {
    if (wishlist.length === 0) { setProducts([]); return }
    api.get('/products?limit=200').then((d) => setProducts((d.products || []).filter((p) => wishlist.includes(p.id))))
  }, [wishlist])

  return (
    <div className="text-black">
      <h1 className="font-serif text-3xl tracking-wide mb-1 font-normal text-black">Wishlist</h1>
      <p className="text-xs text-neutral-500 tracking-tight mb-8">Saved for later.</p>

      {products.length === 0 ? (
        <div className="border border-neutral-200 p-12 text-center text-xs text-neutral-400 tracking-tight bg-white">
          Nothing saved yet — browse the shop and tap the heart icon.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {products.map((p) => (
            <div key={p.id} className="border border-neutral-200 rounded-none p-5 flex items-center justify-between bg-white gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-black tracking-tight truncate">{p.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">${p.price.toFixed(2)}</p>
              </div>
              <div className="flex gap-4 text-[11px] uppercase tracking-wider font-medium shrink-0">
                <button onClick={() => addToCart(p)} className="text-black hover:opacity-60 underline underline-offset-4 decoration-neutral-200">Add to bag</button>
                <button onClick={() => toggleWishlist(p.id)} className="text-neutral-400 hover:text-black">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 4. Support Tickets Log
function TicketsPage() {
  const [tickets, { loading, reload }] = useApiList('/tickets/my')
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTicketId, setActiveTicketId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!subject.trim()) return
    setSubmitting(true)
    setError('')
    try {
      if (editingId) {
        await api.patch(`/tickets/${editingId}`, { subject, description })
      } else {
        await api.post('/tickets', { subject, description })
      }
      setSubject(''); setDescription(''); setOpen(false); setEditingId(null)
      reload()
    } catch (err) {
      setError(err.message || 'Could not save ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (t) => {
    setEditingId(t.id)
    setSubject(t.subject)
    setDescription(t.description || '')
    setOpen(true)
  }

  const cancelForm = () => {
    setOpen(false); setEditingId(null); setSubject(''); setDescription(''); setError('')
  }

  const removeTicket = async (t) => {
    if (!window.confirm(`Delete ticket ${t.ticketNo}? This can't be undone.`)) return
    try {
      await api.delete(`/tickets/${t.id}`)
      reload()
    } catch (err) {
      alert(err.message || 'Could not delete ticket')
    }
  }

  return (
    <div className="text-black">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl tracking-wide mb-1 font-normal text-black">Support tickets</h1>
          <p className="text-xs text-neutral-500 tracking-tight">Raised tickets and their current status.</p>
        </div>
        <button onClick={() => (open ? cancelForm() : setOpen(true))} className="flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 text-xs uppercase tracking-wider font-medium hover:bg-neutral-800 transition-colors rounded-none w-fit">
          <Plus size={14} /> Raise ticket
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="border border-neutral-200 bg-white p-5 mb-6 space-y-3">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full border border-neutral-200 px-3 py-2 text-xs outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue…"
            rows={3}
            className="w-full border border-neutral-200 px-3 py-2 text-xs outline-none"
          />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting} className="bg-black text-white px-4 py-2 text-xs uppercase tracking-wider disabled:opacity-50">
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Submit ticket'}
            </button>
            <button type="button" onClick={cancelForm} className="text-xs text-neutral-500 hover:text-black underline underline-offset-2">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="border border-neutral-200 rounded-none divide-y divide-neutral-100 bg-white">
        {loading && <p className="p-5 text-xs text-neutral-400">Loading…</p>}
        {tickets.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-4 text-xs gap-4">
            <span className="text-neutral-800 font-medium">{t.ticketNo} — {t.subject}</span>
            <div className="flex items-center gap-4">
              <Pill tone={statusTone(t.status)}>{t.status}</Pill>
              <button onClick={() => setActiveTicketId(t.id)} className="underline underline-offset-2 hover:opacity-60">View / Reply</button>
              {t.status === 'open' && (
                <button onClick={() => startEdit(t)} aria-label="Edit ticket" className="text-neutral-400 hover:text-black">
                  <Pencil size={13} />
                </button>
              )}
              <button onClick={() => removeTicket(t)} aria-label="Delete ticket" className="text-neutral-400 hover:text-red-600">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {!loading && tickets.length === 0 && (
          <div className="p-12 text-center text-xs text-neutral-400">
            You haven't raised any tickets yet. Need help with an order? Start a new ticket above.
          </div>
        )}
      </div>

      {activeTicketId && (
        <TicketThread ticketId={activeTicketId} onClose={() => { setActiveTicketId(null); reload() }} />
      )}
    </div>
  )

}

// 5. Saved Addresses Section
function Addresses() {
  const [addresses, { loading, reload }] = useApiList('/addresses')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ label: 'Home', line1: '', city: '', postalCode: '' })
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/addresses', form)
      setForm({ label: 'Home', line1: '', city: '', postalCode: '' })
      setOpen(false)
      reload()
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (id) => {
    await api.delete(`/addresses/${id}`)
    reload()
  }

  return (
    <div className="text-black">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl tracking-wide mb-1 font-normal text-black">Addresses</h1>
          <p className="text-xs text-neutral-500 tracking-tight">Manage delivery addresses.</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 text-xs uppercase tracking-wider font-medium hover:bg-neutral-800 transition-colors rounded-none w-fit">
          <Plus size={14} /> Add address
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="border border-neutral-200 bg-white p-5 mb-6 grid sm:grid-cols-2 gap-3">
          <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Label (e.g. Home)" className="border border-neutral-200 px-3 py-2 text-xs outline-none" />
          <input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} placeholder="Address line" required className="border border-neutral-200 px-3 py-2 text-xs outline-none" />
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" required className="border border-neutral-200 px-3 py-2 text-xs outline-none" />
          <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="Postal code" required className="border border-neutral-200 px-3 py-2 text-xs outline-none" />
          <button type="submit" disabled={submitting} className="sm:col-span-2 bg-black text-white px-4 py-2 text-xs uppercase tracking-wider disabled:opacity-50">
            {submitting ? 'Saving…' : 'Save address'}
          </button>
        </form>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {loading && <p className="text-xs text-neutral-400">Loading…</p>}
        {addresses.map((a) => (
          <div key={a.id} className="border border-neutral-200 rounded-none p-6 bg-white relative flex flex-col justify-between min-h-[120px]">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs uppercase tracking-wider font-semibold text-black flex items-center gap-2">
                <MapPin size={13} className="text-neutral-400" /> {a.label}
              </p>
              <div className="flex items-center gap-2">
                {a.is_default && <span className="text-[10px] uppercase tracking-wider border border-black bg-black text-white px-2 py-0.5 font-medium">Default</span>}
                <button onClick={() => remove(a.id)} className="text-neutral-400 hover:text-black"><Trash2 size={13} /></button>
              </div>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-[90%]">{a.line1}, {a.city} {a.postal_code}</p>
          </div>
        ))}
        {!loading && addresses.length === 0 && (
          <div className="border border-neutral-200 p-12 text-center text-xs text-neutral-400 col-span-2">No saved addresses yet.</div>
        )}
      </div>
    </div>
  )
}

// 6. Payments History Section
function Payments() {
  const [orders] = useApiList('/orders/my')
  return (
    <div className="text-black">
      <h1 className="font-serif text-3xl tracking-wide mb-1 font-normal text-black">Payments</h1>
      <p className="text-xs text-neutral-500 tracking-tight mb-8">Payment status for each order.</p>

      <div className="border border-neutral-200 rounded-none divide-y divide-neutral-100 bg-white">
        {orders.slice(0, 8).map((o) => (
          <div key={o.id} className="grid grid-cols-4 items-center p-4 text-xs tracking-tight hover:bg-neutral-50/50 transition-colors gap-2">
            <span className="font-medium text-neutral-800">{o.orderNumber}</span>
            <span className="text-neutral-400 text-[11px]">{new Date(o.createdAt).toLocaleDateString()}</span>
            <span className="font-medium text-black">${o.total.toFixed(2)}</span>
            <span className="text-right text-[11px] uppercase tracking-wider text-neutral-500">{o.paymentStatus}</span>
          </div>
        ))}
        {orders.length === 0 && <p className="p-5 text-xs text-neutral-400">No payments yet.</p>}
      </div>
    </div>
  )
}

// 7. Offers & Promotional Coupons View
function Offers() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCoupons = () => {
    api.get('/coupons/active')
      .then(data => { setCoupons(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchCoupons()
    const id = setInterval(fetchCoupons, 5000) // Poll every 5s to sync changes instantly
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-black">
      <h1 className="font-serif text-3xl tracking-wide mb-1 font-normal text-black">Offers & coupons</h1>
      <p className="text-xs text-neutral-500 tracking-tight mb-8">Available promotions — apply them at checkout.</p>

      <div className="border border-neutral-200 rounded-none divide-y divide-neutral-200 bg-white">
        {loading && <p className="p-5 text-xs text-neutral-400">Loading…</p>}
        {!loading && coupons.length === 0 && (
          <p className="p-5 text-xs text-neutral-400">No offers currently available.</p>
        )}
        {coupons.map((c) => (
          <div key={c.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 text-xs tracking-tight gap-4">
            <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-black min-w-[120px] shrink-0">
              <Tag size={13} className="text-neutral-400" /> {c.code}
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-neutral-800 font-medium text-xs">
                {c.description || (c.type === 'percentage' ? `${parseFloat(c.value)}% off your order` : `$${parseFloat(c.value).toFixed(2)} off your order`)}
              </span>
              <div className="flex flex-wrap gap-4 text-neutral-500 text-[11px]">
                <span>Discount: {c.type === 'percentage' ? `${parseFloat(c.value)}%` : `$${parseFloat(c.value).toFixed(2)}`}</span>
                {parseFloat(c.min_purchase) > 0 && <span>Min. purchase: ${parseFloat(c.min_purchase).toFixed(2)}</span>}
                {c.expiry_date && <span>Expires: {new Date(c.expiry_date).toLocaleDateString()}</span>}
              </div>
            </div>
            <div className="shrink-0">
              <Pill tone={c.status === 'active' ? 'success' : 'neutral'}>{c.status}</Pill>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 8. System Notifications Center
function Notifications() {
  const [items, { loading, reload }] = useApiList('/notifications')
  const { refreshNotifications } = useApp()

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`)
    reload()
    refreshNotifications()
  }

  return (
    <div className="text-black">
      <h1 className="font-serif text-3xl tracking-wide mb-1 font-normal text-black">Notifications</h1>
      <p className="text-xs text-neutral-500 tracking-tight mb-8">Order updates, offers, and ticket replies.</p>

      <div className="border border-neutral-200 rounded-none divide-y divide-neutral-100 bg-white">
        {loading && <p className="p-5 text-xs text-neutral-400">Loading…</p>}
        {items.map((n) => (
          <button key={n.id} onClick={() => !n.is_read && markRead(n.id)} className="w-full flex items-center justify-between p-4.5 text-xs tracking-tight hover:bg-neutral-50/30 transition-colors gap-4 text-left">
            <span className="flex items-center gap-3 text-neutral-800 min-w-0">
              <Bell size={13} className={n.is_read ? 'text-neutral-300' : 'text-black'} />
              <span className={`truncate ${n.is_read ? 'text-neutral-400' : ''}`}>{n.title}</span>
            </span>
            <span className="text-neutral-400 text-[11px] flex-shrink-0">{new Date(n.created_at).toLocaleDateString()}</span>
          </button>
        ))}
        {!loading && items.length === 0 && <p className="p-5 text-xs text-neutral-400">No notifications yet.</p>}
      </div>
    </div>
  )
}

// 9. Personal Reviews Ledger
function MyReviews() {
  const [eligible, { loading, reload }] = useApiList('/reviews/my-eligible')
  
  // review form state per product
  const [forms, setForms] = useState({})
  
  const handleRating = (productId, rating) => {
    setForms(prev => ({ ...prev, [productId]: { ...prev[productId], rating } }))
  }
  const handleText = (productId, text) => {
    setForms(prev => ({ ...prev, [productId]: { ...prev[productId], text } }))
  }
  const submitReview = async (productId) => {
    const f = forms[productId]
    if (!f || !f.rating || !f.text) return alert('Rating and text required')
    try {
      await api.post(`/reviews/product/${productId}`, { rating: f.rating, text: f.text })
      reload()
    } catch (e) {
      alert(e.message)
    }
  }

  // Pre-fill forms when eligible changes
  useEffect(() => {
    const initialForms = {}
    eligible.forEach(p => {
      if (p.reviewId) {
        initialForms[p.productId] = { rating: p.rating, text: p.text }
      } else {
        initialForms[p.productId] = { rating: 0, text: '' }
      }
    })
    setForms(initialForms)
  }, [eligible])

  return (
    <div className="text-black">
      <h1 className="font-serif text-3xl tracking-wide mb-1 font-normal text-black">My reviews</h1>
      <p className="text-xs text-neutral-500 tracking-tight mb-8">Products you've purchased that are eligible for review.</p>

      <div className="space-y-6">
        {loading && <p className="text-xs text-neutral-400">Loading…</p>}
        {eligible.map((p) => (
          <div key={p.productId} className="border border-neutral-200 bg-white p-5 flex flex-col md:flex-row gap-6">
            <div className="shrink-0 w-24 h-24 bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden">
              {p.image ? (
                <img src={p.image} alt={p.product} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag size={24} className="text-neutral-300" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm text-black mb-2">{p.product}</h3>
              
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => handleRating(p.productId, star)}>
                    <Star size={16} fill={star <= (forms[p.productId]?.rating || 0) ? "var(--ink)" : "none"} className={star <= (forms[p.productId]?.rating || 0) ? "text-ink" : "text-line"} />
                  </button>
                ))}
              </div>
              
              <textarea
                value={forms[p.productId]?.text || ''}
                onChange={(e) => handleText(p.productId, e.target.value)}
                placeholder="Write your review here..."
                rows={3}
                className="w-full border border-neutral-200 px-3 py-2 text-xs outline-none mb-3 resize-none focus:border-black"
              />
              
              <button 
                onClick={() => submitReview(p.productId)}
                className="bg-black text-white px-5 py-2 text-xs uppercase tracking-wider font-medium hover:bg-neutral-800 transition-colors"
              >
                {p.reviewId ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </div>
        ))}
        {!loading && eligible.length === 0 && (
          <div className="border border-neutral-200 p-12 text-center text-xs text-neutral-400 bg-white">
            You haven't purchased any eligible products yet.
          </div>
        )}
      </div>
    </div>
  )
}

// 10. Security Layout Details
function Security() {
  const { user } = useApp()
  return (
    <div className="text-black">
      <h1 className="font-serif text-3xl tracking-wide mb-1 font-normal text-black">Security & settings</h1>
      <p className="text-xs text-neutral-500 tracking-tight mb-8">Manage your profile and password.</p>

      <div className="border border-neutral-200 rounded-none divide-y divide-neutral-200 bg-white">
        <div className="flex items-center justify-between p-5 text-xs tracking-tight gap-4">
          <span className="flex items-center gap-3 text-neutral-800 font-medium">
            <ShieldCheck size={14} className="text-neutral-400" /> Sign-in method
          </span>
          <span className="text-neutral-500 text-xs shrink-0">{user?.hasPassword ? 'Email & password' : 'Google'}</span>
        </div>
        <div className="flex items-center justify-between p-5 text-xs tracking-tight gap-4">
          <span className="flex items-center gap-3 text-neutral-800 font-medium">
            <Smartphone size={14} className="text-neutral-400" /> Profile & password
          </span>
          <Link to="/profile" className="text-[10px] uppercase tracking-wider border border-black bg-black text-white px-3 py-1.5 font-medium shrink-0">Edit profile</Link>
        </div>
      </div>
    </div>
  )
}

// 11. Account History
function History() {
  const [history, { loading }] = useApiList('/users/history')
  return (
    <div className="text-black">
      <h1 className="font-serif text-3xl tracking-wide mb-1 font-normal text-black">Account history</h1>
      <p className="text-xs text-neutral-500 tracking-tight mb-8">Recent login activities for your account.</p>

      <div className="border border-neutral-200 rounded-none divide-y divide-neutral-100 bg-white">
        {loading && <p className="p-5 text-xs text-neutral-400">Loading…</p>}
        {history.map((h) => (
          <div key={h.id} className="grid grid-cols-4 items-center p-4 text-xs tracking-tight hover:bg-neutral-50/50 transition-colors gap-2">
            <span className="font-medium text-neutral-800">{new Date(h.createdAt).toLocaleString()}</span>
            <span className="text-neutral-400 text-[11px] truncate">{h.userAgent || 'Unknown device'}</span>
            <span className="font-mono text-neutral-500">{h.ipAddress || 'Unknown IP'}</span>
            <span className="text-right text-[11px] uppercase tracking-wider">
              <Pill tone={h.status === 'success' ? 'success' : 'critical'}>{h.status}</Pill>
            </span>
          </div>
        ))}
        {!loading && history.length === 0 && <p className="p-5 text-xs text-neutral-400">No login history found.</p>}
      </div>
    </div>
  )
}

export default function CustomerDashboard() {
  return (
    <DashboardShell>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="addresses" element={<Addresses />} />
        <Route path="payments" element={<Payments />} />
        <Route path="offers" element={<Offers />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="reviews" element={<MyReviews />} />
        <Route path="history" element={<History />} />
        <Route path="security" element={<Security />} />
      </Routes>
    </DashboardShell>
  )
}
