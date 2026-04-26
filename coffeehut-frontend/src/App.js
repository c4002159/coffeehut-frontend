// App.js — Root component with routing and shared state -WeiqiWang
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MenuPage     from './components/MenuPage';
import OrderStatus  from './components/OrderStatus';
import Payment      from './components/Payment';
import TrainData    from './components/TrainData';
import LoyaltyScheme from './components/LoyaltyScheme';
import StaffLogin       from './components/staff/StaffLogin';
import StaffLayout      from './components/staff/StaffLayout';
import OrdersDashboard  from './components/staff/OrdersDashboard';
import OrderDetail      from './components/staff/OrderDetail';
import OrderArchive     from './components/staff/OrderArchive';
import Inventory        from './components/staff/Inventory';
import Settings         from './components/staff/Settings';
import Schedule         from './components/staff/Schedule';

const INITIAL_INVENTORY = [
    { id: 1, name: 'Americano',           stock: 24, available: true  },
    { id: 2, name: 'Americano with milk', stock: 18, available: true  },
    { id: 3, name: 'Latte',               stock: 12, available: true  },
    { id: 4, name: 'Cappuccino',          stock: 5,  available: true  },
    { id: 5, name: 'Hot Chocolate',       stock: 0,  available: true  },
    { id: 6, name: 'Mocha',               stock: 15, available: false },
    { id: 7, name: 'Mineral Water',       stock: 32, available: true  },
];

const CUSTOMER_NAV = [
  { icon: '\u{1F3E0}', label: 'Home',    path: '/',  state: { page: 'home' } },
  { icon: '\u2615',    label: 'Menu',    path: '/',  state: { page: 'menu' } },
  { icon: '\u{1F4E6}', label: 'Orders',  path: '/order-status' },
  { icon: '\u{1F464}', label: 'Profile', path: '/loyalty' },
];

function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const getActive = (item) => {
    if (item.path === '/order-status') return location.pathname === '/order-status';
    if (item.path === '/loyalty')      return location.pathname === '/loyalty';
    if (item.label === 'Menu')         return location.pathname === '/' && location.state?.page === 'menu';
    if (item.label === 'Home')         return location.pathname === '/' && location.state?.page !== 'menu';
    return false;
  };
  const NAV_HEIGHT = 60;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Outlet />
      </div>
      <nav style={{ height: NAV_HEIGHT, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-around', background: 'white', borderTop: '1px solid #e5e7eb', zIndex: 100 }}>
        {CUSTOMER_NAV.map(item => (
          <div key={item.label} onClick={() => navigate(item.path, item.state ? { state: item.state } : undefined)}
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
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading]       = useState(true);
    const [inventoryItems, setInventoryItems] = useState(INITIAL_INVENTORY);
    const [prepTime, setPrepTime] = useState(10);
    useEffect(() => {
        const token = localStorage.getItem('staff') || sessionStorage.getItem('staff');
        setIsLoggedIn(!!token);
        setLoading(false);
    }, []);
    if (loading) return <div className="p-8 text-center">Loading...</div>;
    return (
        <Router>
            <Routes>
                <Route element={<CustomerLayout />}>
                    <Route path="/"             element={<MenuPage />} />
                    <Route path="/order-status" element={<OrderStatus />} />
                    <Route path="/train"        element={<TrainData />} />
                    <Route path="/loyalty"      element={<LoyaltyScheme />} />
                </Route>
                <Route path="/payment"      element={<Payment />} />
                <Route path="/staff" element={<StaffLogin onLoginSuccess={() => setIsLoggedIn(true)} />} />
                <Route element={isLoggedIn ? <StaffLayout /> : <Navigate to="/staff" />}>
                    <Route path="/dashboard" element={<OrdersDashboard prepTime={prepTime} />} />
                    <Route path="/archive"   element={<OrderArchive />} />
                    <Route path="/inventory" element={<Inventory items={inventoryItems} setItems={setInventoryItems} />} />
                    <Route path="/settings"  element={<Settings prepTime={prepTime} setPrepTime={setPrepTime} />} />
                    <Route path="/schedule"  element={<Schedule />} />
                </Route>
                <Route path="/order/:id" element={isLoggedIn ? <OrderDetail /> : <Navigate to="/staff" />} />
            </Routes>
        </Router>
    );
}
export default App;
