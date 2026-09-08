import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { KenyaFlagBadge } from "../components/KenyaFlagBadge";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/items", label: "Asset register", icon: "🗄️" },
  { to: "/scan", label: "Scan asset tag", icon: "📷" },
  { to: "/reports", label: "Reports", icon: "🧾" },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/items": "Asset register",
  "/scan": "Scan asset tag",
  "/reports": "Reports",
  "/reference-data": "Reference data",
  "/user-management": "User roles & permissions",
};

function currentPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/items/new")) return "Register new item";
  if (pathname.match(/\/items\/[^/]+\/transfer/)) return "Transfer custody";
  if (pathname.match(/\/items\/[^/]+\/service/)) return "Log service";
  if (pathname.match(/\/items\/[^/]+\/dispose/)) return "Dispose item";
  if (pathname.startsWith("/items/")) return "Item detail";
  return "National Treasury Inventory";
}

const navLinkClass = (isActive: boolean) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
    isActive
      ? "bg-treasury-green text-white shadow-sm"
      : "text-treasury-ink/70 hover:bg-treasury-green-light hover:text-treasury-green-dark"
  }`;

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "??";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Government-site-style top utility strip */}
      <div className="h-1.5 bg-treasury-green shrink-0" aria-hidden />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar -- light, brand-accented, matching the public site's white/brown look */}
        <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col">
          <div className="px-5 py-5 border-b border-slate-200 flex items-center gap-3">
            <KenyaFlagBadge className="h-11 w-11" />
            <div className="leading-tight min-w-0">
              <p className="text-sm font-bold text-treasury-ink truncate">The National Treasury</p>
              <p className="text-[11px] text-treasury-slate">Asset Inventory System</p>
            </div>
          </div>

          <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto scrollbar-thin">
            <p className="px-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Operations
            </p>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClass(isActive)}>
                <span aria-hidden className="text-base">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}

            {hasRole("admin") && (
              <>
                <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Administration
                </p>
                <NavLink to="/reference-data" className={({ isActive }) => navLinkClass(isActive)}>
                  <span aria-hidden className="text-base">⚙️</span>
                  Reference data
                </NavLink>
                <NavLink to="/user-management" className={({ isActive }) => navLinkClass(isActive)}>
                  <span aria-hidden className="text-base">👤</span>
                  User roles
                </NavLink>
              </>
            )}
          </nav>

          <div className="px-3 py-4 border-t border-slate-200">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-50 border border-slate-200">
              <div className="h-8 w-8 rounded-full bg-treasury-navy text-white flex items-center justify-center text-xs font-semibold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-treasury-ink truncate">{user?.username}</p>
                <p className="text-[11px] text-treasury-slate capitalize truncate">
                  {user?.groups.join(", ") || "no role assigned"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 w-full text-xs font-medium text-treasury-green border border-treasury-green/40 rounded-lg py-2
                         hover:bg-treasury-green hover:text-white transition-colors duration-150"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-8 w-1.5 rounded-full bg-treasury-green shrink-0" aria-hidden />
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-treasury-ink truncate">
                  {currentPageTitle(location.pathname)}
                </h1>
                <p className="text-[11px] text-treasury-slate">Republic of Kenya · The National Treasury</p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              {/* Genuine Kenya flag colors -- deliberately not the brand accent */}
              <div className="hidden sm:flex h-1.5 w-16 rounded-full overflow-hidden" aria-hidden>
                <span className="flex-1 bg-treasury-ink" />
                <span className="flex-1 bg-treasury-red" />
                <span className="flex-1 bg-treasury-flag-green" />
              </div>
              <div className="h-9 w-9 rounded-full bg-treasury-navy text-white flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 min-w-0 fade-in">
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-treasury-slate">
            <p>&copy; {new Date().getFullYear()} The National Treasury, Republic of Kenya. All rights reserved.</p>
            <p className="flex items-center gap-3">
              <span>Asset Inventory System</span>
              <span className="text-slate-300">|</span>
              <span>Internal use only</span>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}