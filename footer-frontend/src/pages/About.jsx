import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const pillars = [
  {
    label: 'Quality',
    text: 'Every item undergoes a thorough review for fabric, fit, comfort, and performance before it ever reaches our site.',
  },
  {
    label: 'Customer Service',
    text: 'From browsing to delivery and beyond, our team is available at every step to make sure your experience is positive.',
  },
  {
    label: 'Innovation',
    text: 'We embrace new trends and technologies to keep our platform modern, convenient, and always evolving.',
  },
  {
    label: 'Sustainability',
    text: 'We seek opportunities to reduce waste, work with responsible suppliers, and make decisions that support the environment.',
  },
]

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-ink text-bg px-6 md:px-16 py-20 md:py-32">
        <div className="max-w-7xl mx-auto">
          <p className="eyebrow text-bg/50 mb-6">Who we are</p>
          <h1 className="font-display text-5xl md:text-7xl font-light leading-[1.05] max-w-3xl">
            Fashion is a reflection of who you are.
          </h1>
          <p className="mt-8 text-bg/70 text-base md:text-lg max-w-xl leading-relaxed font-light">
            At The Kour, we believe every outfit tells a story. Our mission is to help 
            you tell yours — with style, comfort, and authenticity.
          </p>
          <Link
            to="/how-we-work"
            className="inline-flex items-center gap-2 mt-10 border border-bg/30 text-bg px-6 py-3 text-sm tracking-wide hover:bg-bg hover:text-ink transition-colors"
          >
            How we work <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Origin */}
      <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="eyebrow text-muted mb-6">Our story</p>
            <h2 className="font-display text-3xl md:text-4xl font-light leading-tight text-ink">
              A trusted destination, built from a simple vision.
            </h2>
          </div>
          <div className="space-y-5 text-muted text-sm leading-[1.9] font-light">
            <p>
              Our journey began with a clear purpose: to create an online destination where customers 
              can discover high-quality fashion without compromising on comfort or affordability. We 
              understand that today's shoppers value both style and convenience.
            </p>
            <p>
              That's why we focus on versatile collections that suit a variety of lifestyles, 
              occasions, and personal preferences. Every product featured in our store is selected 
              with attention to detail — ensuring it meets our standards for quality, durability, 
              and design.
            </p>
            <p>
              Our success is built on the trust and loyalty of our customers. Every order represents 
              an opportunity to exceed expectations, and we are grateful for the confidence you place in us.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-line mx-6 md:mx-16" />

      {/* Pillars */}
      <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto">
        <p className="eyebrow text-muted mb-12">What we stand for</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          {pillars.map((p) => (
            <div key={p.label}>
              <p className="eyebrow text-ink mb-4">{p.label}</p>
              <p className="text-sm text-muted leading-7 font-light">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-line mx-6 md:mx-16" />

      {/* Our Goal section */}
      <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="eyebrow text-muted mb-6">Our goal</p>
            <h2 className="font-display text-3xl md:text-4xl font-light leading-tight text-ink">
              Inspiring confidence through fashion.
            </h2>
          </div>
          <div className="space-y-5 text-muted text-sm leading-[1.9] font-light">
            <p>
              Our goal extends far beyond offering clothing. We aim to create meaningful experiences 
              that empower people to express themselves with confidence and authenticity. We believe 
              what you wear has the power to influence how you feel, present yourself, and engage 
              with the world.
            </p>
            <p>
              Every collection we offer is thoughtfully curated to help our customers embrace their 
              unique style while enjoying exceptional comfort, quality, and value. Our purpose is to 
              make fashion accessible, inspiring, and effortless for individuals from all walks of life.
            </p>
            <p>
              From the very beginning, our vision has been to build more than just an online clothing 
              store — a trusted fashion destination where customers can shop with complete confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Goal details grid */}
      <section className="bg-surface px-6 md:px-16 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10">
            {[
              {
                heading: 'Style & Function',
                body: 'Fashion trends evolve quickly, but timeless quality never goes out of style. We continuously evaluate our collections to ensure they reflect current trends while maintaining versatility and long-lasting appeal.',
              },
              {
                heading: 'Customer Satisfaction',
                body: 'Shopping online requires trust. Our goal is to create a seamless experience from the moment you visit our site to the day your order arrives — with clear information, accurate sizing, and responsive support.',
              },
              {
                heading: 'Transparency',
                body: 'We believe our customers deserve honest product descriptions, fair pricing, secure transactions, and clear communication at every stage so shoppers can make informed decisions with confidence.',
              },
            ].map((item) => (
              <div key={item.heading} className="space-y-3">
                <p className="eyebrow text-muted">{item.heading}</p>
                <p className="text-sm text-muted leading-7 font-light">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="px-6 md:px-16 py-16 max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <h2 className="font-display text-2xl md:text-3xl font-light text-ink max-w-sm">
          Ready to find your style?
        </h2>
        <div className="flex gap-4">
          <Link
            to="/how-we-work"
            className="text-sm eyebrow text-muted hover:text-ink transition-colors"
          >
            How we work →
          </Link>
        </div>
      </section>
    </div>
  )
}
