'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DEFAULT_PRODUCTS } from './lib/shop';
import { createOrder, fetchProducts } from './lib/backend';

if (typeof window !== 'undefined' && gsap && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

/* Copied motion language from https://kabuor-mkuruu.vercel.app/ (Mkurugenzi v2.1.0):
   --mkr-ease: cubic-bezier(.22,.9,.24,1), --mkr-spring: cubic-bezier(.34,1.4,.5,1),
   hang-in (y -30px, 0.9s, 45ms stagger), swing (2.4deg/-1.4deg/0.6deg),
   42s marquee ticker, bump on bag. Rebuilt here with real GSAP. */

const TICKER_ITEMS = [
  'More than just thrift',
  'Veel Thrifts',
  'Tap a find to see it up close',
  'New drops land daily',
  'Free shipping over $75',
];

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function swingEl(el) {
  if (!el || prefersReducedMotion()) return;
  gsap.fromTo(
    el,
    { rotation: 2.4, transformOrigin: '50% 0%' },
    {
      keyframes: [{ rotation: 2.4 }, { rotation: -1.4 }, { rotation: 0.6 }, { rotation: 0 }],
      duration: 1.3,
      ease: 'power2.out',
      overwrite: 'auto',
    }
  );
}

/* ---------------------------------- data ---------------------------------- */

const NAV = [
  { label: 'New In', hint: 'Fresh drops' },
  { label: 'Clothing', hint: 'Jackets, knits & more' },
  { label: 'Shoes', hint: 'Sneakers & trainers' },
  { label: 'Accessories', hint: 'Scarves, bags & more' },
  { label: 'Activewear', hint: 'Joggers & gym' },
  { label: 'Gifts & Living', hint: 'Bundles & home' },
  { label: 'Inspiration', hint: 'Lookbook' },
];

const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'name', label: 'Name A–Z' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'UK 7', 'UK 9', 'One size'];

const FREE_SHIPPING_AT = 75;

/* --------------------------------- icons ---------------------------------- */

const I = {
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  cart: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 4h2l2.4 12.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20.5 8H6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="20" r="1.3" fill="currentColor" />
      <circle cx="17.5" cy="20" r="1.3" fill="currentColor" />
    </svg>
  ),
  heart: (filled) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path
        d="M12 20.5C7 16.5 3.5 13.3 3.5 9.6 3.5 7 5.5 5 8 5c1.6 0 3.1.8 4 2.1C13 5.8 14.4 5 16 5c2.5 0 4.5 2 4.5 4.6 0 3.7-3.5 6.9-8.5 10.9z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  bolt: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#f5b301" aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  chat: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="12" r="1.1" fill="currentColor" />
      <circle cx="13" cy="12" r="1.1" fill="currentColor" />
      <circle cx="17" cy="12" r="1.1" fill="currentColor" />
    </svg>
  ),
};

function NavIcon({ label }) {
  const map = {
    'New In': '⚡',
    Clothing: '🧥',
    Shoes: '👟',
    Accessories: '👜',
    Activewear: '🏋️',
    'Gifts & Living': '🎁',
    Inspiration: '💎',
  };
  return <span aria-hidden="true">{map[label] || '•'}</span>;
}

/* ---------------------------------- app ----------------------------------- */

export default function App() {
  const rootRef = useRef(null);
  const tickerTrackRef = useRef(null);
  const cartBtnRef = useRef(null);
  const [activeNav, setActiveNav] = useState('New In');
  const [tab, setTab] = useState('Women');
  const [query, setQuery] = useState('');
  const [sortId, setSortId] = useState('featured');
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(60);
  const [onlySale, setOnlySale] = useState(false);
  const [onlyLiked, setOnlyLiked] = useState(false);
  const [sizePick, setSizePick] = useState([]);
  const [liked, setLiked] = useState({});
  const [cart, setCart] = useState({ 'adidas-lxcon': 1, 'orange-scarf': 1 });
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [email, setEmail] = useState('');
  // Live catalog: admin-saved products override the built-in list when present.
  const [catalog, setCatalog] = useState(DEFAULT_PRODUCTS);
  // Guest checkout (no accounts): cart -> details (phone + location) -> done.
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [lastOrder, setLastOrder] = useState(null);
  const [quickView, setQuickView] = useState(null);

  const closeCart = () => {
    setCartOpen(false);
    setCheckoutStep('cart');
  };

  useEffect(() => {
    let live = true;
    // Shared backend when configured (Supabase), otherwise on-device catalog.
    fetchProducts()
      .then((list) => {
        if (live && list && list.length) setCatalog(list);
      })
      .catch(() => {
        /* offline — keep built-in list */
      });
    const onStorage = (e) => {
      if (e.key === 'veel-catalog-v1') {
        try {
          const raw = window.localStorage.getItem('veel-catalog-v1');
          const next = raw ? JSON.parse(raw) : null;
          if (next && next.length) setCatalog(next);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      live = false;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        closeCart();
        setSortOpen(false);
        setFilterOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ---------- GSAP: entrance (hang), ticker marquee, scroll reveals ---------- */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      // Header entrance
      gsap.from('.topbar', { y: -18, opacity: 0, duration: 0.7, ease: 'power3.out' });
      gsap.from('.brand-logo', {
        scale: 0.82,
        opacity: 0,
        duration: 0.9,
        ease: 'back.out(1.4)',
        transformOrigin: '50% 50%',
      });
      gsap.from('.ticker', { y: 12, opacity: 0, duration: 0.6, delay: 0.15, ease: 'power3.out' });
      gsap.from('.sidebar nav button', {
        x: -14,
        opacity: 0,
        duration: 0.5,
        stagger: 0.05,
        delay: 0.2,
        ease: 'power3.out',
        clearProps: 'all',
      });
      // Rack-style hang-in for the editorial grid (45ms stagger like reference)
      gsap.from('.grid .card', {
        y: -30,
        opacity: 0,
        duration: 0.9,
        stagger: 0.045,
        delay: 0.25,
        ease: 'back.out(1.4)',
        clearProps: 'transform,opacity',
      });
      // Scroll reveals
      gsap.utils.toArray('.gs-reveal').forEach((el) => {
        gsap.from(el, {
          y: 24,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  /* ---------- GSAP: infinite ticker (reference: 42s linear marquee) ---------- */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const track = tickerTrackRef.current;
    if (!track) return;
    const tween = gsap.to(track, {
      xPercent: -50,
      duration: 22,
      ease: 'none',
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, []);

  const toggleLike = (id) => setLiked((p) => ({ ...p, [id]: !p[id] }));

  const toggleSize = (s) =>
    setSizePick((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const addToCart = (id) => {
    setCart((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));
    const item = catalog.find((x) => x.id === id);
    setToast(`Added to cart — ${item ? item.brand : 'item'}`);
  };

  const setQty = (id, qty) =>
    setCart((p) => {
      if (qty <= 0) {
        const { [id]: _drop, ...rest } = p;
        return rest;
      }
      return { ...p, [id]: qty };
    });

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ ...catalog.find((p) => p.id === id), qty }))
        .filter((l) => l.id),
    [cart]
  );

  const cartCount = cartLines.reduce((n, l) => n + l.qty, 0);
  const subtotal = cartLines.reduce((n, l) => n + l.price * l.qty, 0);
  const savings = cartLines.reduce((n, l) => n + (l.was ? (l.was - l.price) * l.qty : 0), 0);
  const likedCount = Object.values(liked).filter(Boolean).length;

  const activeFilterCount =
    (onlySale ? 1 : 0) + (onlyLiked ? 1 : 0) + sizePick.length + (maxPrice < 60 ? 1 : 0);

  const isEditorial =
    (activeNav === 'New In' || activeNav === 'Inspiration') &&
    !query.trim() &&
    !onlySale &&
    !onlyLiked &&
    sizePick.length === 0 &&
    maxPrice >= 60 &&
    sortId === 'featured';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = catalog.filter((p) => {
      if (tab === 'Women' && p.audience === 'Men') return false;
      if (tab === 'Men' && p.audience === 'Women') return false;
      if (activeNav !== 'New In' && activeNav !== 'Inspiration' && p.category !== activeNav)
        return false;
      if (q && `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q) === false)
        return false;
      if (onlySale && !p.was) return false;
      if (onlyLiked && !liked[p.id]) return false;
      if (sizePick.length && !sizePick.includes(p.size)) return false;
      if (p.price > maxPrice) return false;
      return true;
    });
    if (sortId === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sortId === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sortId === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [tab, activeNav, query, onlySale, onlyLiked, sizePick, maxPrice, sortId, liked]);

  const clearAll = () => {
    setQuery('');
    setOnlySale(false);
    setOnlyLiked(false);
    setSizePick([]);
    setMaxPrice(60);
    setSortId('featured');
    setActiveNav('New In');
  };

  const sortLabel = SORTS.find((s) => s.id === sortId)?.label || 'Featured';
  const shipProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_AT) * 100));

  // Editorial slots: live catalog first, built-ins fill any gaps.
  const ED = [...catalog, ...DEFAULT_PRODUCTS].slice(0, 8);

  const placeOrder = async () => {
    if (!/^[+\d][\d\s-]{6,17}$/.test(phone.trim())) {
      setToast('Enter a valid phone number');
      return;
    }
    if (location.trim().length < 3) {
      setToast('Enter your delivery location');
      return;
    }
    const order = {
      ref: `VT-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      date: new Date().toISOString(),
      items: cartLines.map((l) => ({ id: l.id, name: l.name, price: l.price, qty: l.qty, size: l.size })),
      subtotal,
      phone: phone.trim(),
      location: location.trim(),
      note: note.trim(),
      status: 'New',
    };
    try {
      await createOrder(order);
    } catch {
      setToast('Could not send your order — check connection and try again');
      return;
    }
    setCart({});
    setLastOrder(order);
    setPhone('');
    setLocation('');
    setNote('');
    setCheckoutStep('done');
  };

  /* ---------- GSAP: re-hang grid when results change (rack entering) ---------- */
  const gridKey = `${isEditorial ? 'ed' : 'flat'}:${activeNav}:${tab}:${filtered.length}:${sortId}`;
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const root = rootRef.current;
    if (!root) return;
    const cards = root.querySelectorAll('.grid .card');
    if (!cards.length) return;
    const tween = gsap.fromTo(
      cards,
      { y: -30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.045,
        ease: 'back.out(1.4)',
        overwrite: 'auto',
        clearProps: 'transform,opacity',
      }
    );
    return () => {
      if (tween) tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridKey]);

  /* ---------- GSAP: bump the cart button when count changes (mkr-bump) ---------- */
  const firstCart = useRef(true);
  useEffect(() => {
    if (firstCart.current) {
      firstCart.current = false;
      return;
    }
    if (prefersReducedMotion()) return;
    const el = cartBtnRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { scale: 1 },
      { keyframes: [{ scale: 1.12 }, { scale: 1 }], duration: 0.5, ease: 'back.out(2)', overwrite: 'auto' }
    );
  }, [cartCount]);

  return (
    <div className="stage" ref={rootRef}>
      <div className="shell">
        {/* HEADER */}
        <header className="topbar">
          <a
            className="logo"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              clearAll();
            }}
            aria-label="Veel Thrifts home"
          >
            <img
              className="brand-logo"
              src="/logo.png"
              alt="Veel Thrifts — hanger logo"
              width={168}
              height={162}
            />
          </a>

          <label className="search">
            <span className="search-icon">{I.search}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for items, brands and inspiration ..."
              aria-label="Search products"
            />
            {query && (
              <button
                className="search-clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                {I.close}
              </button>
            )}
          </label>

          <div className="top-right">
            <button
              className="icon-btn"
              aria-label={`Wishlist, ${likedCount} items`}
              title="Wishlist"
              onClick={() => {
                setOnlyLiked((v) => !v);
                setFilterOpen(true);
              }}
            >
              {I.heart(likedCount > 0)}
              {likedCount > 0 && <span className="badge">{likedCount}</span>}
            </button>
            <button ref={cartBtnRef} className="cart-btn" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${cartCount} items`}>
              {I.cart} <span>Cart: {cartCount}</span>
            </button>
          </div>
        </header>

        <div className="ticker" aria-hidden="true">
          <div className="ticker-track" ref={tickerTrackRef}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
              <span key={i} className="ticker-item">
                {t} <i>✦</i>
              </span>
            ))}
          </div>
        </div>

        <div className="body">
          {/* SIDEBAR */}
          <aside className="sidebar" aria-label="Explore categories">
            <h2>Explore</h2>
            <nav>
              {NAV.map((n) => (
                <button
                  key={n.label}
                  onClick={() => setActiveNav(n.label)}
                  className={activeNav === n.label ? 'active' : ''}
                  aria-pressed={activeNav === n.label}
                  title={n.hint}
                >
                  <span className="nav-ico">
                    <NavIcon label={n.label} />
                  </span>
                  {n.label}
                </button>
              ))}
            </nav>

            <button className="help" onClick={() => setToast('Help Center — hello@veelthrifts.com')}>
              <span className="help-dot">{I.chat}</span> Help Center
            </button>
          </aside>

          {/* MAIN */}
          <main className="main">
            <div className="main-head">
              <h1>
                <span className="bolt">{I.bolt}</span> {activeNav === 'Inspiration' ? 'Inspiration' : activeNav}
                <span className="count">
                  {isEditorial
                    ? `${catalog.length} fresh finds`
                    : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}
                </span>
              </h1>
              <div className="controls">
                <div className="seg" role="tablist" aria-label="Shop by audience">
                  <button
                    role="tab"
                    aria-selected={tab === 'Women'}
                    className={tab === 'Women' ? 'on' : ''}
                    onClick={() => setTab('Women')}
                  >
                    <span aria-hidden="true">💃</span> Women
                  </button>
                  <button
                    role="tab"
                    aria-selected={tab === 'Men'}
                    className={tab === 'Men' ? 'on' : ''}
                    onClick={() => setTab('Men')}
                  >
                    <span aria-hidden="true">🕺</span> Men
                  </button>
                </div>

                <div className="drop-wrap">
                  <button
                    className="pill-btn"
                    onClick={() => setSortOpen((v) => !v)}
                    aria-expanded={sortOpen}
                    aria-haspopup="listbox"
                  >
                    ☰ <span>&nbsp; {sortLabel}</span>
                  </button>
                  {sortOpen && (
                    <div className="drop" role="listbox" aria-label="Sort products">
                      {SORTS.map((s) => (
                        <button
                          key={s.id}
                          role="option"
                          aria-selected={s.id === sortId}
                          className={s.id === sortId ? 'sel' : ''}
                          onClick={() => {
                            setSortId(s.id);
                            setSortOpen(false);
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className={`pill-btn ${filterOpen ? 'open' : ''}`}
                  onClick={() => setFilterOpen((v) => !v)}
                  aria-expanded={filterOpen}
                >
                  <span className="f-count">{activeFilterCount}</span> <span>&nbsp; Filter</span>
                </button>
              </div>
            </div>

            {filterOpen && (
              <section className="filters" aria-label="Filters">
                <div className="filter-row">
                  <div className="filter-group">
                    <span className="filter-title">Max price: ${maxPrice}</span>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="1"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      aria-label="Maximum price"
                    />
                  </div>
                  <div className="filter-group">
                    <span className="filter-title">Size</span>
                    <div className="chips">
                      {SIZES.map((s) => (
                        <button
                          key={s}
                          className={sizePick.includes(s) ? 'chip on' : 'chip'}
                          onClick={() => toggleSize(s)}
                          aria-pressed={sizePick.includes(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="filter-group toggles">
                    <button
                      className={onlySale ? 'chip on' : 'chip'}
                      onClick={() => setOnlySale((v) => !v)}
                      aria-pressed={onlySale}
                    >
                      On sale only
                    </button>
                    <button
                      className={onlyLiked ? 'chip on' : 'chip'}
                      onClick={() => setOnlyLiked((v) => !v)}
                      aria-pressed={onlyLiked}
                    >
                      ♥ Wishlist ({likedCount})
                    </button>
                    <button className="link" onClick={clearAll}>
                      Clear all
                    </button>
                  </div>
                </div>
              </section>
            )}

            {isEditorial ? (
              <div className="grid" aria-label="New in highlights">
                <a className="card banner-sale span2" href="#sale" onClick={(e) => e.preventDefault()}>
                  <svg className="doodle d1" viewBox="0 0 60 90" aria-hidden="true"><path d="M34 2 8 48h14L18 88l32-52H34l6-34z" fill="#f78fb3" stroke="#111" strokeWidth="3" strokeLinejoin="round"/></svg>
                  <svg className="doodle d2" viewBox="0 0 60 90" aria-hidden="true"><path d="M34 2 8 48h14L18 88l32-52H34l6-34z" fill="#ffffff" stroke="#111" strokeWidth="3" strokeLinejoin="round"/></svg>
                  <svg className="doodle d3" viewBox="0 0 60 90" aria-hidden="true"><path d="M34 2 8 48h14L18 88l32-52H34l6-34z" fill="#f78fb3" stroke="#111" strokeWidth="3" strokeLinejoin="round"/></svg>
                  <svg className="doodle d4" viewBox="0 0 60 90" aria-hidden="true"><path d="M34 2 8 48h14L18 88l32-52H34l6-34z" fill="#ffd21f" stroke="#111" strokeWidth="3" strokeLinejoin="round"/></svg>
                  <svg className="doodle d5" viewBox="0 0 60 90" aria-hidden="true"><path d="M34 2 8 48h14L18 88l32-52H34l6-34z" fill="#ffd21f" stroke="#111" strokeWidth="3" strokeLinejoin="round"/></svg>
                  <svg className="doodle d6" viewBox="0 0 60 90" aria-hidden="true"><path d="M34 2 8 48h14L18 88l32-52H34l6-34z" fill="#ffffff" stroke="#111" strokeWidth="3" strokeLinejoin="round"/></svg>
                  <div>
                    <h3>GET UP TO 50% OFF</h3>
                  </div>
                </a>

                <ProductCard
                  product={ED[0]}
                  liked={!!liked[ED[0].id]}
                  onLike={() => toggleLike(ED[0].id)}
                  onAdd={() => addToCart(ED[0].id)}
                  onQuick={() => setQuickView(ED[0])}
                  tall
                />
                <ProductCard
                  product={ED[1]}
                  liked={!!liked[ED[1].id]}
                  onLike={() => toggleLike(ED[1].id)}
                  onAdd={() => addToCart(ED[1].id)}
                  onQuick={() => setQuickView(ED[1])}
                  tall
                />

                <div className="card banner-winter span2">
                  <div>
                    <h3>Winter Weekends</h3>
                    <p>Keep it casual</p>
                    <button className="mini-cta" onClick={() => setActiveNav('Clothing')}>Shop coats</button>
                  </div>
                  <img
                    src={ED[4].img}
                    alt={ED[4].alt}
                    loading="lazy"
                  />
                </div>

                <ProductCard
                  product={ED[2]}
                  liked={!!liked[ED[2].id]}
                  onLike={() => toggleLike(ED[2].id)}
                  onAdd={() => addToCart(ED[2].id)}
                  onQuick={() => setQuickView(ED[2])}
                  tallSm
                />
                <ProductCard
                  product={ED[3]}
                  liked={!!liked[ED[3].id]}
                  onLike={() => toggleLike(ED[3].id)}
                  onAdd={() => addToCart(ED[3].id)}
                  onQuick={() => setQuickView(ED[3])}
                  tallSm
                />

                <div className="card banner-knit span2">
                  <div>
                    <h3>New-In Knitwear</h3>
                    <p>Layers. On. Layers</p>
                    <button className="mini-cta" onClick={() => setActiveNav('Clothing')}>Shop knitwear</button>
                  </div>
                  <img
                    src={ED[5].img}
                    alt={ED[5].alt}
                    loading="lazy"
                  />
                </div>

                <div className="card banner-texture span2">
                  <div>
                    <h3>New-Season Textures</h3>
                    <p>Cozy up in corduroy</p>
                    <button className="mini-cta" onClick={() => setActiveNav('Clothing')}>Shop textures</button>
                  </div>
                  <img
                    src={ED[6].img}
                    alt={ED[6].alt}
                    loading="lazy"
                  />
                </div>
              </div>
            ) : (
              <>
                {(query || activeNav !== 'New In') && (
                  <p className="query-note">
                    {query ? (
                      <>Showing results for “{query}” in {tab}’s {activeNav} </>
                    ) : (
                      <>Browsing {tab}’s {activeNav} </>
                    )}
                    <button className="link" onClick={clearAll}>Clear</button>
                  </p>
                )}
                {filtered.length === 0 ? (
                  <div className="empty">
                    <div className="empty-emoji" aria-hidden="true">🧺</div>
                    <h3>No thrift finds match that</h3>
                    <p>Try a different search, price or size — new drops land daily.</p>
                    <button className="pill-btn dark" onClick={clearAll}>Clear search & filters</button>
                  </div>
                ) : (
                  <div className="grid flat" aria-label="Products">
                    {filtered.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        liked={!!liked[p.id]}
                        onLike={() => toggleLike(p.id)}
                        onAdd={() => addToCart(p.id)}
                        onQuick={() => setQuickView(p)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            <section className="perks gs-reveal" aria-label="Why shop with us">
              <div><strong>♻️ Pre-loved first</strong><span>Authenticated vintage & rework</span></div>
              <div><strong>🚚 Fast shipping</strong><span>Free over ${FREE_SHIPPING_AT} · easy returns</span></div>
              <div><strong>✨ New drops daily</strong><span>One-of-one finds, graded condition</span></div>
            </section>

            <footer className="footer gs-reveal">
              <div className="foot-grid">
                <div>
                  <div className="logo sm">
                    <img
                      className="brand-logo sm"
                      src="/logo.png"
                      alt="Veel Thrifts"
                      width={120}
                      height={116}
                    />
                  </div>
                  <p className="muted">New-in thrift fashion. Good for your wardrobe, better for the planet.</p>
                </div>
                <div>
                  <strong>Shop</strong>
                  {['New In', 'Clothing', 'Shoes', 'Accessories'].map((c) => (
                    <button key={c} className="foot-link" onClick={() => setActiveNav(c)}>{c}</button>
                  ))}
                </div>
                <div>
                  <strong>Help</strong>
                  {['Shipping & returns', 'Size guide', 'Condition grading', 'Contact'].map((c) => (
                    <button key={c} className="foot-link" onClick={() => setToast(`${c} — hello@veelthrifts.com`)}>{c}</button>
                  ))}
                </div>
                <div>
                  <strong>Get 10% off your first thrift</strong>
                  <form
                    className="news"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!email.includes('@')) {
                        setToast('Enter a valid email');
                        return;
                      }
                      setToast('Welcome in — check your inbox for 10% off');
                      setEmail('');
                    }}
                  >
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      aria-label="Email address"
                      type="email"
                    />
                    <button type="submit">Join</button>
                  </form>
                </div>
              </div>
              <div className="foot-base">
                <span>© 2026 Veel Thrifts. All rights reserved.</span>
                <span>Sustainably built · One-of-one finds</span>
              </div>
            </footer>
          </main>
        </div>
      </div>

      {/* CART DRAWER */}
      {cartOpen && <div className="overlay" onClick={() => closeCart()} aria-hidden="true" />}
      <aside className={`drawer ${cartOpen ? 'open' : ''}`} aria-hidden={!cartOpen} aria-label="Shopping cart">
        <div className="drawer-head">
          <h2>
            {checkoutStep === 'details'
              ? 'Checkout'
              : checkoutStep === 'done'
                ? 'Order placed'
                : `Your cart (${cartCount})`}
          </h2>
          <button className="icon-btn" onClick={() => closeCart()} aria-label="Close cart">{I.close}</button>
        </div>
        {checkoutStep === 'cart' && (
          <div className="ship">
            <p>
              {subtotal >= FREE_SHIPPING_AT
                ? 'You unlocked FREE shipping 🎉'
                : `$${(FREE_SHIPPING_AT - subtotal).toFixed(0)} away from free shipping`}
            </p>
            <div className="bar"><span style={{ width: `${shipProgress}%` }} /></div>
          </div>
        )}
        {checkoutStep === 'details' ? (
          <div className="lines">
            <p className="muted co-note">No account needed — just tell us where to reach you.</p>
            <label className="co-field">
              <span>Phone number</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0712 345 678"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            <label className="co-field">
              <span>Delivery location</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Estate / street / town"
                autoComplete="street-address"
              />
            </label>
            <label className="co-field">
              <span>Note (optional)</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything we should know?"
              />
            </label>
          </div>
        ) : checkoutStep === 'done' ? (
          <div className="lines">
            <div className="co-done">
              <div className="co-check" aria-hidden="true">✓</div>
              <h3>Order received!</h3>
              <p className="muted">
                Ref <strong>{lastOrder?.ref}</strong> · ${lastOrder?.subtotal.toFixed(0)}
              </p>
              <p>
                We’ll call <strong>{lastOrder?.phone}</strong> to confirm delivery to{' '}
                <strong>{lastOrder?.location}</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="lines">
            {cartLines.length === 0 && <p className="muted">Your cart is empty — go thrift something good.</p>}
            {cartLines.map((l) => (
              <div className="line" key={l.id}>
                <img src={l.img} alt={l.alt} />
                <div>
                  <strong>{l.name}</strong>
                  <span className="muted">{l.brand} · {l.size}</span>
                  <div className="qty">
                    <button onClick={() => setQty(l.id, l.qty - 1)} aria-label={`Decrease quantity of ${l.name}`}>−</button>
                    <span>{l.qty}</span>
                    <button onClick={() => setQty(l.id, l.qty + 1)} aria-label={`Increase quantity of ${l.name}`}>+</button>
                  </div>
                </div>
                <div className="line-right">
                  <strong>${(l.price * l.qty).toFixed(0)}</strong>
                  {l.was && <s className="muted">${(l.was * l.qty).toFixed(0)}</s>}
                  <button className="link danger" onClick={() => setQty(l.id, 0)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="drawer-foot">
          {checkoutStep === 'details' ? (
            <>
              <button className="checkout" onClick={placeOrder}>
                Place order · ${subtotal.toFixed(0)}
              </button>
              <button className="link" onClick={() => setCheckoutStep('cart')}>Back to cart</button>
            </>
          ) : checkoutStep === 'done' ? (
            <button className="checkout" onClick={() => closeCart()}>Continue thrifting</button>
          ) : (
            <>
              <div className="totals">
                <span>Subtotal <strong>${subtotal.toFixed(0)}</strong></span>
                {savings > 0 && <span className="save">You save ${savings.toFixed(0)} vs. new</span>}
              </div>
              <button
                className="checkout"
                disabled={cartLines.length === 0}
                onClick={() => setCheckoutStep('details')}
              >
                Checkout · ${subtotal.toFixed(0)}
              </button>
              <button className="link" onClick={() => closeCart()}>Continue thrifting</button>
            </>
          )}
        </div>
      </aside>

      {quickView && (
        <div className="qv-overlay" onClick={() => setQuickView(null)}>
          <div
            className="qv-modal"
            role="dialog"
            aria-modal="true"
            aria-label={quickView.name}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="icon-btn qv-close" onClick={() => setQuickView(null)} aria-label="Close details">
              {I.close}
            </button>
            <img src={quickView.img} alt={quickView.alt || quickView.name} />
            <div className="qv-body">
              <p className="qv-brand">{quickView.brand}</p>
              <h3>{quickView.name}</h3>
              <p className="qv-desc">
                {quickView.desc || `${quickView.brand} · ${quickView.category} · Size ${quickView.size}.`}
              </p>
              <div className="p-meta qv-meta">
                <span className="price">${quickView.price}</span>
                {quickView.was && <s className="was">${quickView.was}</s>}
                <span className="size">{quickView.size}</span>
              </div>
              <button
                className="checkout"
                onClick={() => {
                  addToCart(quickView.id);
                  setQuickView(null);
                }}
              >
                Add to cart · ${quickView.price}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function ProductCard({ product, liked, onLike, onAdd, onQuick, tall, tallSm }) {
  const discount = product.was ? Math.round((1 - product.price / product.was) * 100) : 0;
  return (
    <article
      className={`card product ${tall ? 'tall' : ''} ${tallSm ? 'tall-sm' : ''}`}
      onMouseEnter={(e) => {
        const img = e.currentTarget.querySelector('.img-wrap');
        if (img) swingEl(img);
      }}
    >
      <div className="img-wrap">
        <button className="qv-open" onClick={() => onQuick && onQuick()} aria-label={`View ${product.name}`}>
          <img src={product.img} alt={product.alt} loading="lazy" />
        </button>
        {discount > 0 && <span className="sale-tag">−{discount}%</span>}
        <button
          className={`heart ${liked ? 'liked' : ''}`}
          onClick={onLike}
          aria-pressed={liked}
          aria-label={liked ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        >
          {I.heart(liked)}
        </button>
      </div>
      <div className="p-body">
        <button className="p-name-btn" onClick={() => onQuick && onQuick()}>
          <p className="p-name">{product.name}</p>
        </button>
        <div className="p-meta">
          <span className="price">${product.price}</span>
          {product.was && <s className="was">${product.was}</s>}
          <span className="size">{product.size}</span>
        </div>
        <button className="add" onClick={onAdd}>Add to cart</button>
      </div>
    </article>
  );
}
