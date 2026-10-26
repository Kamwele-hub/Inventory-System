import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
const ALL_ROLES = ["admin", "warehouse_officer", "custodian", "auditor"];
const ROLE_LABELS = {
    admin: "Admin",
    warehouse_officer: "Warehouse officer",
    custodian: "Custodian",
    auditor: "Auditor",
};
export default function UserManagementPage() {
    const queryClient = useQueryClient();
    const [savingId, setSavingId] = useState(null);
    const { data, isLoading, error } = useQuery({
        queryKey: ["admin-users"],
        queryFn: async () => (await api.get("/admin/users/")).data.results,
    });
    const updateUser = useMutation({
        mutationFn: async ({ id, patch }) => api.patch(`/admin/users/${id}/`, patch),
        onMutate: ({ id }) => setSavingId(id),
        onSettled: () => setSavingId(null),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    });
    function toggleRole(user, role) {
        const hasRole = user.roles.includes(role);
        const nextRoles = hasRole ? user.roles.filter((r) => r !== role) : [...user.roles, role];
        updateUser.mutate({ id: user.id, patch: { roles: nextRoles } });
    }
    function toggleActive(user) {
        updateUser.mutate({ id: user.id, patch: { is_active: !user.is_active } });
    }
    if (isLoading)
        return _jsx("div", { className: "p-6 text-sm text-treasury-slate", children: "Loading staff accounts..." });
    if (error)
        return _jsx("div", { className: "p-6 text-sm text-treasury-red", children: "Could not load staff accounts. This page requires admin access." });
    return (_jsxs("div", { className: "p-6 max-w-4xl mx-auto space-y-5", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold", children: "User roles & permissions" }), _jsx("p", { className: "text-sm text-treasury-slate mt-1", children: "Assign roles to staff accounts. Access is enforced by the backend regardless of what's shown here -- this screen only controls which roles a user holds. Account creation and removal are handled separately in the Django admin panel." })] }), _jsxs("div", { className: "card overflow-hidden", children: [_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-treasury-slate bg-slate-50 border-b border-slate-200", children: [_jsx("th", { className: "py-2.5 px-4", children: "Staff member" }), ALL_ROLES.map((role) => _jsx("th", { className: "px-3 text-center", children: ROLE_LABELS[role] }, role)), _jsx("th", { className: "px-4 text-center", children: "Active" })] }) }), _jsx("tbody", { children: data?.map((user) => (_jsxs("tr", { className: "border-b border-slate-100 last:border-0", children: [_jsxs("td", { className: "py-2.5 px-4", children: [_jsx("p", { className: "font-medium", children: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username }), _jsx("p", { className: "text-xs text-treasury-slate", children: user.username })] }), ALL_ROLES.map((role) => (_jsx("td", { className: "px-3 text-center", children: _jsx("input", { type: "checkbox", checked: user.roles.includes(role), disabled: savingId === user.id, onChange: () => toggleRole(user, role), className: "h-4 w-4 accent-treasury-green cursor-pointer disabled:opacity-40", "aria-label": `${ROLE_LABELS[role]} role for ${user.username}` }) }, role))), _jsx("td", { className: "px-4 text-center", children: _jsx("input", { type: "checkbox", checked: user.is_active, disabled: savingId === user.id, onChange: () => toggleActive(user), className: "h-4 w-4 accent-treasury-green cursor-pointer disabled:opacity-40", "aria-label": `Active status for ${user.username}` }) })] }, user.id))) })] }), data?.length === 0 && _jsx("p", { className: "text-sm text-treasury-slate p-6 text-center", children: "No staff accounts found." })] })] }));
}
