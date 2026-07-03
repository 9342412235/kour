import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, Circle } from "lucide-react";

const CLIENT_URL = import.meta.env.VITE_CLIENT_URL || "http://localhost:5173";

const navLinks = [
  { label: "About", to: "/about" },
  { label: "How We Work", to: "/how-we-work" },
  { label: "Shipping", to: "/shipping" },
  { label: "Returns", to: "/returns" },
  { label: "Privacy", to: "/privacy" },
  { label: "Accessibility", to: "/accessibility" },
];

function ThemeIcon({ theme }) {
  if (theme === "dark") return <Moon size={16} />;
  if (theme === "medium") return <Circle size={16} />;
  return <Sun size={16} />;
}

export default function Navbar() {
  const { theme, cycle } = useTheme();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-bg border-b border-line">
      <div className="max-w-7xl mx-auto px-6 md:px-16 h-14 flex items-center justify-between gap-8">
        {/* Logo → back to storefront */}
        <a
          href={CLIENT_URL}
          className="eyebrow text-ink hover:opacity-60 transition-opacity shrink-0"
        >
          <div className="h-16 flex items-center justify-center border-b border-line">
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-12 w-auto cursor-pointer"
              onClick={() => {
                window.location.href = "http://localhost:5173";
              }}
            />
          </div>{" "}
        </a>

        {/* Nav links — hidden on mobile, scrollable */}
        <nav className="hidden md:flex items-center gap-6 overflow-x-auto">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-xs tracking-wide transition-opacity whitespace-nowrap ${
                pathname === l.to
                  ? "text-ink opacity-100"
                  : "text-muted hover:text-ink hover:opacity-80"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Theme toggle */}
        <button
          onClick={cycle}
          aria-label="Toggle theme"
          className="text-muted hover:text-ink transition-colors shrink-0"
        >
          <ThemeIcon theme={theme} />
        </button>
      </div>

      {/* Mobile nav — scrollable horizontal strip */}
      <div className="md:hidden flex gap-5 overflow-x-auto px-6 pb-2 pt-1 scrollbar-none">
        {navLinks.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`text-xs whitespace-nowrap tracking-wide transition-opacity ${
              pathname === l.to ? "text-ink" : "text-muted"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
