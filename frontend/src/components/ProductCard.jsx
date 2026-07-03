import { Heart, Star } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
const SWATCH = {
  Bone: '#e7e3da', White: '#ffffff', Black: '#0c0c0b', Graphite: '#3a3a38',
  Charcoal: '#2a2a28', Stone: '#9b978d', Fog: '#c7c5c0', Espresso: '#241c16',
  Silver: '#c8c8c6',
}

export default function ProductCard({ product }) {
  const { user, wishlist, toggleWishlist } = useApp()
  const navigate = useNavigate()
  const liked = wishlist.includes(product.id)

  const handleWishlistClick = (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    toggleWishlist(product.id).catch(() => {})
  }

  return (
    <div className="group">
      <div className="relative aspect-[4/5] bg-surface overflow-hidden mb-3 rounded-md">
        <Link to={`/product/${product.id}`}>
  <img
    src={product.image}
    alt={product.name}
    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
  />
</Link>
        <button
  onClick={handleWishlistClick}
  aria-label="Toggle wishlist"
  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-bg/80 flex items-center justify-center hover:scale-105 transition"
>
  <Heart 
    size={15} 
    fill={liked ? '#ef4444' : 'none'} 
    className={liked ? 'text-red-500' : 'text-ink'}
  />
</button>
        {/* {product.badge && (
          <span className="absolute top-3 left-3 eyebrow bg-bg/90 px-2 py-1">{product.badge}</span>
        )} */}
        {product.stock <= 10 && (
          <span className="absolute bottom-3 left-3 eyebrow bg-ink text-bg px-2 py-1">Low stock</span>
        )}
      </div>
      <Link to={`/product/${product.id}`} className="block">
        <h3 className="text-sm leading-snug mb-1 group-hover:opacity-60">{product.name}</h3>
      </Link>
      <div className="flex items-center justify-between mb-1.5">
  <div className="flex items-center gap-2">
    <span className="text-[1.25rem]">
      ${product.price.toFixed(2)}
    </span>

    <span className="text-sm text-muted line-through">
      ${(product.price * 1.25).toFixed(2)}
    </span>
  </div>

  <span className="flex items-center gap-1 text-xs text-muted">
    <Star size={11} fill="var(--muted)" />
    {product.rating}
  </span>
</div>
      <div className="flex items-center gap-1.5">
        {product.colors.map((c) => (
          <span
            key={c}
            title={c}
            className="h-3.5 w-3.5 rounded-full border border-line"
            style={{ background: SWATCH[c] || '#999' }}
          />
        ))}
      </div>
    </div>
  )
}
