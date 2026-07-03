import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Heart } from 'lucide-react'
import api from '../lib/api'
import { useApp } from '../context/AppContext'

export default function BlogDetail() {
  const { id } = useParams()
  const { user } = useApp()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [liking, setLiking] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/blog/${id}`)
      .then((data) => { setPost(data); setActiveImage(0) })
      .catch((err) => setError(err.message || 'Post not found'))
      .finally(() => setLoading(false))
  }, [id])

  const like = async () => {
    if (!user || liking) return
    setLiking(true)
    try {
      const { likes } = await api.post(`/blog/${id}/like`)
      setPost((p) => ({ ...p, likes }))
    } catch { /* ignore */ } finally { setLiking(false) }
  }

  if (loading) return <div className="px-5 py-24 text-center text-sm text-muted">Loading…</div>
  if (error || !post) {
    return (
      <div className="px-5 py-24 text-center max-w-md mx-auto">
        <p className="text-sm text-muted mb-4">{error || 'This post could not be found.'}</p>
        <Link to="/blog" className="underline text-sm hover:opacity-60">Back to the blog</Link>
      </div>
    )
  }

  const images = post.images?.length ? post.images : (post.coverImage ? [post.coverImage] : [])

  return (
    <div className="px-5 md:px-16 py-16 max-w-3xl mx-auto">
      <Link to="/blog" className="flex items-center gap-2 text-xs text-muted hover:opacity-60 mb-8">
        <ArrowLeft size={14} /> Back to the blog
      </Link>

      <p className="text-xs text-muted mb-2">
        {post.date ? new Date(post.date).toLocaleDateString() : ''}
        {post.author ? ` · ${post.author}` : ''}
      </p>
      <h1 className="font-display text-3xl md:text-4xl mb-8">{post.title}</h1>

      {images.length > 0 && (
        <div className="mb-8">
          <div className="aspect-[16/9] bg-surface overflow-hidden mb-3">
            <img src={images[activeImage]} alt={post.title} className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 overflow-hidden border ${i === activeImage ? 'border-ink' : 'border-line opacity-70'}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-muted leading-7 whitespace-pre-line mb-10">{post.description}</p>

      <div className="flex items-center gap-4 pt-6 border-t border-line text-sm text-muted">
        <button onClick={like} disabled={!user} className="flex items-center gap-1.5 disabled:opacity-50 hover:opacity-70">
          <Heart size={15} /> {post.likes || 0}
        </button>
        <span>{post.views || 0} views</span>
      </div>
    </div>
  )
}
