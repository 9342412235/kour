import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import api from '../lib/api'

export default function Cart() {
  const { cart, removeFromCart, updateQty, cartTotal, user } = useApp()
  const navigate = useNavigate()
  const [tax, setTax] = useState({ label: 'Sales Tax', ratePercent: 0, inclusive: false })

  useEffect(() => {
    api.get('/orders/tax-rate').then(setTax).catch(() => {})
  }, [])

  // Mirrors the backend's checkout calculation exactly (shipping is always
  // free storewide) so the number shown here matches the order that's
  // actually created.
  const shippingFee = 0
  const taxAmount = tax.inclusive
    ? cartTotal - cartTotal / (1 + tax.ratePercent / 100)
    : (cartTotal + shippingFee) * (tax.ratePercent / 100)
  const orderTotal = tax.inclusive ? cartTotal + shippingFee : cartTotal + shippingFee + taxAmount

  const goToCheckout = () => {
    navigate(user ? '/checkout' : '/login', user ? undefined : { state: { from: '/checkout' } })
  }

  if (cart.length === 0) {
    return (
      <div className="px-5 md:px-10 py-24 text-center">
        <p className="font-display text-2xl mb-4">Your bag is empty</p>
        <Link to="/shop" className="eyebrow underline underline-offset-4">Continue shopping</Link>
      </div>
    )
  }

  return (
    <div className="px-5 md:px-10 py-10 grid md:grid-cols-3 gap-10">
      <div className="md:col-span-2">
        <h1 className="font-display text-3xl mb-8">Your bag</h1>
        <div className="divide-y divide-line">
          {cart.map((item) => (
            <div key={item.cartItemId} className="flex items-center gap-4 py-5">
              <div className="h-20 w-16 bg-surface flex items-center justify-center shrink-0 overflow-hidden">
                {item.image
                  ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  : <span className="font-display text-xl text-muted/40">{item.name[0]}</span>}
              </div>
              <div className="flex-1">
                <p className="text-sm">{item.name}</p>
                <p className="text-xs text-muted">
                  ${item.price.toFixed(2)}
                  {item.selectedColor && <> · {item.selectedColor}</>}
                  {item.selectedSize && <> · {item.selectedSize}</>}
                </p>
              </div>
              <div className="flex items-center border border-line">
                <button onClick={() => updateQty(item.cartItemId, item.qty - 1)} className="px-2.5 py-1">−</button>
                <span className="px-3">{item.qty}</span>
                <button onClick={() => updateQty(item.cartItemId, item.qty + 1)} className="px-2.5 py-1">+</button>
              </div>
              <p className="text-sm w-16 text-right">${(item.qty * item.price).toFixed(2)}</p>
              <button onClick={() => removeFromCart(item.cartItemId)} aria-label="Remove" className="text-muted hover:text-ink">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="border border-line p-6">
          <p className="eyebrow text-muted mb-4">Order summary</p>
          <div className="flex justify-between text-sm mb-2">
            <span>Subtotal</span><span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2 text-muted">
            <span>Shipping</span><span>Free</span>
          </div>
          {tax.ratePercent > 0 ? (
            <div className="flex justify-between text-sm mb-4 text-muted">
              <span>
                {tax.label} ({tax.ratePercent}%)
                {tax.inclusive && <span className="ml-1 text-[11px]">· included</span>}
              </span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex justify-between text-sm mb-4 text-muted">
              <span>{tax.label || 'Tax'}</span>
              <span>$0.00</span>
            </div>
          )}
          <div className="flex justify-between text-base border-t border-line pt-4 mb-6">
            <span>Total</span><span>${orderTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={goToCheckout}
            className="w-full bg-ink text-bg py-3 text-sm tracking-wide hover:opacity-85 disabled:opacity-50"
          >
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  )
}
