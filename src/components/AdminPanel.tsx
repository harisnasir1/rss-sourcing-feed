// AdminPanel.tsx
// Place this file in your components folder (e.g., src/components/AdminPanel.tsx)

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  user:{ name: string; email?: string; role:String } | null
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

const mockUsers: User[] = [];


export default function AdminPanel({ open, onClose,user }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [u,setu]=useState()

  const getusers=async()=>{
    let re=await fetch("http://localhost:4000/api/users/");
       const data = await re.json().catch(() => ({}))
    console.log(data)
    setUsers(data.users)
  }

  useEffect(()=>{
    if(user&&user.role==="admin")
    {
       getusers()
    }
    else{
       
    }
  },[user])

  if (!open) return null;

  const handleToggleActive =async (userId: string,role:string,cis_active:boolean) => {
    
    if(role==="admin"){
        return;
    }
     const base='http://localhost:4000/api/users/status_update'
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify({ id:userId,is_active:!cis_active }),
      })
      const data=await res.json();
    if(!data.success) return
    setUsers(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, is_active: !cis_active} : user
      )
    );

  };

  const filteredUsers = users.filter(user =>
    user.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div>
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <p className="text-sm text-gray-400 mt-1">Manage users and permissions</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center border border-white/10 rounded hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Search and Stats Bar */}
        <div className="px-6 py-4 border-b border-white/10 bg-black/20">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                <span className="text-green-400 font-semibold">
                  {users.filter(u => u.is_active).length}
                </span>
              </div>
              <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded">
                <span className="text-gray-400">Inactive: </span>
                <span className="text-red-400 font-semibold">
                  {users.filter(u => !u.is_active).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="min-w-full">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-gradient-to-b from-gray-900 to-gray-900/95 backdrop-blur-sm z-10">
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Website
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Inventory
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No users found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      {/* User Column with Avatar */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {user.fullname.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {user.fullname}
                            </div>
                            <div className="text-xs text-gray-500">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Email Column */}
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-300">{user.email}</div>
                      </td>

                      {/* Role Column with Badge */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                            user.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-gray-700/50 text-gray-300 border border-gray-600/30'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Website Column */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs ${
                            user.have_site ? 'text-green-400' : 'text-gray-500'
                          }`}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            {user.have_site ? (
                              <path strokeWidth="2" strokeLinecap="round" d="M5 13l4 4L19 7" />
                            ) : (
                              <path strokeWidth="2" strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                            )}
                          </svg>
                          {user.have_site ? 'Yes' : 'No'}
                        </span>
                      </td>

                      {/* Inventory Column */}
                      <td className="px-4 py-4">
                        <div className="text-xs">
                          {user.have_stock ? (
                            <div>
                              <span className="text-green-400">✓ Yes</span>
                              {user.inventoryValueBand && (
                                <div className="text-gray-500 mt-1">
                                  {user.inventoryValueBand}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">No</span>
                          )}
                        </div>
                      </td>

                      {/* Joined Date Column */}
                      <td className="px-4 py-4">
                        <div className="text-xs text-gray-400">
                          {new Date(user.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>

                      {/* Status Toggle Column */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() =>
                                
                                 handleToggleActive(user.id,user.role,user.is_active)
                                }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                              user.is_active ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                            role="switch"
                            aria-checked={user.is_active}
                            aria-label={`Toggle active status for ${user.fullname}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                user.is_active ? 'translate-x-6' : 'translate-x-1'
                              }`}
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