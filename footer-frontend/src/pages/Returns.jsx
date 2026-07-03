import PolicyLayout from '../components/PolicyLayout'
import { Link } from 'react-router-dom'

export default function Returns() {
  return (
    <div>
      {/* Hero — the 365-day policy is the signature element */}
      <section className="px-6 md:px-16 py-20 md:py-32 bg-ink text-bg">
        <div className="max-w-7xl mx-auto">
          <p className="eyebrow text-bg/50 mb-6">Return Policy</p>
          <div className="flex flex-col md:flex-row md:items-end gap-8 md:gap-16">
            <div>
              <h1 className="font-display text-6xl md:text-9xl font-light leading-none text-bg">
                365
              </h1>
              <p className="font-display text-2xl md:text-3xl font-light text-bg/70 mt-2">
                days to return.
              </p>
            </div>
            <p className="text-sm text-bg/60 max-w-sm leading-[1.9] font-light md:pb-2">
              We believe our customers deserve flexibility and peace of mind. Eligible products 
              can be returned within 365 days from the date of delivery — one of the most 
              customer-friendly policies in fashion.
            </p>
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="eyebrow text-muted mb-6">Eligibility requirements</p>
            <h2 className="font-display text-3xl font-light leading-tight text-ink">
              What qualifies for a return?
            </h2>
          </div>
          <div className="space-y-4">
            {[
              'Items must be in their original condition — unworn, unwashed, and unused.',
              'Free from stains, odors, alterations, or damage.',
              'All original tags, labels, and packaging should be attached and included.',
              'We reserve the right to inspect returned items before approving a refund.',
              'Products that do not meet our return requirements may not be eligible.',
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start py-3 border-b border-line last:border-0">
                <span className="eyebrow text-muted shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-sm text-muted leading-7 font-light">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-line mx-6 md:mx-16" />

      {/* Process */}
      <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto">
        <p className="eyebrow text-muted mb-12">The return process</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10">
          {[
            { step: '01', title: 'Initiate', body: 'Start a return request through your The Kour account or by contacting our Customer Support team.' },
            { step: '02', title: 'Package', body: 'Once your request is approved, you\'ll receive instructions on how to securely package and return your item.' },
            { step: '03', title: 'Inspect', body: 'After we receive your returned item, our team inspects it to ensure it meets our return eligibility requirements.' },
            { step: '04', title: 'Refund', body: 'If approved, your refund will be processed to your original payment method or issued as store credit.' },
          ].map((s) => (
            <div key={s.step}>
              <p className="eyebrow text-muted mb-4">{s.step} — {s.title}</p>
              <p className="text-sm text-muted leading-7 font-light">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Exceptions */}
      <section className="bg-surface px-6 md:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <p className="eyebrow text-muted mb-8">Non-returnable items</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              'Items marked as "Final Sale"',
              'Gift cards',
              'Personalized or customized products',
              'Products identified as non-returnable at time of purchase',
              'Items showing signs of misuse or excessive wear',
              'Products with unauthorized alterations',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="w-1 h-1 rounded-full bg-muted shrink-0" />
                <p className="text-sm text-muted font-light">{item}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted mt-8 font-light">
            Exception: items in any of the above categories that arrive damaged or defective 
            are still eligible for resolution. Contact support with photos of the item and packaging.
          </p>
        </div>
      </section>

      {/* Damaged items */}
      <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <p className="eyebrow text-muted mb-6">Damaged or incorrect items</p>
            <h2 className="font-display text-3xl font-light text-ink leading-tight">
              Received something wrong? We'll make it right.
            </h2>
          </div>
          <div className="space-y-4 text-sm text-muted leading-[1.9] font-light">
            <p>
              If you receive an item that is damaged, defective, incorrect, or incomplete, 
              please contact our Customer Support team as soon as possible after delivery.
            </p>
            <p>
              To help us resolve the issue quickly, you may be asked to provide your order 
              number along with photographs of the product and its packaging. After reviewing 
              the information, we will provide an appropriate resolution — which may include 
              a replacement, exchange, refund, or store credit.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-ink text-bg px-6 md:px-16 py-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-display text-xl font-light">Need to start a return?</p>
          <a
            href="mailto:support@thekour.com"
            className="eyebrow text-bg/60 hover:text-bg transition-colors text-xs"
          >
            support@thekour.com →
          </a>
        </div>
      </section>
    </div>
  )
}
