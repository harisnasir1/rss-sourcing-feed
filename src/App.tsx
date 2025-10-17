import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CookieBanner, { openCookieManager } from './components/CookieBanner';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import FeedCard from './components/FeedCard';
import AnimatedList from './components/AnimatedList';
import ErrorBanner from './components/ErrorBanner';
import AnimatedHeight from './components/AnimatedHeight';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import { normalizeItem, Item as NormalizedItem } from './utils/normalizeItem';
import { within72Hours } from './utils/time';
// favorites/status storage removed

type Item = NormalizedItem;

export default function App() {
  const location = useLocation();
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

  const [user, setUser] = useState<{ name: string; email?: string; hasWebsite?: boolean; hasInventory?: boolean; inventoryValueBand?: string } | null>(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileBackdropRef = useRef<HTMLDivElement | null>(null);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);
  // favorites/status features removed

  // Animate mobile menu open/close
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(mobileBackdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: 'power2.out' })
      gsap.fromTo(mobilePanelRef.current, { y: 16, opacity: 0, filter: 'blur(8px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.32, ease: 'power3.out' })
    })
    // lock body scroll
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { ctx.revert(); document.body.style.overflow = prevOverflow }
  }, [mobileMenuOpen])

  const closeMobileMenu = () => {
    try {
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
      tl.to(mobilePanelRef.current, { y: -12, opacity: 0, filter: 'blur(6px)', duration: 0.2 })
      tl.to(mobileBackdropRef.current, { opacity: 0, duration: 0.18 }, '<')
      tl.eventCallback('onComplete', () => setMobileMenuOpen(false))
    } catch {
      setMobileMenuOpen(false)
    }
  }
  const pollingMs = Number(import.meta.env.VITE_REFRESH_MS || 10000);
  const fetchAbort = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const didInitialFetchRef = useRef(false);

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
      try { localStorage.setItem('feed_cache', JSON.stringify(payload)); } catch {}
      return true;
    }
    const found = findItemsArray(payload, 4);
    if (found && Array.isArray(found)) {
      setItems(found);
      try { localStorage.setItem('feed_cache', JSON.stringify(found)); } catch {}
      return true;
    }
    console.debug('[feed] normalizeAndSet could not find items array. payload:', payload);
    return false;
  };

  // favorites/status features removed

  // --- API Configuration ---
  const configuredRunpodUrl =
    (import.meta.env.VITE_RUNPOD_URL as string) ||
    'https://rmizhq2lxoty3l-4000.proxy.runpod.net/api/product/getlisting';
  const runpodKey = (import.meta.env.VITE_RUNPOD_KEY as string) || '';

  // --- Fetch data ---
  const fetchItems = async (silent = false) => {
    if (inFlightRef.current) return; // prevent overlapping calls
    inFlightRef.current = true;
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

  // Always fetch full dataset; search input filters locally.
  // Preserve any default query from VITE_RUNPOD_URL (e.g., ?search=Nike) in dev and prod.
  let qs = '';
  try { const u = new URL(configuredRunpodUrl); qs = u.search || ''; } catch {}
  const base = import.meta.env.DEV ? `/api/product/getlisting${qs}` : configuredRunpodUrl;
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
          try { localStorage.setItem('feed_cache', JSON.stringify(filtered)); } catch {}
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
      inFlightRef.current = false;
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    // Hydrate from cache first for instant paint
    try {
      const raw = localStorage.getItem('feed_cache');
      if (raw) {
        const cached: Item[] = JSON.parse(raw);
        const filtered = Array.isArray(cached) ? cached.filter((it: any) => within72Hours(it.createdAt)) : [];
        if (filtered.length) setItems(filtered);
      }
    } catch {}
    
    // React 18 StrictMode double-invokes effects in dev; guard to run only once per mount
    if (didInitialFetchRef.current) return;
    didInitialFetchRef.current = true;
    fetchItems();
    // Do not abort here — StrictMode's immediate cleanup would cancel the first fetch.
    // The in-flight guard protects against overlaps; the browser will cancel on real unmounts.
    return () => { /* no-op cleanup to avoid aborting initial fetch in StrictMode */ };
  }, []);

  // Polling disabled — updates come in via SSE only (or manual Refetch)
  useEffect(() => { return; }, [pollingMs]);

  

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
          const next = [candidate, ...prev];
          try { localStorage.setItem('feed_cache', JSON.stringify(next)); } catch {}
          return next;
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

  // Brand pills removed; use only search-filtered items
  const brandFiltered = visible;

  // filtering for favorites removed

  // --- Infinite scroll ---
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  // Reset visible items when filters/search change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setLoadingMore(false);
    try { listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
  }, [query]);

  const pagedItems = useMemo(() => brandFiltered.slice(0, visibleCount), [brandFiltered, visibleCount]);

  const tryLoadMore = () => {
    if (loadingMoreRef.current) return false;
    if (visibleCount >= brandFiltered.length) return false;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((n) => Math.min(n + PAGE_SIZE, brandFiltered.length));
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }, 200);
    return true;
  };

  // IntersectionObserver to trigger load more
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      tryLoadMore();
    }, { root: null, rootMargin: '800px 0px 0px 0px', threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [brandFiltered.length, visibleCount]);

  // Fallback: load more when user scrolls near bottom (in case IO fails)
  useEffect(() => {
    const onScroll = () => {
      if (loadingMoreRef.current) return;
      if (visibleCount >= brandFiltered.length) return;
      const scrollPos = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (docHeight - scrollPos < 600) {
        tryLoadMore();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [brandFiltered.length, visibleCount]);

  // Removed auto-fill: show only PAGE_SIZE initially; user scrolls/clicks to load the next PAGE_SIZE.

  // Removed dynamic pills; search filters locally as you type

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-gray-900 to-gray-800 text-gray-100 noise-bg">
      <CookieBanner />
  <nav className="w-full border-b border-white/10 bg-transparent">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center">
            <Link to="/" aria-label="Home">
              <img src="/assets/rrs_logo_light.svg" alt="RRS" className="w-[70px] h-auto object-contain" />
            </Link>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            {!loggedIn ? (
              <div className="flex gap-2">
                <button className="px-3 py-2 bg-transparent border border-gray-700" onClick={() => setLoginOpen(true)}>
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

          {/* Mobile menu toggle */}
          <button className="md:hidden inline-flex items-center justify-center w-10 h-10 border border-white/10" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>

        {/* Mobile menu overlay (full-screen via portal) */}
        {mobileMenuOpen && createPortal(
          <div className="fixed inset-0 z-[1000] md:hidden">
            <div ref={mobileBackdropRef} className="absolute inset-0 modal-backdrop bg-black/40" onClick={() => closeMobileMenu()} />
            <div
              ref={mobilePanelRef}
              className="absolute inset-0 h-full w-full flex flex-col bg-gradient-to-b from-[#070606] to-[#0F0F0F] text-gray-100"
            >
              <div className="px-4 py-4 flex items-center justify-between border-b border-white/10">
                <Link to="/" aria-label="Home" onClick={() => closeMobileMenu()}>
                  <img src="/assets/rrs_logo_light.svg" alt="RRS" className="w-[70px] h-auto object-contain" />
                </Link>
                <button className="inline-flex items-center justify-center w-10 h-10 border border-white/10" onClick={() => closeMobileMenu()} aria-label="Close menu">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </div>
              <div className="px-4 py-6 flex flex-col gap-3">
                {!loggedIn ? (
                  <>
                    <button className="px-4 py-3 bg-transparent border border-gray-700 text-left" onClick={() => { setLoginOpen(true); closeMobileMenu(); }}>
                      Log in
                    </button>
                    <button className="px-4 py-3 btn-blue text-left" onClick={() => { setSignupOpen(true); closeMobileMenu(); }}>
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-300">{user?.name}</div>
                    <button
                      className="px-4 py-3 bg-red-600 text-left"
                      onClick={() => {
                        setLoggedIn(false);
                        setUser(null);
                        try { localStorage.removeItem('user'); } catch {}
                        closeMobileMenu();
                      }}
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </nav>

      {location.pathname === '/' && (
      <header className="w-full grid-top-bg">
        <div className="max-w-6xl mx-auto pt-[80px] text-center px-4 relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="hero-title title-gradient mb-5">AI WhatsApp Sourcing Feed</h1>
            <p className=" max-w-xl mt-2 text-gray-400">
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

            {/* Brand pills removed */}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-300">
              <button
                className="px-3 py-1 border border-gray-700 text-xs hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => fetchItems()}
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refetch'}
              </button>
              {/* favorites filter removed */}
            </div>

            {/* Quick filter pills removed; search bar now filters locally as you type */}
          </div>
        </div>
      </header>
      )}

      <main>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <section>
            <ErrorBanner message={error || undefined} />
            {/* Anchor to scroll to when page changes */}
            <div ref={listTopRef} />
            <Routes>
              <Route
                path="/"
                element={
                  <AnimatedHeight>
                    {loading ? (
                      <div className="p-8 text-center text-gray-400">Loading...</div>
                    ) : visible.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">No results for "{query}"</div>
                    ) : (
                      <>
                        <AnimatedList
                          items={pagedItems}
                          className="space-y-3"
                          instantRemove
                          renderItem={(item) => (
                            <FeedCard
                              key={item.id}
                              item={item}
                              loggedIn={loggedIn}
                              onRequireAuth={() => setSignupOpen(true)}
                            />
                          )}
                        />

                        {loadingMore && (
                          <div className="flex justify-center py-4" aria-live="polite" aria-busy="true">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-sky-400" />
                          </div>
                        )}

                        <div ref={sentinelRef} style={{ height: 1 }} />
                        {visibleCount < brandFiltered.length && !loadingMore && (
                          <div className="flex justify-center py-3">
                            <button
                              className="px-4 py-2 border border-gray-700 hover:bg-gray-800 text-sm"
                              onClick={() => tryLoadMore()}
                            >
                              Load more
                            </button>
                          </div>
                        )}
                        {visibleCount >= brandFiltered.length && (
                          <div className="text-center text-gray-500 text-sm py-4">End of results</div>
                        )}
                      </>
                    )}
                  </AnimatedHeight>
                }
              />
              <Route path="/privacy" element={<div className="mx-auto max-w-4xl md:px-10 md:py-[75px] px-5 py-5"><h1 className="hero-title title-gradient mb-4">Privacy Policy</h1><div className="prose prose-invert max-w-none"><p>Last updated: <strong>17 October 2025</strong></p><p>This Privacy Policy explains how ResellerSync ("we", "us") collects and uses your information when you use our website and services.</p><h2>Who we are</h2><p>Data Controller: ResellerSync. Contact: <a href="mailto:support@resellersync.io">support@resellersync.io</a>. We are UK based. You may contact the ICO if you have concerns.</p><h2>What we collect</h2><ul><li>Account details (email, name you provide).</li><li>Usage data (IP address, device, and interaction data).</li><li>Cookies and similar technologies (see Cookie Policy).</li></ul><h2>Why we use your data (lawful bases)</h2><ul><li>Provide and maintain the service (Contract/Legitimate Interests).</li><li>Improve the service (Consent for analytics where required).</li><li>Communicate incl. support (Contract/Legitimate Interests; Consent for marketing).</li><li>Security and abuse prevention (Legitimate Interests).</li></ul><h2>Retention</h2><p>We retain data only as long as necessary and as required by law.</p><h2>Sharing and processors</h2><p>We use trusted vendors: Vercel (hosting/CDN), Runpod (infrastructure), Email provider (support/transactional), Analytics provider (if enabled by your cookie choices). We do not sell personal data.</p><h2>International transfers</h2><p>Data may be processed outside the UK with appropriate safeguards (SCCs).</p><h2>Your rights</h2><ul><li>Access, rectification, erasure, restriction, portability, objection.</li><li>Withdraw consent at any time for consent-based activities.</li></ul><p>To exercise rights, contact <a href="mailto:support@resellersync.io">support@resellersync.io</a>.</p><h2>Complaints</h2><p>Complain to the ICO: <a href="https://ico.org.uk/" target="_blank" rel="noreferrer">ico.org.uk</a>.</p><h2>Changes</h2><p>We may update this Policy and post the new date here.</p></div></div>} />
              <Route path="/terms" element={<div className="mx-auto max-w-4xl md:px-10 md:py-[75px] px-5 py-5"><h1 className="hero-title title-gradient mb-4">Terms of Service</h1><div className="prose prose-invert max-w-none"><p>Last updated: <strong>17 October 2025</strong></p><h2>Agreement</h2><p>By using ResellerSync, you agree to these terms.</p><h2>Use of Service</h2><ul><li>No abuse, scraping, or interference; no unauthorized access.</li><li>We may update or discontinue features at any time.</li><li>You are responsible for your account and compliance with laws.</li></ul><h2>Content</h2><p>We aggregate or normalize content. No guarantees of accuracy; not affiliated with brands mentioned.</p><h2>Availability</h2><p>Service is provided “as is”, without warranty; no guarantee of uninterrupted operation.</p><h2>Liability</h2><p>Liability is limited to amounts paid in the last 12 months, to the extent permitted by law.</p><h2>Governing Law</h2><p>Laws of England and Wales. Exclusive jurisdiction of its courts.</p><h2>Contact</h2><p><a href="mailto:support@resellersync.io">support@resellersync.io</a></p></div></div>} />
              <Route path="/cookies" element={<div className="mx-auto max-w-4xl md:px-10 md:py-[75px] px-5 py-5"><h1 className="hero-title title-gradient mb-4">Cookie Policy</h1><div className="prose prose-invert max-w-none"><p>Last updated: <strong>17 October 2025</strong></p><p>This Cookie Policy explains how ResellerSync uses cookies and similar technologies.</p><h2>Categories</h2><ul><li><strong>Necessary</strong>: Required for core functionality. Always on.</li><li><strong>Analytics</strong>: Understand usage and improve the product. Only set with your consent.</li><li><strong>Marketing</strong>: Personalization and measuring campaigns. Only set with your consent.</li></ul><h2>Managing cookies</h2><p>You can change your choices at any time via <button className="underline" onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-manager'))}>Manage cookies</button>.</p><h2>Third parties</h2><ul><li>Vercel (hosting/CDN)</li><li>Runpod (infrastructure)</li><li>Analytics provider (only if you opt in)</li><li>Email provider (support/transactional)</li></ul><h2>More info</h2><p>See our <a href="/privacy">Privacy Policy</a> for data handling info.</p></div></div>} />
            </Routes>
          </section>

          <section className="mt-12 text-center cta-wrapper">
            <div className="mx-auto cta-card">
              <h2 className="hero-title title-gradient">Start Syncing Smarter Today</h2>
              <p className="mt-2 hero-subtitle">
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
          <div className="flex flex-wrap justify-center gap-6 text-sm mb-3">
            <Link className="hover:text-white" to="/privacy">Privacy Policy</Link>
            <Link className="hover:text-white" to="/terms">Terms of Service</Link>
            <Link className="hover:text-white" to="/cookies">Cookie Policy</Link>
            <button className="hover:text-white underline decoration-dotted" onClick={() => openCookieManager()}>Manage cookies</button>
          </div>
          <div className="text-xs text-gray-500">See how ResellerSync powers your white-label consignment model risk-free.</div>
        </div>
      </footer>
    </div>
  );
}
