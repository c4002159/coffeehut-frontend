import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MenuPage from './components/MenuPage';
import OrderStatus from './components/OrderStatus';
import StaffDashboard from './components/StaffDashboard';
import Payment from './components/Payment';
import TrainData from './components/TrainData';
import LoyaltyScheme from './components/LoyaltyScheme';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/order-status" element={<OrderStatus />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/train" element={<TrainData />} />
        <Route path="/loyalty" element={<LoyaltyScheme />} />
      </Routes>
    </Router>
  );
}

export default App;