import React, { useEffect, useState, useCallback } from 'react';
import { SearchInput, ToggleSwitch, PaginationControls, StatBadge, useDebounce } from './Adminshared';

interface User {
  id: string;
  fullname: string;
  email: string;
  is_active: boolean;
  role: string;
  phone?: string;
  have_site: boolean;
  have_stock: boolean;
  inventoryValueBand?: string;
  created_at: string;
}

const LIMIT = 10;

export default function UsersTab({ token }: { token: string | null }) {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const debouncedSearch = useDebounce(searchQuery);
  const totalPages = Math.max(1, Math.ceil(stats.total / LIMIT));

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setIsFetching(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      const res = await fetch(`${import.meta.env.VITE_RUNPOD_URL}/api/users?${params}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.users) setUsers(data.users);
      if (data.total !== undefined) setStats({ total: data.total, active: data.active, inactive: data.inactive });
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [token, page, debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const handleToggleActive = async (userId: string, role: string, currentActive: boolean) => {
    if (role === 'admin') return;
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, is_active: !currentActive } : u)));
    setLoadingUsers(prev => new Set(prev).add(userId));
    try {
      const res = await fetch(`${import.meta.env.VITE_RUNPOD_URL}/api/users/status_update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: userId, is_active: !currentActive }),
      });
      const data = await res.json();
      if (!data.success) {
        setUsers(prev => prev.map(u => (u.id === userId ? { ...u, is_active: currentActive } : u)));
      } else {
        setStats(prev => currentActive
          ? { ...prev, active: prev.active - 1, inactive: prev.inactive + 1 }
          : { ...prev, active: prev.active + 1, inactive: prev.inactive - 1 }
        );
      }
    } catch {
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, is_active: currentActive } : u)));
    } finally {
      setLoadingUsers(prev => { const next = new Set(prev); next.delete(userId); return next; });
    }
  };

  return (
    <>
      {/* Search + Stats */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-black/20 flex-shrink-0">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search name, email, phone..." />
        <div className="flex gap-2 mt-2.5">
          <StatBadge label="Total" value={stats.total} />
          <StatBadge label="Active" value={stats.active} color="green" />
          <StatBadge label="Inactive" value={stats.inactive} color="red" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" /></div>
        ) : (
          <div className={`transition-opacity duration-150 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {/* Desktop Table */}
            <div className="hidden md:block px-6 py-4">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-gradient-to-b from-gray-900 to-gray-900/95 backdrop-blur-sm z-10">
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Website</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Inventory</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">{searchQuery ? `No users found matching "${searchQuery}"` : 'No users found'}</td></tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">{u.fullname.charAt(0).toUpperCase()}</div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-white truncate">{u.fullname}</div>
                              <div className="text-xs text-gray-500">ID: {u.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">+{u.phone}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-gray-700/50 text-gray-300 border border-gray-600/30'}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-xs">{u.have_site ? <span className="text-green-400">Yes</span> : <span className="text-gray-500">No</span>}</td>
                        <td className="px-4 py-3 text-xs">
                          {u.have_stock ? (<div><span className="text-green-400">Yes</span>{u.inventoryValueBand && <div className="text-gray-500 mt-0.5">{u.inventoryValueBand}</div>}</div>) : (<span className="text-gray-500">No</span>)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <ToggleSwitch checked={u.is_active} loading={loadingUsers.has(u.id)} disabled={u.role === 'admin'} onClick={() => handleToggleActive(u.id, u.role, u.is_active)} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards — compact */}
            <div className="md:hidden px-3 py-3 space-y-2">
              {users.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">{searchQuery ? `No results for "${searchQuery}"` : 'No users found'}</div>
              ) : (
                users.map(u => (
                  <div key={u.id} className="px-3 py-3 rounded-lg border border-white/10 bg-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">{u.fullname.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{u.fullname}</div>
                      <div className="text-xs text-gray-500 truncate">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {u.role === 'admin' && <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">admin</span>}
                      <ToggleSwitch checked={u.is_active} loading={loadingUsers.has(u.id)} disabled={u.role === 'admin'} onClick={() => handleToggleActive(u.id, u.role, u.is_active)} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-t border-white/10 bg-black/40 flex items-center justify-between flex-shrink-0">
        <div className="text-xs text-gray-400 hidden sm:block">Page {page} of {totalPages} ({stats.total} users)</div>
        <div className="sm:hidden text-xs text-gray-400">{stats.total} users</div>
        <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  );
}