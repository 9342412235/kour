import PolicyLayout from '../components/PolicyLayout'

const faqs = [
  {
    q: 'When will my order be processed?',
    a: 'Orders are typically processed after payment has been successfully authorized and verified. Orders placed during weekends or public holidays will generally begin processing on the next business day.',
  },
  {
    q: 'Where does The Kour ship?',
    a: 'The Kour currently ships to customers throughout the United States. We continuously evaluate opportunities to expand our shipping network and may offer international shipping in the future.',
  },
  {
    q: 'How are shipping costs calculated?',
    a: 'Shipping costs are calculated during checkout based on the selected shipping method, destination, package weight, dimensions, and total order value. Any applicable charges will be displayed before you complete your purchase.',
  },
  {
    q: 'Will I receive tracking information?',
    a: 'Yes. Once your order has been prepared and handed over to the shipping carrier, you will receive a shipping confirmation email containing tracking information. Tracking updates may take some time to appear after the package has been scanned into the carrier\'s system.',
  },
  {
    q: 'What if my order arrives damaged?',
    a: 'If a shipment arrives with visible damage or items are missing, please contact our customer support team as soon as possible. You may be asked to provide photographs of the damaged product, shipping box, packaging materials, and shipping label.',
  },
  {
    q: 'My tracking says delivered but I can\'t find my package?',
    a: 'Check around the delivery location, with household members, neighbors, or building management. Contact the shipping carrier for additional delivery details. If the package remains missing, notify The Kour so we can assist with initiating an investigation.',
  },
]

export default function Shipping() {
  return (
    <div>
      {/* Hero */}
      <section className="px-6 md:px-16 py-20 bg-surface">
        <div className="max-w-7xl mx-auto">
          <p className="eyebrow text-muted mb-6">Getting your order to you</p>
          <h1 className="font-display text-5xl md:text-6xl font-light leading-[1.05] max-w-2xl text-ink">
            Shipping Policy
          </h1>
          <p className="mt-8 text-muted text-sm leading-[1.9] max-w-lg font-light">
            We are committed to providing a reliable, efficient, and transparent shipping 
            experience for every customer. Every order reaches its destination safely and 
            in excellent condition.
          </p>
        </div>
      </section>

      {/* Key points grid */}
      <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto">
        <p className="eyebrow text-muted mb-12">What to know</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10">
          {[
            { label: 'US-Wide Delivery', body: 'We ship to customers throughout the United States. Provide accurate shipping information at checkout to avoid delays or returned packages.' },
            { label: 'Order Processing', body: 'Once payment is authorized, our fulfillment team reviews your order, verifies availability, performs quality checks, and prepares your items for shipment.' },
            { label: 'Tracking Provided', body: 'After your package ships, you\'ll receive a confirmation email with tracking information so you can monitor progress from our fulfillment center to your door.' },
            { label: 'Estimated Timelines', body: 'Delivery timelines provided at checkout are guidelines, not guarantees. Actual times may vary based on location, carrier operations, weather, or other factors.' },
            { label: 'Multiple Packages', body: 'Orders containing multiple products may ship in separate packages if items are stored in different warehouse locations. Separate tracking info will be provided.' },
            { label: 'Address Accuracy', body: 'Customers are responsible for providing accurate shipping details. The Kour is not responsible for delivery issues caused by inaccurate information.' },
          ].map((item) => (
            <div key={item.label}>
              <p className="eyebrow text-muted mb-3">{item.label}</p>
              <p className="text-sm text-muted leading-7 font-light">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-line mx-6 md:mx-16" />

      {/* Full policy prose */}
      <section className="px-6 md:px-16 py-20 max-w-3xl mx-auto">
        <p className="eyebrow text-muted mb-8">Full Policy</p>

        <div className="policy-prose">
          <p>
            Orders are typically processed after payment has been successfully authorized and 
            verified. Our fulfillment team carefully reviews the order details, verifies product 
            availability, performs quality checks, and prepares each item for shipment. We take 
            great care in packaging every order to ensure that products are protected throughout 
            the delivery process.
          </p>
          <p>
            Shipping costs are calculated during the checkout process and are based on the 
            selected shipping method, destination, package weight, dimensions, and total order 
            value. Any applicable shipping charges will be displayed before the customer completes 
            the purchase. From time to time, The Kour may offer promotional shipping discounts or 
            free shipping on qualifying orders.
          </p>
          <p>
            If a customer realizes that an incorrect shipping address has been provided after 
            placing an order, they should contact The Kour customer support team as soon as 
            possible. We will make every reasonable effort to update the shipping information 
            before the order is dispatched. However, once an order has been processed or shipped, 
            changes to the shipping address may no longer be possible.
          </p>
          <p>
            Shipping delays may occasionally occur due to severe weather conditions, natural 
            disasters, transportation disruptions, labor shortages, or other events beyond our 
            reasonable control. In such situations, delivery estimates may be extended without 
            prior notice. The Kour appreciates customers' patience during these circumstances.
          </p>
          <p>
            During peak shopping periods — including major holidays, promotional events, seasonal 
            sales, and new product launches — processing and shipping times may be longer than 
            usual due to increased order volumes. Customers are encouraged to place orders well 
            in advance if products are needed for a specific occasion.
          </p>
          <p>
            By placing an order through The Kour website, you acknowledge that you have read, 
            understood, and agreed to this Shipping Policy.
          </p>
        </div>
      </section>

      <div className="border-t border-line mx-6 md:mx-16" />

      {/* FAQ */}
      <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto">
        <p className="eyebrow text-muted mb-12">Common questions</p>
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
          {faqs.map((f) => (
            <div key={f.q}>
              <p className="text-sm font-medium text-ink mb-2">{f.q}</p>
              <p className="text-sm text-muted leading-7 font-light">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="bg-surface px-6 md:px-16 py-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-muted font-light">
            Still have questions about your shipment?
          </p>
          <a
            href="mailto:support@thekour.com"
            className="eyebrow text-ink hover:opacity-60 transition-opacity text-xs"
          >
            support@thekour.com →
          </a>
        </div>
      </section>
    </div>
  )
}
