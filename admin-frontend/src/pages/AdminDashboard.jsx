import { Routes, Route, Link } from 'react-router-dom'
import {
  Users as UsersIcon, Package, DollarSign, Ticket, TrendingUp,
  Plus, Download, AlertTriangle, UploadCloud, Loader2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import DashboardShell from '../components/DashboardShell'
import ProductFormModal from '../components/ProductFormModal'
import CrmPage from '../components/CrmPage'
import OffersPage from '../components/OffersPage'
import TicketThread from '../components/TicketThread'
import ManagementPage from '../components/ManagementPage'
import { StatCard, Pill, statusTone } from '../components/ui'
import { useApp } from '../context/AppContext'
import api from '../lib/api'

function useOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    (async () => {
      try {
        setData(await api.get('/admin/overview'))
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])
  return { data, loading }
}

function useResource(path) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get(path)
      setItems(Array.isArray(data) ? data : data.items || data.products || [])
      setError('')
    } catch (err) {
      setError(err.message || `Failed to load ${path}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [path])
  return { items, loading, error, reload: load }
}

function Overview() {
  const { data } = useOverview()
  const { items: orders } = useResource('/orders')
  const { items: stockAlerts } = useResource('/products/low-stock')

  return (
    <div className="w-full space-y-8 pb-12">
      <div>
        <h1 className="font-display text-4xl mb-2">Overview</h1>
        <p className="text-base text-muted">Everything happening across the platform, at a glance.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        <StatCard label="Total revenue" value={`$${(data?.totalRevenue ?? 0).toLocaleString()}`} icon={DollarSign} className="p-6 text-lg w-full" />
        <StatCard label="Orders" value={data?.totalOrders ?? 0} icon={Package} className="p-6 text-lg w-full" />
        <StatCard label="Active users" value={data?.activeUsers ?? 0} sub={`${data?.disabledUsers ?? 0} disabled`} icon={UsersIcon} className="p-6 text-lg w-full" />
        <StatCard label="Open tickets" value={data?.openTickets ?? 0} sub={`${data?.overdueTickets ?? 0} overdue SLA`} icon={Ticket} className="p-6 text-lg w-full" />
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full">
        <div className="border border-line p-8 flex flex-col justify-between min-h-[340px] bg-white w-full">
          <div className="w-full">
            <p className="eyebrow text-muted text-sm mb-6 tracking-wider">Recent orders</p>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-line/60 bg-neutral-50/50 w-full rounded-sm">
                <Package size={36} className="text-neutral-300 mb-3 stroke-[1.2]" />
                <p className="text-base font-medium text-neutral-600">No incoming orders</p>
                <p className="text-sm text-muted max-w-sm mt-1">When users purchase items, they will appear here dynamically.</p>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {orders.slice(0, 4).map((o) => (
                  <div key={o.id} className="flex items-center justify-between text-base border-b border-line/40 pb-2 last:border-0 w-full">
                    <span className="font-medium">{o.orderNumber} — {o.customer}</span>
                    <Pill tone={statusTone(o.status)}>{o.status}</Pill>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link to="/dashboard/orders" className="eyebrow text-sm text-muted mt-6 inline-block hover:text-black transition-colors">View all orders →</Link>
        </div>

        <div className="border border-line p-8 flex flex-col justify-between min-h-[340px] bg-white w-full">
          <div className="w-full">
            <p className="eyebrow text-muted text-sm mb-6 tracking-wider">Low stock alerts</p>
            {stockAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-line/60 bg-neutral-50/50 w-full rounded-sm">
                <AlertTriangle size={36} className="text-neutral-300 mb-3 stroke-[1.2]" />
                <p className="text-base font-medium text-neutral-600">Inventory looks healthy</p>
                <p className="text-sm text-muted max-w-sm mt-1">All standard metrics securely remain above minimum thresholds.</p>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {stockAlerts.map((s) => (
                  <div key={s.sku} className="flex items-center justify-between text-base border-b border-line/40 pb-2 last:border-0 w-full">
                    <span className="flex items-center gap-3"><AlertTriangle size={16} className="text-amber-600" /> {s.name}</span>
                    <span className="text-muted font-medium">{s.stock} left</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link to="/dashboard/warehouse" className="eyebrow text-sm text-muted mt-6 inline-block hover:text-black transition-colors">View warehouse →</Link>
        </div>
      </div>
    </div>
  )
}

const ROLES = ['warehouse', 'support', 'blogger', 'customer']

// Replaced fixed column percentage widths with automatic stretching configurations
function UsersPage() {
  const { items: users, error, reload } = useResource('/users')

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/users/${id}/role`, { role })
      reload()
    } catch (err) {
      alert(err.message || 'Failed to update role')
    }
  }

  const toggleStatus = async (u) => {
    try {
      await api.patch(`/users/${u.id}/status`, { status: u.status === 'active' ? 'disabled' : 'active' })
      reload()
    } catch (err) {
      alert(err.message || 'Failed to update status')
    }
  }

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h1 className="font-display text-4xl mb-2">Users</h1>
        <p className="text-base text-muted">Assign roles and manage account status globally.</p>
      </div>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="border border-line overflow-x-auto bg-white w-full">
        <table className="w-full text-base layout-auto">
          <thead>
            <tr className="border-b border-line text-left text-muted eyebrow bg-neutral-50/50">
              <th className="p-5">Name</th>
              <th className="p-5">Email</th>
              <th className="p-5">Role</th>
              <th className="p-5">Status</th>
              <th className="p-5">Joined</th>
              <th className="p-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-muted text-center">No users found.</td></tr>
            )}
            {users.map((u) => {
              const locked = u.role === 'admin'
              return (
              <tr key={u.id} className="border-b border-line last:border-0 hover:bg-neutral-50/40 transition-colors">
                <td className="p-5 font-medium">{u.name}</td>
                <td className="p-5 text-muted">{u.email}</td>
                <td className="p-5">
                  {locked ? (
                    <Pill tone="neutral">{u.role}</Pill>
                  ) : (
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="bg-transparent border border-line text-sm px-3 py-1.5 rounded-sm w-full max-w-[140px] focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}
                </td>
                <td className="p-5"><Pill tone={statusTone(u.status)}>{u.status}</Pill></td>
                <td className="p-5 text-muted">{u.joined ? new Date(u.joined).toLocaleDateString() : '—'}</td>
                <td className="p-5 text-right">
                  {!locked && (
                    <button onClick={() => toggleStatus(u)} className="eyebrow text-sm text-neutral-600 hover:text-black transition-colors">
                      {u.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OrdersPage() {
  const { items: orders, error, reload } = useResource('/orders')

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h1 className="font-display text-4xl mb-2">Orders</h1>
        <p className="text-base text-muted">View, edit, cancel, refund, and assign orders seamlessly.</p>
      </div>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="border border-line overflow-x-auto bg-white w-full">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-line text-left text-muted eyebrow bg-neutral-50/50">
              <th className="p-5">Order ID</th>
              <th className="p-5">Customer</th>
              <th className="p-5">Date</th>
              <th className="p-5 text-right">Total</th>
              <th className="p-5 text-center">Payment Matrix</th>
              <th className="p-5 text-center">Fulfillment Status</th>
              <th className="p-5 text-right">State Badge</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-muted text-center">No orders found.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0 hover:bg-neutral-50/40 transition-colors">
                <td className="p-5 font-mono font-medium">{o.orderNumber}</td>
                <td className="p-5 font-medium">{o.customer}</td>
                <td className="p-5 text-muted">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</td>
                <td className="p-5 text-right font-mono font-semibold">${Number(o.total).toFixed(2)}</td>
                <td className="p-5 text-center">
                  <select
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) api.patch(`/orders/${o.id}/payment`, { paymentStatus: e.target.value }).then(reload) }}
                    className="bg-transparent border border-line text-sm px-3 py-1.5 rounded-sm w-36 focus:outline-none focus:ring-1 focus:ring-black mx-auto"
                  >
                    <option value="" disabled>{o.paymentStatus}</option>
                    <option value="unpaid">unpaid</option>
                    <option value="paid">paid</option>
                    <option value="refunded">refunded</option>
                  </select>
                </td>
                <td className="p-5 text-center">
                  <select
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) api.patch(`/orders/${o.id}/status`, { status: e.target.value }).then(reload) }}
                    className="bg-transparent border border-line text-sm px-3 py-1.5 rounded-sm w-36 focus:outline-none focus:ring-1 focus:ring-black mx-auto"
                  >
                    <option value="" disabled>{o.status}</option>
                    <option value="pending">pending</option>
                    <option value="processing">processing</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </td>
                <td className="p-5 text-right"><Pill tone={statusTone(o.status)}>{o.status}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function WarehousePage() {
  const { items: products } = useResource('/products')
  const { items: stockAlerts } = useResource('/products/low-stock')

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h1 className="font-display text-4xl mb-2">Warehouse Logs</h1>
        <p className="text-base text-muted">Real-time stock tracking indexes across regional infrastructure centers.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mb-8 w-full">
        <StatCard label="SKUs Tracked" value={products.length} className="p-6 w-full" />
        <StatCard label="Low Stock Line Items" value={stockAlerts.length} sub="Failing safe margins" className="p-6 w-full" />
      </div>
      <div className="border border-line overflow-x-auto bg-white w-full">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-line text-left text-muted eyebrow bg-neutral-50/50">
              <th className="p-5">SKU Unit</th>
              <th className="p-5">Product Name</th>
              <th className="p-5 text-right">Available Stock</th>
              <th className="p-5 text-right">Critical Limit</th>
              <th className="p-5 text-right">Assigned Hub</th>
            </tr>
          </thead>
          <tbody>
            {stockAlerts.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-muted text-center">Nothing currently matches critical variance thresholds.</td></tr>
            )}
            {stockAlerts.map((s) => (
              <tr key={s.sku} className="border-b border-line last:border-0 hover:bg-neutral-50/40 transition-colors">
                <td className="p-5 font-mono text-muted">{s.sku}</td>
                <td className="p-5 font-medium">{s.name}</td>
                <td className="p-5 text-right font-semibold text-amber-700">{s.stock} remaining</td>
                <td className="p-5 text-right text-muted font-mono">{s.lowStockThreshold}</td>
                <td className="p-5 text-right text-muted font-medium">{s.warehouse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TicketsPage() {
  const { items: tickets, error, reload } = useResource('/tickets')
  const { user } = useApp()
  const [openTicketId, setOpenTicketId] = useState(null)

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h1 className="font-display text-4xl mb-2">Support Tickets</h1>
        <p className="text-base text-muted">Track queues, handle SLAs, assign team leads, and view histories.</p>
      </div>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="border border-line overflow-x-auto bg-white w-full">
        {/* Removed w-[30%] and forced table headers to distribute alignment context cleanly */}
        <table className="w-full text-base table-auto">
          <thead>
            <tr className="border-b border-line text-left text-muted eyebrow bg-neutral-50/50">
              <th className="p-5">Ticket Reference</th>
              <th className="p-5">Subject Line</th>
              <th className="p-5">Priority Index</th>
              <th className="p-5">Status Pipeline</th>
              <th className="p-5">Lead Assignee</th>
              <th className="p-5">SLA Countdown</th>
              <th className="p-5 text-right">Action Interface</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-muted text-center">No active tickets inside this layout layer.</td></tr>
            )}
            {tickets.map((t) => (
              <tr key={t.id} className={`border-b border-line last:border-0 hover:bg-neutral-50/30 transition-colors ${t.escalated ? 'bg-amber-50/30 hover:bg-amber-50/50' : ''}`}>
                <td className="p-5 font-mono font-medium">
                  {t.ticketNo}
                  {t.escalated && <span className="ml-3 text-[10px] tracking-wide bg-amber-100 text-amber-900 border border-amber-200 font-bold px-2 py-0.5 rounded-sm uppercase">Escalated</span>}
                </td>
                <td className="p-5 font-medium">{t.subject}</td>
                <td className="p-5"><Pill tone={t.priority === 'urgent' ? 'warning' : 'neutral'}>{t.priority}</Pill></td>
                <td className="p-5">
                  <select
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) api.patch(`/tickets/${t.id}`, { status: e.target.value }).then(reload) }}
                    className="bg-transparent border border-line text-sm px-3 py-1.5 rounded-sm w-32 focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="" disabled>{t.status}</option>
                    <option value="open">open</option>
                    <option value="in_progress">in_progress</option>
                    <option value="resolved">resolved</option>
                  </select>
                </td>
                <td className="p-5 text-muted">{t.assignee}</td>
                <td className="p-5 text-muted font-mono text-sm">{t.slaDueAt ? new Date(t.slaDueAt).toLocaleString() : '—'}</td>
                <td className="p-5 text-right"><button onClick={() => setOpenTicketId(t.id)} className="eyebrow text-sm text-black underline underline-offset-4 hover:opacity-60 transition-opacity">Open Thread</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openTicketId && (
        <TicketThread
          ticketId={openTicketId}
          viewerRole="admin"
          currentUserId={user?.id}
          onClose={() => setOpenTicketId(null)}
          onChanged={reload}
        />
      )}
    </div>
  )
}

function BlogPage() {
  const { items: blogPosts, error, reload } = useResource('/blog')

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h1 className="font-display text-4xl mb-2">Editorial Blog Hub</h1>
        <p className="text-base text-muted">Moderate submissions, design pipelines, verify authors, and check visibility metrics.</p>
      </div>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="border border-line overflow-x-auto bg-white w-full">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-line text-left text-muted eyebrow bg-neutral-50/50">
              <th className="p-5">Post Title Header</th>
              <th className="p-5">Author</th>
              <th className="p-5">Visibility State</th>
              <th className="p-5">Calendar Timestamp</th>
              <th className="p-5 text-right">View Counts</th>
              <th className="p-5 text-right">Review Action</th>
            </tr>
          </thead>
          <tbody>
            {blogPosts.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-muted text-center">No posts indexed in the content schema.</td></tr>
            )}
            {blogPosts.map((b) => (
              <tr key={b.id} className="border-b border-line last:border-0 hover:bg-neutral-50/40 transition-colors">
                <td className="p-5 font-semibold text-neutral-800">{b.title}</td>
                <td className="p-5 text-muted font-medium">{b.author}</td>
                <td className="p-5"><Pill tone={statusTone(b.status)}>{b.status}</Pill></td>
                <td className="p-5 text-muted">{b.date ? new Date(b.date).toLocaleDateString() : '—'}</td>
                <td className="p-5 text-right font-mono font-medium">{(b.views || 0).toLocaleString()}</td>
                <td className="p-5 text-right">
                  <select
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) api.patch(`/blog/${b.id}`, { status: e.target.value }).then(reload) }}
                    className="bg-transparent border border-line text-sm px-3 py-1.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="" disabled>Review state…</option>
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CatalogPage() {
  const { items: products, error, reload } = useResource('/products?limit=200')
  const { items: categories } = useResource('/products/categories')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const openAdd = () => { setEditingProduct(null); setModalOpen(true) }
  const openEdit = (p) => { setEditingProduct(p); setModalOpen(true) }

  const deactivate = async (p) => {
    if (!confirm(`Remove "${p.name}" from the catalog?`)) return
    await api.delete(`/products/${p.id}`)
    reload()
  }

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex items-center justify-between mb-2 w-full">
        <div>
          <h1 className="font-display text-4xl mb-2">Products</h1>
          <p className="text-base text-muted">Manage store definitions, track price matrix configurations, and run changes.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-neutral-800 transition-colors"><Plus size={16} /> Add new item</button>
      </div>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="border border-line overflow-x-auto bg-white w-full">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-line text-left text-muted eyebrow bg-neutral-50/50">
              <th className="p-5">SKU Tag</th>
              <th className="p-5">Product Detail Label</th>
              <th className="p-5">Category Context</th>
              <th className="p-5 text-right">Retail Price</th>
              <th className="p-5 text-right">Units on Hand</th>
              <th className="p-5 text-right">Action Hooks</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-muted text-center">No catalog objects found.</td></tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-neutral-50/40 transition-colors">
                <td className="p-5 font-mono text-sm text-muted">{p.sku}</td>
                <td className="p-5 font-semibold text-neutral-800">{p.name}</td>
                <td className="p-5 text-muted capitalize font-medium">{p.category}</td>
                <td className="p-5 text-right font-mono font-medium">${Number(p.price).toFixed(2)}</td>
                <td className="p-5 text-right font-medium">{p.stock}</td>
                <td className="p-5 text-right space-x-4">
                  <button onClick={() => openEdit(p)} className="eyebrow text-sm text-black underline underline-offset-4 hover:opacity-60 transition-opacity">Edit</button>
                  <button onClick={() => deactivate(p)} className="eyebrow text-sm text-neutral-400 hover:text-red-600 transition-colors">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProductFormModal
        open={modalOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSaved={reload}
      />
    </div>
  )
}

function CategoriesPage() {
  const { items: categories, error, reload } = useResource('/products/categories')
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState('')

  const addCategory = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    setLocalError('')
    try {
      await api.post('/products/categories', { name: trimmed })
      setName('')
      reload()
    } catch (err) {
      setLocalError(err.message || 'Failed to add category')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (c) => { setEditingId(c.id); setEditingName(c.name) }
  const cancelEdit = () => { setEditingId(null); setEditingName('') }

  const saveEdit = async (c) => {
    const trimmed = editingName.trim()
    if (!trimmed) return
    setSaving(true)
    setLocalError('')
    try {
      await api.patch(`/products/categories/${c.id}`, { name: trimmed })
      cancelEdit()
      reload()
    } catch (err) {
      setLocalError(err.message || 'Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  const removeCategory = async (c) => {
    if (!confirm(`Delete category "${c.name}"?`)) return
    try {
      await api.delete(`/products/categories/${c.id}`)
      reload()
    } catch (err) {
      setLocalError(err.message || 'Failed to delete category')
    }
  }

  return (
    <div className="w-full space-y-6 pb-12 max-w-2xl">
      <div>
        <h1 className="font-display text-4xl mb-2">Categories</h1>
        <p className="text-base text-muted">Create, rename, and remove the product categories used across the catalog.</p>
      </div>

      {(error || localError) && <p className="text-sm text-red-600">{error || localError}</p>}

      <form onSubmit={addCategory} className="flex gap-2">
        <input
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 border border-line px-3 py-2.5 bg-bg text-sm"
        />
        <button type="submit" disabled={saving || !name.trim()}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50">
          <Plus size={16} /> Add category
        </button>
      </form>

      <div className="border border-line bg-white w-full">
        {categories.length === 0 && (
          <p className="p-8 text-muted text-center text-sm">No categories yet.</p>
        )}
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 border-b border-line last:border-0 p-4">
            {editingId === c.id ? (
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit(c)}
                className="flex-1 border border-line px-2 py-1.5 bg-bg text-sm"
                autoFocus
              />
            ) : (
              <span className="text-sm font-medium text-neutral-800">{c.name}</span>
            )}
            <div className="flex items-center gap-4 shrink-0">
              {editingId === c.id ? (
                <>
                  <button onClick={() => saveEdit(c)} className="eyebrow text-sm text-black underline underline-offset-4 hover:opacity-60">Save</button>
                  <button onClick={cancelEdit} className="eyebrow text-sm text-neutral-400 hover:text-black">Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(c)} className="eyebrow text-sm text-black underline underline-offset-4 hover:opacity-60">Edit</button>
                  <button onClick={() => removeCategory(c)} className="eyebrow text-sm text-neutral-400 hover:text-red-600">Remove</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinancePage() {
  const { data } = useOverview()
  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex items-center justify-between mb-2 w-full">
        <div>
          <h1 className="font-display text-4xl mb-2">Finance & Audits</h1>
          <p className="text-base text-muted">Tax reports, localized billing nodes, revenue summaries, and statement logs.</p>
        </div>
        <button className="flex items-center gap-2 border border-line px-5 py-2.5 bg-white text-sm font-medium hover:bg-neutral-50 transition-colors"><Download size={16} /> Export spreadsheet</button>
      </div>
      <div className="grid sm:grid-cols-3 gap-6 w-full">
        <StatCard label="Total net revenue" value={`$${(data?.totalRevenue ?? 0).toLocaleString()}`} icon={TrendingUp} className="p-6 w-full" />
        <StatCard label="Accumulated sales volume" value={data?.totalOrders ?? 0} className="p-6 w-full" />
        <StatCard label="Open customer queues" value={data?.openTickets ?? 0} className="p-6 w-full" />
      </div>
    </div>
  )
}

function SiteContentTab() {
  const [content, setContent] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/content').then(setContent).catch(() => setContent(null))
  }, [])

  if (!content) return <p className="text-base text-muted py-6">Loading assets…</p>

  const updateLink = (i, field, value) => {
    const next = [...content.navLinks]
    next[i] = { ...next[i], [field]: value }
    setContent({ ...content, navLinks: next })
  }
  const addLink = () => setContent({ ...content, navLinks: [...content.navLinks, { label: '', url: '' }] })
  const removeLink = (i) => setContent({ ...content, navLinks: content.navLinks.filter((_, idx) => idx !== i) })

  const uploadHeroImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingHeroImage(true)
    setMessage('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const updated = await api.upload('/content/hero-image', fd)
      setContent(updated)
      setMessage('Hero banner graphic updated successfully.')
    } catch (err) {
      setMessage(err.message || 'Error executing device file stream upload.')
    } finally {
      setUploadingHeroImage(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      await api.put('/content', {
        navLinks: content.navLinks,
        topBar: content.topBar,
        hero: content.hero,
      })
      setMessage('System variables compiled and saved.')
    } catch (err) {
      setMessage(err.message || 'Error parsing schema payload update.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-10 bg-white border border-line p-8 w-full">
      <section className="space-y-4">
        <h2 className="font-display text-2xl">Top announcement bar</h2>
        <label className="flex items-center gap-3 text-base cursor-pointer">
          <input type="checkbox" checked={content.topBar.enabled}
            className="w-4 h-4 rounded border-line text-black focus:ring-black"
            onChange={(e) => setContent({ ...content, topBar: { ...content.topBar, enabled: e.target.checked } })} />
          Enable contextual broadcast alert bar across global layouts
        </label>
        <input className="border border-line p-3 text-base w-full focus:outline-none focus:ring-1 focus:ring-black rounded-sm" placeholder="Top bar text"
          value={content.topBar.text || ''}
          onChange={(e) => setContent({ ...content, topBar: { ...content.topBar, text: e.target.value } })} />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Navbar links</h2>
        <div className="space-y-3">
          {content.navLinks.map((link, i) => (
            <div key={i} className="flex gap-3 items-center w-full">
              <input className="border border-line p-3 text-base flex-1 focus:outline-none focus:ring-1 focus:ring-black rounded-sm" placeholder="Label text"
                value={link.label} onChange={(e) => updateLink(i, 'label', e.target.value)} />
              <input className="border border-line p-3 text-base flex-1 focus:outline-none focus:ring-1 focus:ring-black rounded-sm" placeholder="Destination link path (e.g. /shop)"
                value={link.url} onChange={(e) => updateLink(i, 'url', e.target.value)} />
              <button className="border border-line hover:bg-neutral-50 px-4 py-3 text-sm text-red-600 transition-colors" onClick={() => removeLink(i)}>Remove</button>
            </div>
          ))}
        </div>
        <button className="mt-2 flex items-center gap-2 border border-line bg-white px-5 py-2.5 text-sm font-medium hover:bg-neutral-50 transition-colors" onClick={addLink}>
          <Plus size={16} /> Add navigation index row
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Hero / banner section</h2>
        <div className="grid sm:grid-cols-2 gap-4 w-full">
          <input className="border border-line p-3 text-base focus:outline-none focus:ring-1 focus:ring-black rounded-sm" placeholder="Hero viewport title"
            value={content.hero.title || ''} onChange={(e) => setContent({ ...content, hero: { ...content.hero, title: e.target.value } })} />
          <input className="border border-line p-3 text-base focus:outline-none focus:ring-1 focus:ring-black rounded-sm" placeholder="Action trigger button text"
            value={content.hero.ctaText || ''} onChange={(e) => setContent({ ...content, hero: { ...content.hero, ctaText: e.target.value } })} />
          <input className="border border-line p-3 text-base sm:col-span-2 focus:outline-none focus:ring-1 focus:ring-black rounded-sm" placeholder="Hero descriptive subtitle copy"
            value={content.hero.subtitle || ''} onChange={(e) => setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })} />
          <input className="border border-line p-3 text-base focus:outline-none focus:ring-1 focus:ring-black rounded-sm" placeholder="Trigger redirection link destination"
            value={content.hero.ctaUrl || ''} onChange={(e) => setContent({ ...content, hero: { ...content.hero, ctaUrl: e.target.value } })} />
        </div>
        <div className="mt-4 space-y-2">
          <label className="block eyebrow text-muted text-xs tracking-wider">Hero banner background graphic file</label>
          <div className="flex items-center gap-6">
            {content.hero.imageUrl && (
              <img src={content.hero.imageUrl} alt="" className="w-40 h-24 object-cover border border-line shadow-sm" />
            )}
            <label className="flex items-center gap-2 border border-dashed border-neutral-300 bg-neutral-50/50 px-5 py-4 cursor-pointer text-muted hover:text-black hover:border-black transition-all text-sm rounded-sm">
              {uploadingHeroImage ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              {uploadingHeroImage ? 'Processing local data stream…' : 'Upload image or GIF'}
              <input type="file" accept="image/*,.gif" className="hidden" disabled={uploadingHeroImage} onChange={uploadHeroImage} />
            </label>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4 pt-4 border-t border-line">
        <button disabled={saving} onClick={save} className="bg-black text-white px-6 py-3 text-base font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors">
          {saving ? 'Processing deployment changes…' : 'Push and save variables'}
        </button>
        {message && <span className="text-base text-neutral-600 font-medium">{message}</span>}
      </div>
    </div>
  )
}

function TaxSettingsTab() {
  const [settings, setSettings] = useState(null)
  const [denied, setDenied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/tax-settings')
      .then(setSettings)
      .catch((err) => {
        setSettings(null)
        setDenied(err.status === 403)
      })
  }, [])

  if (denied) {
    return (
      <p className="text-base text-muted py-6 w-full">
        Access verification error. System keys do not verify permissions to read Tax configurations. Please check operational credentials.
      </p>
    )
  }
  if (!settings) return <p className="text-base text-muted py-6">Parsing parameter maps…</p>

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      const updated = await api.put('/tax-settings', { tax: settings.tax })
      setSettings(updated)
      setMessage('Tax ledger constraints updated.')
    } catch (err) {
      setMessage(err.message || 'Error patching financial definitions.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 w-full bg-white border border-line p-8">
      <div className="space-y-1">
        <label className="text-xs eyebrow text-muted tracking-wider">Localized tax context label</label>
        <input className="border border-line p-3 text-base w-full rounded-sm focus:outline-none focus:ring-1 focus:ring-black" placeholder="e.g. GST / VAT"
          value={settings.tax.label || ''} onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, label: e.target.value } })} />
      </div>
      <div className="space-y-1">
        <label className="text-xs eyebrow text-muted tracking-wider">Active rate percentile (%)</label>
        <input type="number" step="0.01" className="border border-line p-3 text-base w-full rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
          value={settings.tax.ratePercent} onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, ratePercent: Number(e.target.value) } })} />
      </div>
      <label className="flex items-center gap-3 text-base cursor-pointer py-2">
        <input type="checkbox" checked={settings.tax.inclusive}
          className="w-4 h-4 rounded border-line text-black focus:ring-black"
          onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, inclusive: e.target.checked } })} />
        Display listings with built-in calculated tax rates
      </label>
      <div className="flex items-center gap-4 pt-4 border-t border-line">
        <button disabled={saving} onClick={save} className="bg-black text-white px-6 py-3 text-base font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors">
          {saving ? 'Validating operations logs…' : 'Push system configuration'}
        </button>
        {message && <span className="text-base text-neutral-600 font-medium">{message}</span>}
      </div>
    </div>
  )
}

function InvoiceSettingsTab() {
  const [settings, setSettings] = useState(null)
  const [denied, setDenied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/tax-settings')
      .then(setSettings)
      .catch((err) => {
        setSettings(null)
        setDenied(err.status === 403)
      })
  }, [])

  if (denied) {
    return (
      <p className="text-base text-muted py-6 w-full">
        Access verification error. System keys do not verify permissions to read Invoicing configurations. Please check operational credentials.
      </p>
    )
  }
  if (!settings) return <p className="text-base text-muted py-6">Parsing parameter maps…</p>

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      const updated = await api.put('/tax-settings', { tax: settings.tax })
      setSettings(updated)
      setMessage('Invoice configuration updated.')
    } catch (err) {
      setMessage(err.message || 'Error patching invoicing definitions.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 w-full bg-white border border-line p-8">
      <div className="space-y-1">
        <label className="text-xs eyebrow text-muted tracking-wider">Invoice indexing sequential token prefix</label>
        <input className="border border-line p-3 text-base w-full rounded-sm focus:outline-none focus:ring-1 focus:ring-black" placeholder="e.g. INV-2026-"
          value={settings.tax.invoicePrefix || ''} onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, invoicePrefix: e.target.value } })} />
      </div>
      <div className="space-y-1">
        <label className="text-xs eyebrow text-muted tracking-wider">Invoice footer legal dynamic context notes</label>
        <textarea className="border border-line p-3 text-base w-full rounded-sm focus:outline-none focus:ring-1 focus:ring-black" rows={4}
          value={settings.tax.invoiceNotes || ''} onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, invoiceNotes: e.target.value } })} />
      </div>
      <div className="flex items-center gap-4 pt-4 border-t border-line">
        <button disabled={saving} onClick={save} className="bg-black text-white px-6 py-3 text-base font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors">
          {saving ? 'Validating operations logs…' : 'Push system configuration'}
        </button>
        {message && <span className="text-base text-neutral-600 font-medium">{message}</span>}
      </div>
    </div>
  )
}

function SettingsPage() {
  const [tab, setTab] = useState('content')
  const tabs = [
    { id: 'content', label: 'Site Structure Components' },
    { id: 'tax', label: 'Tax Settings' },
    { id: 'invoice', label: 'Invoicing Settings' },
  ]
  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h1 className="font-display text-4xl mb-2">Global System Settings</h1>
        <p className="text-base text-muted">Update platform variables, adjust financial calculation scripts, and structure layouts.</p>
      </div>
      <div className="flex gap-4 border-b border-line w-full">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-base font-medium border-b-2 transition-all -mb-px ${tab === t.id ? 'border-black text-black' : 'border-transparent text-muted hover:text-black'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="w-full pt-2">
        {tab === 'content' && <SiteContentTab />}
        {tab === 'tax' && <TaxSettingsTab />}
        {tab === 'invoice' && <InvoiceSettingsTab />}
      </div>
    </div>
  )
}

function LogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/admin/audit-logs${filter ? `?action=${encodeURIComponent(filter)}` : ''}`)
      setLogs(data)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h1 className="font-display text-4xl mb-2">System Audit Records</h1>
        <p className="text-base text-muted">Immutable history logging sequential action triggers across node components.</p>
      </div>
      <div className="flex gap-3 bg-white border border-line p-4 rounded-sm w-full">
        <input className="border border-line p-3 text-base flex-1 focus:outline-none focus:ring-1 focus:ring-black rounded-sm" placeholder="Search across action layers (e.g., product updates, permission grants, user deletion)"
          value={filter} onChange={(e) => setFilter(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
        <button className="bg-black text-white px-6 py-3 text-base font-medium hover:bg-neutral-800 transition-colors" onClick={load}>Query logs</button>
      </div>
      {loading ? (
        <p className="text-base text-muted py-6">Parsing audit streams…</p>
      ) : logs.length === 0 ? (
        <div className="border border-line p-12 text-base text-muted text-center bg-white rounded-sm w-full">No action records match your system search query index map.</div>
      ) : (
        <div className="border border-line divide-y divide-line bg-white rounded-sm w-full">
          {logs.map((l) => (
            <div key={l.id} className="p-5 text-base flex items-start justify-between gap-6 hover:bg-neutral-50/60 transition-colors w-full">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-neutral-800">{l.actorName}</span>
                  <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 font-mono rounded-sm">({l.actorRole})</span>
                  <span className="eyebrow text-xs tracking-wider bg-black text-white px-2 py-0.5 rounded-sm">{l.action}</span>
                </div>
                {l.entityType && (
                  <p className="text-sm text-muted">
                    Target tracking block: <span className="font-medium text-neutral-700">{l.entityType}</span> · <span className="font-mono bg-neutral-50 px-1 py-0.5 rounded border border-line/30">{l.entityId?.slice?.(0, 8)}</span>
                  </p>
                )}
              </div>
              <span className="text-sm font-mono text-muted whitespace-nowrap bg-neutral-50 border border-line/40 px-2.5 py-1 rounded-sm">{new Date(l.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <DashboardShell>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="warehouse" element={<WarehousePage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="crm" element={<CrmPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="tax" element={<TaxSettingsTab />} />
        <Route path="invoice" element={<InvoiceSettingsTab />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="management/*" element={<ManagementPage />} />
      </Routes>
    </DashboardShell>
  )
}