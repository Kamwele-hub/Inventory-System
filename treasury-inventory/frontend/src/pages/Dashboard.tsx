import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { api } from "../api/client";
import { DashboardSummary } from "../types/inventory";

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
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await api.get<DashboardSummary>("/dashboard/summary/")).data,
    staleTime: 60 * 1000,
  });

  if (isLoading) return <div className="p-6 text-sm text-treasury-slate">Loading dashboard...</div>;
  if (error || !data) return <div className="p-6 text-sm text-treasury-red">Could not load the dashboard summary.</div>;

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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link to="/items/new" className="btn-primary">+ Register item</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard label="Total assets" value={data.total_items.toLocaleString()} />
        <SummaryCard label="Acquisition value" value={formatKES(Number(data.total_value_kes))} />
        <SummaryCard label="Current book value" value={formatKES(Number(data.total_book_value_kes))} />
        <SummaryCard label="Due for service (30d)" value={data.due_for_service_30d.toLocaleString()} accent="amber" />
        <SummaryCard label="Overdue for service" value={data.overdue_for_service.toLocaleString()} accent="red" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-medium mb-4">Items by status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <ul className="flex flex-wrap gap-3 mt-2 text-xs text-treasury-slate">
            {statusData.map((entry) => (
              <li key={entry.name} className="flex items-center gap-1.5 capitalize">
                <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
                {entry.name} ({entry.value})
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-medium mb-4">Items by condition</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={conditionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} className="capitalize" />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0A6C3B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Disposed / written off this financial year</p>
          <p className="text-xs text-treasury-slate">Under the Public Procurement and Asset Disposal Act, 2015</p>
        </div>
        <p className="text-2xl font-semibold text-treasury-ink">{data.disposed_ytd}</p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: "amber" | "red" }) {
  const accentClass =
    accent === "amber" ? "text-amber-700" : accent === "red" ? "text-treasury-red" : "text-treasury-ink";
  return (
    <div className="card p-4">
      <p className="text-xs text-treasury-slate">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${accentClass}`}>{value}</p>
    </div>
  );
}
