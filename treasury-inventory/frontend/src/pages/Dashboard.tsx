import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { api } from "../api/client";
import { DashboardSummary } from "../types/inventory";
import { useAuth } from "../auth/AuthContext";

const STATUS_COLORS: Record<string, string> = {
  in_store: "#94A3B8",
  issued: "#0A6C3B",
  under_repair: "#D97706",
  lost: "#BE1E2D",
  disposed: "#CBD5E1",
};

function formatKES(value: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await api.get<DashboardSummary>("/dashboard/summary/")).data,
    staleTime: 60 * 1000,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 h-24 bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="card p-6 border-treasury-red/30 bg-treasury-red-light text-treasury-red-dark text-sm">
          Could not load the dashboard summary. Try refreshing the page.
        </div>
      </div>
    );
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 slide-up">
      {/* Welcome banner */}
      <div className="rounded-xl bg-treasury-gradient text-white p-6 shadow-panel flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-white/70 text-sm">{greeting}, {user?.username}</p>
          <h1 className="text-2xl font-semibold mt-0.5">National Treasury Asset Overview</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/items/new" className="bg-white text-treasury-green-dark rounded-lg px-4 py-2 text-sm font-medium shadow-sm hover:shadow-card-hover active:scale-[0.98] transition-all duration-150">
            + Register item
          </Link>
          <Link to="/scan" className="bg-white/10 border border-white/25 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors duration-150">
            📷 Scan tag
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon="🗄️" iconBg="bg-treasury-green-light" label="Total assets" value={data.total_items.toLocaleString()} />
        <StatCard icon="💰" iconBg="bg-treasury-gold-light" label="Acquisition value" value={formatKES(Number(data.total_value_kes))} />
        <StatCard icon="📉" iconBg="bg-blue-50" label="Current book value" value={formatKES(Number(data.total_book_value_kes))} />
        <StatCard icon="🔧" iconBg="bg-amber-50" label="Due for service (30d)" value={data.due_for_service_30d.toLocaleString()} accent="amber" />
        <StatCard icon="⚠️" iconBg="bg-treasury-red-light" label="Overdue for service" value={data.overdue_for_service.toLocaleString()} accent="red" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-treasury-ink">Items by status</h2>
            <Link to="/items" className="text-xs text-treasury-green hover:underline">View register →</Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs text-treasury-slate">
            {statusData.map((entry) => (
              <li key={entry.name} className="flex items-center gap-1.5 capitalize">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                {entry.name} <span className="font-medium text-treasury-ink">({entry.value})</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-treasury-ink mb-4">Items by condition</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={conditionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#4B5563" }} tickLine={false} axisLine={false} className="capitalize" />
              <YAxis tick={{ fontSize: 12, fill: "#4B5563" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "#F1F5F9" }}
                contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }}
              />
              <Bar dataKey="count" fill="#0A6C3B" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5 md:col-span-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-treasury-ink">Disposed / written off this financial year</p>
            <p className="text-xs text-treasury-slate mt-0.5">Under the Public Procurement and Asset Disposal Act, 2015</p>
          </div>
          <p className="text-3xl font-bold text-treasury-ink">{data.disposed_ytd}</p>
        </div>

        <div className="card p-5 bg-treasury-ink text-white flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold">Quick actions</p>
            <p className="text-xs text-white/60 mt-0.5">Jump straight to a common task</p>
          </div>
          <div className="mt-3 space-y-1.5">
            <Link to="/reports" className="block text-xs text-white/80 hover:text-white transition-colors">→ Export the asset register</Link>
            <Link to="/items?status=lost" className="block text-xs text-white/80 hover:text-white transition-colors">→ Review lost/missing items</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, iconBg, label, value, accent,
}: {
  icon: string; iconBg: string; label: string; value: string; accent?: "amber" | "red";
}) {
  const valueClass =
    accent === "amber" ? "text-amber-700" : accent === "red" ? "text-treasury-red" : "text-treasury-ink";
  return (
    <div className="card p-4 hover:shadow-card-hover transition-shadow duration-200">
      <div className={`stat-icon ${iconBg} mb-2`}>{icon}</div>
      <p className="text-xs text-treasury-slate">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${valueClass}`}>{value}</p>
    </div>
  );
}