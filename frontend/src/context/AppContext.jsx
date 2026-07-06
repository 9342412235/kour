import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api from '../lib/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null) // backend user object, or null when signed out
  const [authLoading, setAuthLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [wishlist, setWishlist] = useState([]) // array of product ids
  const [notificationCount, setNotificationCount] = useState(0)

  const role = user?.role || null
  const userName = user?.name || 'Guest'

  const refreshCart = useCallback(async () => {
    if (!user) { setCart([]); return }
    try {
      const items = await api.get('/cart')
      setCart(items)
    } catch {
      setCart([])
    }
  }, [user])

  const refreshWishlist = useCallback(async () => {
    if (!user) { setWishlist([]); return }
    try {
      const items = await api.get('/wishlist')
      setWishlist(items.map((p) => p.id))
    } catch {
      setWishlist([])
    }
  }, [user])

  const refreshNotifications = useCallback(async () => {
    if (!user) { setNotificationCount(0); return }
    try {
      const { count } = await api.get('/notifications/unread-count')
      setNotificationCount(count)
    } catch {
      setNotificationCount(0)
    }
  }, [user])

  const refreshUser = async () => {
    try {
      const me = await api.get('/auth/me')
      setUser(me)
      return me
    } catch {
      setUser(null)
      return null
    }
  }

  // Load current session on first mount
  useEffect(() => {
    (async () => {
      try {
        const me = await api.get('/auth/me')
        setUser(me)
      } catch {
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    refreshCart()
    refreshWishlist()
    refreshNotifications()
  }, [user, refreshCart, refreshWishlist, refreshNotifications])

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    setUser(null)
    setCart([])
    setWishlist([])
  }

  const login = async (email, password) => {
    const me = await api.post('/auth/login', { email, password })
    setUser(me)
    return me
  }

  const register = async (name, email, password) => {
    const me = await api.post('/auth/register', { name, email, password })
    setUser(me)
    return me
  }

  const forgotPassword = async (email) => {
    return api.post('/auth/forgot-password', { email })
  }

  const resetPassword = async (token, password) => {
    return api.post(`/auth/reset-password/${token}`, { password })
  }

  const updateProfile = async (data) => {
    const me = await api.patch('/users/me', data)
    setUser(me)
    return me
  }

  const addToCart = async (product, qty = 1) => {
    await api.post('/cart', {
      productId: product.id,
      color: product.selectedColor || null,
      size: product.selectedSize || null,
      qty,
    })
    await refreshCart()
  }

  const removeFromCart = async (cartItemId) => {
    await api.delete(`/cart/${cartItemId}`)
    await refreshCart()
  }

  const updateQty = async (cartItemId, qty) => {
    if (qty < 1) return removeFromCart(cartItemId)
    await api.patch(`/cart/${cartItemId}`, { qty })
    await refreshCart()
  }

  const toggleWishlist = async (productId) => {
    if (wishlist.includes(productId)) {
      await api.delete(`/wishlist/${productId}`)
      setWishlist((prev) => prev.filter((id) => id !== productId))
    } else {
      await api.post(`/wishlist/${productId}`)
      setWishlist((prev) => [...prev, productId])
    }
  }

  const checkout = async ({ addressId, notes, paymentMethod, couponCode } = {}) => {
    const order = await api.post('/orders/checkout', { addressId, notes, paymentMethod, couponCode })
    await refreshCart()
    return order
  }

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0)
  const cartTotal = cart.reduce((sum, i) => sum + i.qty * i.price, 0)

  return (
    <AppContext.Provider
      value={{
        user, role, userName, authLoading, logout, login, register, forgotPassword, resetPassword, updateProfile, refreshUser,
        cart, addToCart, removeFromCart, updateQty, cartCount, cartTotal, checkout, refreshCart,
        wishlist, toggleWishlist,
        notificationCount, refreshNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
