import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

interface ManagedUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  roles: string[];
}

const ALL_ROLES = ["admin", "warehouse_officer", "custodian", "auditor"] as const;
const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  warehouse_officer: "Warehouse officer",
  custodian: "Custodian",
  auditor: "Auditor",
};

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [savingId, setSavingId] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await api.get<{ results: ManagedUser[] }>("/admin/users/")).data.results,
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<ManagedUser> }) => api.patch(`/admin/users/${id}/`, patch),
    onMutate: ({ id }) => setSavingId(id),
    onSettled: () => setSavingId(null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  function toggleRole(user: ManagedUser, role: string) {
    const hasRole = user.roles.includes(role);
    const nextRoles = hasRole ? user.roles.filter((r) => r !== role) : [...user.roles, role];
    updateUser.mutate({ id: user.id, patch: { roles: nextRoles } });
  }

  function toggleActive(user: ManagedUser) {
    updateUser.mutate({ id: user.id, patch: { is_active: !user.is_active } });
  }

  if (isLoading) return <div className="p-6 text-sm text-treasury-slate">Loading staff accounts...</div>;
  if (error) return <div className="p-6 text-sm text-treasury-red">Could not load staff accounts. This page requires admin access.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold">User roles &amp; permissions</h1>
        <p className="text-sm text-treasury-slate mt-1">
          Assign roles to staff accounts. Access is enforced by the backend regardless of
          what's shown here -- this screen only controls which roles a user holds.
          Account creation and removal are handled separately in the Django admin panel.
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-treasury-slate bg-slate-50 border-b border-slate-200">
              <th className="py-2.5 px-4">Staff member</th>
              {ALL_ROLES.map((role) => <th key={role} className="px-3 text-center">{ROLE_LABELS[role]}</th>)}
              <th className="px-4 text-center">Active</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5 px-4">
                  <p className="font-medium">{[user.first_name, user.last_name].filter(Boolean).join(" ") || user.username}</p>
                  <p className="text-xs text-treasury-slate">{user.username}</p>
                </td>
                {ALL_ROLES.map((role) => (
                  <td key={role} className="px-3 text-center">
                    <input
                      type="checkbox"
                      checked={user.roles.includes(role)}
                      disabled={savingId === user.id}
                      onChange={() => toggleRole(user, role)}
                      className="h-4 w-4 accent-treasury-green cursor-pointer disabled:opacity-40"
                      aria-label={`${ROLE_LABELS[role]} role for ${user.username}`}
                    />
                  </td>
                ))}
                <td className="px-4 text-center">
                  <input
                    type="checkbox"
                    checked={user.is_active}
                    disabled={savingId === user.id}
                    onChange={() => toggleActive(user)}
                    className="h-4 w-4 accent-treasury-green cursor-pointer disabled:opacity-40"
                    aria-label={`Active status for ${user.username}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.length === 0 && <p className="text-sm text-treasury-slate p-6 text-center">No staff accounts found.</p>}
      </div>
    </div>
  );
}