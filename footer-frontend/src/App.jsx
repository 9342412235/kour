import { Routes, Route, Navigate } from 'react-router-dom'
import { useTheme } from './context/ThemeContext'
import Navbar from './components/Navbar'
import PageFooter from './components/PageFooter'
import ScrollToTop from './components/ScrollToTop'
import About from './pages/About'
import HowWeWork from './pages/HowWeWork'
import Privacy from './pages/Privacy'
import Shipping from './pages/Shipping'
import Returns from './pages/Returns'
import Accessibility from './pages/Accessibility'
import FAQ from './pages/FAQ'
import Careers from './pages/Careers'
import OurPromise from './pages/OurPromise'
import OurGoal from './pages/OurGoal'
import ContactUs from './pages/ContactUs'

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen">{children}</div>
      <PageFooter />
    </>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/"               element={<Navigate to="/about" replace />} />
        <Route path="/about"          element={<Layout><About /></Layout>} />
        <Route path="/how-we-work"    element={<Layout><HowWeWork /></Layout>} />
        <Route path="/privacy"        element={<Layout><Privacy /></Layout>} />
        <Route path="/shipping"       element={<Layout><Shipping /></Layout>} />
        <Route path="/returns"        element={<Layout><Returns /></Layout>} />
        <Route path="/accessibility"  element={<Layout><Accessibility /></Layout>} />
        
        {/* New Pages */}
        <Route path="/faq"            element={<Layout><FAQ /></Layout>} />
        <Route path="/careers"        element={<Layout><Careers /></Layout>} />
        <Route path="/our-promise"    element={<Layout><OurPromise /></Layout>} />
        <Route path="/our-goal"       element={<Layout><OurGoal /></Layout>} />
        <Route path="/contact"        element={<Layout><ContactUs /></Layout>} />

        {/* Fallback */}
        <Route path="*"              element={<Navigate to="/about" replace />} />
      </Routes>
    </>
  )
}
