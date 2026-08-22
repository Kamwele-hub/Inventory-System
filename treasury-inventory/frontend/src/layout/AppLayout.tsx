import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/items", label: "Asset register", icon: "🗄️" },
  { to: "/scan", label: "Scan asset tag", icon: "📷" },
  { to: "/reports", label: "Reports", icon: "🧾" },
];

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 shrink-0 bg-treasury-ink text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
          <div
            aria-hidden
            className="h-9 w-9 rounded-full bg-treasury-gold flex items-center justify-center text-treasury-ink font-bold text-sm shrink-0"
          >
            NT
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">National Treasury</p>
            <p className="text-[11px] text-white/60">Asset Inventory System</p>
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-treasury-green text-white font-medium"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {hasRole("admin") && (
            <NavLink
              to="/reference-data"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-treasury-green text-white font-medium"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <span aria-hidden>⚙️</span>
              Reference data
            </NavLink>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-xs text-white/60">Signed in as</p>
          <p className="text-sm font-medium truncate">{user?.username}</p>
          <p className="text-[11px] text-white/50 capitalize">{user?.groups.join(", ") || "no role assigned"}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full text-xs text-white/70 hover:text-white border border-white/20 rounded-md py-1.5 hover:bg-white/10 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-3">
          <div className="h-1.5 w-16 flex rounded-full overflow-hidden" aria-hidden>
            <span className="flex-1 bg-treasury-ink" />
            <span className="flex-1 bg-treasury-red" />
            <span className="flex-1 bg-treasury-green" />
          </div>
          <p className="text-sm text-treasury-slate">Republic of Kenya</p>
        </header>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
