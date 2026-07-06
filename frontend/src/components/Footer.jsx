import { Link } from "react-router-dom";
import {
  Instagram,
  Facebook,
  X,
  Linkedin,
} from "lucide-react";
import logo from "../assests/2 (1).svg";

// Base URL of the footer-frontend (info / policy pages).
// Set VITE_FOOTER_URL in your .env to point at the deployed footer-frontend.
const FOOTER = import.meta.env.VITE_FOOTER_URL || "https://footer-frontend.vercel.app";

/** Internal links stay inside this app; external links go to footer-frontend */
const cols = [
  {
    title: "Shop",
    links: [
      { label: "Best Sellers", to: "/shop?category=bestsellers", external: false },
      { label: "Home", to: "/", external: false },
      { label: "New arrivals", to: "/shop?category=newarrivals", external: false },
    ],
  },
  {
    title: "The kour",
    links: [
      { label: "About Us", to: `${FOOTER}/about`, external: true },
      { label: "How We Work", to: `${FOOTER}/how-we-work`, external: true },
      { label: "Our Goal", to: `${FOOTER}/our-goal`, external: true },
      { label: "Blog", to: "/blog", external: false },
      { label: "Careers", to: `${FOOTER}/careers`, external: true },
      { label: "Our Promise", to: `${FOOTER}/our-promise`, external: true },
    ],
  },
  {
    title: "customer care",
    links: [
      { label: "My orders",          to: "/dashboard/orders",       external: false },
      { label: "Return Policy",      to: `${FOOTER}/returns`,       external: true },
      { label: "Shipping Policy",    to: `${FOOTER}/shipping`,      external: true },
      { label: "FAQ",                to: `${FOOTER}/faq`,           external: true },
      { label: "Contact Us",         to: `${FOOTER}/contact`,       external: true },
    ],
  },
];

function NavLink({ link }) {
  if (link.external) {
    return (
      <a
        href={link.to}
        className="text-zinc-400 hover:text-white transition"
      >
        {link.label}
      </a>
    );
  }
  return (
    <Link to={link.to} className="text-zinc-400 hover:text-white transition">
      {link.label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="bg-zinc-900 text-white mt-24">
      {/* Newsletter Section */}
      <div className="w-full px-0 md:px-16 py-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Brand */}
          <div>
            <div className="font-display text-2xl mb-4">THE KOUR</div>
            <p className="text-sm text-zinc-400 max-w-md leading-8">
              Considered essentials in black, white, and every grey between.
              Factory-direct pricing, no middleman.
            </p>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm mb-3">Join our community</h3>
            <p className="text-sm text-zinc-400 mb-10">
              Get early access to new collections, offers and style updates.
            </p>
            <div className="flex items-center justify-between border-b border-zinc-700 pb-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-transparent outline-none text-sm flex-1 placeholder:text-zinc-500"
              />
              <button className="text-xs uppercase tracking-[2px] hover:opacity-70">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800" />

      {/* Links Section */}
      <div className="px-6 md:px-16 py-16">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-12">

          {/* Promise Column */}
          <div className="col-span-2 md:col-span-4">
            <div className="eyebrow text-zinc-400 mb-4">OUR PROMISE</div>
            <p className="text-sm text-zinc-400 leading-7 max-w-sm">
              Premium fashion without compromise.
              Thoughtful designs made for modern living.
            </p>
          </div>

          {/* Dynamic Columns */}
          {cols.map((c) => (
            <div key={c.title} className="col-span-1 md:col-span-2">
              <div className="eyebrow text-zinc-400 mb-4">{c.title}</div>
              <ul className="space-y-3 text-sm">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <NavLink link={l} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Follow Us */}
          <div className="col-span-2 md:col-span-2 flex flex-col items-center justify-center self-center text-center">
            <div className="eyebrow text-zinc-400 mb-4">FOLLOW US</div>
            <div className="flex gap-5">
              <Instagram size={24} className="text-zinc-400 hover:text-white cursor-pointer transition-colors" />
              <Facebook size={24} className="text-zinc-400 hover:text-white cursor-pointer transition-colors" />
              <X size={24} className="text-zinc-400 hover:text-white cursor-pointer transition-colors" />
              <Linkedin size={24} className="text-zinc-400 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Divider */}
      <div className="border-t border-zinc-800" />

      {/* Bottom Bar */}
      <div className="w-full px-0 md:px-16 py-4 flex flex-col sm:flex-row justify-between gap-4 text-xs">
        <span className="text-zinc-500">2025 TheKour.com — All Rights Reserved.</span>
        <span className="text-zinc-500">© Powered by Ameriavis Tech.</span>
        <span className="text-zinc-500 flex gap-3">
          <a href={`${FOOTER}/about`} className="hover:text-white transition">Terms &amp; Conditions</a>
          <span>·</span>
          <a href={`${FOOTER}/privacy`} className="hover:text-white transition">Privacy Policy</a>
          <span>·</span>
          <a href={`${FOOTER}/accessibility`} className="hover:text-white transition">Accessibility</a>
        </span>
      </div>
    </footer>
  );
}
