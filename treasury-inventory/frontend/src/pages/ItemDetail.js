import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { StatusBadge, ConditionBadge } from "../components/Badges";
import { useAuth } from "../auth/AuthContext";
function formatKES(value) {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(Number(value));
}
export default function ItemDetail() {
    const { id } = useParams();
    const { hasRole } = useAuth();
    const { data, isLoading } = useQuery({
        queryKey: ["item", id],
        queryFn: async () => (await api.get(`/items/${id}/`)).data,
    });
    if (isLoading || !data)
        return _jsx("p", { className: "p-6 text-sm text-treasury-slate", children: "Loading..." });
    const canManage = hasRole("admin", "custodian", "warehouse_officer");
    const canDispose = hasRole("admin");
    const isDisposed = data.status === "disposed";
    return (_jsxs("div", { className: "p-6 max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold", children: data.name }), _jsxs("p", { className: "text-sm text-treasury-slate", children: [data.asset_tag, " \u00B7 Serial ", data.serial_number, data.ifmis_asset_code && ` · IFMIS ${data.ifmis_asset_code}`] }), _jsxs("div", { className: "flex gap-2 mt-2", children: [_jsx(StatusBadge, { status: data.status }), _jsx(ConditionBadge, { condition: data.condition })] })] }), canManage && !isDisposed && (_jsxs("div", { className: "flex gap-2", children: [_jsx(Link, { to: `/items/${id}/transfer`, className: "btn-secondary", children: "Transfer custody" }), _jsx(Link, { to: `/items/${id}/service`, className: "btn-secondary", children: "Log service" }), canDispose && _jsx(Link, { to: `/items/${id}/dispose`, className: "btn-danger", children: "Dispose" })] }))] }), _jsxs("section", { className: "card p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm", children: [_jsx(Field, { label: "Current custodian", value: data.current_custodian_name ?? "Unassigned" }), _jsx(Field, { label: "Current location", value: data.current_location_name ?? "—" }), _jsx(Field, { label: "Category", value: data.category_name }), _jsx(Field, { label: "Unit cost", value: formatKES(data.unit_cost) }), _jsx(Field, { label: "Current book value", value: formatKES(data.current_book_value_kes) }), _jsx(Field, { label: "Date acquired", value: data.date_acquired }), _jsx(Field, { label: "Warranty expiry", value: data.warranty_expiry ?? "—" }), _jsx(Field, { label: "Next service due", value: data.next_service_due ?? "—" }), _jsx(Field, { label: "Funding source", value: data.funding_source || "—" }), _jsx(Field, { label: "LPO reference", value: data.purchase_order_ref || "—" })] }), data.disposal && (_jsxs("section", { className: "card p-5 border-treasury-red/30 bg-treasury-red/5", children: [_jsx("h2", { className: "text-sm font-medium text-treasury-red-dark mb-2", children: "Disposal record" }), _jsxs("p", { className: "text-sm", children: [data.disposal.method.replace("_", " "), " on ", data.disposal.disposal_date, " \u2014 ", data.disposal.reason] })] })), _jsxs("section", { children: [_jsx("h2", { className: "text-sm font-medium mb-2", children: "Custody history" }), _jsxs("ul", { className: "card divide-y divide-slate-100 text-sm", children: [data.custody_history.length === 0 && (_jsx("li", { className: "p-4 text-treasury-slate", children: "No custody transfers recorded yet." })), data.custody_history.map((c) => (_jsxs("li", { className: "p-4 flex justify-between", children: [_jsxs("span", { children: [c.custodian_detail.username, " @ ", c.location_detail.name] }), _jsx("span", { className: "text-treasury-slate", children: new Date(c.received_at).toLocaleDateString("en-KE") })] }, c.id)))] })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-sm font-medium mb-2", children: "Service history" }), _jsxs("ul", { className: "card divide-y divide-slate-100 text-sm", children: [data.service_history.length === 0 && (_jsx("li", { className: "p-4 text-treasury-slate", children: "No servicing recorded yet." })), data.service_history.map((s) => (_jsxs("li", { className: "p-4", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "font-medium", children: s.performed_by }), _jsx("span", { className: "text-treasury-slate", children: s.service_date })] }), _jsx("p", { className: "text-treasury-slate mt-1", children: s.description })] }, s.id)))] })] })] }));
}
function Field({ label, value }) {
    return (_jsxs("div", { children: [_jsx("p", { className: "text-treasury-slate text-xs uppercase tracking-wide", children: label }), _jsx("p", { className: "mt-0.5", children: value })] }));
}
