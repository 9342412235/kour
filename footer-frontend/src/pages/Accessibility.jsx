import PolicyLayout from '../components/PolicyLayout'

const commitments = [
  {
    label: 'Navigation',
    body: 'We provide a clear and consistent navigation structure, making it easier for visitors to find products, access important information, and complete their shopping journey.',
  },
  {
    label: 'Readability',
    body: 'Our pages are designed with readability in mind — using clear headings, organized layouts, and descriptive content to improve the overall user experience.',
  },
  {
    label: 'Alternative Text',
    body: 'We aim to provide meaningful alternative text for images where appropriate, allowing screen reader users to better understand the visual content displayed on our website.',
  },
  {
    label: 'Assistive Technologies',
    body: 'We support customers who use screen readers, screen magnifiers, speech recognition software, keyboard-only navigation, and other accessibility tools.',
  },
  {
    label: 'Ongoing Review',
    body: 'Our team regularly reviews website functionality and customer feedback to identify opportunities for improvement, testing and updating to enhance accessibility and performance.',
  },
  {
    label: 'Equal Access',
    body: 'We believe in creating an environment where every customer feels respected, valued, and included — with equal access to our products, services, and customer support.',
  },
]

export default function Accessibility() {
  return (
    <div>
      {/* Hero */}
      <section className="px-6 md:px-16 py-20 md:py-28 bg-surface">
        <div className="max-w-7xl mx-auto">
          <p className="eyebrow text-muted mb-6">Accessibility</p>
          <h1 className="font-display text-5xl md:text-6xl font-light leading-[1.05] max-w-2xl text-ink">
            Fashion should be accessible to everyone.
          </h1>
          <p className="mt-8 text-muted text-sm leading-[1.9] max-w-lg font-light">
            At The Kour, we are committed to creating an inclusive online shopping experience 
            for everyone — regardless of their abilities or the technology they use.
          </p>
        </div>
      </section>

      {/* Statement */}
      <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <p className="eyebrow text-muted mb-6">Our commitment</p>
            <h2 className="font-display text-3xl font-light text-ink leading-tight">
              An inclusive experience for all visitors.
            </h2>
          </div>
          <div className="md:col-span-8 space-y-4 text-sm text-muted leading-[1.9] font-light">
            <p>
              Our goal is to make The Kour website accessible to individuals with a wide range 
              of abilities by designing a platform that is easy to navigate, understand, and 
              interact with. We strive to follow recognized accessibility standards and best 
              practices to ensure our digital experience is welcoming and functional for as 
              many users as possible.
            </p>
            <p>
              As technology evolves and accessibility standards continue to improve, we remain 
              dedicated to enhancing our website and removing barriers that may prevent customers 
              from accessing our products and services. Accessibility is an ongoing process, and 
              we continue working to make improvements as new opportunities emerge.
            </p>
          </div>
        </div>
      </section>

      <div className="border-t border-line mx-6 md:mx-16" />

      {/* Commitments grid */}
      <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto">
        <p className="eyebrow text-muted mb-12">How we support you</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10">
          {commitments.map((c) => (
            <div key={c.label}>
              <p className="eyebrow text-ink mb-4">{c.label}</p>
              <p className="text-sm text-muted leading-7 font-light">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-line mx-6 md:mx-16" />

      {/* Contact for accessibility */}
      <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="eyebrow text-muted mb-6">Need assistance?</p>
            <h2 className="font-display text-3xl font-light text-ink leading-tight">
              We're here to help you shop with confidence.
            </h2>
          </div>
          <div className="space-y-5 text-sm text-muted leading-[1.9] font-light">
            <p>
              If you experience difficulty accessing any part of The Kour website, encounter 
              content that is difficult to use, or require assistance with browsing, placing an 
              order, or obtaining product information, we encourage you to contact our Customer 
              Support team.
            </p>
            <p>
              We are committed to providing reasonable assistance and will make every effort to 
              address accessibility concerns promptly. Your feedback is valuable and helps us 
              improve our website for all users.
            </p>
            <a
              href="mailto:support@thekour.com"
              className="inline-block eyebrow text-ink hover:opacity-60 transition-opacity"
            >
              support@thekour.com →
            </a>
          </div>
        </div>
      </section>

      {/* Bottom note */}
      <section className="bg-surface px-6 md:px-16 py-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-muted font-light leading-7 max-w-2xl">
            As accessibility standards and technologies continue to evolve, The Kour will 
            continue investing in improvements that enhance usability, functionality, and 
            customer satisfaction. We remain committed to maintaining an accessible online 
            shopping experience by regularly reviewing our website, implementing best practices, 
            and listening to the needs of our customers.
          </p>
        </div>
      </section>
    </div>
  )
}
