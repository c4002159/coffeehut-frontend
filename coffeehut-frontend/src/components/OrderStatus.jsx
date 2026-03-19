// 角色2 负责 - 订单状态
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OrderStatus = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [orderId] = useState(state?.orderId || '');
    const [status, setStatus] = useState('pending');

    useEffect(() => {
        if (!orderId) return;
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/orders/${orderId}`);
                if (response.ok) {
                    const data = await response.json();
                    setStatus(data.status);
                }
            } catch (error) {
                console.error('轮询失败:', error);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [orderId]);

    return (
        <div>
            <h2>订单状态追踪</h2>
            <p>订单 ID: {orderId}</p>
            <p>当前状态: <strong>{status}</strong></p>
            <button onClick={() => navigate('/')}>Back to Menu</button>
        </div>
    );
};

export default OrderStatus;