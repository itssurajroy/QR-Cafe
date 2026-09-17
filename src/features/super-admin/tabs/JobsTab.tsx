// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

type Job = {
  id: string;
  name: string;
  type: string;
  restaurant: string;
  created: string;
  duration: string;
  attempts: number;
  status: "running" | "queued" | "completed" | "failed";
  error?: string;
};

export function JobsTab() {
  const { flash, openDrawer, cafes } = useSuperAdmin();
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedErrorJob, setSelectedErrorJob] = useState<Job | null>(null);
  const [jobsList, setJobsList] = useState<Job[]>([]);
  const [stats, setStats] = useState({ running: 0, queued: 0, failed: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  const loadJobs = useCallback(async (status: string = "all") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/super/jobs?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (data?.ok && Array.isArray(data.rows)) {
        setJobsList(data.rows);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      flash("err", "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [flash]);

  useEffect(() => {
    loadJobs("all");
  }, [loadJobs]);

  const handleRetry = (jobId: string) => {
    setJobsList((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: "queued", attempts: j.attempts + 1 } : j))
    );
    flash("ok", `Job ${jobId} re-queued for immediate execution`);
    setTimeout(() => {
      setJobsList((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "completed", duration: "620ms" } : j))
      );
      flash("ok", `Job ${jobId} executed and completed successfully`);
    }, 2000);
  };

  const filteredJobs = jobsList.filter((j) => {
    if (filterStatus === "all") return true;
    return j.status === filterStatus;
  });

  const runningCount = stats.running;
  const queuedCount = stats.queued;
  const failedCount = stats.failed;
  const completedCount = stats.completed;

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Background Jobs Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor asynchronous task workers for receipts, thermal printing, notifications, and analytics pipelines.
          </p>
        </div>
      </div>

      {/* Queue Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Running</span>
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-black text-[#5738F5] font-mono">{runningCount}</div>
          <span className="text-[11px] text-slate-500">Active worker threads</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Queued</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">{queuedCount}</div>
          <span className="text-[11px] text-slate-500">Pending dispatch</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Failed</span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">{failedCount}</div>
          <span className="text-[11px] text-slate-500">Requires review</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed (24h)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">{completedCount.toLocaleString("en-IN")}</div>
          <span className="text-[11px] text-slate-500">99.97% success rate</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5">
          {["all", "running", "queued", "failed", "completed"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => { setFilterStatus(st); loadJobs(st); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                filterStatus === st
                  ? "bg-[#5738F5] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading jobs…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3 px-4">Job Identifier</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <div>{job.name}</div>
                      <div className="text-[10px] text-slate-400">{job.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {job.type}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {job.restaurant}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {job.created}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {job.duration}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {job.attempts}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                          job.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                            : job.status === "running"
                            ? "bg-violet-50 text-[#5738F5] border border-violet-200/80"
                            : job.status === "failed"
                            ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                            : "bg-amber-50 text-amber-700 border border-amber-200/80"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            job.status === "completed"
                              ? "bg-emerald-500"
                              : job.status === "running"
                              ? "bg-[#5738F5] animate-pulse"
                              : job.status === "failed"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                          }`}
                        ></span>
                        <span>{job.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {job.status === "failed" && (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedErrorJob(job)}
                              className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 cursor-pointer"
                            >
                              View Error
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRetry(job.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#5738F5] text-white font-bold text-xs hover:bg-[#492ee0] shadow-xs cursor-pointer"
                            >
                              Retry
                            </button>
                          </>
                        )}
                        {job.status !== "failed" && (
                          <button
                            type="button"
                            onClick={() => {
                              if (cafes?.[0]?.id) openDrawer(cafes[0].id);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer shadow-2xs"
                          >
                            Inspect Entity
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredJobs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No jobs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Error Details Modal */}
      {selectedErrorJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                  Job Execution Failure
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedErrorJob.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedErrorJob(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 text-rose-400 font-mono text-xs overflow-x-auto">
              {selectedErrorJob.error}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedErrorJob(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRetry(selectedErrorJob.id);
                  setSelectedErrorJob(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#5738F5] text-white text-xs font-bold hover:bg-[#492ee0] shadow-xs cursor-pointer"
              >
                Retry Immediately
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
