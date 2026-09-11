import React, { useState, useEffect } from 'react';

export function StaffTab({ restaurantId }: { restaurantId: string }) {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function loadStaff() {
    if (!restaurantId) return;
    try {
      const res = await fetch(`/api/super/staff`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data.filter((s: any) => s.restaurant_id === restaurantId));
      }
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, [restaurantId]);

  const filteredStaff = staff.filter((s: any) => {
    const q = searchQuery.toLowerCase();
    return s.display_name?.toLowerCase().includes(q) || false;
  });

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add staff');
      }

      setSuccessMsg('Staff member added successfully!');
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('staff');
      loadStaff();
      
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg('');
      }, 2000);

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Team & Staff</h2>
          <p className="text-sm text-slate-500 dark:text-stone-400 mt-1">Manage users who have access to this café.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
        >
          <span>➕</span> Add Team Member
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-4 rounded-2xl shadow-sm">
        <div className="flex-1 w-full sm:w-auto flex items-center gap-2 bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search team members by name..."
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-stone-500">
                    Loading team members...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-stone-500">
                    No team members found.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {user.display_name || 'Unnamed User'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        user.role === 'owner' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' :
                        user.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' :
                        'bg-slate-100 text-slate-600 dark:bg-stone-800 dark:text-stone-300'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700 dark:text-stone-300">
                        {user.restaurant_name}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-stone-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-stone-800 flex items-center justify-between bg-slate-50 dark:bg-stone-950">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">Add Team Member</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-stone-300 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              {errorMsg && <div className="p-3 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold rounded-lg border border-red-200 dark:border-red-900/50">{errorMsg}</div>}
              {successMsg && <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-900/50">{successMsg}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">Full Name</label>
                <input 
                  required
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">Email Address</label>
                <input 
                  required
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">Temporary Password</label>
                <input 
                  required
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Minimum 6 characters. They can change this later.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">Role</label>
                <select 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="staff">Staff (Limited Access)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
                >
                  {isSubmitting ? 'Adding...' : 'Add Team Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
