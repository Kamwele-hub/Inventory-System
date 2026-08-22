import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { ItemDetail as ItemDetailType } from "../types/inventory";
import { StatusBadge, ConditionBadge } from "../components/Badges";
import { useAuth } from "../auth/AuthContext";

function formatKES(value: string) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(
    Number(value)
  );
}

export default function ItemDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["item", id],
    queryFn: async () => (await api.get<ItemDetailType>(`/items/${id}/`)).data,
  });

  if (isLoading || !data) return <p className="p-6 text-sm text-treasury-slate">Loading...</p>;

  const canManage = hasRole("admin", "custodian", "warehouse_officer");
  const canDispose = hasRole("admin");
  const isDisposed = data.status === "disposed";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{data.name}</h1>
          <p className="text-sm text-treasury-slate">
            {data.asset_tag} · Serial {data.serial_number}
            {data.ifmis_asset_code && ` · IFMIS ${data.ifmis_asset_code}`}
          </p>
          <div className="flex gap-2 mt-2">
            <StatusBadge status={data.status} />
            <ConditionBadge condition={data.condition} />
          </div>
        </div>
        {canManage && !isDisposed && (
          <div className="flex gap-2">
            <Link to={`/items/${id}/transfer`} className="btn-secondary">Transfer custody</Link>
            <Link to={`/items/${id}/service`} className="btn-secondary">Log service</Link>
            {canDispose && <Link to={`/items/${id}/dispose`} className="btn-danger">Dispose</Link>}
          </div>
        )}
      </div>

      <section className="card p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <Field label="Current custodian" value={data.current_custodian_name ?? "Unassigned"} />
        <Field label="Current location" value={data.current_location_name ?? "—"} />
        <Field label="Category" value={data.category_name} />
        <Field label="Unit cost" value={formatKES(data.unit_cost)} />
        <Field label="Current book value" value={formatKES(data.current_book_value_kes)} />
        <Field label="Date acquired" value={data.date_acquired} />
        <Field label="Warranty expiry" value={data.warranty_expiry ?? "—"} />
        <Field label="Next service due" value={data.next_service_due ?? "—"} />
        <Field label="Funding source" value={data.funding_source || "—"} />
        <Field label="LPO reference" value={data.purchase_order_ref || "—"} />
      </section>

      {data.disposal && (
        <section className="card p-5 border-treasury-red/30 bg-treasury-red/5">
          <h2 className="text-sm font-medium text-treasury-red-dark mb-2">Disposal record</h2>
          <p className="text-sm">
            {data.disposal.method.replace("_", " ")} on {data.disposal.disposal_date} — {data.disposal.reason}
          </p>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium mb-2">Custody history</h2>
        <ul className="card divide-y divide-slate-100 text-sm">
          {data.custody_history.length === 0 && (
            <li className="p-4 text-treasury-slate">No custody transfers recorded yet.</li>
          )}
          {data.custody_history.map((c) => (
            <li key={c.id} className="p-4 flex justify-between">
              <span>{c.custodian_detail.username} @ {c.location_detail.name}</span>
              <span className="text-treasury-slate">{new Date(c.received_at).toLocaleDateString("en-KE")}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium mb-2">Service history</h2>
        <ul className="card divide-y divide-slate-100 text-sm">
          {data.service_history.length === 0 && (
            <li className="p-4 text-treasury-slate">No servicing recorded yet.</li>
          )}
          {data.service_history.map((s) => (
            <li key={s.id} className="p-4">
              <div className="flex justify-between">
                <span className="font-medium">{s.performed_by}</span>
                <span className="text-treasury-slate">{s.service_date}</span>
              </div>
              <p className="text-treasury-slate mt-1">{s.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-treasury-slate text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}
