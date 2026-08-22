import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useCategories, useVendors, useLocations, useDepartments } from "../hooks/useReferenceData";

type Tab = "departments" | "locations" | "categories" | "vendors";

export default function ReferenceDataPage() {
  const [tab, setTab] = useState<Tab>("departments");

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <h1 className="text-xl font-semibold">Reference data</h1>
      <p className="text-sm text-treasury-slate">
        Manage the departments, locations, categories, and vendors used across the asset register.
      </p>

      <div className="flex gap-2 border-b border-slate-200">
        {(["departments", "locations", "categories", "vendors"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm capitalize border-b-2 -mb-px ${
              tab === t ? "border-treasury-green text-treasury-green font-medium" : "border-transparent text-treasury-slate"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "departments" && <DepartmentsPanel />}
      {tab === "locations" && <LocationsPanel />}
      {tab === "categories" && <CategoriesPanel />}
      {tab === "vendors" && <VendorsPanel />}
    </div>
  );
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
      setName(""); setCode("");
    },
  });

  return (
    <div className="space-y-3">
      <AddRow>
        <input className="input-field" placeholder="Department name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input-field w-32" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="btn-primary shrink-0" onClick={() => create.mutate()} disabled={!name || !code}>Add</button>
      </AddRow>
      <List items={(data ?? []).map((d) => `${d.name} (${d.code})`)} />
    </div>
  );
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
      setName(""); setDepartment("");
    },
  });

  return (
    <div className="space-y-3">
      <AddRow>
        <input className="input-field" placeholder="Location name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="input-field w-48" value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">Department</option>
          {departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button className="btn-primary shrink-0" onClick={() => create.mutate()} disabled={!name || !department}>Add</button>
      </AddRow>
      <List items={(data ?? []).map((l) => `${l.name} — ${l.department_name}`)} />
    </div>
  );
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
      setName(""); setRate("0");
    },
  });

  return (
    <div className="space-y-3">
      <AddRow>
        <input className="input-field" placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input-field w-40" type="number" placeholder="Depreciation %/yr" value={rate} onChange={(e) => setRate(e.target.value)} />
        <button className="btn-primary shrink-0" onClick={() => create.mutate()} disabled={!name}>Add</button>
      </AddRow>
      <List items={(data ?? []).map((c) => `${c.name} (${c.depreciation_rate_pct}%/yr)`)} />
    </div>
  );
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
      setName(""); setEmail("");
    },
  });

  return (
    <div className="space-y-3">
      <AddRow>
        <input className="input-field" placeholder="Vendor name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input-field" placeholder="Contact email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn-primary shrink-0" onClick={() => create.mutate()} disabled={!name}>Add</button>
      </AddRow>
      <List items={(data ?? []).map((v) => v.name)} />
    </div>
  );
}

function AddRow({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 card p-3">{children}</div>;
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="card divide-y divide-slate-100 text-sm">
      {items.length === 0 && <li className="p-3 text-treasury-slate">Nothing here yet.</li>}
      {items.map((item, i) => (
        <li key={i} className="p-3">{item}</li>
      ))}
    </ul>
  );
}
