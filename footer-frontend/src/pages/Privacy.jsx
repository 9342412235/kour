import PolicyLayout from '../components/PolicyLayout'

const sections = [
  {
    title: 'Information We Collect',
    content: [
      'When you create an account, place an order, subscribe to our newsletter, participate in promotional campaigns, submit product reviews, or contact our customer support team, you may voluntarily provide personal information such as your full name, email address, phone number, billing and shipping address, and payment details. We also maintain records of your purchase history, order preferences, and account settings.',
      'In addition to information you provide directly, we automatically collect certain technical information whenever you visit our website. This may include your IP address, browser type and version, device type, operating system, pages viewed, time spent on our website, and browsing behavior. This information helps us improve website performance and enhance user experience.',
    ],
  },
  {
    title: 'How We Use Your Information',
    content: [
      'We use your personal information to process and fulfill orders, verify payment transactions, arrange product shipments, communicate delivery updates, and manage returns, refunds, or exchanges. Without this information, we would be unable to complete purchases or provide customer support.',
      'Your information also helps us personalize your shopping experience by displaying products that match your interests, remembering your preferences, maintaining your shopping cart between visits, and recommending collections based on your browsing history or previous purchases.',
      'Additionally, we use your information to improve our website, analyze customer behavior, identify trends, develop new products and services, prevent fraud, and comply with legal obligations.',
    ],
  },
  {
    title: 'Cookies and Tracking Technologies',
    content: [
      'Like many modern e-commerce websites, The Kour uses cookies, web beacons, pixels, and similar tracking technologies to improve website functionality and provide a more personalized browsing experience. Cookies are small text files stored on your device when you visit our website.',
      'These technologies help us remember your preferences, keep you logged in, save items in your shopping cart, recognize returning visitors, analyze website traffic, understand customer behavior, measure marketing campaign effectiveness, and improve overall website performance.',
    ],
  },
  {
    title: 'Payment Information',
    content: [
      'Protecting your financial information is one of our highest priorities. The Kour does not store your complete credit card or debit card information on its servers. All payment transactions are processed securely through trusted third-party payment processors that comply with industry security standards.',
      'Our payment partners utilize advanced encryption technologies, secure payment gateways, fraud detection systems, and compliance with Payment Card Industry Data Security Standards (PCI DSS) to protect your financial information during every transaction.',
    ],
  },
  {
    title: 'Sharing Your Information',
    content: [
      'The Kour respects your privacy and does not sell, rent, or trade your personal information to third parties for their own marketing purposes. We believe your personal information belongs to you and should only be shared when necessary to provide our services or comply with legal obligations.',
      'We may share limited information with carefully selected service providers who help us operate our business — including payment processors, shipping carriers, cloud hosting companies, customer support platforms, and analytics services. These trusted partners are contractually required to protect your information.',
    ],
  },
  {
    title: 'Data Security',
    content: [
      'The Kour has implemented a variety of administrative, technical, and physical safeguards designed to protect your personal information against unauthorized access, disclosure, alteration, misuse, or destruction.',
      'Our website uses SSL encryption to protect data transmitted between your browser and our servers. We also maintain secure hosting environments, password protection systems, access controls, firewalls, and continuous monitoring. While we make every reasonable effort to safeguard your information, no method of electronic transmission is completely secure.',
    ],
  },
  {
    title: 'Your Privacy Rights',
    content: [
      'We believe you should have meaningful control over your personal information. Depending on the laws applicable to your location, you may have the right to request access to the personal information we hold about you, request corrections to inaccurate information, request deletion of your personal information, or object to certain types of data processing.',
      'You may also withdraw your consent to receive promotional emails or marketing communications at any time without affecting your ability to continue shopping on our website.',
    ],
  },
  {
    title: "Children's Privacy",
    content: [
      'The Kour website is intended for individuals who are at least 13 years of age. We do not knowingly collect personal information from children without appropriate parental consent. If we become aware that information from a child has been collected unintentionally, we will promptly delete that information from our systems.',
      'Parents or legal guardians who believe their child has provided personal information to The Kour may contact us and we will investigate promptly.',
    ],
  },
  {
    title: 'Changes to This Policy',
    content: [
      'As our business continues to grow and technology evolves, we may periodically update this Privacy Policy to reflect changes in our practices, legal requirements, industry standards, or operational needs. Whenever significant updates are made, we will revise the Effective Date and publish the updated version on our website.',
    ],
  },
]

export default function Privacy() {
  return (
    <PolicyLayout
      eyebrow="Legal"
      title="Privacy Policy"
      lastUpdated="Effective Date: January 1, 2025"
    >
      <p>
        At The Kour, we believe that trust is the foundation of every successful customer 
        relationship. When you choose to shop with us, browse our collections, create an account, 
        or interact with our website, you place your confidence in our ability to protect your 
        personal information. This Privacy Policy explains how we collect, use, store, share, and 
        protect the information you provide while using our website and services.
      </p>

      {sections.map((s) => (
        <div key={s.title}>
          <h2>{s.title}</h2>
          {s.content.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ))}

      <h2>Contact Us</h2>
      <p>
        If you have any questions, concerns, or requests regarding this Privacy Policy or our 
        privacy practices, please contact our customer support team.
      </p>
      <p>
        <strong className="text-ink font-medium">Email:</strong>{' '}
        <a href="mailto:support@thekour.com" className="text-ink underline underline-offset-4 hover:opacity-70">
          support@thekour.com
        </a>
        <br />
        <strong className="text-ink font-medium">Website:</strong>{' '}
        <a href="https://www.thekour.com" className="text-ink underline underline-offset-4 hover:opacity-70">
          www.thekour.com
        </a>
      </p>

      <div className="mt-12 p-6 bg-surface">
        <p className="eyebrow text-muted mb-3">Our commitment</p>
        <p>
          At The Kour, protecting your privacy is more than a legal obligation. It is a core 
          part of our commitment to building lasting relationships with our customers. We 
          continuously invest in secure technologies, responsible data practices, and transparent 
          communication to ensure your personal information is handled with the utmost care.
        </p>
      </div>
    </PolicyLayout>
  )
}
