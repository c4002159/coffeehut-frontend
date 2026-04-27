// App.js — Root component with routing and shared state -WeiqiWang
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import MenuPage      from './components/MenuPage';
import OrderStatus   from './components/OrderStatus';
import Payment       from './components/Payment';
import TrainData     from './components/TrainData';
import LoyaltyScheme from './components/LoyaltyScheme';
import StaffLogin      from './components/staff/StaffLogin';
import StaffLayout     from './components/staff/StaffLayout';
import OrdersDashboard from './components/staff/OrdersDashboard';
import OrderDetail     from './components/staff/OrderDetail';
import OrderArchive    from './components/staff/OrderArchive';
import Inventory       from './components/staff/Inventory';
import Settings        from './components/staff/Settings';
import Schedule        from './components/staff/Schedule';

const CUSTOMER_NAV = [
  { icon: '\u{1F3E0}', label: 'Home',    path: '/',  state: { page: 'home' } },
  { icon: '\u2615',    label: 'Menu',    path: '/',  state: { page: 'menu' }, onClick: () => { localStorage.setItem('menuPage', 'menu'); } },
  { icon: '\u{1F4E6}', label: 'Orders',  path: '/order-status' },
  { icon: '\u{1F464}', label: 'Profile', path: '/loyalty' },
];

const SETTINGS_API = 'http://localhost:8080/api/staff/settings';

const DEFAULT_AUTO_CANCEL  = { enabled: true, mins: 15 };
const DEFAULT_AUTO_COLLECT = { enabled: true, mins: 15 };

function CustomerLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const persistedPage = localStorage.getItem('menuPage') || 'home';
  const getActive = (item) => {
    if (item.path === '/order-status') return location.pathname === '/order-status';
    if (item.path === '/loyalty')      return location.pathname.startsWith('/loyalty');
    const currentPage = location.pathname === '/' ? (location.state?.page || persistedPage) : null;
    if (item.label === 'Menu')         return currentPage === 'menu';
    if (item.label === 'Home')         return currentPage === 'home';
    return false;
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Outlet />
      </div>
      <nav style={{ height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-around', background: 'white', borderTop: '1px solid #e5e7eb', zIndex: 100 }}>
        {CUSTOMER_NAV.map(item => (
          <div key={item.label} onClick={() => { if (item.state?.page) localStorage.setItem('menuPage', item.state.page); navigate(item.path, item.state ? { state: item.state } : undefined); }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: getActive(item) ? '#4A3621' : '#9ca3af', padding: '8px 0' }}>
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: getActive(item) ? 'bold' : '500', marginTop: '2px' }}>{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}

function App() {
    const [isLoggedIn,     setIsLoggedIn]     = useState(false);
    const [loading,        setLoading]        = useState(true);
    const [autoCancel,     setAutoCancel]     = useState(DEFAULT_AUTO_CANCEL);
    const [autoCollect,    setAutoCollect]    = useState(DEFAULT_AUTO_COLLECT);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const ordersCacheRef = useRef([]);

    useEffect(() => {
        const token = localStorage.getItem('staff') || sessionStorage.getItem('staff');
        setIsLoggedIn(!!token);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!isLoggedIn) return;
        fetch(SETTINGS_API)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    setAutoCancel({  enabled: data.autoCancelEnabled  ?? true, mins: data.autoCancelMins  ?? 15 });
                    setAutoCollect({ enabled: data.autoCollectEnabled ?? true, mins: data.autoCollectMins ?? 15 });
                }
            })
            .catch(() => {})
            .finally(() => setSettingsLoaded(true));
    }, [isLoggedIn]);

    const saveAutomationSettings = async (newCancel, newCollect) => {
        setAutoCancel(newCancel);
        setAutoCollect(newCollect);
        try {
            await fetch(SETTINGS_API, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    autoCancelEnabled:  newCancel.enabled,
                    autoCancelMins:     newCancel.mins,
                    autoCollectEnabled: newCollect.enabled,
                    autoCollectMins:    newCollect.mins,
                }),
            });
        } catch (err) { console.error('Failed to save automation settings:', err); }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <Router>
            <Routes>
                <Route element={<CustomerLayout />}>
                    <Route path="/"             element={<MenuPage />} />
                    <Route path="/order-status" element={<OrderStatus />} />
                    <Route path="/train"        element={<TrainData />} />
                    <Route path="/loyalty/*"    element={<LoyaltyScheme />} />
                </Route>
                <Route path="/payment" element={<Payment />} />
                <Route path="/staff"   element={<StaffLogin onLoginSuccess={() => setIsLoggedIn(true)} />} />
                <Route element={isLoggedIn ? <StaffLayout /> : <Navigate to="/staff" />}>
                    <Route path="/dashboard" element={
                        settingsLoaded || !isLoggedIn
                            ? <OrdersDashboard autoCancel={autoCancel} autoCollect={autoCollect} ordersCacheRef={ordersCacheRef} />
                            : <div className="p-8 text-center text-slate-400 text-sm">Loading settings…</div>
                    } />
                    <Route path="/archive"   element={<OrderArchive />} />
                    <Route path="/inventory" element={<Inventory />} />  {/* no props — manages own state from API -WeiqiWang */}
                    <Route path="/settings"  element={
                        <Settings autoCancel={autoCancel} autoCollect={autoCollect} onSave={saveAutomationSettings} />
                    } />
                    <Route path="/schedule"  element={<Schedule />} />
                </Route>
                <Route path="/order/:id" element={isLoggedIn ? <OrderDetail /> : <Navigate to="/staff" />} />
            </Routes>
        </Router>
    );
}

export default App;
