import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function MenuPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState('home');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupMode, setPickupMode] = useState('time');
  const [loading, setLoading] = useState(true);
  const [customizeItem, setCustomizeItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState('Regular');
  const [selectedMilk, setSelectedMilk] = useState('Whole Milk');
  const [selectedSugar, setSelectedSugar] = useState('No');
  const [selectedTemp, setSelectedTemp] = useState('Hot');
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [specialNotes, setSpecialNotes] = useState('');
  const [authPage, setAuthPage] = useState(null); // null | 'login' | 'register'
  const [member, setMember] = useState(() => {
    const saved = localStorage.getItem('member');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
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

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const isOpen = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours() + now.getMinutes() / 60;
    if (day === 0) return false;
    if (day >= 1 && day <= 5) return hour >= 6.5 && hour < 19;
    if (day === 6) return hour >= 7 && hour < 18;
    return false;
  };

  const goToPayment = () => {
    if (!customerName || !pickupTime) {
      alert('Please enter your name and pickup time!');
      return;
    }
    navigate('/payment', { state: { cart, customerName, customerPhone, pickupTime, total } });
  };

  const popularItems = menuItems.slice(0, 2);

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
  if (authPage === 'login') {
    return <LoginPage
      onSuccess={(m) => { localStorage.setItem('member', JSON.stringify(m)); setMember(m); setAuthPage(null); }}
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
    const sectionStyle = { background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '12px' };
    const sectionTitle = { margin: '0 0 14px', fontSize: '15px', fontWeight: '700', color: '#1a1a1a' };

    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", background: '#f7f7f6', minHeight: '100dvh', maxWidth: '100%', margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'white', borderBottom: '1px solid rgba(74,54,33,0.08)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div onClick={() => setPage('menu')} style={{ width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '20px', color: '#4A3621' }}>←</div>
          <h2 style={{ margin: 0, flex: 1, textAlign: 'center', fontSize: '17px', fontWeight: 'bold', paddingRight: '38px' }}>Customise</h2>
        </header>
        <div style={{ padding: '20px 16px 120px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            {getImage(item.name) && (
              <div style={{ width: '100px', height: '100px', borderRadius: '16px', overflow: 'hidden' }}>
                <img src={getImage(item.name)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a' }}>{item.name}</h2>
              <p style={{ margin: '4px 0 0', fontSize: '17px', fontWeight: '700', color: '#4A3621' }}>£{totalPrice.toFixed(2)}</p>
            </div>
          </div>
          <div style={sectionStyle}>
            <p style={sectionTitle}>Size</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['Regular', ...(item.largePrice ? ['Large'] : [])].map(size => {
                const sizePrice = size === 'Regular' ? item.regularPrice : item.largePrice;
                const active = selectedSize === size;
                return (
                  <button key={size} onClick={() => setSelectedSize(size)} style={{ flex: 1, padding: '14px 10px', borderRadius: '12px', border: `2px solid ${active ? '#4A3621' : 'rgba(74,54,33,0.15)'}`, background: active ? 'rgba(74,54,33,0.08)' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: active ? '#4A3621' : '#555' }}>{size}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: active ? '#4A3621' : '#888' }}>£{sizePrice?.toFixed(2)}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={sectionStyle}>
            <p style={sectionTitle}>Milk Type</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {['Whole Milk', 'Oat Milk', 'Almond Milk', 'Soy Milk'].map(milk => {
                const active = selectedMilk === milk;
                return (
                  <button key={milk} onClick={() => setSelectedMilk(milk)} style={{ padding: '12px', borderRadius: '12px', border: `2px solid ${active ? '#4A3621' : 'rgba(74,54,33,0.12)'}`, background: active ? 'rgba(74,54,33,0.05)' : 'white', cursor: 'pointer', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: active ? '#4A3621' : '#555' }}>
                    {milk}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={sectionStyle}>
            <p style={sectionTitle}>Sugar Level</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              {['No', '25%', '50%', '75%', '100%'].map((level, i) => {
                const active = selectedSugar === level;
                const heights = [16, 28, 40, 52, 64];
                return (
                  <div key={level} onClick={() => setSelectedSugar(level)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <div style={{ width: '100%', height: `${heights[i]}px`, borderRadius: '6px', background: active ? '#4A3621' : 'rgba(74,54,33,0.15)', transition: 'background 0.15s' }} />
                    <span style={{ fontSize: '11px', fontWeight: active ? '700' : '500', color: active ? '#4A3621' : '#888' }}>{level}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={sectionStyle}>
            <p style={sectionTitle}>Temperature</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[{ label: 'Hot', icon: '🔥' }, { label: 'Warm', icon: '🌡️' }, { label: 'Iced', icon: '❄️' }].map(({ label, icon }) => {
                const active = selectedTemp === label;
                return (
                  <button key={label} onClick={() => setSelectedTemp(label)} style={{ flex: 1, padding: '14px 8px', borderRadius: '12px', border: `2px solid ${active ? '#4A3621' : 'rgba(74,54,33,0.15)'}`, background: active ? 'rgba(74,54,33,0.08)' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', marginBottom: '4px' }}>{icon}</div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: active ? '#4A3621' : '#555' }}>{label}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={sectionStyle}>
            <p style={sectionTitle}>Extras</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {EXTRAS.map(({ label, price }) => {
                const checked = selectedExtras.includes(label);
                return (
                  <div key={label} onClick={() => toggleExtra(label)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', border: `2px solid ${checked ? '#4A3621' : 'rgba(74,54,33,0.12)'}`, background: checked ? 'rgba(74,54,33,0.05)' : 'white', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${checked ? '#4A3621' : '#ccc'}`, background: checked ? '#4A3621' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {checked && <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: checked ? '#4A3621' : '#333' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#888' }}>+£{price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={sectionStyle}>
            <p style={sectionTitle}>Special Instructions</p>
            <textarea value={specialNotes} onChange={e => setSpecialNotes(e.target.value)} placeholder="Any special requests..." rows={3}
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid rgba(74,54,33,0.2)', borderRadius: '12px', padding: '12px', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", color: '#333' }} />
          </div>
        </div>
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #f1f5f9', padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))' }}>
          <button onClick={() => { addToCart(item, selectedSize, { milk: selectedMilk, sugar: selectedSugar, temp: selectedTemp, extras: selectedExtras, notes: specialNotes, extrasTotal }); setPage('menu'); }}
            style={{ width: '100%', background: '#4A3621', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Add to Order</span>
            <span>£{totalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── HOME PAGE ──
  if (page === 'home') return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", background: '#f7f7f6', minHeight: '100dvh', maxWidth: '100%', margin: '0 auto', position: 'relative' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'white', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(74,54,33,0.08)' }}>
        <div style={{ color: '#4A3621', fontSize: '22px' }}>📍</div>
        <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#1a1a1a' }}>Whistlestop Coffee Hut</h1>
        <div onClick={() => setAuthPage('login')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: member ? '#4A3621' : 'rgba(74,54,33,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}>
          {member ? <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>{member.name?.[0]?.toUpperCase()}</span> : '👤'}
        </div>
      </header>
      <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', height: '180px' }}>
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLwg1bs2Uv-hJEjU4qErsQ45aCvwXEdK2tX_Fsi8uukBRTFShRbHDtibmWnJgeGW4fVHU6OFRTbFOo-34MFKZuOOgIa_8S9FRUtBO6WvH1hkkDN9pb0ZklHOISR6W5_kVe3wQTTGxpZWc0ZbXxswIYklmm4VihYU2rcZyQQjzmRXskbqVP2cZ_7iPaCC-J3M9_7RmtefkBaZSlrP318gaMNklHo2VgkkAFrGfQuEyF3vysI1x-Bc5PHmdXK8DNxB4L0WllgVuXT1I"
              alt="cafe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', display: 'flex', alignItems: 'flex-end', padding: '16px' }}>
              <div style={{ color: 'white' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Cramlington Station</h2>
                <p style={{ margin: '2px 0 0', fontSize: '13px', opacity: 0.9 }}>Fresh brews on the go</p>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(74,54,33,0.1)', background: 'rgba(74,54,33,0.04)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>🕐</div>
            <div>
              <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>Open Today 06:30 – 19:00</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOpen() ? '#22c55e' : '#ef4444' }}></div>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Store Status: {isOpen() ? 'Active' : 'Closed'}</p>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 16px 20px' }}>
          <button onClick={() => setPage('menu')} style={{ width: '100%', background: '#4A3621', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            ☕ Browse Menu
          </button>
        </div>
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold' }}>Popular Drinks</h3>
            <span onClick={() => setPage('menu')} style={{ fontSize: '13px', color: '#4A3621', fontWeight: '600', cursor: 'pointer' }}>View all</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 16px))' }}>
            {popularItems.map(item => (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', aspectRatio: '1' }}>
                  {getImage(item.name)
                    ? <img src={getImage(item.name)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: 'rgba(74,54,33,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>☕</div>
                  }
                  <button onClick={() => addToCart(item, 'Regular')} style={{ position: 'absolute', bottom: '8px', right: '8px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#4A3621' }}>+</button>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{item.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#4A3621', fontWeight: '600' }}>£{item.regularPrice?.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999, background: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingTop: '10px', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
        {[['🏠', 'Home', () => setPage('home'), true], ['☕', 'Menu', () => setPage('menu'), false], ['📦', 'Orders', () => navigate('/order-status'), false], ['👤', 'Profile', () => navigate('/loyalty'), false]].map(([icon, label, action, active]) => (
          <div key={label} onClick={action} style={{ textAlign: 'center', cursor: 'pointer', color: active ? '#4A3621' : '#9ca3af' }}>
            <div style={{ fontSize: '22px' }}>{icon}</div>
            <p style={{ margin: '2px 0 0', fontSize: '10px', fontWeight: active ? 'bold' : '500' }}>{label}</p>
          </div>
        ))}
      </nav>
    </div>
  );

  // ── MENU PAGE ──
  if (page === 'menu') return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", background: '#f7f7f6', minHeight: '100dvh', width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box', position: 'relative', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(247,247,246,0.85)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(74,54,33,0.08)' }}>
        <div onClick={() => setPage('home')} style={{ width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '20px', color: '#4A3621' }}>←</div>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold' }}>Whistlestop Coffee Hut</h2>
        <div style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '20px', color: '#4A3621' }}>🔍</div>
      </header>
      <div style={{ padding: '20px 16px 8px 16px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#4A3621' }}>Coffee Menu</h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>Freshly roasted daily in small batches</p>
      </div>
      {loading && <p style={{ textAlign: 'center', padding: '30px', color: '#999' }}>Loading menu...</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(400px, 100%), 1fr))', gap: '12px', padding: '8px 16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 16px))' }}>
        {menuItems.map(item => (
          <div key={item.id} style={{ overflow: 'hidden', borderRadius: '14px', padding: '14px', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(74,54,33,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px', color: '#4A3621' }}>☕</span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h3>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#888' }}>Rich and freshly brewed.</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button onClick={() => addToCart(item, 'Regular')} style={{ padding: '5px 12px', borderRadius: '999px', border: '1px solid rgba(74,54,33,0.2)', background: 'rgba(74,54,33,0.05)', color: '#4A3621', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                      Reg £{item.regularPrice?.toFixed(2)}
                    </button>
                    {item.largePrice && (
                      <button onClick={() => addToCart(item, 'Large')} style={{ padding: '5px 12px', borderRadius: '999px', border: '1px solid rgba(74,54,33,0.1)', background: 'white', color: '#888', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        Lrg £{item.largePrice?.toFixed(2)}
                      </button>
                    )}
                  </div>
                  <button onClick={() => openCustomize(item)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', background: '#4A3621', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                    + Add
                  </button>
                </div>
              </div>
              {getImage(item.name) && (
                <div style={{ width: '72px', height: '72px', minWidth: '72px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden' }}>
                  <img src={getImage(item.name)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {cartCount > 0 && (
        <div onClick={() => setPage('cart')} style={{ position: 'fixed', bottom: '80px', right: '20px', background: '#4A3621', color: 'white', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(74,54,33,0.4)', fontSize: '24px', zIndex: 30 }}>
          🛒
          <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', borderRadius: '50%', width: '22px', height: '22px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid white' }}>{cartCount}</span>
        </div>
      )}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999, background: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingTop: '10px', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
        {[['🏠', 'Home', () => setPage('home'), false], ['☕', 'Menu', () => {}, true], ['📦', 'Orders', () => navigate('/order-status'), false], ['👤', 'Profile', () => navigate('/loyalty'), false]].map(([icon, label, action, active]) => (
          <div key={label} onClick={action} style={{ textAlign: 'center', cursor: 'pointer', color: active ? '#4A3621' : '#9ca3af' }}>
            <div style={{ fontSize: '22px' }}>{icon}</div>
            <p style={{ margin: '2px 0 0', fontSize: '10px', fontWeight: active ? 'bold' : '500' }}>{label}</p>
          </div>
        ))}
      </nav>
    </div>
  );

  // ── CART / ORDER REVIEW ──
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", background: 'white', minHeight: '100dvh', maxWidth: '100%', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(74,54,33,0.08)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div onClick={() => setPage('menu')} style={{ width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '20px', color: '#4A3621' }}>←</div>
        <h2 style={{ margin: 0, flex: 1, textAlign: 'center', fontSize: '17px', fontWeight: 'bold', paddingRight: '38px' }}>Order Review</h2>
      </header>
      <div style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 16px))' }}>
        <div style={{ padding: '20px 16px 8px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '17px', fontWeight: 'bold' }}>Selected Drinks</h3>
        </div>
        {cart.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '30px' }}>Your cart is empty</p>}
        {cart.map(item => (
          <div key={`${item.id}-${item.size}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderBottom: '1px solid #f1f5f9', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', background: 'rgba(74,54,33,0.08)', flexShrink: 0 }}>
                {getImage(item.name) ? <img src={getImage(item.name)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>☕</div>}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '15px' }}>{item.size} {item.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#888' }}>{item.size}</p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 'bold', color: '#4A3621' }}>£{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <button onClick={() => updateQty(item.id, item.size, -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(74,54,33,0.1)', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A3621', fontWeight: 'bold' }}>−</button>
              <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
              <button onClick={() => updateQty(item.id, item.size, 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(74,54,33,0.1)', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A3621', fontWeight: 'bold' }}>+</button>
            </div>
          </div>
        ))}
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Pickup Time</p>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
              <button onClick={() => setPickupMode('time')} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: pickupMode === 'time' ? 'white' : 'transparent', color: pickupMode === 'time' ? '#4A3621' : '#888', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: pickupMode === 'time' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Set a time</button>
              <button onClick={() => navigate('/train')} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: pickupMode === 'train' ? '#4A3621' : 'transparent', color: pickupMode === 'train' ? 'white' : '#888', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Link my train</button>
            </div>
          </div>
          {pickupMode === 'time' ? (
            <input type="datetime-local" value={pickupTime} onChange={e => setPickupTime(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', fontSize: '14px', outline: 'none' }} />
          ) : (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚆</span>
              <span style={{ fontSize: '13px', color: '#166534', fontWeight: '500' }}>Pickup time set to {pickupTime ? new Date(pickupTime + ':00').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} based on your train</span>
            </div>
          )}
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          <input placeholder="Your name *" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', fontSize: '14px', marginBottom: '10px', outline: 'none' }} />
          <input placeholder="Phone (optional)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', fontSize: '14px', outline: 'none' }} />
        </div>
        <div style={{ margin: '0 16px 16px', background: 'rgba(74,54,33,0.04)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '20px', marginTop: '2px' }}>📍</span>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>Pickup Location</p>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#666' }}>Cramlington Station, Whistlestop Coffee Hut</p>
          </div>
        </div>
        <div style={{ margin: '0 16px', background: '#f8fafc', borderRadius: '14px', padding: '16px' }}>
          {[['Subtotal', `£${total.toFixed(2)}`], ['Service Fee', '£0.50'], ['Tax', `£${(total * 0.09).toFixed(2)}`]].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#666' }}>
              <span>{label}</span><span style={{ fontWeight: '500' }}>{value}</span>
            </div>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span style={{ fontSize: '16px' }}>Total</span>
            <span style={{ fontSize: '20px', color: '#4A3621' }}>£{(total + 0.5 + total * 0.09).toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div style={{ background: 'white', borderTop: '1px solid #f1f5f9', padding: '16px 16px 24px', boxSizing: 'border-box' }}>
        {!isOpen() && <p style={{ margin: '0 0 8px', color: '#ef4444', fontSize: '12px', textAlign: 'center' }}>⚠️ Store is currently closed</p>}
        <button onClick={goToPayment} disabled={cart.length === 0 || !isOpen()} style={{ width: '100%', background: cart.length > 0 && isOpen() ? '#4A3621' : '#ccc', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: 'bold', cursor: cart.length > 0 && isOpen() ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Place Order</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>£{(total + 0.5 + total * 0.09).toFixed(2)}</span>
            <span>→</span>
          </div>
        </button>
        <p style={{ margin: '10px 0 0', textAlign: 'center', fontSize: '11px', color: '#9ca3af' }}>By placing your order, you agree to our Terms of Service.</p>
      </div>
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

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid email or password'); return; }
      onSuccess(data);
    } catch { setError('Network error, please try again.'); }
    finally { setLoading(false); }
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
      <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", minHeight: '100dvh', display: 'flex', background: '#f7f7f6' }} className="auth-split">

        {/* LEFT — hero image panel (desktop only) */}
        <div className="auth-left" style={{ flex: '1 1 50%', position: 'relative', overflow: 'hidden', minHeight: '100dvh' }}>
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiqj3OOeh-vdcTt9dIDKAPM6bHb-xmyrNk0w5QkfGEKv30OJa198LomQEDOsAN_ar8eb0bziGYdoTlrgge_GLTRcClzTKo-HL44Nwg836c4XjvV-lmuNw-RY3tR7rq-giF7gj4sPvNZbr3UZUKi5l4pgW-m36uAmkE8a7_OAdCQDOEQ7A3VWTaeRh72Z9VaHBgq_NWqfViP9ckwu-Jh5TkssG7wKGDXf4hpsgEBRd4aV_q30-GudiaY2QjpdRutS1kGnzh6UCc2JQ"
            alt="coffee" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(74,54,33,0.85) 0%, rgba(74,54,33,0.4) 100%)' }} />
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>☕</div>
              <span style={{ color: 'white', fontWeight: '700', fontSize: '15px', letterSpacing: '0.04em' }}>WHISTLESTOP COFFEE HUT</span>
            </div>
            <div>
              <h2 style={{ margin: '0 0 12px', fontSize: '40px', fontWeight: '800', color: 'white', lineHeight: 1.15, letterSpacing: '-0.02em' }}>Fresh brews,<br/>every journey.</h2>
              <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>Order ahead at Cramlington Station<br/>and skip the queue.</p>
            </div>
          </div>
        </div>

        {/* RIGHT — form panel */}
        <div className="auth-right" style={{ flex: '1 1 50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', overflowY: 'auto' }}>
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

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) { setError('Please fill in all fields'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (!agreed) { setError('Please agree to the Terms of Service'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); return; }
      onSuccess();
    } catch { setError('Network error, please try again.'); }
    finally { setLoading(false); }
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
      <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", minHeight: '100dvh', display: 'flex', background: '#f7f7f6' }} className="reg-split">

        {/* LEFT — branding panel */}
        <div className="reg-left" style={{ flex: '1 1 50%', position: 'relative', overflow: 'hidden', minHeight: '100dvh', background: '#4A3621' }}>
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLwg1bs2Uv-hJEjU4qErsQ45aCvwXEdK2tX_Fsi8uukBRTFShRbHDtibmWnJgeGW4fVHU6OFRTbFOo-34MFKZuOOgIa_8S9FRUtBO6WvH1hkkDN9pb0ZklHOISR6W5_kVe3wQTTGxpZWc0ZbXxswIYklmm4VihYU2rcZyQQjzmRXskbqVP2cZ_7iPaCC-J3M9_7RmtefkBaZSlrP318gaMNklHo2VgkkAFrGfQuEyF3vysI1x-Bc5PHmdXK8DNxB4L0WllgVuXT1I"
            alt="station" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, opacity: 0.35 }} />
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>☕</div>
              <span style={{ color: 'white', fontWeight: '700', fontSize: '15px', letterSpacing: '0.04em' }}>WHISTLESTOP COFFEE HUT</span>
            </div>
            <div>
              <h2 style={{ margin: '0 0 16px', fontSize: '40px', fontWeight: '800', color: 'white', lineHeight: 1.15, letterSpacing: '-0.02em' }}>Join the club.<br/>Earn rewards.</h2>
              {[['☕', 'Earn a free drink every 10 orders'], ['⚡', 'Order ahead, skip the queue'], ['🚆', 'Link your train for perfect timing']].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{icon}</div>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: '500' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — form panel */}
        <div className="reg-right" style={{ flex: '1 1 50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', overflowY: 'auto' }}>
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
