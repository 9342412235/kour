import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/blog')
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="px-5 md:px-16 py-16 max-w-6xl mx-auto">
      <p className="eyebrow text-muted mb-2">Journal</p>
      <h1 className="font-display text-3xl md:text-4xl mb-10">From the blog</h1>

      {loading && <p className="text-sm text-muted">Loading…</p>}
      {!loading && posts.length === 0 && (
        <p className="text-sm text-muted">No posts published yet — check back soon.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Link to={`/blog/${post.id}`} key={post.id} className="group block">
            <div className="aspect-[4/3] bg-surface mb-4 overflow-hidden">
              {post.coverImage ? (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted">No image</div>
              )}
            </div>
            <p className="text-xs text-muted mb-1">
              {post.date ? new Date(post.date).toLocaleDateString() : ''}
              {post.author ? ` · ${post.author}` : ''}
            </p>
            <h2 className="font-display text-lg mb-2 group-hover:opacity-70 transition-opacity">{post.title}</h2>
            <p className="text-sm text-muted line-clamp-3">{post.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
