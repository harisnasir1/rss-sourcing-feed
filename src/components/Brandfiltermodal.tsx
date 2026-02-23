import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BRAND_NAMES } from '../utils/Brands';

interface Props {
  selected: string;
  onChange: (brand: string) => void;
}

export default function BrandFilterModal({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return BRAND_NAMES;
    return BRAND_NAMES.filter(b => b.toLowerCase().includes(q));
  }, [search]);

  // Focus search input when modal opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    setSearch('');
  };

  const handleSelect = (brand: string) => {
    onChange(selected === brand ? '' : brand); // toggle off if same
    handleClose();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const triggerLabel = selected || 'Brand';
  const isActive = !!selected;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={`
          inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all duration-200
          ${isActive
            ? 'border-sky-500/50 bg-sky-500/10 text-sky-300'
            : 'border-white/20 bg-gradient-to-b from-white/0 to-white/5 text-gray-400 hover:text-white hover:border-white/30'
          }
        `}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        <span className="max-w-[100px] truncate">{triggerLabel}</span>
        {isActive && (
          <span
            onClick={handleClear}
            className="ml-0.5 text-sky-400 hover:text-white transition-colors cursor-pointer"
            role="button"
            aria-label="Clear brand filter"
          >
            ×
          </span>
        )}
      </button>

      {/* Modal */}
      {open && createPortal(
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            ref={backdropRef}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <div
            ref={panelRef}
            className="relative z-10 w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900 to-[#0b0b0b] shadow-2xl"
            style={{ boxShadow: '0 0 40px rgba(0,0,0,0.8), 0 0 1px rgba(255,255,255,0.1)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
              <span className="text-sm font-medium text-white">Filter by Brand</span>
              <button
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Search inside modal */}
            <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  ref={inputRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search brands..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-sky-500/30 focus:bg-white/8 transition-colors"
                />
              </div>
            </div>

            {/* Brand grid */}
            <div className="overflow-y-auto flex-1 px-3 py-3">
              {filtered.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">No brands found</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {filtered.map(brand => {
                    const isSelected = selected === brand;
                    return (
                      <button
                        key={brand}
                        onClick={() => handleSelect(brand)}
                        className={`
                          px-2 py-2 rounded-lg border text-xs text-left truncate transition-all duration-150
                          ${isSelected
                            ? 'border-sky-500/60 bg-sky-500/15 text-sky-300'
                            : 'border-white/8 bg-white/4 text-gray-400 hover:border-white/20 hover:text-white hover:bg-white/8'
                          }
                        `}
                        title={brand}
                      >
                        {brand}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {selected && (
              <div className="px-4 py-3 border-t border-white/10 flex-shrink-0 flex items-center justify-between">
                <span className="text-xs text-gray-400">Filtered: <span className="text-white">{selected}</span></span>
                <button
                  onClick={() => { onChange(''); handleClose(); }}
                  className="text-xs text-gray-400 hover:text-white transition-colors underline underline-offset-2"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}