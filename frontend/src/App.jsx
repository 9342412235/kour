import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import Blog from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
import CustomerDashboard from './pages/dashboards/CustomerDashboard'
import { useApp } from './context/AppContext'

// All authenticated accounts — including staff (admin/warehouse/support/
// blogger) who share the same login + JWT cookie as customers — get full
// access to the customer-facing dashboard here. Staff also have their own
// dedicated dashboards (admin-frontend, warehouse-frontend, etc.) for their
// day-to-day work, but the storefront account itself behaves like any
// other customer account.

function DashboardGate() {
  const { role, authLoading } = useApp()
  if (authLoading) return <div className="px-5 py-24 text-center text-sm text-muted">Loading…</div>
  if (!role) return <Login />
  return <CustomerDashboard />
}

function StorefrontLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<StorefrontLayout><Home /></StorefrontLayout>} />
      <Route path="/shop" element={<StorefrontLayout><Shop /></StorefrontLayout>} />
      <Route path="/product/:id" element={<StorefrontLayout><ProductDetail /></StorefrontLayout>} />
      <Route path="/cart" element={<StorefrontLayout><Cart /></StorefrontLayout>} />
      <Route path="/checkout" element={<StorefrontLayout><Checkout /></StorefrontLayout>} />
      <Route path="/login" element={<StorefrontLayout><Login /></StorefrontLayout>} />
      <Route path="/register" element={<StorefrontLayout><Register /></StorefrontLayout>} />
      <Route path="/forgot-password" element={<StorefrontLayout><ForgotPassword /></StorefrontLayout>} />
      <Route path="/reset-password/:token" element={<StorefrontLayout><ResetPassword /></StorefrontLayout>} />
      <Route path="/profile" element={<StorefrontLayout><Profile /></StorefrontLayout>} />
      <Route path="/blog" element={<StorefrontLayout><Blog /></StorefrontLayout>} />
      <Route path="/blog/:id" element={<StorefrontLayout><BlogDetail /></StorefrontLayout>} />
      <Route path="/dashboard/*" element={<DashboardGate />} />
      </Routes>
    </>
  )
}
