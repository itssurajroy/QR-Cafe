// Copyright (c) 2026 QRslice. All rights reserved.
import React, { useState } from 'react';
import { useSuperAdmin } from '../SuperAdminContext';

export function StaffTab() {
  const { staff, tab } = useSuperAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  
  if (tab !== 'staff') return null;

  const filteredStaff = staff.filter((s: any) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = s.display_name?.toLowerCase().includes(q) || false;
    const cafeMatch = s.restaurant_name?.toLowerCase().includes(q) || false;
    return nameMatch || cafeMatch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-4 rounded-2xl shadow-sm">
        <div className="flex-1 w-full sm:w-auto flex items-center gap-2 bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by user name or assigned café..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-slate-900 dark:text-white placeholder-stone-400 focus:outline-none flex-1"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950/50 text-slate-500 dark:text-stone-400 uppercase tracking-wider text-[10px]">
                <th className="p-4 font-bold">Name</th>
                <th className="p-4 font-bold">Role</th>
                <th className="p-4 font-bold">Assigned Café</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-stone-800/60">
              {filteredStaff.map((user: any) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {user.display_name || 'Unnamed User'}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      user.role === 'super_admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' :
                      user.role === 'owner' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' :
                      'bg-slate-100 text-slate-600 dark:bg-stone-800 dark:text-stone-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-700 dark:text-stone-300">
                      {user.restaurant_name || <span className="text-slate-400 italic">Unassigned</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-stone-600'}`}></div>
                      <span className={user.active ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-500 dark:text-stone-400'}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-500 dark:text-stone-400 font-mono text-[10px]">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-stone-500">
                    No staff members found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

