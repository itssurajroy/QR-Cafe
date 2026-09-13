"use client";

import React, { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { format } from "date-fns";
import { SearchIcon, FilterIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/Icons";
import { Input } from "@/components/ui/Input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export function SuperAuditPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Filters
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const supabase = getSupabaseBrowserClient();

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("audit_log")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (q) query = query.ilike("action", `%${q}%`);
      if (action) query = query.eq("action", action);
      if (entity) query = query.eq("entity", entity);
      if (from) query = query.gte("created_at", from);
      if (to) query = query.lte("created_at", to);

      const { data, error, count } = await query;
      if (error) throw error;
      setAuditLogs(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, q, action, entity, from, to]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // CSV export of the currently loaded rows (quote-escape like tenantsToCsv).
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  function handleExportCsv() {
    const header = "Timestamp,Entity,Action,Cafe,Details";
    const lines = auditLogs.map((log: any) =>
      [log.created_at, esc(log.entity), esc(log.action), esc(log.entity_id), esc(JSON.stringify(log.details || {}))].join(",")
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qrslice-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const getActionBadge = (action: string) => {
    const badges: Record<string, string> = {
      create: "bg-emerald-100 text-emerald-700",
      update: "bg-indigo-100 text-indigo-700",
      delete: "bg-red-100 text-red-700",
      login: "bg-violet-100 text-violet-700",
      logout: "bg-slate-100 text-slate-700",
      suspend: "bg-amber-100 text-amber-700",
      activate: "bg-emerald-100 text-emerald-700",
      impersonate: "bg-rose-100 text-rose-700",
      export: "bg-cyan-100 text-cyan-700",
    };
    return badges[action] || "bg-slate-100 text-slate-700";
  };

  const getEntityIcon = (entity: string) => {
    const icons: Record<string, React.ReactNode> = {
      tenant: <span className="text-indigo-600">🏪</span>,
      user: <span className="text-emerald-600">👤</span>,
      order: <span className="text-amber-600">📦</span>,
      subscription: <span className="text-violet-600">💳</span>,
      menu: <span className="text-rose-600">🍽️</span>,
      table: <span className="text-cyan-600">🪑</span>,
    };
    return icons[entity] || <span className="text-slate-600">📄</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-slate-500 mt-1">Track all platform activity and changes</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{totalCount} total entries</span>
          <Button variant="outline" onClick={handleExportCsv} disabled={auditLogs.length === 0} className="h-9 text-xs font-bold">
            📥 Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search actions..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
          <Select value={action} onValueChange={(v) => { setAction(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="suspend">Suspend</SelectItem>
              <SelectItem value="activate">Activate</SelectItem>
              <SelectItem value="impersonate">Impersonate</SelectItem>
              <SelectItem value="export">Export</SelectItem>
            </SelectContent>
          </Select>
          <Select value={entity} onValueChange={(v) => { setEntity(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Entities</SelectItem>
              <SelectItem value="tenant">Tenant</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="order">Order</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
              <SelectItem value="menu">Menu</SelectItem>
              <SelectItem value="table">Table</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setCurrentPage(1); }}
            placeholder="From Date"
            className="w-full"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setCurrentPage(1); }}
            placeholder="To Date"
            className="w-full"
          />
          <Button
            variant="outline"
            onClick={() => { setQ(""); setAction(""); setEntity(""); setFrom(""); setTo(""); setCurrentPage(1); }}
            className="h-10"
          >
            <FilterIcon className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
                <th className="p-4 text-left">Time</th>
                <th className="p-4 text-left">Action</th>
                <th className="p-4 text-left">Entity</th>
                <th className="p-4 text-left">Entity ID</th>
                <th className="p-4 text-left">Actor</th>
                <th className="p-4 text-left">Details</th>
                <th className="p-4 text-left">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading...</td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No audit logs found</td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-600">
                      {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 flex items-center gap-2">
                      {getEntityIcon(log.entity)}
                      <span className="font-medium text-slate-700 capitalize">{log.entity}</span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-600">
                      {log.entity_id ? log.entity_id.slice(0, 12) + "..." : "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {log.actor_type === "super_admin" && <span className="text-amber-500">★</span>}
                        <span className="font-medium text-slate-700">{log.actor_email || "—"}</span>
                        <span className="px-1.5 py-0.5 rounded text-xs text-slate-500 bg-slate-100">
                          {log.actor_type}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <pre className="text-xs text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap">
                        {JSON.stringify(log.details || {})}
                      </pre>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">{log.ip_address || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-xs text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/super/audit?page=${currentPage - 1 >= 1 ? currentPage - 1 : 1}${q ? `&q=${q}` : ""}${action ? `&action=${action}` : ""}${entity ? `&entity=${entity}` : ""}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold"
              >
                ← Prev
              </a>
              {currentPage < totalPages && (
                <a
                  href={`/super/audit?page=${currentPage + 1}${q ? `&q=${q}` : ""}${action ? `&action=${action}` : ""}${entity ? `&entity=${entity}` : ""}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Next →
                </a>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default SuperAuditPage;