import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Search,
  Heart,
  ShoppingBag,
  Bell,
  User,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import { useApp } from "../context/AppContext";
import { categories } from "../data/mockData";
import { promoBannerData } from "../data/mockData";
import logo from "../assests/3 (1).svg";
import api from "../lib/api";

export default function Navbar() {
  const { cartCount, wishlist, role, notificationCount } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileSearch, setMobileSearch] = useState("");
  const [content, setContent] = useState(null);

  useEffect(() => {
    api.get("/content").then(setContent).catch(() => setContent(null));
  }, []);

  const navLinks = content?.navLinks?.length
    ? content.navLinks
    : categories.map((c) => ({ label: c.name, url: `/shop?category=${c.id}` }));

  const runSearch = (term) => {
    const value = term.trim();
    if (!value) return;
    navigate(`/shop?search=${encodeURIComponent(value)}`);
    setOpen(false);
  };

  const navLink = ({ isActive }) =>
    `text-[15px] font-medium transition-all duration-200 whitespace-nowrap ${
      isActive
        ? "text-ink" 
        : "text-ink/80 hover:text-ink"
    }`;

  // Icon configurations for easy tweaking
  const iconSize = 21;
  const iconStroke = 1.5; // Decreased thickness (default is 2)

  return (
    <header className="sticky top-0 z-50 bg-bg border-b border-line">
      {/* Announcement Bar — editable from Admin > Settings > Site Content */}
      {(content ? content.topBar.enabled : promoBannerData.isVisible) && (
        <div className="bg-ink text-bg text-center text-[11px] py-3 tracking-[2px] uppercase">
          {content ? content.topBar.text : promoBannerData.text}
        </div>
      )}

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-8 lg:px-14 py-3 border-b-2 border-line">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img
            src={logo}
            alt="The Kour"
            className="h-12 w-auto object-contain"
          />
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); runSearch(search); }}
            className="flex items-center w-[400px]"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="flex-1 px-5 py-2.5 bg-muted/10 border border-line border-r-0 rounded-l-md outline-none text-sm h-[40px]"
            />

            <button
              type="submit"
              aria-label="Search"
              className="px-5 bg-ink text-bg border border-ink hover:opacity-90 transition rounded-r-md flex items-center justify-center h-[40px] flex-shrink-0"
            >
              <Search size={17} />
            </button>
          </form>

          {/* Icons with reduced thickness */}
          <Link
            to="/dashboard"
            aria-label="Account"
            className="hover:opacity-70 opacity-80 transition"
          >
            <User size={iconSize} strokeWidth={iconStroke} />
          </Link>

          <Link
            to="/dashboard/wishlist"
            aria-label="Wishlist"
            className="hover:opacity-70 opacity-80 transition relative"
          >
            <Heart size={iconSize} strokeWidth={iconStroke} />

            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 text-[10px] bg-ink text-bg rounded-full h-4 w-4 flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            aria-label="Cart"
            className="hover:opacity-70 opacity-80 transition relative"
          >
            <ShoppingBag size={iconSize} strokeWidth={iconStroke} />

            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 text-[10px] bg-ink text-bg rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            to="/dashboard/notifications"
            aria-label="Notifications"
            className="hover:opacity-70 opacity-80 transition relative"
          >
            <Bell size={iconSize} strokeWidth={iconStroke} />

            {notificationCount > 0 && (
              <span className="absolute -top-2 -right-2 text-[10px] bg-ink text-bg rounded-full h-4 w-4 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Categories Navigation — editable from Admin > Settings > Site Content */}
      <nav className="hidden md:flex items-center gap-10 px-8 lg:px-14 h-14 overflow-x-auto scrollbar-hide bg-bg">
        {navLinks.map((link) => (
          <NavLink
            key={link.url}
            to={link.url}
            className={navLink}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-5 h-16 border-b border-line">
        <button
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} strokeWidth={iconStroke} /> : <Menu size={22} strokeWidth={iconStroke} />}
        </button>

        <Link
          to="/"
          className="font-display text-xl tracking-tight"
        >
          <img
            src={logo}
            alt="The Kour"
            className="h-12 w-auto object-contain"
          />
        </Link>

        <Link
          to="/cart"
          className="relative"
        >
          <ShoppingBag size={20} strokeWidth={iconStroke} />

          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 text-[10px] bg-ink text-bg rounded-full h-4 w-4 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 py-3 border-b border-line">
        <form
          onSubmit={(e) => { e.preventDefault(); runSearch(mobileSearch); }}
          className="flex items-center border border-line overflow-hidden rounded-sm"
        >
          <input
            type="text"
            value={mobileSearch}
            onChange={(e) => setMobileSearch(e.target.value)}
            placeholder="Search products..."
            className="flex-1 px-4 py-2 outline-none bg-transparent text-sm"
          />

          <button type="submit" className="px-4 py-2 bg-ink text-bg">
            <Search size={18} />
          </button>
        </form>
      </div>

      {/* Mobile Menu */}
      {open && (
        <nav className="md:hidden flex flex-col gap-4 px-5 py-5 bg-bg border-t border-line">
          <NavLink
            to="/shop"
            onClick={() => setOpen(false)}
            className={navLink}
          >
            Shop
          </NavLink>

          {navLinks.map((link) => (
            <NavLink
              key={link.url}
              to={link.url}
              onClick={() => setOpen(false)}
              className={navLink}
            >
              {link.label}
            </NavLink>
          ))}

          <NavLink
            to="/dashboard"
            onClick={() => setOpen(false)}
            className={navLink}
          >
            {role ? "Dashboard" : "Sign In"}
          </NavLink>

          <div className="flex items-center gap-5 pt-3 border-t border-line">
            <ThemeToggle />

            <Link to="/dashboard">
              <User size={20} strokeWidth={iconStroke} />
            </Link>

            <Link to="/dashboard/wishlist" className="relative" onClick={() => setOpen(false)}>
              <Heart size={20} strokeWidth={iconStroke} />

              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 text-[10px] bg-ink text-bg rounded-full h-4 w-4 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}