import { useEffect, useState } from 'react'
import { Plus, X, Edit, Trash2 } from 'lucide-react'
import { Pill } from './ui'
import api from '../lib/api'

export default function OffersPage() {
  const [coupons, setCoupons] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)

  // Form states
  const [code, setCode] = useState('')
  const [type, setType] = useState('percentage')
  const [value, setValue] = useState('')
  const [minPurchase, setMinPurchase] = useState('0')
  const [maxDiscount, setMaxDiscount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [perUserLimit, setPerUserLimit] = useState('')
  const [status, setStatus] = useState('active')
  const [description, setDescription] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/coupons')
      setCoupons(data)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setEditingCoupon(null)
    setCode('')
    setType('percentage')
    setValue('')
    setMinPurchase('0')
    setMaxDiscount('')
    setStartDate('')
    setExpiryDate('')
    setUsageLimit('')
    setPerUserLimit('')
    setStatus('active')
    setDescription('')
    setError('')
    setModalOpen(true)
  }

  const openEdit = (c) => {
    setEditingCoupon(c)
    setCode(c.code)
    setType(c.type)
    setValue(c.value.toString())
    setMinPurchase(c.min_purchase.toString())
    setMaxDiscount(c.max_discount ? c.max_discount.toString() : '')
    setStartDate(c.start_date ? new Date(c.start_date).toISOString().slice(0, 16) : '')
    setExpiryDate(c.expiry_date ? new Date(c.expiry_date).toISOString().slice(0, 16) : '')
    setUsageLimit(c.usage_limit ? c.usage_limit.toString() : '')
    setPerUserLimit(c.per_user_limit ? c.per_user_limit.toString() : '')
    setStatus(c.status)
    setDescription(c.description || '')
    setError('')
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    try {
      await api.delete(`/coupons/${id}`)
      load()
    } catch (err) {
      setError(err.message || 'Failed to delete coupon')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const payload = {
      code: code.trim(),
      type,
      value: parseFloat(value),
      min_purchase: parseFloat(minPurchase),
      max_discount: maxDiscount ? parseFloat(maxDiscount) : null,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
      usage_limit: usageLimit ? parseInt(usageLimit, 10) : null,
      per_user_limit: perUserLimit ? parseInt(perUserLimit, 10) : null,
      status,
      description: description.trim()
    }

    if (!payload.code || isNaN(payload.value) || payload.value <= 0) {
      setError('Please provide a valid code and value')
      return
    }

    try {
      if (editingCoupon) {
        await api.patch(`/coupons/${editingCoupon.id}`, payload)
      } else {
        await api.post('/coupons', payload)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.message || 'Failed to save coupon')
    }
  }

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="font-display text-4xl mb-2">Offers & Coupons</h1>
          <p className="text-base text-muted">Create, update, and manage promotional offers and shopping coupons.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus size={16} /> Add new coupon
        </button>
      </div>

      {error && !modalOpen && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-base text-muted py-6">Loading coupons…</p>
      ) : (
        <div className="border border-line overflow-x-auto bg-white w-full">
          <table className="w-full text-base layout-auto">
            <thead>
              <tr className="border-b border-line text-left text-muted eyebrow bg-neutral-50/50">
                <th className="p-5">Code</th>
                <th className="p-5">Description</th>
                <th className="p-5">Discount</th>
                <th className="p-5">Min Purchase</th>
                <th className="p-5">Status</th>
                <th className="p-5">Expiry Date</th>
                <th className="p-5">Usage</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-muted text-center">
                    No coupons created yet.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-line last:border-0 hover:bg-neutral-50/40 transition-colors"
                  >
                    <td className="p-5 font-mono font-semibold text-neutral-800">{c.code}</td>
                    <td className="p-5 text-muted text-sm max-w-xs truncate">{c.description || '—'}</td>
                    <td className="p-5">
                      {c.type === 'percentage' ? `${parseFloat(c.value)}%` : `$${parseFloat(c.value).toFixed(2)}`}
                      {c.type === 'percentage' && c.max_discount && ` (Max $${parseFloat(c.max_discount).toFixed(2)})`}
                    </td>
                    <td className="p-5 font-mono">${parseFloat(c.min_purchase).toFixed(2)}</td>
                    <td className="p-5">
                      <Pill tone={c.status === 'active' ? 'success' : 'neutral'}>
                        {c.status}
                      </Pill>
                    </td>
                    <td className="p-5 text-muted text-sm">
                      {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : 'No expiry'}
                    </td>
                    <td className="p-5 text-muted text-sm font-mono">
                      {c.usage_limit ? `Limit: ${c.usage_limit}` : 'Unlimited'}
                      {c.per_user_limit && ` (Per user: ${c.per_user_limit})`}
                    </td>
                    <td className="p-5 text-right space-x-4">
                      <button
                        onClick={() => openEdit(c)}
                        className="eyebrow text-sm text-black underline underline-offset-4 hover:opacity-60 transition-opacity"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="eyebrow text-sm text-neutral-400 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-bg border border-line w-full max-w-lg overflow-y-auto p-6 max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl">{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-muted hover:text-ink">
                <X size={18} />
              </button>
            </div>

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs eyebrow text-muted">Coupon Code</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. SAVE20"
                    className="border border-line p-2 text-sm w-full bg-bg uppercase"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs eyebrow text-muted">Discount Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="border border-line p-2 text-sm w-full bg-bg"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs eyebrow text-muted">Discount Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. 20"
                    className="border border-line p-2 text-sm w-full bg-bg"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs eyebrow text-muted">Min Purchase Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    placeholder="e.g. 50"
                    className="border border-line p-2 text-sm w-full bg-bg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs eyebrow text-muted">Max Discount (Percentage only)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder="e.g. 100"
                    className="border border-line p-2 text-sm w-full bg-bg"
                    disabled={type !== 'percentage'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs eyebrow text-muted">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="border border-line p-2 text-sm w-full bg-bg"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs eyebrow text-muted">Start Date</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-line p-2 text-sm w-full bg-bg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs eyebrow text-muted">Expiry Date</label>
                  <input
                    type="datetime-local"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="border border-line p-2 text-sm w-full bg-bg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs eyebrow text-muted">Overall Usage Limit</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="e.g. 500"
                    className="border border-line p-2 text-sm w-full bg-bg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs eyebrow text-muted">Per User Limit</label>
                  <input
                    type="number"
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(e.target.value)}
                    placeholder="e.g. 1"
                    className="border border-line p-2 text-sm w-full bg-bg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs eyebrow text-muted">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Get 20% off on purchase above $50"
                  className="border border-line p-2 text-sm w-full bg-bg"
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-line justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-line px-5 py-2 text-sm hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-5 py-2 text-sm hover:bg-neutral-800 transition-colors"
                >
                  {editingCoupon ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
