import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../utils/AuthContext';
import { TabButton } from './Adminshared';
import UsersTab from './UserTab';
import VendorsTab from './Vendorstab';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  user: { name: string; email?: string; role: string } | null;
}

type Tab = 'users' | 'vendors' ;

export default function AdminPanel({ open, onClose, user }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const { token, loading } = useAuth();

  if (!open || loading || !token || !user || user.role !== 'admin') return null;

  return createPortal(
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 bg-black/40">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Admin Panel</h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Manage users, vendors, and groups</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition sm:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 border-b border-white/10 bg-black/20 flex gap-1 overflow-x-auto">
          <TabButton label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <TabButton label="Vendors" active={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} />

        </div>

        {/* Tab Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'users' && <UsersTab token={token} />}
          {activeTab === 'vendors' && <VendorsTab token={token} />}
        </div>
      </div>
    </div>,
    document.body
  );
}