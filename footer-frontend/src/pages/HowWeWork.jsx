import PolicyLayout from '../components/PolicyLayout'
import { Link } from 'react-router-dom'

const steps = [
  {
    n: '01',
    title: 'Trend Research & Curation',
    body: 'We begin by carefully researching styles, fabrics, colors, and seasonal collections. Every item featured on The Kour is chosen with attention to quality, comfort, durability, and design — ensuring you receive products you can wear with confidence.',
  },
  {
    n: '02',
    title: 'Quality Review',
    body: 'Once products are selected, they undergo a quality review before being made available on our website. We focus on providing accurate product descriptions, detailed size information, and high-quality imagery so you can shop with full confidence.',
  },
  {
    n: '03',
    title: 'Order Fulfillment',
    body: 'When you place an order, our fulfillment process begins immediately. After payment is verified, each product is inspected before packaging. We use secure materials to protect your purchase during transit and minimize the risk of damage.',
  },
  {
    n: '04',
    title: 'Shipping & Tracking',
    body: 'We partner with trusted shipping providers to ensure your order is delivered safely and efficiently. Once your package ships, you receive a confirmation and tracking details so you can monitor every step of the journey.',
  },
  {
    n: '05',
    title: 'Customer Support',
    body: 'Our dedicated support team is available to assist with questions about products, sizing, orders, shipping, returns, and general inquiries. We carefully listen to feedback and use it to improve our products and overall experience.',
  },
  {
    n: '06',
    title: 'After-Sales Care',
    body: 'Our work doesn\'t end when an order is delivered. We remain committed to supporting customers through flexible return policies, responsive after-sales service, and ongoing assistance whenever needed.',
  },
]

export default function HowWeWork() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-surface px-6 md:px-16 py-20 md:py-28">
        <div className="max-w-7xl mx-auto">
          <p className="eyebrow text-muted mb-6">Behind the scenes</p>
          <h1 className="font-display text-5xl md:text-6xl font-light leading-[1.05] max-w-2xl text-ink">
            Every step guided by quality and care.
          </h1>
          <p className="mt-8 text-muted text-sm leading-[1.9] max-w-lg font-light">
            Delivering exceptional fashion goes beyond offering stylish clothing. It begins with a 
            thoughtful process designed to ensure quality, reliability, and customer satisfaction 
            at every stage.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto">
        <div className="space-y-0">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className={`grid md:grid-cols-12 gap-6 md:gap-12 py-10 ${
                i < steps.length - 1 ? 'border-b border-line' : ''
              }`}
            >
              <div className="md:col-span-1">
                <span className="eyebrow text-muted">{s.n}</span>
              </div>
              <div className="md:col-span-4">
                <h2 className="font-display text-xl font-light text-ink">{s.title}</h2>
              </div>
              <div className="md:col-span-7">
                <p className="text-sm text-muted leading-[1.9] font-light">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Values strip */}
      <section className="bg-ink text-bg px-6 md:px-16 py-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
          {[
            { label: 'Security', body: 'We use secure payment systems and industry-standard technologies to protect your personal and financial information at all times.' },
            { label: 'Transparency', body: 'Clear policies, honest communication, and accurate information at every stage — so you always know what to expect.' },
            { label: 'Continuous Improvement', body: 'Fashion trends, customer expectations, and technology constantly evolve. We are committed to evolving with them.' },
          ].map((v) => (
            <div key={v.label}>
              <p className="eyebrow text-bg/50 mb-4">{v.label}</p>
              <p className="text-sm text-bg/70 leading-7 font-light">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-16 py-16 max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <p className="font-display text-2xl font-light text-ink">Questions about your order?</p>
        <a
          href="mailto:support@thekour.com"
          className="eyebrow text-muted hover:text-ink transition-colors text-xs"
        >
          support@thekour.com →
        </a>
      </section>
    </div>
  )
}
