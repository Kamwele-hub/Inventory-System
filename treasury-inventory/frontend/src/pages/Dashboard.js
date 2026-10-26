import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
const STATUS_COLORS = {
    in_store: "#94A3B8",
    issued: "#0A6C3B",
    under_repair: "#D97706",
    lost: "#BE1E2D",
    disposed: "#CBD5E1",
};
function formatKES(value) {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);
}
export default function Dashboard() {
    const { user } = useAuth();
    const { data, isLoading, error } = useQuery({
        queryKey: ["dashboard-summary"],
        queryFn: async () => (await api.get("/dashboard/summary/")).data,
        staleTime: 60 * 1000,
    });
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    if (isLoading) {
        return (_jsxs("div", { className: "p-6 max-w-6xl mx-auto space-y-6", children: [_jsx("div", { className: "h-8 w-64 bg-slate-200 rounded animate-pulse" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-4", children: [...Array(5)].map((_, i) => (_jsx("div", { className: "card p-4 h-24 bg-slate-100 animate-pulse" }, i))) })] }));
    }
    if (error || !data) {
        return (_jsx("div", { className: "p-6 max-w-2xl mx-auto", children: _jsx("div", { className: "card p-6 border-treasury-red/30 bg-treasury-red-light text-treasury-red-dark text-sm", children: "Could not load the dashboard summary. Try refreshing the page." }) }));
    }
    const statusData = Object.entries(data.by_status).map(([status, count]) => ({
        name: status.replace("_", " "),
        value: count,
        color: STATUS_COLORS[status] ?? "#94A3B8",
    }));
    const conditionData = Object.entries(data.by_condition).map(([condition, count]) => ({
        name: condition,
        count,
    }));
    return (_jsxs("div", { className: "p-6 max-w-6xl mx-auto space-y-6 slide-up", children: [_jsxs("div", { className: "rounded-xl bg-treasury-gradient text-white p-6 shadow-panel flex items-center justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-white/70 text-sm", children: [greeting, ", ", user?.username] }), _jsx("h1", { className: "text-2xl font-semibold mt-0.5", children: "National Treasury Asset Overview" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Link, { to: "/items/new", className: "bg-white text-treasury-green-dark rounded-lg px-4 py-2 text-sm font-medium shadow-sm hover:shadow-card-hover active:scale-[0.98] transition-all duration-150", children: "+ Register item" }), _jsx(Link, { to: "/scan", className: "bg-white/10 border border-white/25 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors duration-150", children: "\uD83D\uDCF7 Scan tag" })] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-4", children: [_jsx(StatCard, { icon: "\uD83D\uDDC4\uFE0F", iconBg: "bg-treasury-green-light", label: "Total assets", value: data.total_items.toLocaleString() }), _jsx(StatCard, { icon: "\uD83D\uDCB0", iconBg: "bg-treasury-gold-light", label: "Acquisition value", value: formatKES(Number(data.total_value_kes)) }), _jsx(StatCard, { icon: "\uD83D\uDCC9", iconBg: "bg-blue-50", label: "Current book value", value: formatKES(Number(data.total_book_value_kes)) }), _jsx(StatCard, { icon: "\uD83D\uDD27", iconBg: "bg-amber-50", label: "Due for service (30d)", value: data.due_for_service_30d.toLocaleString(), accent: "amber" }), _jsx(StatCard, { icon: "\u26A0\uFE0F", iconBg: "bg-treasury-red-light", label: "Overdue for service", value: data.overdue_for_service.toLocaleString(), accent: "red" })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "card p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-sm font-semibold text-treasury-ink", children: "Items by status" }), _jsx(Link, { to: "/items", className: "text-xs text-treasury-green hover:underline", children: "View register \u2192" })] }), _jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: statusData, dataKey: "value", nameKey: "name", innerRadius: 55, outerRadius: 85, paddingAngle: 3, children: statusData.map((entry, i) => (_jsx(Cell, { fill: entry.color, stroke: "white", strokeWidth: 2 }, i))) }), _jsx(Tooltip, { contentStyle: { borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 } })] }) }), _jsx("ul", { className: "flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs text-treasury-slate", children: statusData.map((entry) => (_jsxs("li", { className: "flex items-center gap-1.5 capitalize", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full", style: { background: entry.color } }), entry.name, " ", _jsxs("span", { className: "font-medium text-treasury-ink", children: ["(", entry.value, ")"] })] }, entry.name))) })] }), _jsxs("div", { className: "card p-5", children: [_jsx("h2", { className: "text-sm font-semibold text-treasury-ink mb-4", children: "Items by condition" }), _jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(BarChart, { data: conditionData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#EEF2F6" }), _jsx(XAxis, { dataKey: "name", tick: { fontSize: 12, fill: "#4B5563" }, tickLine: false, axisLine: false, className: "capitalize" }), _jsx(YAxis, { tick: { fontSize: 12, fill: "#4B5563" }, tickLine: false, axisLine: false, allowDecimals: false }), _jsx(Tooltip, { cursor: { fill: "#F1F5F9" }, contentStyle: { borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 } }), _jsx(Bar, { dataKey: "count", fill: "#0A6C3B", radius: [6, 6, 0, 0], maxBarSize: 48 })] }) })] })] }), _jsxs("div", { className: "grid md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "card p-5 md:col-span-2 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-treasury-ink", children: "Disposed / written off this financial year" }), _jsx("p", { className: "text-xs text-treasury-slate mt-0.5", children: "Under the Public Procurement and Asset Disposal Act, 2015" })] }), _jsx("p", { className: "text-3xl font-bold text-treasury-ink", children: data.disposed_ytd })] }), _jsxs("div", { className: "card p-5 bg-treasury-ink text-white flex flex-col justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold", children: "Quick actions" }), _jsx("p", { className: "text-xs text-white/60 mt-0.5", children: "Jump straight to a common task" })] }), _jsxs("div", { className: "mt-3 space-y-1.5", children: [_jsx(Link, { to: "/reports", className: "block text-xs text-white/80 hover:text-white transition-colors", children: "\u2192 Export the asset register" }), _jsx(Link, { to: "/items?status=lost", className: "block text-xs text-white/80 hover:text-white transition-colors", children: "\u2192 Review lost/missing items" })] })] })] })] }));
}
function StatCard({ icon, iconBg, label, value, accent, }) {
    const valueClass = accent === "amber" ? "text-amber-700" : accent === "red" ? "text-treasury-red" : "text-treasury-ink";
    return (_jsxs("div", { className: "card p-4 hover:shadow-card-hover transition-shadow duration-200", children: [_jsx("div", { className: `stat-icon ${iconBg} mb-2`, children: icon }), _jsx("p", { className: "text-xs text-treasury-slate", children: label }), _jsx("p", { className: `text-xl font-bold mt-0.5 ${valueClass}`, children: value })] }));
}
