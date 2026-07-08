import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, MapPin, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import { useApp } from '../context/AppContext'
import api from '../lib/api'


const emptyAddressForm = { label: 'Home', line1: '', line2: '', city: '', state: '', postalCode: '', phone: '' }

export default function Checkout() {
  const { cart, cartTotal, checkout, user, authLoading } = useApp()
  const navigate = useNavigate()

  const [addresses, setAddresses] = useState([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState(emptyAddressForm)
  const [savingAddress, setSavingAddress] = useState(false)


  const [notes, setNotes] = useState('')
  const [tax, setTax] = useState({ label: 'Sales Tax', ratePercent: 0, inclusive: false })

  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  // Coupon states
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [activeCoupons, setActiveCoupons] = useState([])
  const [showCoupons, setShowCoupons] = useState(false)

  const handleApplyCoupon = async (e) => {
    e.preventDefault()
    setCouponError('')
    if (!couponInput.trim()) return
    setValidatingCoupon(true)
    try {
      const res = await api.post('/coupons/validate', {
        code: couponInput.trim(),
        subtotal: cartTotal
      })
      setAppliedCoupon({
        code: couponInput.trim().toUpperCase(),
        discount: Number(res.discountAmount)
      })
      setCouponInput('')
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code')
      setAppliedCoupon(null)
    } finally {
      setValidatingCoupon(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
  }

  const loadAddresses = () => {
    setAddressesLoading(true)
    return api.get('/addresses')
      .then((list) => {
        setAddresses(list)
        const def = list.find((a) => a.is_default) || list[0]
        if (def) setSelectedAddressId(def.id)
        if (list.length === 0) setShowAddressForm(true)
      })
      .catch(() => {})
      .finally(() => setAddressesLoading(false))
  }

  // Load active coupons
  const fetchActiveCoupons = () => {
    api.get('/coupons/active')
      .then(data => {
        setActiveCoupons(data)
      })
      .catch(console.error)
  }

  useEffect(() => {
    if (!user) return
    loadAddresses()
    api.get('/orders/tax-rate').then(setTax).catch(() => {})
    
    fetchActiveCoupons()
    const intervalId = setInterval(fetchActiveCoupons, 5000) // Poll every 5s for real-time coupon sync
    return () => clearInterval(intervalId)
  }, [user])

  if (authLoading) return <div className="px-5 py-24 text-center text-sm text-muted">Loading…</div>
  if (!user) { navigate('/login', { state: { from: '/checkout' } }); return null }
  if (cart.length === 0) {
    return (
      <div className="px-5 md:px-10 py-24 text-center">
        <p className="font-display text-2xl mb-4">Your bag is empty</p>
        <Link to="/shop" className="eyebrow underline underline-offset-4">Continue shopping</Link>
      </div>
    )
  }

  const shippingFee = 0
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0
  const subtotalAfterDiscount = Math.max(0, cartTotal - discountAmount)

  const taxAmount = tax.inclusive
    ? subtotalAfterDiscount - subtotalAfterDiscount / (1 + tax.ratePercent / 100)
    : (subtotalAfterDiscount + shippingFee) * (tax.ratePercent / 100)
  const orderTotal = tax.inclusive ? subtotalAfterDiscount + shippingFee : subtotalAfterDiscount + shippingFee + taxAmount;

  const submitAddress = async (e) => {
    e.preventDefault()
    setSavingAddress(true)
    setError('')
    try {
      const saved = await api.post('/addresses', { ...addressForm, isDefault: addresses.length === 0 })
      await loadAddresses()
      setSelectedAddressId(saved.id)
      setAddressForm(emptyAddressForm)
      setShowAddressForm(false)
    } catch (err) {
      setError(err.message || 'Could not save address')
    } finally {
      setSavingAddress(false)
    }
  }

  const placeOrder = async () => {
    setError('')
    if (!selectedAddressId) {
      setError('Please select or add a shipping address.')
      return
    }
    setPlacing(true)
    try {
      const order = await checkout({
        addressId: selectedAddressId,
        notes,
        paymentMethod: 'cod',
        couponCode: appliedCoupon ? appliedCoupon.code : null
      })
      navigate('/dashboard/orders', { state: { justPlaced: order.orderNumber } })
    } catch (err) {
      setError(err.message || 'Checkout failed')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="px-5 md:px-10 py-10 grid md:grid-cols-3 gap-10">
      <div className="md:col-span-2 space-y-10">
        <h1 className="font-display text-3xl">Checkout</h1>

        {/* Shipping address */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="eyebrow text-muted">Shipping address</p>
            <button
              type="button"
              onClick={() => setShowAddressForm((s) => !s)}
              className="text-xs underline underline-offset-4 flex items-center gap-1 hover:opacity-60"
            >
              <Plus size={13} /> {showAddressForm ? 'Cancel' : 'Add new address'}
            </button>
          </div>

          {addressesLoading && <p className="text-sm text-muted">Loading addresses…</p>}

          {!addressesLoading && addresses.length > 0 && (
            <div className="space-y-3 mb-4">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex items-start gap-3 border px-4 py-3 cursor-pointer ${selectedAddressId === a.id ? 'border-ink' : 'border-line'}`}
                >
                  <input
                    type="radio"
                    name="shippingAddress"
                    checked={selectedAddressId === a.id}
                    onChange={() => setSelectedAddressId(a.id)}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <p className="font-medium flex items-center gap-1.5">
                      <MapPin size={13} className="text-muted" /> {a.label}
                      {a.is_default && <span className="ml-2 text-[10px] uppercase tracking-wider border border-ink px-1.5 py-0.5">Default</span>}
                    </p>
                    <p className="text-muted text-xs mt-1">
                      {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}{a.state ? `, ${a.state}` : ''} {a.postal_code}
                    </p>
                    {a.phone && <p className="text-muted text-xs">{a.phone}</p>}
                  </div>
                </label>
              ))}
            </div>
          )}

          {!addressesLoading && addresses.length === 0 && !showAddressForm && (
            <p className="text-sm text-muted mb-4">No saved addresses yet — add one to continue.</p>
          )}

          {showAddressForm && (
            <form onSubmit={submitAddress} className="border border-line p-5 grid sm:grid-cols-2 gap-3">
              <input value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                placeholder="Label (e.g. Home, Work)" className="border border-line px-3 py-2.5 text-sm outline-none bg-transparent" />
              <input value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                placeholder="Phone number" className="border border-line px-3 py-2.5 text-sm outline-none bg-transparent" />
              <input value={addressForm.line1} onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                placeholder="Address line 1" required className="sm:col-span-2 border border-line px-3 py-2.5 text-sm outline-none bg-transparent" />
              <input value={addressForm.line2} onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                placeholder="Address line 2 (optional)" className="sm:col-span-2 border border-line px-3 py-2.5 text-sm outline-none bg-transparent" />
              <input value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                placeholder="City" required className="border border-line px-3 py-2.5 text-sm outline-none bg-transparent" />
              <input value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                placeholder="State" className="border border-line px-3 py-2.5 text-sm outline-none bg-transparent" />
              <input value={addressForm.postalCode} onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                placeholder="Postal code" required className="border border-line px-3 py-2.5 text-sm outline-none bg-transparent" />
              <button type="submit" disabled={savingAddress}
                className="sm:col-span-2 bg-ink text-bg py-2.5 text-sm tracking-wide hover:opacity-90 disabled:opacity-50">
                {savingAddress ? 'Saving…' : 'Save address'}
              </button>
            </form>
          )}
        </div>


        {/* Order notes */}
        <div>
          <p className="eyebrow text-muted mb-3">Order notes (optional)</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Delivery instructions, gift message, etc."
            className="w-full border border-line px-4 py-2.5 text-sm outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Order summary */}
      <div>
        <div className="border border-line p-6 sticky top-24">
          <p className="eyebrow text-muted mb-4">Order summary</p>
          <div className="divide-y divide-line mb-4 max-h-64 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.cartItemId} className="flex justify-between text-xs py-2.5 gap-2">
                <span className="text-muted">{item.name} × {item.qty}</span>
                <span className="shrink-0">${(item.qty * item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Coupon Code section */}
          <div className="py-4 border-b border-line space-y-3">
            {appliedCoupon ? (
              <div className="flex items-center justify-between text-xs bg-neutral-50 p-2 border border-line">
                <span className="font-semibold text-neutral-800">Coupon: {appliedCoupon.code}</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-700 font-semibold">-${appliedCoupon.discount.toFixed(2)}</span>
                  <button type="button" onClick={removeCoupon} className="text-neutral-400 hover:text-black">
                    <Plus size={14} className="rotate-45" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Promo code"
                  className="flex-1 border border-line px-3 py-1.5 text-xs outline-none bg-transparent uppercase"
                />
                <button
                  type="submit"
                  disabled={validatingCoupon || !couponInput.trim()}
                  className="border border-ink bg-ink text-bg px-4 py-1.5 text-xs hover:opacity-90 disabled:opacity-50"
                >
                  {validatingCoupon ? '...' : 'Apply'}
                </button>
              </form>
            )}
            {couponError && <p className="text-[11px] text-red-600">{couponError}</p>}

            {/* Available coupons list */}
            {!appliedCoupon && activeCoupons.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowCoupons(s => !s)}
                  className="flex items-center gap-1 text-[11px] text-muted hover:text-ink transition-colors"
                >
                  <Tag size={11} />
                  {showCoupons ? 'Hide' : 'View'} available coupons ({activeCoupons.length})
                  {showCoupons ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
                {showCoupons && (
                  <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto">
                    {activeCoupons.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setCouponInput(c.code); setShowCoupons(false) }}
                        className="w-full flex items-center justify-between text-left border border-dashed border-line p-2 hover:border-ink hover:bg-neutral-50 transition-colors group"
                      >
                        <div>
                          <span className="font-mono text-[11px] font-semibold text-ink group-hover:underline">{c.code}</span>
                          {(c.description || c.type) && (
                            <p className="text-[10px] text-muted mt-0.5">
                              {c.description || (c.type === 'percentage' ? `${parseFloat(c.value)}% off` : `$${parseFloat(c.value).toFixed(2)} off`)}
                              {parseFloat(c.min_purchase) > 0 && ` · Min $${parseFloat(c.min_purchase).toFixed(2)}`}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted shrink-0 ml-2">Click to use</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between text-sm mb-2 mt-4">
            <span>Subtotal</span><span>${cartTotal.toFixed(2)}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-sm mb-2 text-green-700 font-medium">
              <span>Discount ({appliedCoupon.code})</span><span>-${appliedCoupon.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm mb-2 text-muted">
            <span>Shipping</span><span>Free</span>
          </div>
          <div className="flex justify-between text-sm mb-4 text-muted">
            <span>{tax.label || 'Tax'}{tax.ratePercent > 0 ? ` (${tax.ratePercent}%)` : ''}</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base border-t border-line pt-4 mb-6">
            <span>Total</span><span>${orderTotal.toFixed(2)}</span>
          </div>
          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
          <button
            onClick={placeOrder}
            disabled={placing}
            className="w-full bg-ink text-bg py-3 text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {placing ? 'Placing order…' : 'Place order'}
          </button>
        </div>
      </div>
    </div>
  )
}
