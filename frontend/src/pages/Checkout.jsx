import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, MapPin } from 'lucide-react'
import { useApp } from '../context/AppContext'
import api from '../lib/api'

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on delivery', desc: 'Pay when your order arrives.' },
  { id: 'card', label: 'Credit / debit card', desc: 'Pay securely online.' },
  { id: 'upi', label: 'UPI', desc: 'Pay via any UPI app.' },
]

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

  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [notes, setNotes] = useState('')
  const [tax, setTax] = useState({ label: 'Sales Tax', ratePercent: 0, inclusive: false })

  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

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

  useEffect(() => {
    if (!user) return
    loadAddresses()
    api.get('/orders/tax-rate').then(setTax).catch(() => {})
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
  const taxAmount = tax.inclusive
    ? cartTotal - cartTotal / (1 + tax.ratePercent / 100)
    : (cartTotal + shippingFee) * (tax.ratePercent / 100)
  const orderTotal = tax.inclusive ? cartTotal + shippingFee : cartTotal + shippingFee + taxAmount

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
      const order = await checkout({ addressId: selectedAddressId, notes, paymentMethod })
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

        {/* Payment method */}
        <div>
          <p className="eyebrow text-muted mb-4">Payment method</p>
          <div className="space-y-3">
            {PAYMENT_METHODS.map((m) => (
              <label
                key={m.id}
                className={`flex items-start gap-3 border px-4 py-3 cursor-pointer ${paymentMethod === m.id ? 'border-ink' : 'border-line'}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === m.id}
                  onChange={() => setPaymentMethod(m.id)}
                  className="mt-1"
                />
                <div className="text-sm">
                  <p className="font-medium">{m.label}</p>
                  <p className="text-muted text-xs mt-0.5">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
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
          <div className="flex justify-between text-sm mb-2">
            <span>Subtotal</span><span>${cartTotal.toFixed(2)}</span>
          </div>
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
