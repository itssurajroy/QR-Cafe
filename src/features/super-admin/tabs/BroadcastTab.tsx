import React, { useState } from 'react';
import { useSuperAdmin } from '../SuperAdminContext';

export function BroadcastTab() {
  const { tab } = useSuperAdmin();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [delivery, setDelivery] = useState('both');
  
  if (tab !== 'broadcast') return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-8 rounded-2xl shadow-sm">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Compose Global Announcement</h2>
        <p className="text-slate-500 dark:text-stone-400 mt-2 text-sm">Send a message to all café tenants across the platform.</p>
        
        <div className="mt-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">Subject / Headline</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Scheduled Maintenance" 
              className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">Message Content</label>
            <textarea 
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your announcement here..." 
              className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">Message Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm focus:outline-none"
              >
                <option value="info">Information (Blue)</option>
                <option value="success">Feature Release (Green)</option>
                <option value="warning">Warning / Alert (Yellow)</option>
                <option value="danger">Critical (Red)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">Delivery Method</label>
              <select 
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm focus:outline-none"
              >
                <option value="banner">In-App Banner Only</option>
                <option value="email">Email Broadcast Only</option>
                <option value="both">Both Banner & Email</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-stone-800/50">
            <button className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Save Draft
            </button>
            <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2">
              <span>Send Broadcast</span>
              <span>🚀</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Preview Section */}
      {subject && (
        <div className="bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm border-dashed">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Banner Preview</h3>
          <div className={`p-4 rounded-xl border flex gap-3 ${
            type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-200' :
            type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-200' :
            type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-200' :
            'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-200'
          }`}>
            <div className="text-lg mt-0.5">
              {type === 'info' ? 'ℹ️' : type === 'success' ? '✨' : type === 'warning' ? '⚠️' : '🚨'}
            </div>
            <div>
              <div className="font-bold text-sm">{subject}</div>
              <div className="text-sm opacity-80 mt-1 whitespace-pre-wrap">{message}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
