import { Routes, Route } from 'react-router-dom'
import { Search, AlertTriangle, Truck, Boxes, PackageCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import DashboardShell from '../components/DashboardShell'
import TaxPage from '../components/TaxPage'
import InvoicePage from '../components/InvoicePage'
import { StatCard, Pill, statusTone } from '../components/ui'
import api from '../lib/api'

function useShipments() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/shipments')
      setShipments(data)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load shipments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  return { shipments, loading, error, reload: load }
}

function useLowStock() {
  const [stockAlerts, setStockAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/products/low-stock')
        setStockAlerts(data)
      } catch {
        setStockAlerts([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])
  return { stockAlerts, loading }
}

function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/products?limit=200')
      setProducts(data.products || data.items || data)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  return { products, loading, reload: load }
}

function Overview() {
  const { shipments } = useShipments()
  const { stockAlerts } = useLowStock()

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Today's overview</h1>
      <p className="text-sm text-muted mb-8">Pending shipments, stock levels, and what needs attention.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Pending shipments" value={shipments.filter(s => s.type === 'outbound').length} icon={Truck} />
        <StatCard label="Inbound requests" value={shipments.filter(s => s.type === 'inbound').length} icon={Boxes} />
        <StatCard label="Low stock SKUs" value={stockAlerts.length} icon={AlertTriangle} />
        <StatCard label="Total shipments" value={shipments.length} icon={PackageCheck} />
      </div>

      <div className="border border-line p-6">
        <p className="eyebrow text-muted mb-4">Low stock alerts</p>
        <div className="space-y-3">
          {stockAlerts.length === 0 && <p className="text-sm text-muted">Nothing below threshold right now.</p>}
          {stockAlerts.map((s) => (
            <div key={s.sku} className="flex items-center justify-between text-sm">
              <span>{s.name} <span className="text-muted">({s.sku})</span></span>
              <span className="text-muted">{s.stock}/{s.lowStockThreshold} — {s.warehouse}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ShipmentsPage() {
  const { shipments, loading, error, reload } = useShipments()

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/shipments/${id}/status`, { status })
      reload()
    } catch (err) {
      alert(err.message || 'Failed to update shipment')
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Shipments</h1>
      <p className="text-sm text-muted mb-8">Inbound and outbound, across all warehouses.</p>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted eyebrow">
              <th className="p-4">Shipment</th><th className="p-4">Type</th><th className="p-4">Reference</th>
              <th className="p-4">Items</th><th className="p-4">Status</th><th className="p-4">Warehouse</th><th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {!loading && shipments.length === 0 && (
              <tr><td colSpan={7} className="p-4 text-muted text-center">No shipments yet.</td></tr>
            )}
            {shipments.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0">
                <td className="p-4">{s.shipmentNo}</td><td className="p-4 capitalize">{s.type}</td>
                <td className="p-4 text-muted">{s.order}</td><td className="p-4">{s.items}</td>
                <td className="p-4"><Pill tone={statusTone(s.status)}>{s.status}</Pill></td>
                <td className="p-4 text-muted">{s.warehouse}</td>
                <td className="p-4">
                  <select
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) updateStatus(s.id, e.target.value) }}
                    className="eyebrow bg-transparent border border-line text-xs px-2 py-1"
                  >
                    <option value="" disabled>Update…</option>
                    <option value="pending">Pending</option>
                    <option value="packed">Packed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
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

function StockPage() {
  const { products, loading, reload } = useProducts()
  const [busyId, setBusyId] = useState(null)

  const adjust = async (product) => {
    const input = window.prompt(
      `Adjust stock for ${product.name} (${product.sku})\nCurrent stock: ${product.stock}\nEnter a positive number to add, negative to remove:`,
      ''
    )
    if (input === null) return
    const delta = Number(input)
    if (!Number.isFinite(delta) || delta === 0) return
    setBusyId(product.id)
    try {
      await api.patch(`/products/${product.id}/stock`, { delta })
      await reload()
    } catch (err) {
      alert(err.message || 'Failed to adjust stock')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Stock & Inventory</h1>
      <p className="text-sm text-muted mb-8">Levels across SKUs — add or remove units as stock moves in and out.</p>
      <div className="border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted eyebrow">
              <th className="p-4">SKU</th><th className="p-4">Product</th><th className="p-4">Stock</th><th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {!loading && products.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-muted text-center">No products found.</td></tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="p-4 text-muted">{p.sku}</td><td className="p-4">{p.name}</td>
                <td className="p-4">{p.stock <= p.lowStockThreshold ? <Pill tone="warning">{p.stock} low</Pill> : p.stock}</td>
                <td className="p-4">
                  <button onClick={() => adjust(p)} disabled={busyId === p.id} className="eyebrow hover:opacity-60 disabled:opacity-40">
                    {busyId === p.id ? 'Updating…' : 'Adjust stock'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SkuLookup() {
  const [q, setQ] = useState('')
  const { products } = useProducts()
  const results = products.filter((p) => p.sku.toLowerCase().includes(q.toLowerCase()) || p.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <h1 className="font-display text-3xl mb-1">SKU / Barcode lookup</h1>
      <p className="text-sm text-muted mb-6">Search by SKU or product name.</p>
      <div className="flex items-center border border-line px-4 mb-8 max-w-md">
        <Search size={16} className="text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Scan or type a SKU…"
          className="bg-transparent flex-1 px-3 py-2.5 text-sm outline-none"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {results.map((p) => (
          <div key={p.id} className="border border-line p-4 text-sm">
            <p className="eyebrow text-muted mb-1">{p.sku}</p>
            <p>{p.name}</p>
            <p className="text-muted">{p.stock} units in stock</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function WarehouseDashboard() {
  return (
    <DashboardShell>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="shipments" element={<ShipmentsPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="sku" element={<SkuLookup />} />
        <Route path="tax" element={<TaxPage />} />
        <Route path="invoice" element={<InvoicePage />} />
      </Routes>
    </DashboardShell>
  )
}
