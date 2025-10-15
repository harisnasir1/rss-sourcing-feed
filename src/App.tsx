import React, { useEffect, useMemo, useRef, useState } from 'react';
import FeedCard from './components/FeedCard';
import AnimatedList from './components/AnimatedList';
import ErrorBanner from './components/ErrorBanner';
import AnimatedHeight from './components/AnimatedHeight';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import { normalizeItem, Item as NormalizedItem } from './utils/normalizeItem';
import { within72Hours } from './utils/time';

type Item = NormalizedItem;

export default function App() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Auto-refresh is always enabled; UI toggle removed
  

  const [loggedIn, setLoggedIn] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('user');
      return !!raw;
    } catch {
      return false;
    }
  });

  const [user, setUser] = useState<{ name: string; email?: string } | null>(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const pollingMs = Number(import.meta.env.VITE_REFRESH_MS || 10000);
  const fetchAbort = useRef<AbortController | null>(null);

  // --- Helpers to normalize API payloads ---
  const looksLikeItem = (obj: any) => {
    if (!obj || typeof obj !== 'object') return false;
    const keys = Object.keys(obj);
    return (
      keys.includes('id') ||
      keys.includes('title') ||
      keys.includes('price') ||
      keys.includes('image') ||
      keys.includes('whatsapp')
    );
  };

  const findItemsArray = (val: any, depth = 3): any[] | null => {
    if (depth < 0 || val == null) return null;
    if (Array.isArray(val)) {
      if (val.length > 0 && val.every((el) => typeof el === 'object' && looksLikeItem(el))) return val;
      for (const el of val) {
        const found = findItemsArray(el, depth - 1);
        if (found) return found;
      }
      return null;
    }
    if (typeof val === 'object') {
      if (Array.isArray(val.items) && val.items.every((el: any) => typeof el === 'object')) return val.items;
      if (val.data && Array.isArray(val.data.items)) return val.data.items;
      if (Array.isArray(val.results)) return val.results;
      for (const k of Object.keys(val)) {
        try {
          const found = findItemsArray(val[k], depth - 1);
          if (found) return found;
        } catch {
          // ignore
        }
      }
    }
    return null;
  };

  const normalizeAndSet = (payload: any) => {
    if (!payload) return false;
    if (Array.isArray(payload) && payload.length > 0 && payload.every((el) => typeof el === 'object')) {
      setItems(payload);
      return true;
    }
    const found = findItemsArray(payload, 4);
    if (found && Array.isArray(found)) {
      setItems(found);
      return true;
    }
    console.debug('[feed] normalizeAndSet could not find items array. payload:', payload);
    return false;
  };

  // --- API Configuration ---
  const configuredRunpodUrl =
    (import.meta.env.VITE_RUNPOD_URL as string) ||
    'https://rmizhq2lxoty3l-4000.proxy.runpod.net/api/product/getlisting';
  const runpodKey = (import.meta.env.VITE_RUNPOD_KEY as string) || '';

  // --- Fetch data ---
  const fetchItems = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      // Abort any in-flight request before starting a new one
      try { fetchAbort.current?.abort(); } catch {}
      fetchAbort.current = new AbortController();

      const headers: Record<string, string> = {};
      if (runpodKey) {
        headers['Authorization'] = `Bearer ${runpodKey}`;
        headers['x-api-key'] = runpodKey;
      }

  // Always fetch full dataset; search input filters locally (type-to-filter)
  const base = import.meta.env.DEV ? '/api/product/getlisting' : configuredRunpodUrl.replace(/\?.*$/, '');
    const fetchUrl = base;

      console.debug('[feed] fetching', fetchUrl, { dev: import.meta.env.DEV });

      const res = await fetch(fetchUrl, { headers, signal: fetchAbort.current.signal });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        setError(`Fetch failed: ${res.status} ${text}`);
        return;
      }

      // Prefer JSON; fall back to text->JSON attempt
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        try {
          const txt = await res.text();
          payload = JSON.parse(txt);
        } catch {
          payload = null;
        }
      }

      if (payload) {
        // Try to resolve an array of items from common API shapes
        let arr: any[] = [];
        if (Array.isArray(payload)) arr = payload;
        else if (Array.isArray(payload?.data?.data)) arr = payload.data.data;
        else if (Array.isArray(payload?.data)) arr = payload.data;
        else if (Array.isArray(payload?.results)) arr = payload.results;
        else {
          const found = findItemsArray(payload, 4);
          if (Array.isArray(found)) arr = found;
        }

        if (Array.isArray(arr)) {
          if (arr.length === 0) {
            // Empty is a valid response — just show "No results" state
            setItems([]);
            return;
          }
          const normalized = arr.map((it: any) => normalizeItem(it));
          const filtered = normalized.filter((it: any) => within72Hours(it.createdAt));
          setItems(filtered);
        }
      }
    } catch (e: any) {
      const isAbort = e?.name === 'AbortError' || e?.message?.toLowerCase?.().includes('abort');
      if (isAbort) {
        // Swallow expected aborts from in-flight request cancellation or unmount
        return;
      }
      console.error('[feed] fetchItems error', e);
      const msg = e?.message || String(e);
      setError(`Network error: ${msg}`);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // Abort any in-flight fetch on unmount
    return () => {
      try { fetchAbort.current?.abort(); } catch {}
    };
  }, []);

  // Polling: keep the list in sync with the server periodically
  useEffect(() => {
    if (!pollingMs || pollingMs < 1000) return; // sanity guard
    const id = setInterval(() => {
      // Avoid background refresh if tab not visible
      if (document.visibilityState === 'visible') {
        fetchItems(true);
      }
    }, pollingMs);
    return () => clearInterval(id);
  }, [pollingMs]);

  

  useEffect(() => {
    const sseUrl = (import.meta.env.VITE_RUNPOD_SSE as string) || '';
    if (!sseUrl) return;

    let es: EventSource | null = null;
    try {
      es = new EventSource(sseUrl);
    } catch (err) {
      console.error('[feed] failed to create EventSource', err);
      return;
    }

    const onMsg = (ev: MessageEvent) => {
      try {
        const raw = JSON.parse(ev.data);
        const candidate = normalizeItem(raw);
        if (!within72Hours(candidate.createdAt)) return;
        setItems((prev) => {
          if (prev.some((p) => p.id === candidate.id)) return prev;
          return [candidate, ...prev];
        });
      } catch (e) {
        console.warn('[feed] failed to parse SSE event', e);
      }
    };

    es.addEventListener('message', onMsg);
    es.addEventListener('error', (e) => console.error('[feed] SSE error', e));
    return () => {
      es?.close();
    };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    const textOf = (it: Item) => {
      const parts: string[] = [];
      if (it.name) parts.push(String(it.name));
      const brandCandidates: any[] = [
        it.meta && (it.meta as any).brand,
        it.meta && (it.meta as any).make,
        it.raw && (it.raw as any).brand,
        it.raw && (it.raw as any).make,
      ];
      for (const b of brandCandidates) {
        if (!b) continue;
        if (Array.isArray(b)) parts.push(b.join(' '));
        else if (typeof b === 'string') parts.push(b);
      }
      return parts.join(' ').toLowerCase();
    };
    return items.filter((it) => textOf(it).includes(q));
  }, [query, items]);

  // Removed dynamic pills; search filters locally as you type

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-gray-900 to-gray-800 text-gray-100 noise-bg">
      <nav className="w-full">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center">
            <img src="/assets/rrs_logo_light.svg" alt="RRS" className="w-[70px] h-auto object-contain" />
          </div>

          <div className="flex items-center gap-3">
            {!loggedIn ? (
              <div className="hidden md:flex gap-2">
                <button className="px-3 py-2 bg-transparent border border-gray-700 rounded" onClick={() => setLoginOpen(true)}>
                  Log in
                </button>
                <button className="px-3 py-2 btn-blue" onClick={() => setSignupOpen(true)}>
                  Sign up
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-300">{user?.name}</div>
                <button
                  className="px-3 py-2 bg-red-600 rounded"
                  onClick={() => {
                    setLoggedIn(false);
                    setUser(null);
                    try {
                      localStorage.removeItem('user');
                    } catch {}
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <header className="w-full grid-top-bg">
        <div className="max-w-6xl mx-auto pt-[80px] text-center px-4 relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-4xl font-normal mb-5">AI WhatsApp Sourcing Feed</h1>
            <p className="text-gray-400 max-w-xl">
              Our AI removes the need of searching through whatsapp trade groups. Search any item that’s been listed in the
              last 72 hours from ANY group chat. To contact a buyer or seller, click on the ‘Message on Whatsapp’ button.
            </p>

            <div className="mt-6 w-full flex justify-center">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search names and brands"
                className="w-full max-w-md px-4 py-2 rounded-xl border border-white/20 bg-gradient-to-b from-white/0 to-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500/10 focus:shadow-[0_0_10px_rgba(14,165,233,0.3)] transition duration-200"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-300">
              <button
                className="px-3 py-1 border border-gray-700 rounded text-xs hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => fetchItems()}
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refetch'}
              </button>
            </div>

            {/* Quick filter pills removed; search bar now filters locally as you type */}
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <section>
            <ErrorBanner message={error || undefined} />
            <AnimatedHeight>
              {loading ? (
                <div className="p-8 text-center text-gray-400">Loading...</div>
              ) : visible.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No results for "{query}"</div>
              ) : (
                <AnimatedList
                  items={visible}
                  className="space-y-3"
                  renderItem={(item) => (
                    <FeedCard
                      key={item.id}
                      item={item}
                      loggedIn={loggedIn}
                      onRequireAuth={() => setSignupOpen(true)}
                    />
                  )}
                />
              )}
            </AnimatedHeight>
          </section>

          <section className="mt-12 text-center cta-wrapper">
            <div className="mx-auto cta-card">
              <h2 className="font-normal">Start Syncing Smarter Today</h2>
              <p className="mt-2 text-gray-400">
                Discover how ResellerSync streamlines supplier onboarding, product syncing, and payouts — all in one platform.
                Risk-free demo, zero commitment.
              </p>
              <button className="px-6 py-4 btn-blue">Book Your Free Demo</button>
            </div>
          </section>
        </div>
      </main>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={(u) => {
          setLoggedIn(true);
          setUser(u);
          try {
            localStorage.setItem('user', JSON.stringify(u));
          } catch {}
          setLoginOpen(false);
        }}
        onSwitch={() => {
          // animate out then open signup
          setLoginOpen(false);
          setTimeout(() => setSignupOpen(true), 220);
        }}
      />

      <SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSignup={(u) => {
          setLoggedIn(true);
          setUser(u);
          try {
            localStorage.setItem('user', JSON.stringify(u));
          } catch {}
          setSignupOpen(false);
        }}
        onSwitch={() => {
          setSignupOpen(false);
          setTimeout(() => setLoginOpen(true), 220);
        }}
      />

      <footer className="mt-20 py-12 text-center text-gray-400">
        <div className="max-w-6xl mx-auto">
          <img src="/assets/rrs_logo_light.svg" alt="RRS" className="mx-auto w-[70px] mb-4" />
          <div className="flex justify-center gap-6 text-sm mb-3">
            <a className="hover:text-white">Link</a>
            <a className="hover:text-white">Link</a>
            <a className="hover:text-white">Link</a>
            <a className="hover:text-white">Link</a>
          </div>
          <div className="text-xs text-gray-500">See how ResellerSync powers your white-label consignment model risk-free.</div>
        </div>
      </footer>
    </div>
  );
}
