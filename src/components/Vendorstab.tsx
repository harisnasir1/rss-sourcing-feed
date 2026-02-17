import React, { useEffect, useState, useCallback } from 'react';
import { SearchInput, ToggleSwitch, PaginationControls, StatBadge, useDebounce } from './Adminshared';

interface Vendor {
  id: string;
  phonenumber: string;
  displayname: string;
  totallistings: number;
  avgrating: number;
  totalratings: number;
  isblocked: boolean;
  lastmessageat: string;
  createdat: string;
  updatedat: string;
}

const LIMIT = 10;

export default function VendorsTab({ token }: { token: string | null }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0 });
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [blockingVendors, setBlockingVendors] = useState<Set<string>>(new Set());

  const debouncedSearch = useDebounce(searchQuery);
  const totalPages = Math.max(1, Math.ceil(stats.total / LIMIT));

  const fetchVendors = useCallback(async () => {
    if (!token) return;
    setIsFetching(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      const res = await fetch(`${import.meta.env.VITE_RUNPOD_URL}/api/vendors/getallvendors?${params}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) setVendors(data.data);
      if (data.total !== undefined) setStats({ total: data.total, active: data.active, blocked: data.blocked });
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [token, page, debouncedSearch]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const handleToggleBlock = async (vendorId: string, currentBlocked: boolean) => {
    setVendors(prev => prev.map(v => (v.id === vendorId ? { ...v, isblocked: !currentBlocked } : v)));
    setBlockingVendors(prev => new Set(prev).add(vendorId));
    try {
      const res = await fetch(`${import.meta.env.VITE_RUNPOD_URL}/api/vendors/toogleaccess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: vendorId, blocked: !currentBlocked }),
      });
      const data = await res.json();
      if (!data.success) {
        setVendors(prev => prev.map(v => (v.id === vendorId ? { ...v, isblocked: currentBlocked } : v)));
      } else {
        setStats(prev => currentBlocked
          ? { ...prev, active: prev.active + 1, blocked: prev.blocked - 1 }
          : { ...prev, active: prev.active - 1, blocked: prev.blocked + 1 }
        );
      }
    } catch {
      setVendors(prev => prev.map(v => (v.id === vendorId ? { ...v, isblocked: currentBlocked } : v)));
    } finally {
      setBlockingVendors(prev => { const next = new Set(prev); next.delete(vendorId); return next; });
    }
  };

  return (
    <>
      {/* Search + Stats */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-black/20 flex-shrink-0">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search name or phone..." />
        <div className="flex gap-2 mt-2.5">
          <StatBadge label="Vendors" value={stats.total} />
          <StatBadge label="Active" value={stats.active} color="green" />
          <StatBadge label="Blocked" value={stats.blocked} color="red" />
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Listings</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Active</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Blocked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vendors.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">{searchQuery ? `No vendors found matching "${searchQuery}"` : 'No vendors found'}</td></tr>
                  ) : (
                    vendors.map(v => (
                      <tr key={v.id} className={`hover:bg-white/5 transition-colors ${v.isblocked ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">{v.displayname.charAt(0).toUpperCase()}</div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-white truncate">{v.displayname}</div>
                              <div className="text-xs text-gray-500">ID: {v.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">+{v.phonenumber}</td>
                        <td className="px-4 py-3"><span className="text-sm font-semibold text-sky-400">{v.totallistings}</span></td>
                        <td className="px-4 py-3 text-sm text-gray-300">{v.avgrating > 0 ? `${v.avgrating} (${v.totalratings})` : <span className="text-gray-500">N/A</span>}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{v.lastmessageat ? new Date(v.lastmessageat).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(v.createdat).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <ToggleSwitch checked={!v.isblocked} loading={blockingVendors.has(v.id)} onClick={() => handleToggleBlock(v.id, v.isblocked)} activeColor="bg-green-500" inactiveColor="bg-red-500" />
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
              {vendors.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">{searchQuery ? `No results for "${searchQuery}"` : 'No vendors found'}</div>
              ) : (
                vendors.map(v => (
                  <div key={v.id} className={`px-3 py-3 rounded-lg border border-white/10 bg-white/5 flex items-center gap-3 ${v.isblocked ? 'opacity-60' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">{v.displayname.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{v.displayname}</div>
                      <div className="text-xs text-gray-500">{v.totallistings} listings</div>
                    </div>
                    <ToggleSwitch checked={!v.isblocked} loading={blockingVendors.has(v.id)} onClick={() => handleToggleBlock(v.id, v.isblocked)} activeColor="bg-green-500" inactiveColor="bg-red-500" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-t border-white/10 bg-black/40 flex items-center justify-between flex-shrink-0">
        <div className="text-xs text-gray-400 hidden sm:block">Page {page} of {totalPages} ({stats.total} vendors)</div>
        <div className="sm:hidden text-xs text-gray-400">{stats.total} vendors</div>
        <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  );
}