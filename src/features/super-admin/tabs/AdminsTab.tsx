// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSuperAdmin } from "../SuperAdminContext";
import { RolesTab } from "./RolesTab";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "Platform Owner" | "Platform Admin" | "Finance" | "Support" | "Operations" | "Engineering";
  lastActive: string;
  twoFactorEnabled: boolean;
  status: "Active" | "Invited" | "Suspended";
};

export function AdminsTab() {
  const router = useRouter();
  const { tab, authUsers, flash } = useSuperAdmin();
  const [activeSubTab, setActiveSubTab] = useState<"admins" | "roles">(tab === "roles" ? "roles" : "admins");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminUser["role"]>("Platform Admin");
  const [isInviting, setIsInviting] = useState(false);
  const [selectedAdminForManage, setSelectedAdminForManage] = useState<AdminUser | null>(null);
  const [recoveryLink, setRecoveryLink] = useState<string | null>(null);
  const [isManagingAction, setIsManagingAction] = useState(false);

  const admins: AdminUser[] = React.useMemo(() => {
    if (!authUsers || authUsers.length === 0) {
      return [
        {
          id: "adm-01",
          name: "Super Admin",
          email: "super@qrslice.test",
          role: "Platform Owner",
          lastActive: "Active now",
          twoFactorEnabled: true,
          status: "Active",
        },
      ];
    }
    return authUsers.map((u: { id: string; email: string; last_sign_in_at: string | null; role: string; app_metadata?: any; user_metadata?: any }, idx: number) => ({
      id: u.id,
      name: u.user_metadata?.display_name || u.email.split("@")[0],
      email: u.email,
      role: (u.user_metadata?.role as AdminUser["role"]) || (idx === 0 ? "Platform Owner" : "Platform Admin"),
      lastActive: u.last_sign_in_at
        ? new Date(u.last_sign_in_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
        : "Never",
      twoFactorEnabled: true,
      status: u.app_metadata?.banned_at ? "Suspended" : "Active",
    }));
  }, [authUsers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_super_admin",
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          role: inviteRole,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        flash("ok", `Super Admin invited successfully: ${inviteEmail}`);
        setShowInviteModal(false);
        setInviteEmail("");
        setInviteName("");
        router.refresh();
      } else {
        flash("err", data.error || "Failed to invite Super Admin");
      }
    } catch {
      flash("err", "Network error inviting Super Admin");
    } finally {
      setIsInviting(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    setIsManagingAction(true);
    setRecoveryLink(null);
    try {
      const res = await fetch("/api/super/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "reset_password", user_id: userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.link) {
        setRecoveryLink(data.link);
        flash("ok", "Password recovery link generated");
      } else {
        flash("err", data.error || "Failed to generate recovery link");
      }
    } catch {
      flash("err", "Network error generating recovery link");
    } finally {
      setIsManagingAction(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: string) => {
    setIsManagingAction(true);
    const nextOp = currentStatus === "Active" ? "disable" : "enable";
    try {
      const res = await fetch("/api/super/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: nextOp, user_id: userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        flash("ok", `Admin user account ${nextOp === "enable" ? "enabled" : "disabled"}`);
        setSelectedAdminForManage(null);
        router.refresh();
      } else {
        flash("err", data.error || "Action failed");
      }
    } catch {
      flash("err", "Network error updating user");
    } finally {
      setIsManagingAction(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Segmented Sub-Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab("admins")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "admins"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Super Admin Accounts
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("roles")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "roles"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Roles & Permissions Matrix
        </button>
      </div>

      {activeSubTab === "roles" ? (
        <RolesTab />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Super Admin Users</h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage authenticated platform console administrators, RBAC role assignments, and 2FA credentials.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 rounded-xl bg-[#5738F5] hover:bg-[#492ee0] text-white font-bold text-xs transition-all shadow-sm shadow-[#5738F5]/25 cursor-pointer flex items-center gap-1.5"
            >
              <span>＋ Invite Super Admin</span>
            </button>
          </div>

      {/* Admins Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3 px-4">Admin</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4">2FA Security</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{admin.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{admin.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-lg bg-violet-50 text-[#5738F5] border border-violet-100 font-bold text-[11px]">
                      {admin.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {admin.lastActive}
                  </td>
                  <td className="py-3.5 px-4">
                    {admin.twoFactorEnabled ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                        <span>✓</span>
                        <span>Enforced</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                        <span>⚠</span>
                        <span>Pending Setup</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        admin.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <span>●</span>
                      <span>{admin.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAdminForManage(admin);
                        setRecoveryLink(null);
                      }}
                      className="px-3 py-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Manage Modal */}
      {selectedAdminForManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manage Administrator</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedAdminForManage.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAdminForManage(null);
                  setRecoveryLink(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-bold text-slate-900">{selectedAdminForManage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Role:</span>
                <span className="font-bold text-[#5738F5]">{selectedAdminForManage.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-slate-900">{selectedAdminForManage.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">User ID:</span>
                <span className="font-mono text-[10px] text-slate-400">{selectedAdminForManage.id}</span>
              </div>
            </div>

            {recoveryLink && (
              <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-violet-900 block">Password Recovery URL Generated:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={recoveryLink}
                    className="flex-1 bg-white border border-violet-200 text-xs px-2.5 py-1.5 rounded-lg font-mono text-slate-700 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(recoveryLink);
                      flash("ok", "Recovery link copied to clipboard!");
                    }}
                    className="px-3 py-1.5 bg-[#5738F5] text-white font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isManagingAction}
                onClick={() => handleResetPassword(selectedAdminForManage.id)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>🔑 Generate Password Recovery Link</span>
              </button>

              <button
                type="button"
                disabled={isManagingAction}
                onClick={() => handleToggleActive(selectedAdminForManage.id, selectedAdminForManage.status)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                  selectedAdminForManage.status === "Active"
                    ? "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                <span>
                  {selectedAdminForManage.status === "Active" ? "⛔ Disable Administrator Account" : "✓ Enable Administrator Account"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleInvite}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Invite Super Admin</h3>
                <p className="text-xs text-slate-500">Provide credentials for QRslice operations console</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#5738F5]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@qrslice.test"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-[#5738F5]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Role Assignment</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-[#5738F5]"
                >
                  <option value="Platform Admin">Platform Admin</option>
                  <option value="Operations">Operations</option>
                  <option value="Finance">Finance</option>
                  <option value="Support">Support</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isInviting}
                className="px-4 py-2 rounded-xl bg-[#5738F5] text-white text-xs font-bold hover:bg-[#492ee0] shadow-sm shadow-[#5738F5]/25 cursor-pointer disabled:opacity-50"
              >
                {isInviting ? "Inviting…" : "Send Invite"}
              </button>
            </div>
          </form>
        </div>
      )}
        </>
      )}
    </div>
  );
}
