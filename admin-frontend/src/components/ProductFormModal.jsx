import { useEffect, useState } from 'react'
import { X, UploadCloud, Trash2, Loader2, Tag } from 'lucide-react'
import api from '../lib/api'

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const TAG_OPTIONS  = ['Best seller', 'New', 'Trending', 'Limited', 'Sale']

const emptyForm = {
  sku: '', name: '', description: '', category: '', subcategory: '',
  price: '', compareAtPrice: '', colors: '', sizes: [], tags: [],
  stock: '', lowStockThreshold: '', warehouse: 'WH-Mumbai', isActive: true,
  productDetails: '', materialCare: '', sizeFitGuide: '', sustainability: '',
}

export default function ProductFormModal({ open, product, categories: initialCategories, onClose, onSaved }) {
  const [form, setForm]             = useState(emptyForm)
  const [categories, setCategories] = useState(initialCategories || [])

  // DB-stored images: [{ id, url, color }]
  const [existingImages, setExistingImages] = useState([])
  // New files to upload: [{ file, color }]
  const [newFiles, setNewFiles]             = useState([])

  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState('')

  // Sync categories when parent updates them
  useEffect(() => { setCategories(initialCategories || []) }, [initialCategories])

  useEffect(() => {
    if (!open) return
    if (product) {
      setForm({
        sku:              product.sku || '',
        name:             product.name || '',
        description:      product.description || '',
        category:         product.category || '',
        subcategory:      product.subcategory || '',
        price:            product.price ?? '',
        compareAtPrice:   product.compareAtPrice ?? '',
        colors:           (product.colors || []).join(', '),
        sizes:            product.sizes || [],
        tags:             product.tags  || [],
        stock:            product.stock ?? '',
        lowStockThreshold: product.lowStockThreshold ?? '',
        warehouse:        product.warehouse || 'WH-Mumbai',
        isActive:         product.isActive ?? true,
        productDetails:   product.productDetails || '',
        materialCare:     product.materialCare || '',
        sizeFitGuide:     product.sizeFitGuide || '',
        sustainability:   product.sustainability || '',
      })
      // Build existing image list with color metadata from colorImages map
      const colorMap = product.colorImages || {}
      const imgList  = (product.images || []).map((url) => {
        const color = Object.keys(colorMap).find((c) => colorMap[c] === url) || ''
        // Extract imageId from URL like /api/products/images/uuid
        const match = url.match(/\/images\/([a-f0-9-]{36})/)
        return { id: match?.[1] || null, url, color }
      })
      setExistingImages(imgList)
    } else {
      setForm(emptyForm)
      setExistingImages([])
    }
    setNewFiles([])
    setError('')
  }, [open, product])

  if (!open) return null

  const toggleListValue = (key, value) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }))

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || [])
    setNewFiles((prev) => [...prev, ...files.map((f) => ({ file: f, color: '' }))])
    e.target.value = ''
  }

  const removeNewFile     = (idx) => setNewFiles((prev) => prev.filter((_, i) => i !== idx))
  const setNewFileColor   = (idx, color) => setNewFiles((prev) => prev.map((f, i) => i === idx ? { ...f, color } : f))
  const setExistingColor  = (idx, color) => setExistingImages((prev) => prev.map((img, i) => i === idx ? { ...img, color } : img))

  const removeExistingImage = async (img, idx) => {
    if (product && img.id) {
      try {
        await api.delete(`/products/${product.id}/images/${img.id}`)
      } catch (err) {
        setError(err.message || 'Failed to remove image')
        return
      }
    }
    setExistingImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const colorList = form.colors.split(',').map((c) => c.trim()).filter(Boolean)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        sku:            form.sku.trim(),
        name:           form.name.trim(),
        description:    form.description,
        category:       form.category || null,
        subcategory:    form.subcategory || null,
        price:          Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
        colors:         colorList,
        sizes:          form.sizes,
        tags:           form.tags,
        stock:          Number(form.stock) || 0,
        warehouse:      form.warehouse,
        isActive:       form.isActive,
        lowStockThreshold: form.lowStockThreshold ? Number(form.lowStockThreshold) : 15,
        productDetails: form.productDetails,
        materialCare:   form.materialCare,
        sizeFitGuide:   form.sizeFitGuide,
        sustainability: form.sustainability,
      }

      let saved
      if (product) {
        saved = await api.patch(`/products/${product.id}`, payload)
        // Update color metadata on existing images that changed
        for (const img of existingImages) {
          if (img.id) {
            try { await api.patch(`/products/${product.id}/images/${img.id}`, { color: img.color || null }) } catch (_) {}
          }
        }
      } else {
        saved = await api.post('/products', payload)
      }

      if (newFiles.length > 0) {
        const fd = new FormData()
        newFiles.forEach(({ file }) => fd.append('images', file))
        fd.append('colors',     JSON.stringify(newFiles.map((f) => f.color || null)))
        fd.append('sortOrders', JSON.stringify(newFiles.map((_, i) => existingImages.length + i)))
        await api.upload(`/products/${saved.id}/images`, fd)
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-bg border border-line w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-line sticky top-0 bg-bg">
          <h2 className="font-display text-xl">{product ? 'Edit product' : 'Add product'}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-5 text-sm">
          {error && <p className="text-red-600">{error}</p>}

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="SKU">
              <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full border border-line px-3 py-2 bg-bg" />
            </Field>
            <Field label="Name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-line px-3 py-2 bg-bg" />
            </Field>
          </div>

          <Field label="Description">
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-line px-3 py-2 bg-bg" />
          </Field>

          <Field label="Product Details">
            <textarea rows={2} value={form.productDetails} onChange={(e) => setForm({ ...form, productDetails: e.target.value })}
              className="w-full border border-line px-3 py-2 bg-bg" />
          </Field>
          <Field label="Material & Care">
            <textarea rows={2} value={form.materialCare} onChange={(e) => setForm({ ...form, materialCare: e.target.value })}
              className="w-full border border-line px-3 py-2 bg-bg" />
          </Field>
          <Field label="Size & Fit Guide">
            <textarea rows={2} value={form.sizeFitGuide} onChange={(e) => setForm({ ...form, sizeFitGuide: e.target.value })}
              className="w-full border border-line px-3 py-2 bg-bg" />
          </Field>
          <Field label="Sustainability Focus">
            <textarea rows={2} value={form.sustainability} onChange={(e) => setForm({ ...form, sustainability: e.target.value })}
              className="w-full border border-line px-3 py-2 bg-bg" />
          </Field>

          {/* Category — dropdown only; manage categories from the Categories section */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-line px-3 py-2 bg-bg">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Subcategory (optional)">
              <input value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                className="w-full border border-line px-3 py-2 bg-bg" />
            </Field>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Price ($)">
              <input required type="number" min="0" step="0.01" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border border-line px-3 py-2 bg-bg" />
            </Field>
            <Field label="Compare-at price (optional)">
              <input type="number" min="0" step="0.01" value={form.compareAtPrice}
                onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                className="w-full border border-line px-3 py-2 bg-bg" />
            </Field>
            <Field label="Stock">
              <input required type="number" min="0" value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full border border-line px-3 py-2 bg-bg" />
            </Field>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Low stock threshold">
              <input type="number" min="0" placeholder="15" value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                className="w-full border border-line px-3 py-2 bg-bg" />
            </Field>
            <Field label="Warehouse">
              <input placeholder="WH-Mumbai" value={form.warehouse}
                onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
                className="w-full border border-line px-3 py-2 bg-bg" />
            </Field>
            <Field label="Status">
              <label className="flex items-center gap-2 border border-line px-3 py-2 bg-bg cursor-pointer h-[42px]">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                <span className="text-sm">{form.isActive ? 'Active (visible in shop)' : 'Inactive (hidden)'}</span>
              </label>
            </Field>
          </div>

          <Field label="Colors (comma separated)">
            <input placeholder="Black, White, Stone" value={form.colors}
              onChange={(e) => setForm({ ...form, colors: e.target.value })}
              className="w-full border border-line px-3 py-2 bg-bg" />
          </Field>

          <Field label="Sizes">
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((s) => (
                <Chip key={s} active={form.sizes.includes(s)} onClick={() => toggleListValue('sizes', s)}>{s}</Chip>
              ))}
            </div>
          </Field>

          <Field label="Tags">
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((t) => (
                <Chip key={t} active={form.tags.includes(t)} onClick={() => toggleListValue('tags', t)}>{t}</Chip>
              ))}
            </div>
          </Field>

          {/* Product images with optional colour tagging */}
          <Field label="Product images">
            <p className="text-muted text-xs mb-3 flex items-center gap-1">
              <Tag size={11} /> Tag each image with a colour to show it when that colour is selected on the product page.
            </p>
            <div className="space-y-2 mb-3">
              {existingImages.map((img, idx) => (
                <div key={idx} className="flex items-center gap-3 border border-line p-2">
                  <img src={img.url} alt="" className="w-14 h-14 object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted truncate mb-1">Saved image</p>
                    <select
                      value={img.color}
                      onChange={(e) => setExistingColor(idx, e.target.value)}
                      className="border border-line px-2 py-1 bg-bg text-xs w-full"
                    >
                      <option value="">No colour tag</option>
                      {colorList.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={() => removeExistingImage(img, idx)}
                    className="text-muted hover:text-red-500 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {newFiles.map(({ file, color }, idx) => (
                <div key={idx} className="flex items-center gap-3 border border-dashed border-line p-2">
                  <img src={URL.createObjectURL(file)} alt="" className="w-14 h-14 object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted truncate mb-1">{file.name}</p>
                    <select
                      value={color}
                      onChange={(e) => setNewFileColor(idx, e.target.value)}
                      className="border border-line px-2 py-1 bg-bg text-xs w-full"
                    >
                      <option value="">No colour tag</option>
                      {colorList.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={() => removeNewFile(idx)}
                    className="text-muted hover:text-red-500 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 border border-dashed border-line px-3 py-2 w-fit cursor-pointer text-muted hover:text-ink">
              <UploadCloud size={15} /> Upload images / GIFs
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            </label>
          </Field>

          <div className="flex justify-end gap-3 pt-2 border-t border-line">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-line text-sm">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-ink text-bg px-4 py-2 text-sm disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {product ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block eyebrow text-muted mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 text-xs border ${active ? 'bg-ink text-bg border-ink' : 'border-line text-muted hover:text-ink'}`}>
      {children}
    </button>
  )
}
