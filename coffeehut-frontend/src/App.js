// App.js — Root component with routing and shared state -WeiqiWang

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// Initial inventory data — lifted to App level so it survives page navigation. -WeiqiWang
const INITIAL_INVENTORY = [
    { id: 1, name: 'Americano',           stock: 24, available: true  },
    { id: 2, name: 'Americano with milk', stock: 18, available: true  },
    { id: 3, name: 'Latte',               stock: 12, available: true  },
    { id: 4, name: 'Cappuccino',          stock: 5,  available: true  },
    { id: 5, name: 'Hot Chocolate',       stock: 0,  available: true  },
    { id: 6, name: 'Mocha',               stock: 15, available: false },
    { id: 7, name: 'Mineral Water',       stock: 32, available: true  },
];

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading]       = useState(true);

    // Lifted to App so both Inventory and Dashboard share the same data across navigation. -WeiqiWang
    const [inventoryItems, setInventoryItems] = useState(INITIAL_INVENTORY);

    // Lifted to App so Dashboard (consumer) and Settings (editor) share the same value. -WeiqiWang
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
                <Route path="/"             element={<MenuPage />} />
                <Route path="/order-status" element={<OrderStatus />} />
                <Route path="/payment"      element={<Payment />} />
                <Route path="/train"        element={<TrainData />} />
                <Route path="/loyalty"      element={<LoyaltyScheme />} />

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
