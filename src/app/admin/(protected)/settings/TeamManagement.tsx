"use client";

import { useState } from "react";
import { STAFF_ROLES, ROLE_LABELS, PERMISSIONS, PERMISSION_LABELS, type Permission } from "@/lib/domain";
import { updateStaffPermissionsAction, deleteStaffAction } from "./actions";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  canViewOrders: boolean;
  canViewProducts: boolean;
  canViewCustomers: boolean;
  canViewReports: boolean;
  canViewFinance: boolean;
  canViewSettings: boolean;
};

const PERMISSION_FIELD: Record<Permission, keyof StaffMember> = {
  orders: "canViewOrders",
  products: "canViewProducts",
  customers: "canViewCustomers",
  reports: "canViewReports",
  finance: "canViewFinance",
  settings: "canViewSettings",
};

export function TeamManagement({ members }: { members: StaffMember[] }) {
  const editable = members.filter((m) => m.role !== "OWNER");
  const [selectedId, setSelectedId] = useState<string | null>(editable[0]?.id ?? null);
  const selected = editable.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs text-zinc-500">
              <th className="pb-2 font-medium">Nome</th>
              <th className="pb-2 font-medium">E-mail</th>
              <th className="pb-2 font-medium">Cargo</th>
              <th className="pb-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isOwner = member.role === "OWNER";
              const isSelected = member.id === selectedId;
              return (
                <tr
                  key={member.id}
                  onClick={() => !isOwner && setSelectedId(member.id)}
                  className={`border-b border-zinc-50 last:border-0 ${
                    isOwner ? "" : "cursor-pointer hover:bg-zinc-50"
                  } ${isSelected ? "bg-brand/5" : ""}`}
                >
                  <td className="py-2.5 font-medium text-zinc-900">{member.name}</td>
                  <td className="py-2.5 text-zinc-500">{member.email}</td>
                  <td className="py-2.5">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                      {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] ?? member.role}
                    </span>
                  </td>
                  <td className="py-2.5">
                    {!isOwner && (
                      <form
                        action={deleteStaffAction.bind(null, member.id)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button type="submit" className="font-medium text-red-600 hover:underline">
                          Remover
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4">
        {selected ? (
          <form key={selected.id} action={updateStaffPermissionsAction.bind(null, selected.id)}>
            <p className="text-xs font-medium text-zinc-500">Membro selecionado</p>
            <p className="mt-0.5 font-semibold text-zinc-900">{selected.name}</p>
            <p className="text-sm text-zinc-500">{selected.email}</p>

            <label className="mt-4 block text-sm font-medium text-zinc-700">Cargo</label>
            <select
              name="role"
              defaultValue={selected.role}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>

            <p className="mt-4 text-sm font-medium text-zinc-700">Acessos no painel</p>
            <div className="mt-2 flex flex-col gap-2">
              {PERMISSIONS.map((permission) => (
                <label key={permission} className="flex items-center justify-between text-sm text-zinc-700">
                  {PERMISSION_LABELS[permission]}
                  <input
                    type="checkbox"
                    name={`permission-${permission}`}
                    defaultChecked={selected[PERMISSION_FIELD[permission]] as boolean}
                    className="rounded border-zinc-300"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Salvar alterações
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-zinc-500">
            Selecione um membro na lista para configurar cargo e permissões.
          </p>
        )}
      </div>
    </div>
  );
}
