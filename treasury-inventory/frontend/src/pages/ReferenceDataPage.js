import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useCategories, useVendors, useLocations, useDepartments } from "../hooks/useReferenceData";
export default function ReferenceDataPage() {
    const [tab, setTab] = useState("departments");
    return (_jsxs("div", { className: "p-6 max-w-3xl mx-auto space-y-5", children: [_jsx("h1", { className: "text-xl font-semibold", children: "Reference data" }), _jsx("p", { className: "text-sm text-treasury-slate", children: "Manage the departments, locations, categories, and vendors used across the asset register." }), _jsx("div", { className: "flex gap-2 border-b border-slate-200", children: ["departments", "locations", "categories", "vendors"].map((t) => (_jsx("button", { onClick: () => setTab(t), className: `px-3 py-2 text-sm capitalize border-b-2 -mb-px ${tab === t ? "border-treasury-green text-treasury-green font-medium" : "border-transparent text-treasury-slate"}`, children: t }, t))) }), tab === "departments" && _jsx(DepartmentsPanel, {}), tab === "locations" && _jsx(LocationsPanel, {}), tab === "categories" && _jsx(CategoriesPanel, {}), tab === "vendors" && _jsx(VendorsPanel, {})] }));
}
function DepartmentsPanel() {
    const { data } = useDepartments();
    const qc = useQueryClient();
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const create = useMutation({
        mutationFn: () => api.post("/departments/", { name, code }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["departments"] });
            setName("");
            setCode("");
        },
    });
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs(AddRow, { children: [_jsx("input", { className: "input-field", placeholder: "Department name", value: name, onChange: (e) => setName(e.target.value) }), _jsx("input", { className: "input-field w-32", placeholder: "Code", value: code, onChange: (e) => setCode(e.target.value) }), _jsx("button", { className: "btn-primary shrink-0", onClick: () => create.mutate(), disabled: !name || !code, children: "Add" })] }), _jsx(List, { items: (data ?? []).map((d) => `${d.name} (${d.code})`) })] }));
}
function LocationsPanel() {
    const { data } = useLocations();
    const { data: departments } = useDepartments();
    const qc = useQueryClient();
    const [name, setName] = useState("");
    const [department, setDepartment] = useState("");
    const create = useMutation({
        mutationFn: () => api.post("/locations/", { name, department: Number(department) }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["locations"] });
            setName("");
            setDepartment("");
        },
    });
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs(AddRow, { children: [_jsx("input", { className: "input-field", placeholder: "Location name", value: name, onChange: (e) => setName(e.target.value) }), _jsxs("select", { className: "input-field w-48", value: department, onChange: (e) => setDepartment(e.target.value), children: [_jsx("option", { value: "", children: "Department" }), departments?.map((d) => _jsx("option", { value: d.id, children: d.name }, d.id))] }), _jsx("button", { className: "btn-primary shrink-0", onClick: () => create.mutate(), disabled: !name || !department, children: "Add" })] }), _jsx(List, { items: (data ?? []).map((l) => `${l.name} — ${l.department_name}`) })] }));
}
function CategoriesPanel() {
    const { data } = useCategories();
    const qc = useQueryClient();
    const [name, setName] = useState("");
    const [rate, setRate] = useState("0");
    const create = useMutation({
        mutationFn: () => api.post("/categories/", { name, depreciation_rate_pct: rate }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["categories"] });
            setName("");
            setRate("0");
        },
    });
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs(AddRow, { children: [_jsx("input", { className: "input-field", placeholder: "Category name", value: name, onChange: (e) => setName(e.target.value) }), _jsx("input", { className: "input-field w-40", type: "number", placeholder: "Depreciation %/yr", value: rate, onChange: (e) => setRate(e.target.value) }), _jsx("button", { className: "btn-primary shrink-0", onClick: () => create.mutate(), disabled: !name, children: "Add" })] }), _jsx(List, { items: (data ?? []).map((c) => `${c.name} (${c.depreciation_rate_pct}%/yr)`) })] }));
}
function VendorsPanel() {
    const { data } = useVendors();
    const qc = useQueryClient();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const create = useMutation({
        mutationFn: () => api.post("/vendors/", { name, contact_email: email }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["vendors"] });
            setName("");
            setEmail("");
        },
    });
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs(AddRow, { children: [_jsx("input", { className: "input-field", placeholder: "Vendor name", value: name, onChange: (e) => setName(e.target.value) }), _jsx("input", { className: "input-field", placeholder: "Contact email", value: email, onChange: (e) => setEmail(e.target.value) }), _jsx("button", { className: "btn-primary shrink-0", onClick: () => create.mutate(), disabled: !name, children: "Add" })] }), _jsx(List, { items: (data ?? []).map((v) => v.name) })] }));
}
function AddRow({ children }) {
    return _jsx("div", { className: "flex gap-2 card p-3", children: children });
}
function List({ items }) {
    return (_jsxs("ul", { className: "card divide-y divide-slate-100 text-sm", children: [items.length === 0 && _jsx("li", { className: "p-3 text-treasury-slate", children: "Nothing here yet." }), items.map((item, i) => (_jsx("li", { className: "p-3", children: item }, i)))] }));
}
