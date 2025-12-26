import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../utils/AuthContext';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  user: { name: string; email?: string; role: string } | null;
}

interface User {
  id: string;
  fullname: string;
  email: string;
  is_active: boolean;
  role: string;
  have_site: boolean;
  have_stock: boolean;
  inventoryValueBand?: string;
  created_at: string;
}

export default function AdminPanel({ open, onClose, user }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const { token, loading } = useAuth();

  const getUsers = async () => {
    if (!token || !user || user.role !== 'admin') return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_RUNPOD_URL}/api/users`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (loading || !token || !user || user.role !== 'admin' || !open) return;
    getUsers();
  }, [token, user, loading, open]);

  const handleToggleActive = async (userId: string, role: string, currentActive: boolean) => {
    if (role === 'admin') return;

    // Optimistic update
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, is_active: !currentActive } : u))
    );
    setLoadingUsers(prev => new Set(prev).add(userId));

    try {
      const res = await fetch(`/api/users/status_update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: userId, is_active: !currentActive }),
      });
      const data = await res.json();

      if (!data.success) {
        // Rollback
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, is_active: currentActive } : u))
        );
      }
    } catch {
      // Rollback
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, is_active: currentActive } : u))
      );
    } finally {
      setLoadingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const filteredUsers = useMemo(
    () =>
      users.filter(
        u =>
          u.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [users, searchQuery]
  );

  const { activeCount, inactiveCount } = useMemo(() => {
    const active = users.filter(u => u.is_active).length;
    return { activeCount: active, inactiveCount: users.length - active };
  }, [users]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-6xl max-h-[90vh] bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div>
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <p className="text-sm text-gray-400 mt-1">Manage users and permissions</p>
          </div>
        </div>

        {/* Search and Stats Bar */}
        <div className="px-6 py-4 border-b border-white/10 bg-black/20">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full sm:w-96 px-4 py-2 rounded-lg border border-white/20 bg-gradient-to-b from-white/5 to-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/30 transition"
            />
            <div className="flex gap-4 text-sm flex-wrap">
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded">
                <span className="text-gray-400">Total Users: </span>
                <span className="text-white font-semibold">{users.length}</span>
              </div>
              <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded">
                <span className="text-gray-400">Active: </span>
                <span className="text-green-400 font-semibold">{activeCount}</span>
              </div>
              <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded">
                <span className="text-gray-400">Inactive: </span>
                <span className="text-red-400 font-semibold">{inactiveCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="min-w-full">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-gradient-to-b from-gray-900 to-gray-900/95 backdrop-blur-sm z-10">
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Website</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Inventory</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        {searchQuery ? `No users found matching "${searchQuery}"` : 'No users found'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                              {u.fullname.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{u.fullname}</div>
                              <div className="text-xs text-gray-500">ID: {u.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-300">{u.email}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                              u.role === 'admin'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-gray-700/50 text-gray-300 border border-gray-600/30'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs ${u.have_site ? 'text-green-400' : 'text-gray-500'}`}>
                            {u.have_site ? '✓ Yes' : '✗ No'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs">
                            {u.have_stock ? (
                              <div>
                                <span className="text-green-400">✓ Yes</span>
                                {u.inventoryValueBand && <div className="text-gray-500 mt-1">{u.inventoryValueBand}</div>}
                              </div>
                            ) : (
                              <span className="text-gray-500">No</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs text-gray-400">
                            {new Date(u.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleToggleActive(u.id, u.role, u.is_active)}
                              disabled={loadingUsers.has(u.id) || u.role === 'admin'}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                                u.role === 'admin'
                                  ? 'bg-gray-700 cursor-not-allowed opacity-50'
                                  : loadingUsers.has(u.id)
                                  ? 'bg-gray-500 cursor-wait'
                                  : u.is_active
                                  ? 'bg-green-500'
                                  : 'bg-gray-600'
                              }`}
                              role="switch"
                              aria-checked={u.is_active}
                              aria-label={`Toggle active status for ${u.fullname}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  u.is_active ? 'translate-x-6' : 'translate-x-1'
                                } ${loadingUsers.has(u.id) ? 'opacity-50' : ''}`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {filteredUsers.length} of {users.length} users
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}