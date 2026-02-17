import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../utils/AuthContext';
import UsersTab from './UserTab';
import VendorsTab from './Vendorstab';


interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  user: { name: string; email?: string; role: string } | null;
}

type Tab = 'users' | 'vendors' ;

const TABS: { key: Tab; label: string }[] = [
  { key: 'users', label: 'Users' },
  { key: 'vendors', label: 'Vendors' }
];

export default function AdminPanel({ open, onClose, user }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const { token, loading } = useAuth();

  if (!open || loading || !token || !user || user.role !== 'admin') return null;

  return createPortal(
    <div className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-6xl h-[92vh] sm:max-h-[90vh] bg-gradient-to-b from-gray-900 to-black border-t sm:border border-white/10 rounded-t-2xl sm:rounded-lg shadow-2xl flex flex-col overflow-hidden">

        {/* Header — compact on mobile */}
        <div className="px-4 sm:px-6 py-3 sm:py-5 border-b border-white/10 bg-black/40 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white">Admin Panel</h2>
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">Manage users, vendors, and groups</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs — full width on mobile, equal sizing */}
        <div className="border-b border-white/10 bg-black/20 flex flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'text-sky-400 border-sky-400 bg-white/5'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {activeTab === 'users' && <UsersTab token={token} />}
          {activeTab === 'vendors' && <VendorsTab token={token} />}
        
        </div>
      </div>
    </div>,
    document.body
  );
}