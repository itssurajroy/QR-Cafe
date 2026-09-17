// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useMemo, useState } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

type RoleDef = {
  id: string;
  name: string;
  description: string;
  userCount: number;
};

type PermissionGroup = {
  domain: string;
  permissions: { key: string; label: string }[];
};

export function RolesTab() {
  const { staff, flash } = useSuperAdmin();

  const roles: RoleDef[] = useMemo(() => {
    const staffList = staff ?? [];
    const roleCounts: Record<string, number> = {};
    for (const s of staffList) {
      const r = s?.role ?? "staff";
      roleCounts[r] = (roleCounts[r] ?? 0) + 1;
    }
    const roleDefs: RoleDef[] = [
      { id: "owner", name: "Platform Owner", description: "Unrestricted platform governance, billing, and root configuration.", userCount: roleCounts["owner"] ?? 1 },
      { id: "admin", name: "Platform Admin", description: "Daily operations, tenant provisioning, and platform triaging.", userCount: roleCounts["super_admin"] ?? roleCounts["admin"] ?? 2 },
      { id: "finance", name: "Finance & Accounting", description: "Subscription reconciliations, invoice management, and payment refunds.", userCount: roleCounts["finance"] ?? 1 },
      { id: "support", name: "Customer Support", description: "Tenant investigation, customer tickets, and staff assistance.", userCount: roleCounts["support"] ?? 3 },
      { id: "operations", name: "Live Operations", description: "Live order monitor, kitchen display bridge, and outlet health.", userCount: roleCounts["operations"] ?? 2 },
      { id: "engineering", name: "Site Reliability / Dev", description: "System health monitoring, background jobs, logs, and feature flags.", userCount: roleCounts["engineering"] ?? 2 },
    ];
    return roleDefs;
  }, [staff]);

  const permissionMatrix: PermissionGroup[] = [
    {
      domain: "Restaurants & Tenancy",
      permissions: [
        { key: "restaurants.view", label: "View restaurants & outlets" },
        { key: "restaurants.create", label: "Provision new restaurant tenant" },
        { key: "restaurants.edit", label: "Update restaurant settings & slug" },
        { key: "restaurants.suspend", label: "Suspend / archive tenant" },
      ],
    },
    {
      domain: "Subscriptions & Billing",
      permissions: [
        { key: "subscriptions.view", label: "View subscriptions & MRR" },
        { key: "subscriptions.edit", label: "Modify subscription plans / trials" },
        { key: "billing.view", label: "View invoices & transactions" },
        { key: "billing.refund", label: "Initiate payment refunds" },
      ],
    },
    {
      domain: "Operations & Support",
      permissions: [
        { key: "orders.view", label: "Inspect live dine-in table stream" },
        { key: "support.view", label: "View tenant support inquiries" },
        { key: "support.manage", label: "Reply and resolve support tickets" },
      ],
    },
    {
      domain: "Platform Infrastructure",
      permissions: [
        { key: "system.health.view", label: "Monitor microservice uptime" },
        { key: "system.config.edit", label: "Modify global platform config" },
        { key: "integrations.view", label: "Inspect WhatsApp/Payment telemetry" },
        { key: "integrations.manage", label: "Configure API credentials & keys" },
      ],
    },
    {
      domain: "Security & Governance",
      permissions: [
        { key: "audit.view", label: "Inspect immutable audit trail" },
        { key: "admins.view", label: "View Super Admin directory" },
        { key: "admins.manage", label: "Invite & revoke Super Admin roles" },
      ],
    },
  ];

  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({
    "owner_restaurants.view": true, "owner_restaurants.create": true, "owner_restaurants.edit": true, "owner_restaurants.suspend": true,
    "owner_subscriptions.view": true, "owner_subscriptions.edit": true, "owner_billing.view": true, "owner_billing.refund": true,
    "owner_orders.view": true, "owner_support.view": true, "owner_support.manage": true,
    "owner_system.health.view": true, "owner_system.config.edit": true, "owner_integrations.view": true, "owner_integrations.manage": true,
    "owner_audit.view": true, "owner_admins.view": true, "owner_admins.manage": true,
    "admin_restaurants.view": true, "admin_restaurants.create": true, "admin_restaurants.edit": true, "admin_restaurants.suspend": false,
    "admin_subscriptions.view": true, "admin_subscriptions.edit": true, "admin_billing.view": true, "admin_billing.refund": false,
    "admin_orders.view": true, "admin_support.view": true, "admin_support.manage": true,
    "admin_system.health.view": true, "admin_system.config.edit": false, "admin_integrations.view": true, "admin_integrations.manage": false,
    "admin_audit.view": true, "admin_admins.view": true, "admin_admins.manage": false,
    "finance_restaurants.view": true, "finance_subscriptions.view": true, "finance_subscriptions.edit": true,
    "finance_billing.view": true, "finance_billing.refund": true, "finance_audit.view": true,
    "support_restaurants.view": true, "support_orders.view": true, "support_support.view": true,
    "support_support.manage": true, "support_integrations.view": true,
    "operations_restaurants.view": true, "operations_orders.view": true, "operations_integrations.view": true,
    "operations_system.health.view": true,
    "engineering_restaurants.view": true, "engineering_system.health.view": true, "engineering_system.config.edit": true,
    "engineering_integrations.view": true, "engineering_integrations.manage": true, "engineering_audit.view": true,
  });

  const togglePermission = (roleId: string, permKey: string) => {
    if (roleId === "owner") {
      flash("err", "Platform Owner permissions are strictly root and immutable.");
      return;
    }
    const key = `${roleId}_${permKey}`;
    const nextVal = !rolePermissions[key];
    setRolePermissions((prev) => ({ ...prev, [key]: nextVal }));
    flash("ok", `Permission updated: ${roleId} -> ${permKey} = ${nextVal ? "Allowed" : "Denied"}`);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Roles & Permissions Matrix</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enforce least-privilege Role-Based Access Control (RBAC) across all platform super console operations.
          </p>
        </div>
      </div>

      {/* Roles Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {roles.map((r) => (
          <div key={r.id} className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{r.name}</span>
            <div className="text-base font-extrabold text-slate-900 font-mono">{r.userCount} users</div>
            <p className="text-[11px] text-slate-500 line-clamp-1" title={r.description}>{r.description}</p>
          </div>
        ))}
      </div>

      {/* Permissions Matrix Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3 px-4 w-72">Permission Capability</th>
                {roles.map((r) => (
                  <th key={r.id} className="py-3 px-3 text-center">
                    <div>{r.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionMatrix.map((group) => (
                <React.Fragment key={group.domain}>
                  <tr className="bg-slate-100/60 text-slate-800 font-extrabold text-xs">
                    <td colSpan={roles.length + 1} className="py-2.5 px-4 uppercase tracking-wider">
                      {group.domain}
                    </td>
                  </tr>
                  {group.permissions.map((perm) => (
                    <tr key={perm.key} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-800">{perm.label}</div>
                        <code className="text-[10px] text-slate-400 font-mono">{perm.key}</code>
                      </td>
                      {roles.map((r) => {
                        const hasPerm = !!rolePermissions[`${r.id}_${perm.key}`];
                        return (
                          <td key={r.id} className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => togglePermission(r.id, perm.key)}
                              className={`w-6 h-6 rounded-lg inline-flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                                hasPerm
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                              }`}
                            >
                              {hasPerm ? "✓" : "—"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
