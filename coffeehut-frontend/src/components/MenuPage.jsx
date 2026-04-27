import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function MenuPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const authPageFromQuery = new URLSearchParams(location.search).get('authPage');
  const [menuItems, setMenuItems] = useState([]);
  const [storeOpen, setStoreOpen] = useState(true);
  const [storeHoursLabel, setStoreHoursLabel] = useState('Open Today');
  const [cart, setCart] = useState(() => { if (location.state?.cartItems?.length) return location.state.cartItems; try { const saved = localStorage.getItem('cart'); return saved ? JSON.parse(saved) : []; } catch { return []; } });
  const [page, setPageState] = useState(() => location.state?.page || localStorage.getItem('menuPage') || 'home');
  const [customerName, setCustomerName] = useState('');

  // Re-sync page/cart when location.state changes (e.g. nav clicks or reorder navigation)
  useEffect(() => {
    if (location.state?.page) setPageState(location.state.page);
    if (location.state?.cartItems) setCart(location.state.cartItems);
    // Apply pickup time from reorder sheet
    if (location.state?.reorderPickupTime) {
      if (location.state.reorderPickupTime === 'ASAP') {
        setPickupTime(getDefaultPickupTime());
      } else {
        setPickupTime(location.state.reorderPickupTime);
      }
      setPickupMode('time');
    }
  }, [location.state]);
  
  useEffect(() => {
    if (location.state?.authPage === 'login' || location.state?.authPage === 'register') {
      setAuthPage(location.state.authPage);
    }
  }, [location.state]);

  useEffect(() => {
    if (authPageFromQuery === 'login' || authPageFromQuery === 'register') {
      setAuthPage(authPageFromQuery);
    }
  }, [authPageFromQuery]);

  const [customerPhone, setCustomerPhone] = useState('');
  const toLocalDateTimeInput = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${hh}:${mm}`;
  };
  const getDefaultDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const getDefaultPickupTime = () => {
    const d = new Date();
    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
    return toLocalDateTimeInput(d);
  };
  const [pickupDate, setPickupDate] = useState(getDefaultDate);
  const [pickupHour, setPickupHour] = useState(String(new Date().getHours()).padStart(2,"0"));
  const [pickupMinute, setPickupMinute] = useState(String(Math.ceil(new Date().getMinutes()/5)*5%60).padStart(2,"0"));
  const [pickupTime, setPickupTime] = useState(getDefaultPickupTime);
  const [pickupMode, setPickupMode] = useState('time');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [customizeItem, setCustomizeItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState('Regular');
  const [selectedMilk, setSelectedMilk] = useState('Whole Milk');
  const [selectedSugar, setSelectedSugar] = useState('No');
  const [selectedTemp, setSelectedTemp] = useState('Hot');
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [specialNotes, setSpecialNotes] = useState('');
  const [authPage, setAuthPage] = useState(() => {
    if (authPageFromQuery === 'login' || authPageFromQuery === 'register') return authPageFromQuery;
    return location.state?.authPage || localStorage.getItem('authPage') || null;
  }); // null | 'login' | 'register'
  const [member, setMember] = useState(() => {
    const saved = localStorage.getItem('member');
    return saved ? JSON.parse(saved) : null;
  });

  const setPage = (nextPage) => {
    localStorage.setItem('menuPage', nextPage);
    setPageState(nextPage);
    navigate('/', { replace: true, state: { ...location.state, page: nextPage } });
  };

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:8080/api/menu')
      .then(res => res.json())
      .then(data => { setMenuItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (location.state?.suggestedPickupTime) {
      setPickupTime(location.state.suggestedPickupTime);
      setPickupMode('train');
      setPage('cart');
    }
  }, [location.state]);

  useEffect(() => {
    let isMounted = true;

    const refreshStoreStatus = () => {
      fetch('http://localhost:8080/api/store/status')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (!isMounted || !data) return;
          setStoreOpen(Boolean(data.isOpen));
          setStoreHoursLabel(data.todayHoursLabel || 'Open Today');
        })
        .catch(() => {
          if (!isMounted) return;
          setStoreOpen(false);
          setStoreHoursLabel('Currently unavailable');
        });
    };

    refreshStoreStatus();
    const intervalId = window.setInterval(refreshStoreStatus, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const addToCart = (item, size, customization = {}) => {
    const basePrice = size === 'Regular' ? item.regularPrice : item.largePrice;
    const price = (basePrice || 0) + (customization.extrasTotal || 0);
    setCart(prev => [...prev, { ...item, size, price, quantity: 1, customization }]);
  };

  const updateQty = (id, size, delta) => {
    setCart(cart.map(c => {
      if (c.id === id && c.size === size) {
        const newQty = c.quantity + delta;
        return newQty <= 0 ? null : { ...c, quantity: newQty };
      }
      return c;
    }).filter(Boolean));
  };

  const setQtyDirect = (id, size, val) => {
    if (val === '' || val === 0) {
      setCart(cart.map(c => c.id === id && c.size === size ? { ...c, quantity: 0 } : c));
      return;
    }
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 1) return;
    const capped = Math.min(n, 999);
    setCart(cart.map(c => c.id === id && c.size === size ? { ...c, quantity: capped } : c));
  };
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { if (authPage) localStorage.setItem('authPage', authPage); else localStorage.removeItem('authPage'); }, [authPage]);
  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const goToPayment = () => {
    if (cart.some(c => !c.quantity || c.quantity < 1)) {
      alert('Quantity cannot be empty. Please enter a valid quantity for all items.');
      return;
    }
    if (!customerName || !pickupTime) {
      alert('Please enter your name and pickup time!');
      return;
    }
    const selectedMs = new Date(pickupTime).getTime();
    if (isNaN(selectedMs) || selectedMs < Date.now()) {
      alert('Please select a pickup time in the future.');
      return;
    }
    navigate('/payment', { state: { items: cart, customerName, pickupTime, taxRate: 0.09, serviceFee: 0.50 } });
    setCart([]);
    localStorage.removeItem('cart');
  };

  const popularItems = menuItems.slice(0, 2);

  const filteredMenuItems = searchQuery.trim()
    ? menuItems.filter(item => item.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : menuItems;

  const coffeeImages = {
    'Americano': 'https://lh3.googleusercontent.com/aida-public/AB6AXuD06yMNSMpBQMHgImurP7s5KbSwQE1h8lP0DG1JJEdvehJq1diRwvrMw8t1Q4D5kPhGuM-meL2jeQVS995xRvzUUflMnZbIc8vkqAAU-MbuKEnzXaA0rb63U6lGk62zfCPfTF3s1Q_xAM60G0TRZqHxwxdy0shM_J_QTnh69dtphuSh8_IJbtVGIHp7_ehYH2f8HRtqU9SaF4d38zRJg3YuzCL8BZp7MbwGpqPFRn7f6BjtzmMrLL8MjXGhcFHSy_SM6N1OxGF9Hjs',
    'Latte': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBH32QBDa6Yion_MtKkjG1WLUbk9DBNSkYxIy0QXMLB5QzLjvhLpA0VR2vwqfwW5Unps1Jt07SQJwltRtGx5HcFS5me8XnPUIsz3UxpIDu5XGfcec_PCbI38CPe7B-9niIgfCvHV1Pv5bUv3NzNGFwPbQsDpono8N19AG07jp215YeRfzPnSMTzAPq6a1Jec4I6KhzJlE2lAJZ0zU8JvFKS5hjRnQiS1X-ULvAqxr2UziB2IFv0ynF1-fyticmGevvyt4SvcdIptKs',
    'Cappuccino': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmYwlzcicNaw9LGtsb6WIdBvGNq5gVgPHVM92luyYxPplVs0jk1OG2_PT8D17zKucTKsow3OrNVqvPrjGrrMelqiIIz-ZKppxd-Js0x2Dm2MPOM3b8rmZZscFkQKFnaL4NJUoiRHDOrnHBzFqq_xFQx8DXWiB0ilQJPniZxjgmT-H3gr9TjiW54u3LkZMpguimOAOmZNyfcQfWxyrQtjO4IlkhGzQWit1osUD5PmoKFe0NXO4fD9BEpAhxq94hTDC8F-69IBZrtqQ',
    'Hot Chocolate': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDE1T75JcgmQbYbUjz50Ybl6DzS6zPHWFWhOTPOQ8wiBYiwG3D42RFN5msL8NjRswAF6Hb3RezABlvwR-qirHS9Cqnt7SINIcf0BHD4FmUiBJfRMYIz4InWrhhTMMWFe98et9rdD853glld_YHqgeeswIr-WFKtKkzUg_NtNv3gWZ5bPP04gYy16mfn-gFMjWxCTKkqIB2Ua1qt6i9Zpme2LoZaO6BLIuCmPoyxus3XtcZxRCsMWdpDk7WHiAurBgaqEdLRhgmF2t0',
    'Americano with milk': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&q=80',
    'Mocha': 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=300&q=80',
    'Mineral Water': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&q=80',
  };

  const getImage = (name) => coffeeImages[name] || null;

  const EXTRAS = [
    { label: 'Extra Shot', price: 0.50 },
    { label: 'Whipped Cream', price: 0.30 },
  ];

  const toggleExtra = (label) => {
    setSelectedExtras(prev =>
      prev.includes(label) ? prev.filter(e => e !== label) : [...prev, label]
    );
  };

  const openCustomize = (item) => {
    if (item.name === "Mineral Water") { addToCart(item, "Regular"); return; }
    setCustomizeItem(item);
    setSelectedSize('Regular');
    setSelectedMilk('Whole Milk');
    setSelectedSugar('No');
    setSelectedTemp('Hot');
    setSelectedExtras([]);
    setSpecialNotes('');
    setPage('customize');
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    height: '56px', borderRadius: '12px',
    border: '1px solid #e2e8f0', background: 'white',
    padding: '0 16px', fontSize: '15px', outline: 'none',
    fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", color: '#1a1a1a',
  };

  // ── LOGIN PAGE ──
  if (authPage === "login") {
    return <LoginPage
      onSuccess={(m) => {
        const totalOrders = Number(m?.totalOrders);
        const normalized = {
          ...m,
          isLoyaltyMember: true,
          totalOrders: Number.isFinite(totalOrders) && totalOrders >= 0 ? Math.floor(totalOrders) : 0,
        };
        localStorage.setItem('member', JSON.stringify(normalized));
        setMember(normalized);
        setAuthPage(null);
      }}
      onGoRegister={() => setAuthPage('register')}
      onBack={() => setAuthPage(null)}
    />;
  }

  // ── REGISTER PAGE ──
  if (authPage === 'register') {
    return <RegisterPage
      onSuccess={() => setAuthPage('login')}
      onGoLogin={() => setAuthPage('login')}
      onBack={() => setAuthPage(null)}
    />;
  }

  // ── CUSTOMIZE PAGE ──
  if (page === 'customize' && customizeItem) {
    const item = customizeItem;
    const basePrice = selectedSize === 'Regular' ? item.regularPrice : item.largePrice;
    const extrasTotal = EXTRAS.filter(e => selectedExtras.includes(e.label)).reduce((s, e) => s + e.price, 0);
    const totalPrice = (basePrice || 0) + extrasTotal;
    const C2 = { espresso: '#2C1A0E', brown: '#4A3621', cream: '#FAF8F5', creamDark: '#F2EDE6', border: 'rgba(44,26,14,0.09)', borderMid: 'rgba(44,26,14,0.15)', textMain: '#1A1008', textSub: '#7A6A5A', textMuted: '#A89A8A' };
    const sectionStyle = { background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(44,26,14,0.06)', border: `1px solid ${C2.border}`, marginBottom: '10px' };
    const sectionTitle = { margin: '0 0 14px', fontSize: '12px', fontWeight: '700', color: C2.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' };

    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", background: C2.cream, minHeight: '100dvh', maxWidth: '100%', margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'rgba(250,248,245,0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C2.border}`, position: 'sticky', top: 0, zIndex: 10 }}>
          <div onClick={() => setPage('menu')} style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', color: C2.brown, background: C2.creamDark }}>←</div>
          <h2 style={{ margin: 0, flex: 1, textAlign: 'center', fontSize: '15px', fontWeight: '700', color: C2.textMain, paddingRight: '36px', letterSpacing: '0.01em' }}>Customise</h2>
        </header>

        <div style={{ padding: '24px 16px 120px' }}>
          {/* Item preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            {getImage(item.name) && (
              <div style={{ width: '96px', height: '96px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(44,26,14,0.18)' }}>
                <img src={getImage(item.name)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: C2.textMain, letterSpacing: '-0.02em' }}>{item.name}</h2>
              <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: '700', color: C2.espresso }}>£{totalPrice.toFixed(2)}</p>
            </div>
          </div>

          {/* Size */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Size</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['Regular', ...(item.largePrice ? ['Large'] : [])].map(size => {
                const sizePrice = size === 'Regular' ? item.regularPrice : item.largePrice;
                const active = selectedSize === size;
                return (
                  <button key={size} onClick={() => setSelectedSize(size)} style={{ flex: 1, padding: '14px 10px', borderRadius: '12px', border: `2px solid ${active ? C2.espresso : C2.borderMid}`, background: active ? 'rgba(44,26,14,0.07)' : 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: active ? C2.espresso : C2.textSub }}>{size}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: active ? C2.brown : C2.textMuted, fontWeight: '600' }}>£{sizePrice?.toFixed(2)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Milk */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Milk Type</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {['Whole Milk', 'Oat Milk', 'Almond Milk', 'Soy Milk'].map(milk => {
                const active = selectedMilk === milk;
                return (
                  <button key={milk} onClick={() => setSelectedMilk(milk)} style={{ padding: '12px', borderRadius: '12px', border: `2px solid ${active ? C2.espresso : C2.border}`, background: active ? 'rgba(44,26,14,0.07)' : C2.cream, cursor: 'pointer', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: active ? C2.espresso : C2.textSub, transition: 'all 0.15s' }}>
                    {milk}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sugar */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Sugar Level</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              {['No', '25%', '50%', '75%', '100%'].map((level, i) => {
                const active = selectedSugar === level;
                const heights = [14, 26, 38, 50, 62];
                return (
                  <div key={level} onClick={() => setSelectedSugar(level)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
                    <div style={{ width: '100%', height: `${heights[i]}px`, borderRadius: '8px', background: active ? C2.espresso : C2.creamDark, transition: 'background 0.18s', border: `1px solid ${active ? C2.espresso : C2.border}` }} />
                    <span style={{ fontSize: '11px', fontWeight: active ? '700' : '500', color: active ? C2.espresso : C2.textMuted }}>{level}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Temperature */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Temperature</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[{ label: 'Hot', icon: '🔥' }, { label: 'Warm', icon: '🌡️' }, { label: 'Iced', icon: '❄️' }].map(({ label, icon }) => {
                const active = selectedTemp === label;
                return (
                  <button key={label} onClick={() => setSelectedTemp(label)} style={{ flex: 1, padding: '14px 8px', borderRadius: '12px', border: `2px solid ${active ? C2.espresso : C2.border}`, background: active ? 'rgba(44,26,14,0.07)' : 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: '22px', marginBottom: '6px' }}>{icon}</div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: active ? C2.espresso : C2.textSub }}>{label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Extras */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Extras</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {EXTRAS.map(({ label, price }) => {
                const checked = selectedExtras.includes(label);
                return (
                  <div key={label} onClick={() => toggleExtra(label)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', border: `2px solid ${checked ? C2.espresso : C2.border}`, background: checked ? 'rgba(44,26,14,0.05)' : C2.cream, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${checked ? C2.espresso : C2.borderMid}`, background: checked ? C2.espresso : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                        {checked && <span style={{ color: 'white', fontSize: '11px', fontWeight: '700' }}>✓</span>}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: checked ? C2.espresso : C2.textSub }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: C2.textMuted }}>+£{price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Special instructions */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Special Instructions</p>
            <textarea value={specialNotes} onChange={e => setSpecialNotes(e.target.value)} placeholder="Any special requests..." rows={3}
              style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C2.borderMid}`, borderRadius: '12px', padding: '12px', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", color: C2.textMain, background: 'white' }} />
          </div>
        </div>

        <div style={{ position: 'sticky', bottom: 0, background: 'white', borderTop: `1px solid ${C2.border}`, padding: '16px' }}>
          <button onClick={() => { addToCart(item, selectedSize, { milk: selectedMilk, sugar: selectedSugar, temp: selectedTemp, extras: selectedExtras, notes: specialNotes, extrasTotal }); setPage('menu'); }}
            style={{ width: '100%', background: C2.espresso, color: 'white', border: 'none', borderRadius: '14px', padding: '17px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 3px 12px rgba(44,26,14,0.28)', letterSpacing: '0.01em' }}>
            <span>Add to Order</span>
            <span style={{ fontWeight: '800' }}>£{totalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── SINGLE PERSISTENT SHELL ──
  const C = {
    espresso: '#2C1A0E',
    brown: '#4A3621',
    cream: '#FAF8F5',
    creamDark: '#F2EDE6',
    border: 'rgba(44,26,14,0.09)',
    borderMid: 'rgba(44,26,14,0.15)',
    textMain: '#1A1008',
    textSub: '#7A6A5A',
    textMuted: '#A89A8A',
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", background: page === 'cart' ? 'white' : C.cream, minHeight: '100dvh', maxWidth: '100%', margin: '0 auto', position: 'relative' }}>
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .icon-btn { transition: background 0.15s; }
        .icon-btn:hover { background: rgba(44,26,14,0.07) !important; }
        .size-pill { transition: all 0.15s; }
        .size-pill:hover { background: rgba(44,26,14,0.08) !important; border-color: rgba(44,26,14,0.3) !important; }
        .add-btn { transition: background 0.15s, transform 0.1s, box-shadow 0.15s; }
        .add-btn:hover { background: #1e1008 !important; box-shadow: 0 3px 10px rgba(44,26,14,0.35) !important; }
        .add-btn:active { transform: scale(0.96); }
        .pop-card { transition: box-shadow 0.18s, transform 0.18s; }
        .pop-card:hover { box-shadow: 0 6px 24px rgba(44,26,14,0.12) !important; transform: translateY(-2px); }
        .qty-btn { transition: background 0.12s; }
        .qty-btn:hover { background: rgba(44,26,14,0.15) !important; }
        .browse-btn { transition: background 0.18s, box-shadow 0.18s, transform 0.1s; }
        .browse-btn:hover { background: #1e1008 !important; box-shadow: 0 4px 16px rgba(44,26,14,0.35) !important; }
        .browse-btn:active { transform: scale(0.98); }
      `}</style>

      {/* ── HOME PAGE CONTENT ── */}
      {page === 'home' && (
        <>
          {/* Header */}
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(250,248,245,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10, borderBottom: `1px solid ${C.border}` }}>
            
            <h1 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: C.textMain, letterSpacing: '0.01em' }}>Whistlestop Coffee Hut</h1>
            <div onClick={() => member ? navigate('/loyalty') : setAuthPage('login')} className="icon-btn" style={{ width: '36px', height: '36px', borderRadius: '50%', background: member ? C.espresso : C.creamDark, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', border: `1px solid ${C.border}` }}>
              {member ? <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{member.name?.[0]?.toUpperCase()}</span> : <span style={{ fontSize: '15px' }}>👤</span>}
            </div>
          </header>

          <div>
            {/* Member greeting */}
            {member && (
              <div style={{ padding: '8px 16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '16px', background: C.creamDark, border: `1px solid ${C.border}` }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: C.espresso, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '15px', flexShrink: 0 }}>
                    {member.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: C.textMain }}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {member.name?.split(' ')[0]}!</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: C.textSub }}>Ready for your next brew?</p>
                  </div>
                </div>
              </div>
            )}

            {/* Hero image */}
            <div style={{ padding: '8px 16px 0' }}>
              <div style={{ borderRadius: '20px', overflow: 'hidden', position: 'relative', height: '190px', boxShadow: '0 4px 24px rgba(44,26,14,0.15)' }}>
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLwg1bs2Uv-hJEjU4qErsQ45aCvwXEdK2tX_Fsi8uukBRTFShRbHDtibmWnJgeGW4fVHU6OFRTbFOo-34MFKZuOOgIa_8S9FRUtBO6WvH1hkkDN9pb0ZklHOISR6W5_kVe3wQTTGxpZWc0ZbXxswIYklmm4VihYU2rcZyQQjzmRXskbqVP2cZ_7iPaCC-J3M9_7RmtefkBaZSlrP318gaMNklHo2VgkkAFrGfQuEyF3vysI1x-Bc5PHmdXK8DNxB4L0WllgVuXT1I"
                  alt="cafe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,10,4,0.72) 0%, rgba(20,10,4,0.1) 60%, transparent 100%)', display: 'flex', alignItems: 'flex-end', padding: '20px' }}>
                  <div style={{ color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em' }}>Cramlington Station</h2>
                    <p style={{ margin: '3px 0 0', fontSize: '13px', opacity: 0.8, fontWeight: '500' }}>Fresh brews on the go</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hours card */}
            <div style={{ padding: '8px 16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '16px', border: `1px solid ${C.border}`, background: 'white', boxShadow: '0 1px 4px rgba(44,26,14,0.05)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: C.creamDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🕐</div>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: C.textMain }}>
                    {storeHoursLabel}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: storeOpen ? '#16a34a' : '#dc2626', boxShadow: storeOpen ? '0 0 0 2px rgba(22,163,74,0.2)' : '0 0 0 2px rgba(220,38,38,0.2)' }}></div>
                    <p style={{ margin: 0, fontSize: '12px', color: C.textSub, fontWeight: '500' }}>{storeOpen ? 'Open now' : 'Currently closed'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Browse button */}
            <div style={{ padding: '8px 16px 0' }}>
              <button onClick={() => setPage('menu')} className="browse-btn" style={{ width: '100%', background: C.espresso, color: 'white', border: 'none', borderRadius: '16px', padding: '17px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 3px 12px rgba(44,26,14,0.28)', letterSpacing: '0.01em' }}>
                ☕ Browse Menu
              </button>
            </div>

            {/* Popular drinks */}
            <div style={{ padding: '12px 16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: C.textMain, letterSpacing: '-0.01em' }}>Popular Drinks</h3>
                <span onClick={() => setPage('menu')} style={{ fontSize: '13px', color: C.brown, fontWeight: '600', cursor: 'pointer', padding: '4px 0' }}>View all →</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingBottom: '16px' }}>
                {popularItems.map(item => (
                  <div key={item.id} className="pop-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'white', borderRadius: '18px', overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(44,26,14,0.06)', cursor: 'pointer' }} onClick={() => openCustomize(item)}>
                    <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', maxHeight: '220px' }}>
                      {getImage(item.name)
                        ? <img src={getImage(item.name)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', background: C.creamDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>☕</div>
                      }
                      <button onClick={e => { e.stopPropagation(); openCustomize(item); }} style={{ position: 'absolute', bottom: '8px', right: '8px', width: '30px', height: '30px', borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: C.espresso, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>+</button>
                    </div>
                    <div style={{ padding: '0 12px 14px' }}>
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: C.textMain }}>{item.name}</p>
                      <p style={{ margin: '3px 0 0', fontSize: '13px', color: C.brown, fontWeight: '600' }}>£{item.regularPrice?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MENU PAGE CONTENT ── */}
      {page === 'menu' && (
        <>
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(250,248,245,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10, borderBottom: `1px solid ${C.border}` }}>
            <div onClick={() => { setPage('home'); setSearchOpen(false); setSearchQuery(''); }} className="icon-btn" style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', color: C.brown, background: C.creamDark }}>←</div>
            
            
          </header>

          {searchOpen && (
            <div style={{ padding: '10px 16px 12px', background: 'white', borderBottom: `1px solid ${C.border}` }}>
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search drinks…"
                style={{ width: '100%', boxSizing: 'border-box', height: '44px', borderRadius: '12px', border: `1.5px solid ${C.borderMid}`, background: C.cream, padding: '0 16px', fontSize: '14px', outline: 'none', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", color: C.textMain }}
              />
            </div>
          )}

          <div style={{ padding: '22px 16px 10px' }}>
            <h1 style={{ margin: 0, fontSize: '30px', fontWeight: '800', color: C.espresso, letterSpacing: '-0.03em', lineHeight: 1.1 }}>Coffee Menu</h1>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: C.textMuted, fontWeight: '500' }}>
              {searchQuery.trim() ? `${filteredMenuItems.length} result${filteredMenuItems.length !== 1 ? 's' : ''} for "${searchQuery}"` : 'Freshly roasted, brewed with care'}
            </p>
            <div style={{ margin: "12px 0 8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}><span style={{ fontSize: "14px" }}>💡</span><p style={{ margin: 0, fontSize: "13px", color: "#A06B5D", fontWeight: "500" }}>Please note: Orders not picked up within 15 minutes of the scheduled time will be cancelled without refund.</p></div>
          </div>
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textMuted }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>☕</div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Loading menu...</p>
            </div>
          )}
          {!loading && filteredMenuItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textMuted }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: C.textSub }}>No drinks found</p>
              <p style={{ margin: '6px 0 0', fontSize: '13px' }}>Try "{searchQuery.slice(0, 1).toUpperCase() + searchQuery.slice(1)}" or a different term</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px', padding: '8px 16px', paddingBottom: '16px' }}>
            {filteredMenuItems.map(item => (
              <div key={item.id} className="menu-card" style={{ overflow: 'hidden', borderRadius: '16px', padding: '14px', background: 'white', boxShadow: '0 1px 3px rgba(44,26,14,0.06), 0 4px 12px rgba(44,26,14,0.04)', border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 3px', fontSize: '15px', fontWeight: '700', color: C.textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h3>
                    <p style={{ margin: '0 0 12px', fontSize: '12px', color: C.textMuted, fontWeight: '400' }}>Rich and freshly brewed.</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>

                      <button onClick={() => openCustomize(item)} className="add-btn" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', background: C.espresso, color: 'white', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 6px rgba(44,26,14,0.22)' }}>
                        + Add
                      </button>
                    </div>
                  </div>
                  {getImage(item.name) && (
                    <div style={{ width: '74px', height: '74px', minWidth: '74px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(44,26,14,0.1)' }}>
                      <img src={getImage(item.name)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {cartCount > 0 && (
            <div onClick={() => setPage('cart')} style={{ position: 'sticky', bottom: '20px', float: 'right', marginRight: '20px', background: C.espresso, color: 'white', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 20px rgba(44,26,14,0.45)', fontSize: '22px', zIndex: 30 }}>
              🛒
              <span style={{ position: 'absolute', top: '-3px', right: '-3px', background: '#dc2626', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', border: '2px solid white' }}>{cartCount}</span>
            </div>
          )}
        </>
      )}

      {/* ── CART / ORDER REVIEW CONTENT ── */}
      {page === 'cart' && (
        <>
          <header style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
            <div onClick={() => setPage('menu')} className="icon-btn" style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', color: C.brown, background: C.creamDark }}>←</div>
            <h2 style={{ margin: 0, flex: 1, textAlign: 'center', fontSize: '15px', fontWeight: '700', color: C.textMain, paddingRight: '36px', letterSpacing: '0.01em' }}>Order Review</h2>
          </header>

          <div style={{ paddingBottom: '16px' }}>
            <div style={{ padding: '20px 16px 10px' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Selected Drinks</h3>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}><button onClick={() => setCart([])} style={{ fontSize: '13px', fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button></div>
            </div>

            {cart.length === 0 && (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: C.textMuted }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛒</div>
                <p style={{ margin: 0, fontWeight: '600', color: C.textSub }}>Your cart is empty</p>
              </div>
            )}

            {cart.map(item => (
              <div key={`${item.id}-${item.size}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderBottom: `1px solid ${C.border}`, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', background: C.creamDark, flexShrink: 0 }}>
                    {getImage(item.name) ? <img src={getImage(item.name)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>☕</div>}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: C.textMain }}>{item.size} {item.name}</p>
                    {item.customization && (item.customization.milk || item.customization.temp || item.customization.sugar !== undefined) && (
                      <p style={{ margin: '3px 0 0', fontSize: '11px', color: C.textMuted, fontWeight: '500' }}>
                        {[item.customization.temp, item.customization.milk, item.customization.sugar !== 'No' ? `Sugar ${item.customization.sugar}` : null, ...(item.customization.extras || [])].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p style={{ margin: '5px 0 0', fontSize: '14px', fontWeight: '700', color: C.brown }}>£{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <button onClick={() => updateQty(item.id, item.size, -1)} className="qty-btn" style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: C.creamDark, cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.brown, fontWeight: '700' }}>−</button>
                  <input type="number" min="1" max="999" value={item.quantity === 0 ? "" : item.quantity} onChange={e => { const v = e.target.value.replace(/[^0-9]/g,""); setQtyDirect(item.id, item.size, v === "" ? 0 : Math.min(parseInt(v)||0, 999)); }} onBlur={e => { if (!item.quantity || item.quantity < 1) setQtyDirect(item.id, item.size, 1); }} onClick={e => e.target.select()} onKeyDown={e => { if (["e","E","+","-","."].includes(e.key)) e.preventDefault(); }} style={{ width: "48px", textAlign: "center", fontWeight: "700", fontSize: "15px", color: C.textMain, border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "4px 0", outline: "none", background: "white" }} />
                  <button onClick={() => updateQty(item.id, item.size, 1)} className="qty-btn" style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: C.creamDark, cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.brown, fontWeight: '700' }}>+</button>
                </div>
              </div>
            ))}

            {/* Pickup time */}
            <div style={{ padding: '20px 16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pickup Time</p>
                <div style={{ display: 'flex', background: C.creamDark, borderRadius: '10px', padding: '3px', border: `1px solid ${C.border}` }}>
                  <button onClick={() => setPickupMode('time')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: pickupMode === 'time' ? 'white' : 'transparent', color: pickupMode === 'time' ? C.espresso : C.textSub, fontSize: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: pickupMode === 'time' ? '0 1px 4px rgba(44,26,14,0.1)' : 'none', transition: 'all 0.15s' }}>Set a time</button>
                  <button onClick={() => navigate('/train')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: pickupMode === 'train' ? C.espresso : 'transparent', color: pickupMode === 'train' ? 'white' : C.textSub, fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>Link my train</button>
                </div>
              </div>
              {pickupMode === 'time' ? (
<div style={{display:"flex",gap:"10px",flexDirection:"column"}}>
  <input type="date" value={pickupDate} min={new Date().toISOString().slice(0,10)}
    onChange={e=>{
      const d=e.target.value;
      setPickupDate(d);
      setPickupTime(d+"T"+pickupHour+":"+pickupMinute);
    }}
    style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.borderMid}`,borderRadius:"12px",padding:"14px",fontSize:"14px",outline:"none",background:"white",color:C.textMain}}/>
  <div style={{display:"flex",gap:"10px",marginBottom:"4px"}}>
    <span style={{flex:1,fontSize:"13px",fontWeight:"700",color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.08em"}}>HOUR</span>
    <span style={{flex:1,fontSize:"13px",fontWeight:"700",color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.08em"}}>MINUTE</span>
  </div>
  <div style={{display:"flex",gap:"10px"}}>
    <select value={pickupHour}
      onChange={e=>{
        const h=e.target.value;
        setPickupHour(h);
        setPickupTime(pickupDate+"T"+h+":"+pickupMinute);
      }}
      style={{flex:1,border:`1.5px solid ${C.borderMid}`,borderRadius:"12px",padding:"14px",fontSize:"14px",outline:"none",background:"white",color:C.textMain}}>
      {Array.from({length:24},(_,i)=>{
        const h=String(i).padStart(2,"0");
        const isToday=pickupDate===new Date().toISOString().slice(0,10);
        const nowH=new Date().getHours();
        const past=isToday && i<nowH;
        return <option key={h} value={h} disabled={past} style={{color:past?"#ccc":"inherit"}}>{h}</option>;
      })}
    </select>
    <select value={pickupMinute}
      onChange={e=>{
        const m=e.target.value;
        setPickupMinute(m);
        setPickupTime(pickupDate+"T"+pickupHour+":"+m);
      }}
      style={{flex:1,border:`1.5px solid ${C.borderMid}`,borderRadius:"12px",padding:"14px",fontSize:"14px",outline:"none",background:"white",color:C.textMain}}>
      {["00","05","10","15","20","25","30","35","40","45","50","55"].map(m=>{
        const isToday=pickupDate===new Date().toISOString().slice(0,10);
        const nowH=new Date().getHours();
        const nowM=new Date().getMinutes();
        const sameHour=isToday && parseInt(pickupHour,10)===nowH;
        const past=sameHour && parseInt(m,10)<=nowM;
        return <option key={m} value={m} disabled={past} style={{color:past?"#ccc":"inherit"}}>{m}</option>;
      })}
    </select>
  </div>
  {(()=>{
    const sel=new Date(pickupTime);
    const isPast=!isNaN(sel.getTime()) && sel.getTime()<Date.now();
    return isPast ? (
      <p style={{margin:"4px 0 0",fontSize:"12px",color:"#dc2626",fontWeight:"600"}}>⚠️ Please select a future time</p>
    ) : null;
  })()}
</div>              ) : (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🚆</span>
                  <span style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>Pickup time set to {pickupTime ? new Date(pickupTime + ':00').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} based on your train</span>
                </div>
              )}
            </div>

            {/* Name / Phone */}
            <div style={{ padding: '8px 16px 0' }}>
              <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Personal Information</p>
              <input placeholder="Your name *" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.borderMid}`, borderRadius: '12px', padding: '14px', fontSize: '14px', marginBottom: '10px', outline: 'none', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", color: C.textMain, background: 'white' }} />
              <input placeholder="Phone (optional)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.borderMid}`, borderRadius: '12px', padding: '14px', fontSize: '14px', outline: 'none', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", color: C.textMain, background: 'white' }} />
            </div>

            {/* Pickup location */}
            <div style={{ margin: '16px 16px 0', background: C.creamDark, borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px', border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: '18px', marginTop: '1px' }}>📍</span>
              <div>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '13px', color: C.textMain }}>Pickup Location</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: C.textSub, fontWeight: '500' }}>Cramlington Station, Whistlestop Coffee Hut</p>
              </div>
            </div>

            {/* Order summary */}
            <div style={{ margin: '16px 16px 0', background: C.creamDark, borderRadius: '16px', padding: '18px', border: `1px solid ${C.border}` }}>
              {[['Subtotal', `£${total.toFixed(2)}`], ['Service Fee', '£0.50'], ['Tax', `£${(total * 0.09).toFixed(2)}`]].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: C.textSub }}>
                  <span style={{ fontWeight: '500' }}>{label}</span><span style={{ fontWeight: '600' }}>{value}</span>
                </div>
              ))}
              <div style={{ height: '1px', background: C.border, margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: C.textMain }}>Total</span>
                <span style={{ fontSize: '22px', fontWeight: '800', color: C.espresso, letterSpacing: '-0.02em' }}>£{(total + 0.5 + total * 0.09).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Place order bar */}
          <div style={{ background: 'white', borderTop: `1px solid ${C.border}`, padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))', boxSizing: 'border-box' }}>
            {!storeOpen && <p style={{ margin: '0 0 8px', color: '#dc2626', fontSize: '12px', textAlign: 'center', fontWeight: '600' }}>⚠️ Store is currently closed</p>}
            <button onClick={goToPayment} disabled={cart.length === 0 || !storeOpen} className={cart.length > 0 && storeOpen ? 'browse-btn' : ''} style={{ width: '100%', background: cart.length > 0 && storeOpen ? C.espresso : '#d1c4b8', color: 'white', border: 'none', borderRadius: '16px', padding: '17px', fontSize: '15px', fontWeight: '700', cursor: cart.length > 0 && storeOpen ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: cart.length > 0 && storeOpen ? '0 3px 12px rgba(44,26,14,0.28)' : 'none', letterSpacing: '0.01em' }}>
              <span>Place Order</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                <span>£{(total + 0.5 + total * 0.09).toFixed(2)}</span>
                <span style={{ fontSize: '18px', opacity: 0.8 }}>→</span>
              </div>
            </button>
            <p style={{ margin: '10px 0 0', textAlign: 'center', fontSize: '11px', color: C.textMuted, fontWeight: '400' }}>By placing your order, you agree to our Terms of Service.</p>
          </div>
        </>
      )}

      {/* 底部导航由 App.js CustomerLayout 统一管理 */}
    </div>
  );
}

// ── LOGIN PAGE COMPONENT (Responsive Web + Mobile) ──
function LoginPage({ onSuccess, onGoRegister, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setError('');
    // Loyalty login: verify against localStorage (customer accounts are local-only)
    try {
      const saved = localStorage.getItem('member');
      if (saved) {
        const m = JSON.parse(saved);
        if (m.email === email.trim() && m.password === password) {
          onSuccess(m);
          return;
        }
      }
      setError('Invalid email or password');
    } catch {
      setError('Something went wrong, please try again.');
    }
  };

  const inp = { width: '100%', boxSizing: 'border-box', height: '52px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', padding: '0 16px', fontSize: '15px', outline: 'none', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", color: '#1a1a1a', transition: 'border-color 0.2s' };
  const lbl = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '7px' };

  return (
    <>
      <style>{`
        @media (max-width: 767px) { .auth-split { flex-direction: column !important; } .auth-left { display: none !important; } .auth-right { width: 100% !important; min-height: 100dvh !important; padding: 0 !important; align-items: stretch !important; justify-content: flex-start !important; } .auth-card { box-shadow: none !important; border-radius: 0 !important; padding: 24px 20px 40px !important; max-width: 100% !important; width: 100% !important; min-height: 100dvh !important; box-sizing: border-box !important; } }
        .auth-inp:focus { border-color: #4A3621 !important; box-shadow: 0 0 0 3px rgba(74,54,33,0.08) !important; }
        .auth-btn:hover { background: #3a2a16 !important; }
        .auth-btn:active { transform: scale(0.98); }
      `}</style>
      <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", minHeight: '100dvh', display: 'flex', background: '#f7f7f6', overflowY: 'auto', position: 'fixed', inset: 0, zIndex: 9999 }} className="auth-split">

        {/* LEFT — hero image panel (desktop only) */}
        <div className="auth-left" style={{ flex: '0 0 45%', position: 'relative', overflow: 'hidden', minHeight: '100dvh', margin: '40px 20px', alignSelf: 'center', borderRadius: '16px', height: 'calc(100dvh - 80px)', maxHeight: '600px', minHeight: 'unset' }}>
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiqj3OOeh-vdcTt9dIDKAPM6bHb-xmyrNk0w5QkfGEKv30OJa198LomQEDOsAN_ar8eb0bziGYdoTlrgge_GLTRcClzTKo-HL44Nwg836c4XjvV-lmuNw-RY3tR7rq-giF7gj4sPvNZbr3UZUKi5l4pgW-m36uAmkE8a7_OAdCQDOEQ7A3VWTaeRh72Z9VaHBgq_NWqfViP9ckwu-Jh5TkssG7wKGDXf4hpsgEBRd4aV_q30-GudiaY2QjpdRutS1kGnzh6UCc2JQ"
            alt="coffee" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(74,54,33,0.85) 0%, rgba(74,54,33,0.4) 100%)' }} />
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '16px', padding: '24px', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              
              <span style={{ color: 'white', fontWeight: '700', fontSize: '14px', letterSpacing: '0.04em' }}>WHISTLESTOP COFFEE HUT</span>
            </div>
            <div>
              <h2 style={{ margin: '0 0 12px', fontSize: '36px', fontWeight: '800', color: 'white', lineHeight: 1.15, letterSpacing: '-0.02em', textAlign: 'center' }}>Fresh brews, every journey.</h2>
              <p style={{ margin: 0, fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, textAlign: 'center' }}>Order ahead at Cramlington Station and skip the queue.</p>
            </div>
          </div>
        </div>

        {/* RIGHT — form panel */}
        <div className="auth-right" style={{ flex: '1 1 60%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 40px', overflowY: 'auto' }}>
          <div className="auth-card" style={{ width: '100%', maxWidth: '420px', background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>

            {/* Back */}
            <div onClick={onBack} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(74,54,33,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', color: '#4A3621', marginBottom: '28px' }}>←</div>

            {/* Title */}
            <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em' }}>Welcome Back</h1>
            <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#9ca3af' }}>The best beans, just a tap away.</p>

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>Email</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>✉️</span>
                <input type="email" placeholder="yourname@email.com" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="auth-inp" style={{ ...inp, paddingLeft: '42px' }} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <label style={{ ...lbl, margin: 0 }}>Password</label>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#4A3621', cursor: 'pointer' }}>Forgot Password?</span>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔒</span>
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="auth-inp" style={{ ...inp, paddingLeft: '42px', paddingRight: '42px' }} />
                <span onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '16px', color: '#9ca3af' }}>{showPw ? '🙈' : '👁️'}</span>
              </div>
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', background: '#fef2f2', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>{error}</div>}

            <button onClick={handleLogin} disabled={loading} className="auth-btn"
              style={{ width: '100%', height: '52px', background: '#4A3621', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(74,54,33,0.3)', marginBottom: '20px', opacity: loading ? 0.7 : 1, transition: 'background 0.2s' }}>
              {loading ? 'Logging in...' : <><span>Login</span><span>→</span></>}
            </button>

            <p style={{ textAlign: 'center', fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              Don't have an account?{' '}
              <span onClick={onGoRegister} style={{ color: '#4A3621', fontWeight: '700', cursor: 'pointer' }}>Sign Up</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── REGISTER PAGE COMPONENT (Responsive Web + Mobile) ──
function RegisterPage({ onSuccess, onGoLogin, onBack }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    if (!name || !email || !password || !confirm) { setError('Please fill in all fields'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (!agreed) { setError('Please agree to the Terms of Service'); return; }
    setError('');
    // Save loyalty member to localStorage (no backend registration needed for customers)
    const member = { name: name.trim(), email: email.trim(), password, isLoyaltyMember: true, totalOrders: 0, freeCups: 0 };
    localStorage.setItem('member', JSON.stringify(member));
    // Carry over any existing guest order IDs
    onSuccess();
  };

  const inp = { width: '100%', boxSizing: 'border-box', height: '52px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', padding: '0 16px', fontSize: '15px', outline: 'none', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", color: '#1a1a1a', transition: 'border-color 0.2s' };
  const lbl = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '7px' };

  return (
    <>
      <style>{`
        @media (max-width: 767px) { .reg-split { flex-direction: column !important; } .reg-left { display: none !important; } .reg-right { width: 100% !important; min-height: 100dvh !important; padding: 0 !important; align-items: stretch !important; justify-content: flex-start !important; } .reg-card { box-shadow: none !important; border-radius: 0 !important; padding: 24px 20px 40px !important; max-width: 100% !important; width: 100% !important; min-height: 100dvh !important; box-sizing: border-box !important; } .reg-grid-2 { grid-template-columns: 1fr !important; } }
        .reg-inp:focus { border-color: #4A3621 !important; box-shadow: 0 0 0 3px rgba(74,54,33,0.08) !important; }
        .reg-btn:hover { background: #3a2a16 !important; }
      `}</style>
      <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", minHeight: '100dvh', display: 'flex', background: '#f7f7f6', position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto' }} className="reg-split">

        {/* LEFT — branding panel */}
        <div className="reg-left" style={{ flex: '0 0 45%', position: 'relative', overflow: 'hidden', minHeight: '100dvh', margin: '40px 20px', alignSelf: 'center', borderRadius: '16px', height: 'calc(100dvh - 80px)', maxHeight: '600px', minHeight: 'unset', background: '#4A3621' }}>
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLwg1bs2Uv-hJEjU4qErsQ45aCvwXEdK2tX_Fsi8uukBRTFShRbHDtibmWnJgeGW4fVHU6OFRTbFOo-34MFKZuOOgIa_8S9FRUtBO6WvH1hkkDN9pb0ZklHOISR6W5_kVe3wQTTGxpZWc0ZbXxswIYklmm4VihYU2rcZyQQjzmRXskbqVP2cZ_7iPaCC-J3M9_7RmtefkBaZSlrP318gaMNklHo2VgkkAFrGfQuEyF3vysI1x-Bc5PHmdXK8DNxB4L0WllgVuXT1I"
            alt="station" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, opacity: 0.35 }} />
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '16px', padding: '24px', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              
              <span style={{ color: 'white', fontWeight: '700', fontSize: '14px', letterSpacing: '0.04em' }}>WHISTLESTOP COFFEE HUT</span>
            </div>
            <div>
              <h2 style={{ margin: '0 0 16px', fontSize: '36px', fontWeight: '800', color: 'white', lineHeight: 1.15, letterSpacing: '-0.02em' }}>Join the club.<br/>Earn rewards.</h2>
              {[['☕', 'Earn a free drink every 9 orders'], ['⚡', 'Order ahead, skip the queue'], ['🚆', 'Link your train for perfect timing']].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{icon}</div>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: '500' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — form panel */}
        <div className="reg-right" style={{ flex: '1 1 60%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 40px', overflowY: 'auto' }}>
          <div className="reg-card" style={{ width: '100%', maxWidth: '420px', background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>

            {/* Back */}
            <div onClick={onBack} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(74,54,33,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', color: '#4A3621', marginBottom: '28px' }}>←</div>

            {/* Title */}
            <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em' }}>Create Your Account</h1>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#9ca3af' }}>Join the club for fresh beans and rewards.</p>

            {/* Name + Email side by side on desktop, single column on mobile */}
            <div className="reg-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={lbl}>Full Name</label>
                <input placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} className="reg-inp" style={inp} />
              </div>
              <div>
                <label style={lbl}>Email Address</label>
                <input type="email" placeholder="coffee@whistlestop.com" value={email} onChange={e => setEmail(e.target.value)} className="reg-inp" style={inp} />
              </div>
            </div>

            {/* Password + Confirm side by side on desktop, single column on mobile */}
            <div className="reg-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={lbl}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} placeholder="Create password" value={password} onChange={e => setPassword(e.target.value)} className="reg-inp" style={{ ...inp, paddingRight: '40px' }} />
                  <span onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '15px', color: '#9ca3af' }}>{showPw ? '🙈' : '👁️'}</span>
                </div>
              </div>
              <div>
                <label style={lbl}>Confirm Password</label>
                <input type="password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} className="reg-inp" style={inp} />
              </div>
            </div>

            {/* Terms */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px' }}>
              <input type="checkbox" id="reg-terms" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: '#4A3621', flexShrink: 0 }} />
              <label htmlFor="reg-terms" style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5, cursor: 'pointer' }}>
                I agree to the <span style={{ color: '#4A3621', fontWeight: '700', textDecoration: 'underline' }}>Terms of Service</span> and <span style={{ color: '#4A3621', fontWeight: '700', textDecoration: 'underline' }}>Privacy Policy</span>
              </label>
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', background: '#fef2f2', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>{error}</div>}

            <button onClick={handleRegister} disabled={loading} className="reg-btn"
              style={{ width: '100%', height: '52px', background: '#4A3621', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(74,54,33,0.3)', marginBottom: '20px', opacity: loading ? 0.7 : 1, transition: 'background 0.2s' }}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              Already have an account?{' '}
              <span onClick={onGoLogin} style={{ color: '#4A3621', fontWeight: '700', cursor: 'pointer' }}>Login</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
export default MenuPage;
