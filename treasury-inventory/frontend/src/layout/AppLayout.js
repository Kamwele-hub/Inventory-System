import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { KenyaFlagBadge } from "../components/KenyaFlagBadge";
const NAV_ITEMS = [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/items", label: "Asset register", icon: "🗄️" },
    { to: "/scan", label: "Scan asset tag", icon: "📷" },
    { to: "/reports", label: "Reports", icon: "🧾" },
];
const PAGE_TITLES = {
    "/dashboard": "Dashboard",
    "/items": "Asset Register",
    "/scan": "Scan Asset Tag",
    "/reports": "Reports",
    "/reference-data": "Reference Data",
    "/user-management": "User roles & permissions",
};
function currentPageTitle(pathname) {
    if (PAGE_TITLES[pathname])
        return PAGE_TITLES[pathname];
    if (pathname.startsWith("/items/new"))
        return "Register new item";
    if (pathname.match(/\/items\/[^/]+\/transfer/))
        return "Transfer custody";
    if (pathname.match(/\/items\/[^/]+\/service/))
        return "Log service";
    if (pathname.match(/\/items\/[^/]+\/dispose/))
        return "Dispose item";
    if (pathname.startsWith("/items/"))
        return "Item detail";
    return "National Treasury Inventory";
}
const navLinkClass = (isActive) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${isActive
    ? "bg-treasury-green text-white shadow-sm"
    : "text-treasury-ink/70 hover:bg-treasury-green-light hover:text-treasury-green-dark"}`;
export default function AppLayout() {
    const { user, logout, hasRole } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    function handleLogout() {
        logout();
        navigate("/login");
    }
    const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "??";
    return (_jsxs("div", { className: "min-h-screen flex flex-col bg-slate-50", children: [_jsx("div", { className: "h-1.5 bg-treasury-green shrink-0", "aria-hidden": true }), _jsxs("div", { className: "flex flex-1 min-h-0", children: [_jsxs("aside", { className: "w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col", children: [_jsxs("div", { className: "px-5 py-5 border-b border-slate-200 flex items-center gap-3", children: [_jsx(KenyaFlagBadge, { className: "h-11 w-11" }), _jsxs("div", { className: "leading-tight min-w-0", children: [_jsx("p", { className: "text-sm font-bold text-treasury-ink truncate", children: "The National Treasury" }), _jsx("p", { className: "text-[11px] text-treasury-slate", children: "Asset Inventory System" })] })] }), _jsxs("nav", { className: "flex-1 py-4 space-y-1 px-3 overflow-y-auto scrollbar-thin", children: [_jsx("p", { className: "px-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: "Operations" }), NAV_ITEMS.map((item) => (_jsxs(NavLink, { to: item.to, className: ({ isActive }) => navLinkClass(isActive), children: [_jsx("span", { "aria-hidden": true, className: "text-base", children: item.icon }), item.label] }, item.to))), hasRole("admin") && (_jsxs(_Fragment, { children: [_jsx("p", { className: "px-3 pt-4 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: "Administration" }), _jsxs(NavLink, { to: "/reference-data", className: ({ isActive }) => navLinkClass(isActive), children: [_jsx("span", { "aria-hidden": true, className: "text-base", children: "\u2699\uFE0F" }), "Reference data"] }), _jsxs(NavLink, { to: "/user-management", className: ({ isActive }) => navLinkClass(isActive), children: [_jsx("span", { "aria-hidden": true, className: "text-base", children: "\uD83D\uDC64" }), "User roles"] })] }))] }), _jsxs("div", { className: "px-3 py-4 border-t border-slate-200", children: [_jsxs("div", { className: "flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-50 border border-slate-200", children: [_jsx("div", { className: "h-8 w-8 rounded-full bg-treasury-navy text-white flex items-center justify-center text-xs font-semibold shrink-0", children: initials }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-sm font-medium text-treasury-ink truncate", children: user?.username }), _jsx("p", { className: "text-[11px] text-treasury-slate capitalize truncate", children: user?.groups.join(", ") || "no role assigned" })] })] }), _jsx("button", { onClick: handleLogout, className: "mt-2 w-full text-xs font-medium text-treasury-green border border-treasury-green/40 rounded-lg py-2\n                         hover:bg-treasury-green hover:text-white transition-colors duration-150", children: "Sign out" })] })] }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsxs("header", { className: "h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10", children: [_jsxs("div", { className: "flex items-center gap-4 min-w-0", children: [_jsx("div", { className: "h-8 w-1.5 rounded-full bg-treasury-green shrink-0", "aria-hidden": true }), _jsxs("div", { className: "min-w-0", children: [_jsx("h1", { className: "text-base font-semibold text-treasury-ink truncate", children: currentPageTitle(location.pathname) }), _jsx("p", { className: "text-[11px] text-treasury-slate", children: "Republic of Kenya \u00B7 The National Treasury" })] })] }), _jsxs("div", { className: "flex items-center gap-4 shrink-0", children: [_jsxs("div", { className: "hidden sm:flex h-1.5 w-16 rounded-full overflow-hidden", "aria-hidden": true, children: [_jsx("span", { className: "flex-1 bg-treasury-ink" }), _jsx("span", { className: "flex-1 bg-treasury-red" }), _jsx("span", { className: "flex-1 bg-treasury-flag-green" })] }), _jsx("div", { className: "h-9 w-9 rounded-full bg-treasury-navy text-white flex items-center justify-center text-xs font-semibold", children: initials })] })] }), _jsx("main", { className: "flex-1 min-w-0 fade-in", children: _jsx(Outlet, {}) }), _jsxs("footer", { className: "border-t border-slate-200 bg-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-treasury-slate", children: [_jsxs("p", { children: ["\u00A9 ", new Date().getFullYear(), " The National Treasury, Republic of Kenya. All rights reserved."] }), _jsxs("p", { className: "flex items-center gap-3", children: [_jsx("span", { children: "Asset Inventory System" }), _jsx("span", { className: "text-slate-300", children: "|" }), _jsx("span", { children: "Internal use only" })] })] })] })] })] }));
}
