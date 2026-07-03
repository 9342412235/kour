import { useEffect, useState } from 'react'
import { X, Upload, Trash2 } from 'lucide-react'
import api from '../lib/api'

const MAX_RELATED = 10

export default function ProductForm({ product, allProducts, categories, onClose, onSaved }) {
  const isEdit = Boolean(product)
  const [form, setForm] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || (categories[0]?.id ?? ''),
    subcategory: product?.subcategory || '',
    price: product?.price ?? '',
    compareAtPrice: product?.compareAtPrice ?? '',
    stock: product?.stock ?? 0,
    badge: product?.badge || '',
  })
  const [relatedIds, setRelatedIds] = useState(product?.relatedProductIds || [])
  const [existingImages, setExistingImages] = useState(product?.images || [])
  const [newFiles, setNewFiles] = useState([])
  const [newPreviews, setNewPreviews] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    return () => newPreviews.forEach((url) => URL.revokeObjectURL(url))
  }, [newPreviews])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onFilesChosen = (e) => {
    const files = Array.from(e.target.files || [])
    const room = 10 - existingImages.length - newFiles.length
    const accepted = files.slice(0, Math.max(room, 0))
    setNewFiles((prev) => [...prev, ...accepted])
    setNewPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))])
  }

  const removeNewFile = (idx) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx))
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const removeExistingImage = async (url) => {
    if (!isEdit) return
    await api.delete(`/products/${product.id}/images`, { url })
    setExistingImages((prev) => prev.filter((u) => u !== url))
  }

  const toggleRelated = (id) => {
    setRelatedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_RELATED) return prev
      return [...prev, id]
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.sku.trim() || !form.name.trim() || form.price === '') {
      setError('SKU, name and price are required')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description,
        category: form.category || null,
        subcategory: form.subcategory.trim() || null,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice === '' ? null : Number(form.compareAtPrice),
        stock: Number(form.stock),
        badge: form.badge.trim() || null,
        relatedProductIds: relatedIds,
      }

      let saved
      if (isEdit) {
        saved = await api.patch(`/products/${product.id}`, payload)
      } else {
        saved = await api.post('/products', payload)
      }

      if (newFiles.length > 0) {
        const formData = new FormData()
        newFiles.forEach((f) => formData.append('images', f))
        saved = await api.upload(`/products/${saved.id}/images`, formData)
      }

      onSaved(saved)
    } catch (err) {
      setError(err.message || 'Could not save product')
    } finally {
      setSubmitting(false)
    }
  }

  const candidates = (allProducts || []).filter((p) => p.id !== product?.id)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-10">
      <div className="bg-white w-full max-w-2xl mx-4 border border-line">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h2 className="font-display text-xl">{isEdit ? 'Edit product' : 'New product'}</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow text-muted block mb-1.5">SKU</label>
              <input value={form.sku} onChange={set('sku')} className="w-full border border-line px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="eyebrow text-muted block mb-1.5">Name</label>
              <input value={form.name} onChange={set('name')} className="w-full border border-line px-3 py-2 text-sm outline-none" />
            </div>
          </div>

          <div>
            <label className="eyebrow text-muted block mb-1.5">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={3} className="w-full border border-line px-3 py-2 text-sm outline-none" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow text-muted block mb-1.5">Category</label>
              <select value={form.category} onChange={set('category')} className="w-full border border-line px-3 py-2 text-sm">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="eyebrow text-muted block mb-1.5">Subcategory</label>
              <input value={form.subcategory} onChange={set('subcategory')} placeholder="e.g. Sneakers, Sandals…" className="w-full border border-line px-3 py-2 text-sm outline-none" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="eyebrow text-muted block mb-1.5">Price ($)</label>
              <input type="number" step="0.01" value={form.price} onChange={set('price')} className="w-full border border-line px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="eyebrow text-muted block mb-1.5">Compare-at price</label>
              <input type="number" step="0.01" value={form.compareAtPrice} onChange={set('compareAtPrice')} className="w-full border border-line px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="eyebrow text-muted block mb-1.5">Stock</label>
              <input type="number" value={form.stock} onChange={set('stock')} className="w-full border border-line px-3 py-2 text-sm outline-none" />
            </div>
          </div>

          <div>
            <label className="eyebrow text-muted block mb-1.5">Badge (optional)</label>
            <input value={form.badge} onChange={set('badge')} placeholder="e.g. New, Bestseller…" className="w-full border border-line px-3 py-2 text-sm outline-none" />
          </div>

          {/* Raw image uploads */}
          <div>
            <label className="eyebrow text-muted block mb-1.5">
              Product images ({existingImages.length + newFiles.length}/10)
            </label>
            <div className="flex flex-wrap gap-3 mb-2">
              {existingImages.map((url) => (
                <div key={url} className="relative w-20 h-20 border border-line">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeExistingImage(url)} className="absolute -top-2 -right-2 bg-black text-white rounded-full p-0.5">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {newPreviews.map((url, i) => (
                <div key={url} className="relative w-20 h-20 border border-line">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeNewFile(i)} className="absolute -top-2 -right-2 bg-black text-white rounded-full p-0.5">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            {existingImages.length + newFiles.length < 10 && (
              <label className="inline-flex items-center gap-2 border border-line px-3 py-2 text-sm cursor-pointer hover:bg-surface">
                <Upload size={14} /> Upload images
                <input type="file" accept="image/*" multiple className="hidden" onChange={onFilesChosen} />
              </label>
            )}
            <p className="text-xs text-muted mt-1">Upload raw image files directly — no URLs needed. Up to 10 images.</p>
          </div>

          {/* Related products */}
          <div>
            <label className="eyebrow text-muted block mb-1.5">
              Related products ({relatedIds.length}/{MAX_RELATED})
            </label>
            <div className="border border-line max-h-44 overflow-y-auto divide-y divide-line">
              {candidates.map((p) => (
                <label key={p.id} className="flex items-center gap-3 p-2.5 text-sm cursor-pointer hover:bg-surface">
                  <input
                    type="checkbox"
                    checked={relatedIds.includes(p.id)}
                    disabled={!relatedIds.includes(p.id) && relatedIds.length >= MAX_RELATED}
                    onChange={() => toggleRelated(p.id)}
                  />
                  {p.name} <span className="text-muted">({p.sku})</span>
                </label>
              ))}
              {candidates.length === 0 && <p className="p-3 text-sm text-muted">No other products yet.</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="bg-ink text-bg px-5 py-2.5 text-sm disabled:opacity-50">
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
            </button>
            <button type="button" onClick={onClose} className="border border-line px-5 py-2.5 text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
