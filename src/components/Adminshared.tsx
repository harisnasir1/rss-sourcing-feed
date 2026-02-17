import React from 'react';

// --- Debounce Hook ---
export function useDebounce(value: string, delay: number = 400) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// --- Pagination Controls ---
// Mobile: simple prev/next with page indicator
// Desktop: full page numbers
export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <>
      {/* Mobile: just prev / page x of y / next */}
      <div className="flex sm:hidden items-center gap-3">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm rounded-lg border border-white/10 text-gray-300 active:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          Prev
        </button>
        <span className="text-xs text-gray-400">{currentPage}/{totalPages}</span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm rounded-lg border border-white/10 text-gray-300 active:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          Next
        </button>
      </div>

      {/* Desktop: full page numbers */}
      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm rounded border border-white/10 text-gray-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          Prev
        </button>
        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-gray-500 text-sm">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-8 h-8 text-sm rounded transition ${
                currentPage === p
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-gray-400 hover:bg-white/5 border border-transparent'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm rounded border border-white/10 text-gray-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          Next
        </button>
      </div>
    </>
  );
}

// --- Search Input ---
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full sm:w-80 px-3 py-2 rounded-lg border border-white/20 bg-gradient-to-b from-white/5 to-white/10 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/30 transition"
    />
  );
}

// --- Toggle Switch ---
export function ToggleSwitch({
  checked,
  loading,
  disabled,
  onClick,
  activeColor = 'bg-green-500',
  inactiveColor = 'bg-gray-600',
}: {
  checked: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  activeColor?: string;
  inactiveColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        disabled ? 'bg-gray-700 cursor-not-allowed opacity-50' : loading ? 'bg-gray-500 cursor-wait' : checked ? activeColor : inactiveColor
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'} ${loading ? 'opacity-50' : ''}`} />
    </button>
  );
}

// --- Stat Badge ---
export function StatBadge({ label, value, color = 'white' }: { label: string; value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    white: 'bg-white/5 border-white/10 text-white',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };
  const c = colorMap[color] || colorMap.white;
  return (
    <div className={`px-2.5 py-1 border rounded text-xs ${c}`}>
      <span className="text-gray-400">{label}: </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}