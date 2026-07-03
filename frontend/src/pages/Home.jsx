import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { productImages, categories, reviews, bannerSlides, heroData } from '../data/mockData' // Added heroData import
import { useEffect, useState } from "react";
import api from '../lib/api'

export default function Home() {
  const [products, setProducts] = useState([])
  const [content, setContent] = useState(null)
  useEffect(() => {
    api.get('/products?limit=60').then((data) => setProducts(data.products)).catch(() => setProducts([]))
  }, [])

  useEffect(() => {
    api.get('/content').then(setContent).catch(() => setContent(null))
  }, [])

  // Falls back to mockData until /api/content resolves (or if it fails),
  // then prefers the admin-edited hero from Settings > Site Content.
  const hero = {
    title: content?.hero?.title || heroData.title,
    subtitle: content?.hero?.subtitle || heroData.subtitle,
    ctaText: content?.hero?.ctaText || heroData.ctaText,
    ctaLink: content?.hero?.ctaUrl || heroData.ctaLink,
    backgroundImage: content?.hero?.imageUrl || heroData.backgroundImage,
    season: heroData.season,
  }

  const bestSellers = products.filter((p) => p.badge === 'Best seller').slice(0, 4)
  const newArrivals = products.filter((p) => p.badge === 'New').slice(0, 4)  

  const [currentSlide, setCurrentSlide] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setReviewIndex((prev) => (prev + 3) % reviews.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [reviews.length]); // Added missing dependency array items for safety

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [bannerSlides.length]); // Added missing dependency array items for safety

  const reviewTriplets = [];
  for (let i = 0; i < reviews.length; i += 3) {
    reviewTriplets.push(reviews.slice(i, i + 3));
  }

  return (
    <div>
      {/* Dynamic Hero Section */}
      <section className="relative h-[78vh] min-h-[480px] bg-surface flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={hero.backgroundImage}
            alt={hero.title}
            className="w-full h-full object-cover opacity-70"
          />
        </div>

        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 px-6 text-center max-w-4xl mx-auto">
          <p className="eyebrow text-white/80 mb-4">
            {hero.season}
          </p>

          <h1 className="font-display text-4xl md:text-6xl leading-[1.05] mb-6 text-white whitespace-pre-line">
            {hero.title}
          </h1>

          <p className="text-sm md:text-base text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed whitespace-pre-line">
            {hero.subtitle}
          </p>

          <Link
            to={hero.ctaLink}
            className="inline-flex items-center gap-2 bg-ink text-bg px-6 py-3 text-sm tracking-wide hover:opacity-85 rounded-lg"
          >
            {hero.ctaText}
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Category strip */}
      <section className="px-5 md:px-10 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/shop?category=${c.id}`}
              className="group"
            >
              <div className="aspect-square bg-surface flex items-center justify-center mb-3 group-hover:bg-surface-2 transition-colors overflow-hidden">
                <img
                  src={products.find((p) => p.category === c.id)?.image}
                  alt={c.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="text-sm">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Editorial banner */}
      <section className="py-6 w-full">
        <div className="bg-ink text-bg p-10 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="eyebrow opacity-60 mb-2">Sourced direct</p>
            <h2 className="font-display text-3xl md:text-4xl max-w-md">No middleman. No markup theatrics.</h2>
          </div>
          <Link to="/shop" className="text-sm underline underline-offset-4 hover:opacity-70 shrink-0">
            How we keep prices low
          </Link>
        </div>
      </section>

      {/* Best sellers */}
      <section className="px-5 md:px-10 py-14">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl">Best sellers</h2>
          <Link to="/shop" className="text-sm eyebrow hover:opacity-60">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Banner Carousel */}
      <section className="relative h-[450px] overflow-hidden">
        {bannerSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-black/35" />

            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div className="text-white px-6">
                <p className="uppercase tracking-[0.3em] text-xs mb-4">
                  Featured Collection
                </p>

                <h2 className="font-display text-4xl md:text-6xl mb-4">
                  {slide.title}
                </h2>

                <p className="text-white/80 mb-8">
                  {slide.subtitle}
                </p>

                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-sm rounded-lg"
                >
                  Shop Now
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        ))}

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {bannerSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === index ? "w-8 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="px-5 md:px-10 py-14 bg-surface">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl">New arrivals</h2>
          <Link to="/shop" className="text-sm eyebrow hover:opacity-60">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          {newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Reviews */}
      <section className="px-5 md:px-10 py-16 overflow-hidden">
        <h2 className="font-display text-2xl mb-8">
          Honest Reviews
        </h2>

        <div className="relative">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${Math.floor(reviewIndex / 3) * 100}%)`,
            }}
          >
            {reviewTriplets.map((pair, slideIndex) => (
              <div
                key={slideIndex}
                className="w-full shrink-0"
              >
                <div className="grid md:grid-cols-3 gap-6">
                  {pair.map((r) => {
                    const product = products.find(
                      (p) => p.name === r.product
                    );

                    return (
                      <Link
                        key={r.product}
                        to={`/product/${product?.id}`}
                        className="border border-line p-5 bg-bg flex flex-col aspect-square group hover:shadow-sm transition-all overflow-hidden"
                      >
                        <div className="flex-1 min-h-0 w-full mb-3 overflow-hidden">
                          <img
                            src={product?.image}
                            alt={r.product}
                            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                          />
                        </div>

                        <div className="shrink-0 space-y-2">
                          <p className="text-xs md:text-sm leading-snug text-ink line-clamp-2">
                            "{r.text}"
                          </p>
                          
                          <div>
                            <p className="eyebrow text-muted text-[10px]">
                              {r.author}
                            </p>
                            <p className="text-xs font-medium underline underline-offset-2 group-hover:text-ink transition-colors truncate">
                              {r.product}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {reviewTriplets.map((_, index) => (
              <button
                key={index}
                onClick={() => setReviewIndex(index * 3)}
                className={`h-2 rounded-full transition-all ${
                  Math.floor(reviewIndex / 3) === index
                    ? "w-8 bg-ink"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}