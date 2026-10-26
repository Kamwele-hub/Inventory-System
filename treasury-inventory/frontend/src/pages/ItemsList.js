import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { StatusBadge, ConditionBadge } from "../components/Badges";
import { useCategories } from "../hooks/useReferenceData";
function formatKES(value) {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(Number(value));
}
export default function ItemsList() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [category, setCategory] = useState("");
    const [cursor, setCursor] = useState(null);
    const { data: categories } = useCategories();
    const { data, isLoading, error } = useQuery({
        queryKey: ["items", search, status, category, cursor],
        queryFn: async () => {
            const { data } = await api.get("/items/", {
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
    function resetAndFilter(setter, value) {
        setter(value);
        setCursor(null);
    }
    return (_jsxs("div", { className: "p-6 max-w-6xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h1", { className: "text-xl font-semibold", children: "Asset register" }), _jsx(Link, { to: "/items/new", className: "btn-primary", children: "+ Register item" })] }), _jsxs("div", { className: "flex flex-wrap gap-3 mb-4", children: [_jsx("input", { className: "input-field flex-1 min-w-[220px]", placeholder: "Search name, serial number, asset tag, IFMIS code...", value: search, onChange: (e) => resetAndFilter(setSearch, e.target.value) }), _jsxs("select", { className: "input-field w-44", value: status, onChange: (e) => resetAndFilter(setStatus, e.target.value), children: [_jsx("option", { value: "", children: "All statuses" }), _jsx("option", { value: "in_store", children: "In store" }), _jsx("option", { value: "issued", children: "Issued" }), _jsx("option", { value: "under_repair", children: "Under repair" }), _jsx("option", { value: "lost", children: "Lost / missing" }), _jsx("option", { value: "disposed", children: "Disposed" })] }), _jsxs("select", { className: "input-field w-48", value: category, onChange: (e) => resetAndFilter(setCategory, e.target.value), children: [_jsx("option", { value: "", children: "All categories" }), categories?.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] })] }), isLoading && _jsx("p", { className: "text-sm text-treasury-slate", children: "Loading..." }), error && _jsx("p", { className: "text-sm text-treasury-red", children: "Could not load items." }), data && (_jsxs("div", { className: "card overflow-hidden", children: [_jsxs("table", { className: "w-full text-sm border-collapse", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-treasury-slate bg-slate-50 border-b border-slate-200", children: [_jsx("th", { className: "py-2.5 px-4", children: "Name" }), _jsx("th", { className: "px-4", children: "Asset tag" }), _jsx("th", { className: "px-4", children: "Category" }), _jsx("th", { className: "px-4", children: "Status" }), _jsx("th", { className: "px-4", children: "Condition" }), _jsx("th", { className: "px-4", children: "Custodian" }), _jsx("th", { className: "px-4", children: "Location" }), _jsx("th", { className: "px-4 text-right", children: "Value (KES)" })] }) }), _jsx("tbody", { children: data.results.map((item) => (_jsxs("tr", { className: "border-b border-slate-100 hover:bg-slate-50", children: [_jsx("td", { className: "py-2.5 px-4", children: _jsx(Link, { to: `/items/${item.id}`, className: "text-treasury-green font-medium hover:underline", children: item.name }) }), _jsx("td", { className: "px-4 font-mono text-xs text-treasury-slate", children: item.asset_tag }), _jsx("td", { className: "px-4", children: item.category_name }), _jsx("td", { className: "px-4", children: _jsx(StatusBadge, { status: item.status }) }), _jsx("td", { className: "px-4", children: _jsx(ConditionBadge, { condition: item.condition }) }), _jsx("td", { className: "px-4", children: item.current_custodian_name ?? "—" }), _jsx("td", { className: "px-4", children: item.current_location_name ?? "—" }), _jsx("td", { className: "px-4 text-right", children: formatKES(item.unit_cost) })] }, item.id))) })] }), data.results.length === 0 && (_jsx("p", { className: "text-sm text-treasury-slate p-6 text-center", children: "No items match your search." })), _jsxs("div", { className: "flex justify-between items-center px-4 py-3 border-t border-slate-200 text-sm", children: [_jsx("button", { className: "btn-secondary disabled:opacity-40", disabled: !data.previous, onClick: () => setCursor(data.previous ? new URL(data.previous).searchParams.get("cursor") : null), children: "\u2190 Previous" }), _jsx("button", { className: "btn-secondary disabled:opacity-40", disabled: !data.next, onClick: () => setCursor(data.next ? new URL(data.next).searchParams.get("cursor") : null), children: "Next \u2192" })] })] }))] }));
}
