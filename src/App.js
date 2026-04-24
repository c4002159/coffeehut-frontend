import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
// 顾客端组件
import MenuPage from './components/MenuPage';
import OrderStatus from './components/OrderStatus';
import Payment from './components/Payment';
import TrainData from './components/TrainData';
import LoyaltyScheme from './components/LoyaltyScheme';
// 员工端组件
import StaffLogin from './components/staff/StaffLogin';
import StaffLayout from './components/staff/StaffLayout';
import OrdersDashboard from './components/staff/OrdersDashboard';
import OrderDetail from './components/staff/OrderDetail';
import OrderArchive from './components/staff/OrderArchive';
import Settings from './components/staff/Settings';
import Schedule from './components/staff/Schedule';

/* ─────────────────────────────────────────────
   顾客端共享底部导航（只渲染一次，路由切换不销毁）
───────────────────────────────────────────── */
const CUSTOMER_NAV = [
  { icon: '🏠', label: 'Home',    path: '/',  state: { page: 'home' } },
  { icon: '☕', label: 'Menu',    path: '/',  state: { page: 'menu' } },
  { icon: '📦', label: 'Orders',  path: '/order-status' },
  { icon: '👤', label: 'Profile', path: '/loyalty' },
];

function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // 判断当前高亮项
  const getActive = (item) => {
    if (item.path === '/order-status') return location.pathname === '/order-status';
    if (item.path === '/loyalty')      return location.pathname === '/loyalty';
    if (item.label === 'Menu')         return location.pathname === '/' && location.state?.page === 'menu';
    if (item.label === 'Home')         return location.pathname === '/' && location.state?.page !== 'menu';
    return false;
  };

  // nav 高度常量，页面内容需要留出这个底部空间
  const NAV_HEIGHT = 60; // px，不含 safe-area

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
    }}>
      {/* 页面内容区：独立滚动，高度 = 全屏 - nav */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {/* 统一最大宽度，所有顾客端页面对齐 */}
        <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
          <Outlet />
        </div>
      </div>

      {/* 底部导航 —— 普通文档流元素，永远不会销毁或抖动 */}
      <nav style={{
        flexShrink: 0,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(44,26,14,0.08)',
        paddingTop: '8px',
        paddingBottom: 'env(safe-area-inset-bottom, 12px)',
        minHeight: `${NAV_HEIGHT}px`,
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '100%' }}>
        {CUSTOMER_NAV.map((item) => {
          const active = getActive(item);
          return (
            <div
              key={item.label}
              onClick={() => navigate(item.path, item.state ? { state: item.state } : undefined)}
              style={{ textAlign: 'center', cursor: 'pointer', padding: '4px 16px', borderRadius: '12px', transition: 'background 0.15s', color: active ? '#2C1A0E' : '#B0A090' }}
            >
              <div style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</div>
              <p style={{ margin: '4px 0 0', fontSize: '10px', fontWeight: active ? '700' : '500', letterSpacing: '0.02em' }}>{item.label}</p>
            </div>
          );
        })}
        </div>
      </nav>
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('staff') || sessionStorage.getItem('staff');
    setIsLoggedIn(!!token);
    setLoading(false);
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <Router>
      <Routes>
        {/* 顾客端：共享 CustomerLayout，nav 只挂载一次 */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<MenuPage />} />
          <Route path="/order-status" element={<OrderStatus />} />
          <Route path="/loyalty" element={<LoyaltyScheme />} />
          <Route path="/train" element={<TrainData />} />
        </Route>

        {/* 支付页：全屏，不需要底部导航 */}
        <Route path="/payment" element={<Payment />} />

        {/* 员工端登录 */}
        <Route path="/staff" element={<StaffLogin onLoginSuccess={() => setIsLoggedIn(true)} />} />

        {/* 员工端（需要登录） */}
        <Route element={isLoggedIn ? <StaffLayout /> : <Navigate to="/staff" />}>
          <Route path="/dashboard" element={<OrdersDashboard />} />
          <Route path="/archive" element={<OrderArchive />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/schedule" element={<Schedule />} />
        </Route>

        {/* 订单详情页 */}
        <Route path="/order/:id" element={isLoggedIn ? <OrderDetail /> : <Navigate to="/staff" />} />
      </Routes>
    </Router>
  );
}

export default App;