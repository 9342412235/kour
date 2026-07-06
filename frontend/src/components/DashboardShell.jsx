import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LayoutGrid,
  Users,
  Package,
  Warehouse,
  Ticket,
  Newspaper,
  Boxes,
  LineChart,
  Settings,
  ScrollText,
  LogOut,
  Truck,
  ClipboardList,
  MessageSquareText,
  PenSquare,
  BarChart3,
  ShoppingBag,
  Heart,
  MapPin,
  CreditCard,
  Tag,
  Bell,
  ShieldCheck,
  Star,
  UserRound,
  History, // Imported the History icon
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useApp } from "../context/AppContext";

const NAV = {
  admin: [
    { to: "/dashboard", label: "Overview", icon: LayoutGrid, end: true },
    { to: "/dashboard/users", label: "Users", icon: Users },
    { to: "/dashboard/orders", label: "Orders", icon: Package },
    { to: "/dashboard/warehouse", label: "Warehouse", icon: Warehouse },
    { to: "/dashboard/tickets", label: "Support Tickets", icon: Ticket },
    { to: "/dashboard/blog", label: "Blog", icon: Newspaper },
    { to: "/dashboard/catalog", label: "Catalog", icon: Boxes },
    { to: "/dashboard/finance", label: "Finance & Reports", icon: LineChart },
    { to: "/dashboard/settings", label: "Settings", icon: Settings },
    { to: "/dashboard/logs", label: "Logs & Audit", icon: ScrollText },
  ],
  warehouse: [
    { to: "/dashboard", label: "Overview", icon: LayoutGrid, end: true },
    { to: "/dashboard/shipments", label: "Shipments", icon: Truck },
    { to: "/dashboard/stock", label: "Stock & Inventory", icon: Boxes },
    { to: "/dashboard/sku", label: "SKU Lookup", icon: ClipboardList },
  ],
  support: [
    { to: "/dashboard", label: "Overview", icon: LayoutGrid, end: true },
    { to: "/dashboard/tickets", label: "All Tickets", icon: Ticket },
    {
      to: "/dashboard/my-tickets",
      label: "My Tickets",
      icon: MessageSquareText,
    },
  ],
  blogger: [
    { to: "/dashboard", label: "Overview", icon: LayoutGrid, end: true },
    { to: "/dashboard/posts", label: "My Posts", icon: PenSquare },
    { to: "/dashboard/analytics", label: "Post Analytics", icon: BarChart3 },
  ],
  customer: [
    { to: "/dashboard", label: "Overview", icon: LayoutGrid, end: true },
    { to: "/dashboard/orders", label: "My Orders", icon: ShoppingBag },
    { to: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
    { to: "/dashboard/tickets", label: "Support Tickets", icon: Ticket },
    { to: "/dashboard/addresses", label: "Addresses", icon: MapPin },
    { to: "/dashboard/payments", label: "Payments & Wallet", icon: CreditCard },
    { to: "/dashboard/offers", label: "Offers & Coupons", icon: Tag },
    { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { to: "/dashboard/reviews", label: "My Reviews", icon: Star },
    { to: "/dashboard/history", label: "Account History", icon: History }, // NEW: History Nav Item
    {
      to: "/dashboard/security",
      label: "Security & Settings",
      icon: ShieldCheck,
    },
  ],
};

const ROLE_LABEL = {
  admin: "Admin",
  warehouse: "Warehouse Staff",
  support: "Support Agent",
  blogger: "Blogger",
  customer: "Customer",
};

export default function DashboardShell({ children }) {
  const { logout, userName, user } = useApp();
  const navigate = useNavigate();
  // This storefront app only ever renders the customer-facing dashboard —
  // even for staff accounts (admin/warehouse/support/blogger) signed in
  // here, since their day-to-day work nav lives in their own dedicated
  // dashboards. So always use the customer nav/label set.
  const items = NAV.customer;

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 text-sm rounded-md transition-colors ${isActive
      ? "bg-white text-black font-medium"
      : "text-white/80 hover:bg-white hover:text-black"
    }`;

  const signOut = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <aside
        className="hidden md:flex w-64 flex-col border-r border-line shrink-0 text-white h-screen"
        style={{ backgroundColor: "#2b2b2b" }}
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
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClass}
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/profile"
            className={linkClass}
          >
            <UserRound size={17} />
            Edit profile
          </NavLink>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-md transition-colors text-white/80 hover:bg-white hover:text-black w-full text-left"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </nav>
      </aside>

      <div className="flex-1 min-w-0 h-screen flex flex-col overflow-hidden">
        <header className="h-16 shrink-0 border-b border-line flex items-center justify-between px-5 md:px-8 bg-bg/95 backdrop-blur z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              title="Go back"
              className="flex items-center justify-center w-8 h-8 rounded-md border border-line hover:bg-black hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className="eyebrow text-muted">Customer Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="hidden sm:flex items-center gap-2 text-sm hover:opacity-60"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <UserRound size={16} />
              )}
              {userName}
            </Link>
            <button onClick={signOut} className="md:hidden">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="p-5 md:p-8 max-w-6xl overflow-y-auto flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
