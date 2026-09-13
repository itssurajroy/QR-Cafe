// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState, useEffect, useCallback } from "react";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyalty_points?: number;
  loyaltyPoints?: number;
  total_orders?: number;
  totalOrders?: number;
  total_spent?: number;
  totalSpent?: number;
  last_visit?: string;
  lastVisit?: string;
  tags?: string[];
}

interface CustomerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer | null) => void;
  selectedCustomer: Customer | null;
  onCreateCustomer?: (customer: Omit<Customer, "id">) => void;
}

export function CustomerPicker({
  isOpen,
  onClose,
  onSelect,
  selectedCustomer,
  onCreateCustomer,
}: CustomerPickerProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCustomers = useCallback(async (query = "") => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/pos/customers?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      } else {
        setCustomers([]);
      }
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCustomers(search);
    }
  }, [isOpen, search, fetchCustomers]);

  if (!isOpen) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/pos/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim(),
          email: newEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.customer) {
        const createdCust: Customer = data.customer;
        onSelect(createdCust);
        if (onCreateCustomer) {
          onCreateCustomer(createdCust);
        }
        setNewName("");
        setNewPhone("");
        setNewEmail("");
        setShowCreateForm(false);
        onClose();
      } else {
        setErrorMsg(data.error || "Failed to create customer");
      }
    } catch {
      setErrorMsg("Network error creating customer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-900">Select Customer</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setSearch("");
                setErrorMsg(null);
              }}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-500 cursor-pointer"
            >
              {showCreateForm ? "← Back" : "+ New Customer"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 text-xs font-bold border-b border-red-100 text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        {showCreateForm ? (
          <form onSubmit={handleCreateSubmit} className="p-4 space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Name *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Customer name"
                required
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Phone *</label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="9876543210"
                required
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="customer@email.com"
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving..." : "Create & Select"}
              </button>
            </div>
          </form>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="p-3 border-b border-slate-200">
              <input
                type="text"
                placeholder="🔍 Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="divide-y divide-slate-100">
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  onClose();
                }}
                className={`w-full p-3 text-left flex items-center gap-3 cursor-pointer ${
                  !selectedCustomer
                    ? "bg-indigo-50 border-l-4 border-indigo-600"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  👤
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-sm">Walk-in Guest</p>
                  <p className="text-xs text-slate-500">No customer selected</p>
                </div>
                {!selectedCustomer && (
                  <span className="text-xs text-indigo-600 font-bold">✓ Selected</span>
                )}
              </button>

              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Syncing real-time customers...
                </div>
              ) : (
                customers.map((cust) => {
                  const pts = cust.loyalty_points ?? cust.loyaltyPoints ?? 0;
                  const ordersCount = cust.total_orders ?? cust.totalOrders ?? 0;
                  const spent = cust.total_spent ?? cust.totalSpent ?? 0;
                  return (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => {
                        onSelect(cust);
                        onClose();
                      }}
                      className={`w-full p-3 text-left flex items-center gap-3 cursor-pointer ${
                        selectedCustomer?.id === cust.id
                          ? "bg-indigo-50 border-l-4 border-indigo-600"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 text-sm truncate">{cust.name}</p>
                          {cust.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-medium rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 font-mono">{cust.phone}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span>🏆 {pts} pts</span>
                          <span>📦 {ordersCount} orders</span>
                          <span>💰 ₹{(spent / 100).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      {selectedCustomer?.id === cust.id && (
                        <span className="text-xs text-indigo-600 font-bold">✓ Selected</span>
                      )}
                    </button>
                  );
                })
              )}

              {!loading && customers.length === 0 && (
                <div className="p-6 text-center text-slate-500">
                  <p className="font-medium text-xs">No customers found</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {search ? `No matches for "${search}"` : "Click '+ New Customer' above to add one."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
