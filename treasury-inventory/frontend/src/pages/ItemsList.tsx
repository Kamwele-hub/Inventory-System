import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { ItemListRow, CursorPage } from "../types/inventory";
import { StatusBadge, ConditionBadge } from "../components/Badges";
import { useCategories } from "../hooks/useReferenceData";

function formatKES(value: string) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(
    Number(value)
  );
}

export default function ItemsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);

  const { data: categories } = useCategories();

  const { data, isLoading, error } = useQuery({
    queryKey: ["items", search, status, category, cursor],
    queryFn: async () => {
      const { data } = await api.get<CursorPage<ItemListRow>>("/items/", {
        params: {
          search: search || undefined,
          status: status || undefined,
          category: category || undefined,
          cursor: cursor || undefined,
        },
      });
      return data;
    },
  });

  function resetAndFilter(setter: (v: string) => void, value: string) {
    setter(value);
    setCursor(null);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Asset register</h1>
        <Link to="/items/new" className="btn-primary">+ Register item</Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="input-field flex-1 min-w-[220px]"
          placeholder="Search name, serial number, asset tag, IFMIS code..."
          value={search}
          onChange={(e) => resetAndFilter(setSearch, e.target.value)}
        />
        <select className="input-field w-44" value={status} onChange={(e) => resetAndFilter(setStatus, e.target.value)}>
          <option value="">All statuses</option>
          <option value="in_store">In store</option>
          <option value="issued">Issued</option>
          <option value="under_repair">Under repair</option>
          <option value="lost">Lost / missing</option>
          <option value="disposed">Disposed</option>
        </select>
        <select className="input-field w-48" value={category} onChange={(e) => resetAndFilter(setCategory, e.target.value)}>
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-sm text-treasury-slate">Loading...</p>}
      {error && <p className="text-sm text-treasury-red">Could not load items.</p>}

      {data && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-treasury-slate bg-slate-50 border-b border-slate-200">
                <th className="py-2.5 px-4">Name</th>
                <th className="px-4">Asset tag</th>
                <th className="px-4">Category</th>
                <th className="px-4">Status</th>
                <th className="px-4">Condition</th>
                <th className="px-4">Custodian</th>
                <th className="px-4">Location</th>
                <th className="px-4 text-right">Value (KES)</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 px-4">
                    <Link to={`/items/${item.id}`} className="text-treasury-green font-medium hover:underline">
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 font-mono text-xs text-treasury-slate">{item.asset_tag}</td>
                  <td className="px-4">{item.category_name}</td>
                  <td className="px-4"><StatusBadge status={item.status} /></td>
                  <td className="px-4"><ConditionBadge condition={item.condition} /></td>
                  <td className="px-4">{item.current_custodian_name ?? "—"}</td>
                  <td className="px-4">{item.current_location_name ?? "—"}</td>
                  <td className="px-4 text-right">{formatKES(item.unit_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.results.length === 0 && (
            <p className="text-sm text-treasury-slate p-6 text-center">No items match your search.</p>
          )}

          <div className="flex justify-between items-center px-4 py-3 border-t border-slate-200 text-sm">
            <button
              className="btn-secondary disabled:opacity-40"
              disabled={!data.previous}
              onClick={() => setCursor(data.previous ? new URL(data.previous).searchParams.get("cursor") : null)}
            >
              ← Previous
            </button>
            <button
              className="btn-secondary disabled:opacity-40"
              disabled={!data.next}
              onClick={() => setCursor(data.next ? new URL(data.next).searchParams.get("cursor") : null)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
