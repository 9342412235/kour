import { Routes, Route } from 'react-router-dom'
import { Plus, Eye, Heart, MessageCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import DashboardShell from '../components/DashboardShell'
import TaxPage from '../components/TaxPage'
import InvoicePage from '../components/InvoicePage'
import { StatCard, Pill, statusTone } from '../components/ui'
import api from '../lib/api'

function usePosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/blog')
      setPosts(data)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  return { posts, loading, error, reload: load }
}

function NewPostModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('draft')
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleFiles = (e) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])
    e.target.value = ''
  }
  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const post = await api.post('/blog', { title, description: content, status })
      if (files.length > 0) {
        const fd = new FormData()
        files.forEach((f) => fd.append('images', f))
        await api.upload(`/blog/${post.id}/images`, fd)
      }
      onCreated()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-bg border border-line w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:opacity-60">
          <X size={18} />
        </button>
        <h2 className="font-display text-2xl mb-6">New post</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="eyebrow text-muted block mb-1.5">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="eyebrow text-muted block mb-1.5">Description</label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="eyebrow text-muted block mb-1.5">Images</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {files.map((f, idx) => (
                <div key={idx} className="relative w-16 h-16 border border-line border-dashed">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFile(idx)}
                    className="absolute -top-2 -right-2 bg-ink text-bg rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 border border-dashed border-line px-3 py-2 w-fit cursor-pointer text-muted hover:text-ink text-xs">
              <Plus size={14} /> Upload images from device
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            </label>
          </div>
          <div>
            <label className="eyebrow text-muted block mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button disabled={saving} className="bg-ink text-bg px-4 py-2.5 text-sm w-full disabled:opacity-50">
            {saving ? 'Saving…' : 'Save post'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Edit an existing post: change text/status, and — this is the missing
// piece that made "blog images won't upload" true for any post that
// wasn't brand new — add or remove images on a post that already exists.
function EditPostModal({ post, onClose, onSaved }) {
  const [title, setTitle] = useState(post.title)
  const [content, setContent] = useState(post.content || '')
  const [status, setStatus] = useState(post.status)
  const [existingImages, setExistingImages] = useState(post.images || [])
  const [newFiles, setNewFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleFiles = (e) => {
    setNewFiles((prev) => [...prev, ...Array.from(e.target.files || [])])
    e.target.value = ''
  }
  const removeNewFile = (idx) => setNewFiles((prev) => prev.filter((_, i) => i !== idx))

  const removeExistingImage = async (url) => {
    try {
      await api.delete(`/blog/${post.id}/images`, { url })
      setExistingImages((prev) => prev.filter((u) => u !== url))
    } catch (err) {
      setError(err.message || 'Failed to remove image')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.patch(`/blog/${post.id}`, { title, description: content, status })
      if (newFiles.length > 0) {
        const fd = new FormData()
        newFiles.forEach((f) => fd.append('images', f))
        await api.upload(`/blog/${post.id}/images`, fd)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-bg border border-line w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:opacity-60">
          <X size={18} />
        </button>
        <h2 className="font-display text-2xl mb-6">Edit post</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="eyebrow text-muted block mb-1.5">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="eyebrow text-muted block mb-1.5">Description</label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="eyebrow text-muted block mb-1.5">Images</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {existingImages.map((url) => (
                <div key={url} className="relative w-16 h-16 border border-line">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeExistingImage(url)}
                    className="absolute -top-2 -right-2 bg-ink text-bg rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {newFiles.map((f, idx) => (
                <div key={idx} className="relative w-16 h-16 border border-line border-dashed">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeNewFile(idx)}
                    className="absolute -top-2 -right-2 bg-ink text-bg rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 border border-dashed border-line px-3 py-2 w-fit cursor-pointer text-muted hover:text-ink text-xs">
              <Plus size={14} /> Upload images from device
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            </label>
          </div>
          <div>
            <label className="eyebrow text-muted block mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button disabled={saving} className="bg-ink text-bg px-4 py-2.5 text-sm w-full disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

function PostsTable({ posts, onEditStatus, onEditPost }) {
  return (
    <div className="border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-muted eyebrow">
            <th className="p-4">Title</th><th className="p-4">Status</th><th className="p-4">Date</th><th className="p-4"></th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 && (
            <tr><td colSpan={4} className="p-4 text-muted text-center">No posts yet.</td></tr>
          )}
          {posts.map((b) => (
            <tr key={b.id} className="border-b border-line last:border-0">
              <td className="p-4">{b.title}</td>
              <td className="p-4"><Pill tone={statusTone(b.status)}>{b.status}</Pill></td>
              <td className="p-4 text-muted">{b.date ? new Date(b.date).toLocaleDateString() : '—'}</td>
              <td className="p-4">
                <div className="flex items-center gap-3 justify-end">
                  <button onClick={() => onEditPost(b)} className="eyebrow text-muted hover:opacity-60 text-xs">Edit / images</button>
                  <select
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) onEditStatus(b.id, e.target.value) }}
                    className="eyebrow bg-transparent border border-line text-xs px-2 py-1"
                  >
                    <option value="" disabled>Set status…</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Overview() {
  const { posts, error, reload } = usePosts()
  const [showNew, setShowNew] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl mb-1">My posts</h1>
          <p className="text-sm text-muted">Drafts, scheduled and published.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-ink text-bg px-4 py-2 text-sm"
        >
          <Plus size={15} /> New post
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Total views" value={totalViews.toLocaleString()} icon={Eye} />
        <StatCard label="Published" value={posts.filter(p => p.status === 'published').length} />
        <StatCard label="Drafts" value={posts.filter(p => p.status === 'draft').length} />
      </div>
      <PostsTable
        posts={posts}
        onEditStatus={(id, status) => api.patch(`/blog/${id}`, { status }).then(reload)}
        onEditPost={(post) => setEditingPost(post)}
      />
      {showNew && <NewPostModal onClose={() => setShowNew(false)} onCreated={reload} />}
      {editingPost && (
        <EditPostModal post={editingPost} onClose={() => setEditingPost(null)} onSaved={reload} />
      )}
    </div>
  )
}

function Analytics() {
  const { posts } = usePosts()
  const published = posts.filter(p => p.status === 'published')
  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Post analytics</h1>
      <p className="text-sm text-muted mb-8">Views, likes and comments per post.</p>
      <div className="grid gap-4">
        {published.length === 0 && <p className="text-sm text-muted">No published posts yet.</p>}
        {published.map((b) => (
          <div key={b.id} className="border border-line p-5 flex items-center justify-between">
            <p className="text-sm">{b.title}</p>
            <div className="flex items-center gap-6 text-sm text-muted">
              <span className="flex items-center gap-1.5"><Eye size={14} /> {(b.views || 0).toLocaleString()}</span>
              <span className="flex items-center gap-1.5"><Heart size={14} /> {b.likes || 0}</span>
              <span className="flex items-center gap-1.5"><MessageCircle size={14} /> {b.comments || 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BloggerDashboard() {
  return (
    <DashboardShell>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="posts" element={<Overview />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="tax" element={<TaxPage />} />
        <Route path="invoice" element={<InvoicePage />} />
      </Routes>
    </DashboardShell>
  )
}
