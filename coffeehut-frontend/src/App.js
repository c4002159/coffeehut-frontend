import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
// 顾客端组件（简单占位）
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
<<<<<<< HEAD
    <Router>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/order-status" element={<OrderStatus />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/train" element={<TrainData />} />
        <Route path="/loyalty" element={<LoyaltyScheme initialView="landing" />} />
        <Route path="/loyalty/login" element={<LoyaltyScheme initialView="login" />} />
        <Route path="/loyalty/register" element={<LoyaltyScheme initialView="register" />} />
        <Route path="/loyalty/profile" element={<LoyaltyScheme initialView="profile" />} />
      </Routes>
    </Router>
=======
      <Router>
        <Routes>
          {/* 顾客端路由 */}
          <Route path="/" element={<MenuPage />} />
          <Route path="/order-status" element={<OrderStatus />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/train" element={<TrainData />} />
          <Route path="/loyalty" element={<LoyaltyScheme />} />

          {/* 员工端登录 */}
          <Route path="/staff" element={<StaffLogin onLoginSuccess={() => setIsLoggedIn(true)} />} />

          {/* 需要登录且带底部导航栏的页面 */}
          <Route element={isLoggedIn ? <StaffLayout /> : <Navigate to="/staff" />}>
            <Route path="/dashboard" element={<OrdersDashboard />} />
            <Route path="/archive" element={<OrderArchive />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/schedule" element={<Schedule />} />
          </Route>

          {/* 订单详情页：需要登录但无底部导航栏，返回逻辑由组件内部处理 */}
          <Route path="/order/:id" element={isLoggedIn ? <OrderDetail /> : <Navigate to="/staff" />} />
        </Routes>
      </Router>
>>>>>>> d76aa2c5250caded26e859f44fd20d4b31f47f0b
  );
}

export default App;