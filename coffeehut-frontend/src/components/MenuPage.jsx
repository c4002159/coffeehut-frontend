// 角色1 负责 - 菜单与下单
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

  const addToCart = (item, size) => {
    const price = size === 'Regular' ? item.regularPrice : item.largePrice;
    const existing = cart.find(c => c.id === item.id && c.size === size);
    if (existing) {
      setCart(cart.map(c => c.id === item.id && c.size === size ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, size, price, quantity: 1 }]);
    }
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

  const coffeeImages = {
    'americano': 'https://lh3.googleusercontent.com/aida-public/AB6AXuD06yMNSMpBQMHgImurP7s5KbSwQE1h8lP0DG1JJEdvehJq1diRwvrMw8t1Q4D5kPhGuM-meL2jeQVS995xRvzUUflMnZbIc8vkqAAU-MbuKEnzXaA0rb63U6lGk62zfCPfTF3s1Q_xAM60G0TRZqHxwxdy0shM_J_QTnh69dtphuSh8_IJbtVGIHp7_ehYH2f8HRtqU9SaF4d38zRJg3YuzCL8BZp7MbwGpqPFRn7f6BjtzmMrLL8MjXGhcFHSy_SM6N1OxGF9Hjs',
    'americano with milk': 'https://lh3.googleusercontent.com/aida-public/AB6AXuD06yMNSMpBQMHgImurP7s5KbSwQE1h8lP0DG1JJEdvehJq1diRwvrMw8t1Q4D5kPhGuM-meL2jeQVS995xRvzUUflMnZbIc8vkqAAU-MbuKEnzXaA0rb63U6lGk62zfCPfTF3s1Q_xAM60G0TRZqHxwxdy0shM_J_QTnh69dtphuSh8_IJbtVGIHp7_ehYH2f8HRtqU9SaF4d38zRJg3YuzCL8BZp7MbwGpqPFRn7f6BjtzmMrLL8MjXGhcFHSy_SM6N1OxGF9Hjs',
    'latte': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBH32QBDa6Yion_MtKkjG1WLUbk9DBNSkYxIy0QXMLB5QzLjvhLpA0VR2vwqfwW5Unps1Jt07SQJwltRtGx5HcFS5me8XnPUIsz3UxpIDu5XGfcec_PCbI38CPe7B-9niIgfCvHV1Pv5bUv3NzNGFwPbQsDpono8N19AG07jp215YeRfzPnSMTzAPq6a1Jec4I6KhzJlE2lAJZ0zU8JvFKS5hjRnQiS1X-ULvAqxr2UziB2IFv0ynF1-fyticmGevvyt4SvcdIptKs',
    'cappuccino': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmYwlzcicNaw9LGtsb6WIdBvGNq5gVgPHVM92luyYxPplVs0jk1OG2_PT8D17zKucTKsow3OrNVqvPrjGrrMelqiIIz-ZKppxd-Js0x2Dm2MPOM3b8rmZZscFkQKFnaL4NJUoiRHDOrnHBzFqq_xFQx8DXWiB0ilQJPniZxjgmT-H3gr9TjiW54u3LkZMpguimOAOmZNyfcQfWxyrQtjO4IlkhGzQWit1osUD5PmoKFe0NXO4fD9BEpAhxq94hTDC8F-69IBZrtqQ',
    'hot chocolate': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDE1T75JcgmQbYbUjz50Ybl6DzS6zPHWFWhOTPOQ8wiBYiwG3D42RFN5msL8NjRswAF6Hb3RezABlvwR-qirHS9Cqnt7SINIcf0BHD4FmUiBJfRMYIz4InWrhhTMMWFe98et9rdD853glld_YHqgeeswIr-WFKtKkzUg_NtNv3gWZ5bPP04gYy16mfn-gFMjWxCTKkqIB2Ua1qt6i9Zpme2LoZaO6BLIuCmPoyxus3XtcZxRCsMWdpDk7WHiAurBgaqEdLRhgmF2t0',
    'mocha': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBH32QBDa6Yion_MtKkjG1WLUbk9DBNSkYxIy0QXMLB5QzLjvhLpA0VR2vwqfwW5Unps1Jt07SQJwltRtGx5HcFS5me8XnPUIsz3UxpIDu5XGfcec_PCbI38CPe7B-9niIgfCvHV1Pv5bUv3NzNGFwPbQsDpono8N19AG07jp215YeRfzPnSMTzAPq6a1Jec4I6KhzJlE2lAJZ0zU8JvFKS5hjRnQiS1X-ULvAqxr2UziB2IFv0ynF1-fyticmGevvyt4SvcdIptKs',
    'mineral water': 'https://lh3.googleusercontent.com/aida-public/AB6AXuD06yMNSMpBQMHgImurP7s5KbSwQE1h8lP0DG1JJEdvehJq1diRwvrMw8t1Q4D5kPhGuM-meL2jeQVS995xRvzUUflMnZbIc8vkqAAU-MbuKEnzXaA0rb63U6lGk62zfCPfTF3s1Q_xAM60G0TRZqHxwxdy0shM_J_QTnh69dtphuSh8_IJbtVGIHp7_ehYH2f8HRtqU9SaF4d38zRJg3YuzCL8BZp7MbwGpqPFRn7f6BjtzmMrLL8MjXGhcFHSy_SM6N1OxGF9Hjs',
  };

  const getImage = (name) => coffeeImages[name?.toLowerCase()] || null;

  const popularItems = menuItems.slice(0, 2);

  // ── HOME PAGE ──
  if (page === 'home') return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", background: '#f7f7f6', minHeight: '100vh', maxWidth: '480px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'white', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(74,54,33,0.08)' }}>
        <div style={{ color: '#4A3621', fontSize: '22px' }}>📍</div>
        <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold' }}>Whistlestop Coffee Hut</h1>
        <div onClick={() => navigate('/loyalty')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(74,54,33,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}>👤</div>
      </header>

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
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', flexShrink: 0 }}>🕐</div>
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
        <button onClick={() => setPage('menu')} style={{ width: '100%', background: '#4A3621', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
          ☕ Browse Menu
        </button>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold' }}>Popular Drinks</h3>
          <span onClick={() => setPage('menu')} style={{ fontSize: '13px', color: '#4A3621', fontWeight: '600', cursor: 'pointer' }}>View all</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingBottom: '90px' }}>
          {popularItems.map(item => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', aspectRatio: '1', background: 'rgba(74,54,33,0.08)' }}>
                {getImage(item.name)
                  ? <img src={getImage(item.name)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>☕</div>
                }
                <button onClick={() => addToCart(item, 'Regular')} style={{ position: 'absolute', bottom: '8px', right: '8px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#4A3621' }}>+</button>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{item.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#4A3621', fontWeight: '600' }}>£{item.regularPrice?.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: 'white', borderTop: '1px solid rgba(74,54,33,0.08)', display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px' }}>
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
    <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", background: '#f7f7f6', minHeight: '100vh', maxWidth: '480px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(247,247,246,0.9)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(74,54,33,0.08)' }}>
        <div onClick={() => setPage('home')} style={{ width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '20px', color: '#4A3621' }}>←</div>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold' }}>Whistlestop Coffee Hut</h2>
        <div style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '20px' }}>🔍</div>
      </header>

      <div style={{ padding: '20px 16px 8px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#4A3621' }}>Coffee Menu</h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>Freshly roasted daily in small batches</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', overflowX: 'auto' }}>
        {['Hot Coffee', 'Cold Brew', 'Tea', 'Pastries'].map((cat, i) => (
          <button key={cat} style={{ flexShrink: 0, padding: '8px 18px', borderRadius: '999px', border: 'none', background: i === 0 ? '#4A3621' : 'rgba(74,54,33,0.1)', color: i === 0 ? 'white' : '#4A3621', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{cat}</button>
        ))}
      </div>

      {loading && <p style={{ textAlign: 'center', padding: '30px', color: '#999' }}>Loading menu...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 16px 100px' }}>
        {menuItems.map(item => (
          <div key={item.id} style={{ background: 'white', borderRadius: '14px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(74,54,33,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* 统一图片区域 - 有图显示图，没图显示☕ */}
            <div style={{ width: '90px', height: '90px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: 'rgba(74,54,33,0.08)' }}>
              {getImage(item.name)
                ? <img src={getImage(item.name)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>☕</div>
              }
            </div>
            {/* 内容区域 - 固定高度对齐 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '90px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>{item.name}</h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888' }}>Rich and freshly brewed.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => addToCart(item, 'Regular')} style={{ padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(74,54,33,0.2)', background: 'rgba(74,54,33,0.05)', color: '#4A3621', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                    Reg £{item.regularPrice?.toFixed(2)}
                  </button>
                  {item.largePrice && (
                    <button onClick={() => addToCart(item, 'Large')} style={{ padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(74,54,33,0.1)', background: 'white', color: '#888', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                      Lrg £{item.largePrice?.toFixed(2)}
                    </button>
                  )}
                </div>
                <button onClick={() => addToCart(item, 'Regular')} style={{ background: '#4A3621', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 }}>
                  + Add
                </button>
              </div>
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

      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: 'white', borderTop: '1px solid rgba(74,54,33,0.08)', display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px' }}>
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
    <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", background: 'white', minHeight: '100vh', maxWidth: '480px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(74,54,33,0.08)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div onClick={() => setPage('menu')} style={{ width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '20px', color: '#4A3621' }}>←</div>
        <h2 style={{ margin: 0, flex: 1, textAlign: 'center', fontSize: '17px', fontWeight: 'bold', paddingRight: '38px' }}>Order Review</h2>
      </header>

      <div style={{ paddingBottom: '120px' }}>
        <div style={{ padding: '20px 16px 8px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '17px', fontWeight: 'bold' }}>Selected Drinks</h3>
        </div>

        {cart.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '30px' }}>Your cart is empty</p>}

        {cart.map(item => (
          <div key={`${item.id}-${item.size}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', background: 'rgba(74,54,33,0.08)', flexShrink: 0 }}>
                {getImage(item.name)
                  ? <img src={getImage(item.name)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>☕</div>
                }
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '15px' }}>{item.size} {item.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>{item.size}</p>
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
            <input type="datetime-local" value={pickupTime} onChange={e => setPickupTime(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', fontSize: '14px', outline: 'none' }} />
          ) : (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚆</span>
              <span style={{ fontSize: '13px', color: '#166534', fontWeight: '500' }}>
                Pickup time set to {pickupTime ? new Date(pickupTime + ':00').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} based on your train
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          <input placeholder="Your name *" value={customerName} onChange={e => setCustomerName(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', fontSize: '14px', marginBottom: '10px', outline: 'none' }} />
          <input placeholder="Phone (optional)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', fontSize: '14px', outline: 'none' }} />
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

      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: 'white', borderTop: '1px solid #f1f5f9', padding: '16px 16px 24px', boxSizing: 'border-box' }}>
        {!isOpen() && <p style={{ margin: '0 0 8px', color: '#ef4444', fontSize: '12px', textAlign: 'center' }}>⚠️ Store is currently closed</p>}
        <button onClick={goToPayment} disabled={cart.length === 0 || !isOpen()} style={{
          width: '100%', background: cart.length > 0 && isOpen() ? '#4A3621' : '#ccc',
          color: 'white', border: 'none', borderRadius: '14px', padding: '16px',
          fontSize: '16px', fontWeight: 'bold', cursor: cart.length > 0 && isOpen() ? 'pointer' : 'not-allowed',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
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

export default MenuPage;