import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { Star, Heart, Truck, RotateCcw, Share2, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ProductCard from '../components/ProductCard'
import api from '../lib/api'

export default function ProductDetail() {
  const { id } = useParams()
  const { user, addToCart, wishlist, toggleWishlist } = useApp()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [color, setColor] = useState(null)
  const [size, setSize] = useState('M')
  const [activeImage, setActiveImage] = useState(null)

  // All images available for this product (falls back to the single main image)
  const galleryImages = (product?.images && product.images.length > 0)
    ? product.images
    : (product?.image ? [product.image] : [])

  // Derive the image to show: a manually-selected thumbnail takes priority,
  // then a colour-specific image if available, else the default image
  const currentImage = activeImage
    || (product && color && product.colorImages?.[color])
    || product?.image
    || galleryImages[0]
    || null
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [copied, setCopied] = useState(false)

  // Zoom feature states
  const [isZooming, setIsZooming] = useState(false)
  const [lensStyle, setLensStyle] = useState({ top: 0, left: 0 })
  const [zoomBgStyle, setZoomBgStyle] = useState({ backgroundPosition: '0% 0%' })

  const imageRef = useRef(null)

  // Fetch Product Data
  useEffect(() => {
    setLoading(true)
    api.get(`/products/${id}`)
      .then((p) => {
        setProduct(p)
        setColor(p.colors?.[0] || null)
        if (p.relatedProducts && p.relatedProducts.length > 0) {
          setRelated(p.relatedProducts.slice(0, 4))
          return null
        }
        return api.get(`/products?category=${p.category}&limit=8`)
      })
      .then((data) => {
        if (data) setRelated((data?.products || []).filter((p) => p.id !== id).slice(0, 4))
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  // Reset the manually-picked thumbnail whenever the color swatch changes,
  // so the colour-specific image takes over again
  useEffect(() => {
    setActiveImage(null)
  }, [color])

  // ─── OPTIMIZED LAG-FREE SMOOTH SCROLL ──────────────────────────────────────
  useEffect(() => {
    // requestAnimationFrame ensures the browser schedules the scroll 
    // after it handles the heavy DOM mount/layout recalculations.
    const handleScroll = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }

    const animFrame = requestAnimationFrame(handleScroll)
    
    return () => cancelAnimationFrame(animFrame)
  }, [id])
  // ────────────────────────────────────────────────────────────────────────────

  if (loading) return <div className="p-10 text-sm text-muted">Loading product…</div>
  if (!product) return <div className="p-10">Product not found.</div>

  const liked = wishlist.includes(product.id)

  const handleAdd = () => {
    addToCart({ ...product, selectedColor: color, selectedSize: size }, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  // Quince-style zoom tracking
  const handleMouseMove = (e) => {
    if (!imageRef.current) return
    const { left, top, width, height } = imageRef.current.getBoundingClientRect()
    
    // Position of cursor relative to main image container
    let x = e.clientX - left
    let y = e.clientY - top

    // Dimensions of the tracking lens box (e.g., 160px by 160px)
    const lensSize = 160

    // Keep lens bounds inside the main image wrapper
    let lensLeft = x - lensSize / 2
    let lensTop = y - lensSize / 2

    if (lensLeft < 0) lensLeft = 0
    if (lensTop < 0) lensTop = 0
    if (lensLeft > width - lensSize) lensLeft = width - lensSize
    if (lensTop > height - lensSize) lensTop = height - lensSize

    // Calculate background position percentages for the zoom view box
    const bgX = (lensLeft / (width - lensSize)) * 100
    const bgY = (lensTop / (height - lensSize)) * 100

    setIsZooming(true)
    setLensStyle({
      left: `${lensLeft}px`,
      top: `${lensTop}px`,
      width: `${lensSize}px`,
      height: `${lensSize}px`,
    })
    setZoomBgStyle({
      backgroundPosition: `${bgX}% ${bgY}%`,
    })
  }

  return (
    <div className="px-5 md:px-[60px] py-6 max-w-[1440px] mx-auto">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-muted mb-8 tracking-wide uppercase">
        <Link to="/" className="hover:text-ink transition">Home</Link>
        <ChevronRight size={10} className="text-line" />
        <Link to="/shop" className="hover:text-ink transition">Shop</Link>
        <ChevronRight size={10} className="text-line" />
        <span className="text-muted/60 lowercase first-letter:uppercase">{product.category}</span>
        <ChevronRight size={10} className="text-line" />
        <span className="text-ink font-medium max-w-[150px] md:max-w-none truncate">{product.name}</span>
      </nav>

      {/* 3-Column Layout */}
      <div className="grid lg:grid-cols-[80px_1.3fr_1fr] gap-10 mb-16 items-start relative">

        {/* 1. Thumbnail Gallery (Left) */}
        <div className="hidden lg:flex flex-col gap-3 lg:sticky lg:top-10 h-fit">
          {galleryImages.map((imgUrl, idx) => (
            <button
              key={imgUrl + idx}
              onClick={() => setActiveImage(imgUrl)}
              className={`aspect-[4/5] border bg-surface hover:border-ink transition flex items-center justify-center rounded-sm overflow-hidden ${
                currentImage === imgUrl ? 'border-ink' : 'border-line'
              }`}
            >
              <img
                src={imgUrl}
                alt={`${product.name} thumbnail ${idx + 1}`}
                className={`w-full h-full object-cover transition-opacity ${
                  currentImage === imgUrl ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                }`}
              />
            </button>
          ))}
        </div>

        {/* 2. Main Preview Image with Cursor Lens (Center Sticky Wrapper) */}
        <div className="lg:sticky lg:top-10 h-fit w-full">
          <div 
            ref={imageRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setIsZooming(false)}
            className="w-[90%] h-[80%] aspect-[4/5] bg-surface flex items-center justify-center relative overflow-hidden rounded-md cursor-zoom-in"
          >
            {/* Wishlist Icon */}
            {/* Wishlist Icon */}
<button
  onClick={() => toggleWishlist(product.id)}
  className="absolute top-4 right-4 bg-white rounded-full p-2.5 shadow-sm z-10 hover:scale-105 transition"
>
  <Heart 
    size={16} 
    fill={liked ? "#ef4444" : "none"} 
    className={liked ? "text-red-500" : "text-ink"} 
  />
</button>

            {/* Main Product Image */}
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />

            {/* Tracking Square Lens */}
            {isZooming && (
              <div 
                className="absolute bg-black/10 border border-black/20 pointer-events-none"
                style={lensStyle}
              />
            )}
          </div>
        </div>

        {/* 3. Product Info Column & Dynamic Zoom Mirror Panel */}
        <div className="w-full relative">
          
          {/* Quince Zoom Window */}
          {isZooming && (
            <div 
              className="absolute inset-0 bg-surface border border-line rounded-sm z-20 pointer-events-none hidden lg:block"
              style={{
                ...zoomBgStyle,
                backgroundImage: `url(${currentImage})`,
                backgroundSize: '300%', 
                backgroundRepeat: 'no-repeat',
                minHeight: '600px'
              }}
            />
          )}

          {/* Regular Product Content Details */}
          <div className="w-full">
            <p className="eyebrow text-muted mb-2 text-xs uppercase tracking-wider">
              {product.category}
            </p>

            <h1 className="font-display text-2xl mb-2 font-normal text-ink">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mb-4 text-xs text-muted">
              <Star size={12} fill="var(--muted)" />
              {product.rating} ({product.reviews} reviews)
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <p className="text-2xl font-semibold">
                  ${product.price.toFixed(2)}
                </p>
                <p className="text-md text-muted line-through">
                  ${(product.price * 2.2).toFixed(2)}
                </p>
              </div>
              <p className="text-xs text-muted mt-1">
                You save {Math.round((1 - product.price / (product.price * 2.2)) * 100)}%
              </p>
            </div>

            {/* Colors */}
            <div className="mb-6">
              <p className="eyebrow text-muted mb-2 text-xs">
                Color — <span className="text-ink font-medium">{color}</span>
              </p>

              <div className="flex gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      color === c ? "border-ink scale-105" : "border-line hover:scale-105"
                    }`}
                    style={{
                      background:
                        c.toLowerCase() === "black" ? "#000" :
                        c.toLowerCase() === "white" ? "#fff" :
                        c.toLowerCase() === "charcoal" ? "#4b5563" : "#d4d4d4",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="mb-6">
              <p className="eyebrow text-muted mb-2 text-xs">Size</p>
              <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {["XS", "S", "M", "L", "XL", "XXL"].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSize(sz)}
                    className={`border py-1.5 px-3 text-xs font-medium transition rounded-md min-w-[42px] flex-shrink-0 ${
                      size === sz 
                        ? "border-ink bg-ink text-white" 
                        : "border-line hover:border-ink bg-transparent"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex items-center border border-line rounded-md overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-2.5 py-1.5 hover:bg-surface transition"
                >
                  −
                </button>
                <span className="px-3 text-sm font-medium">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-2.5 py-1.5 hover:bg-surface transition"
                >
                  +
                </button>
              </div>

              <span className="text-xs text-muted">
                {product.stock} in stock
              </span>
            </div>

            {/* Add To Cart, Wishlist & Share Container */}
            <div className="flex gap-3 mb-6 relative items-stretch">
              <button
                onClick={handleAdd}
                className="flex-[4] rounded-lg bg-ink text-bg py-2.5 text-sm font-medium tracking-wide hover:opacity-95 transition active:scale-[0.99]"
              >
                {added ? "Added to bag ✓" : "Add to bag"}
              </button>

              <button
                onClick={() => { if (!user) { navigate('/login'); return } toggleWishlist(product.id).catch(() => {}) }}
                className="flex-1 flex items-center justify-center border border-line rounded-md hover:bg-surface transition"
                title="Add to wishlist"
              >
                <Heart size={16} fill={liked ? "var(--ink)" : "none"} />
              </button>

              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center border border-line rounded-md hover:bg-surface transition relative"
                title="Copy Product Link"
              >
                <Share2 size={16} className="text-ink" />
                {copied && (
                  <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-ink text-bg text-[10px] px-2 py-1 rounded shadow-sm whitespace-nowrap animate-fade-in-up">
                    Copied!
                  </span>
                )}
              </button>
            </div>

            {/* Shipping Terms */}
            <div className="space-y-2.5 text-xs text-muted mb-8">
              <div className="flex items-center gap-2.5">
                <Truck size={14} />
                Free shipping, arrives in 4–6 days
              </div>
              <div className="flex items-center gap-2.5">
                <RotateCcw size={14} />
                365-day easy returns
              </div>
            </div>

            {/* Expanded Content Sections */}
            <div className="border-t border-line pt-6 space-y-6">
              <div>
                <h3 className="font-display text-sm font-medium uppercase tracking-wide text-ink mb-3">
                  Product Details
                </h3>
                <p className="text-xs text-muted leading-relaxed mb-3">
                  Woven from premium long-staple fibers sourced directly from sustainable European mills. This breathable, high-performance garment offers incredible light comfort paired with a structured luxury drape that softens naturally with every wash cycle.
                </p>
                <ul className="space-y-2 text-xs text-muted list-disc list-inside pl-0.5">
                  <li>Soft and highly breathable construction.</li>
                  <li>Minimalist classic tailoring with fine needle stitching.</li>
                  <li>Naturally moisture-wicking properties.</li>
                  <li>SKU: {product.sku || 'N/A-00291'}</li>
                </ul>
              </div>

              <div className="border-t border-line pt-5">
                <h3 className="font-display text-sm font-medium uppercase tracking-wide text-ink mb-3">
                  Material & Care
                </h3>
                <ul className="space-y-1.5 text-xs text-muted list-none">
                  <li><strong className="text-ink font-normal">Composition:</strong> 100% Organically Grown European Flax Linen.</li>
                  <li><strong className="text-ink font-normal">Washing:</strong> Machine wash cold with like colors on a gentle cycle.</li>
                  <li><strong className="text-ink font-normal">Drying:</strong> Tumble dry low or line dry out of direct sunlight.</li>
                  <li><strong className="text-ink font-normal">Ironing:</strong> Use medium warm iron with steam while fabric is slightly damp if desired.</li>
                </ul>
              </div>

              <div className="border-t border-line pt-5">
                <h3 className="font-display text-sm font-medium uppercase tracking-wide text-ink mb-3">
                  Size & Fit Guide
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Designed for a relaxed, slightly oversized modern profile. We suggest taking your standard true size for the intended effortless casual styling context, or sizing down one size if you prefer a slim, standard contour alignment.
                </p>
              </div>

              <div className="border-t border-line pt-5">
                <h3 className="font-display text-sm font-medium uppercase tracking-wide text-ink mb-3">
                  Sustainability Focus
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Crafted using 100% certified clean renewable practices. Utilizing up to 85% less fresh water and zero harsh chemical run-offs compared to traditional industrial manufacturing methods, ensuring minimum impact footprint across processing stages.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Related Products Footer Layout */}
      {related.length > 0 && (
        <div className="border-t border-line pt-12">
          <h2 className="font-display text-xl mb-6">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      <Link to="/shop" className="inline-block mt-10 text-xs eyebrow hover:opacity-60 transition">
        ← Back to shop
      </Link>
    </div>
  )
}