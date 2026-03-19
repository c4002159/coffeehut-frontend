// 角色2 负责 - 订单状态
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OrderStatus = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [orderId] = useState(state?.orderId || ''); // 从跳转传参获取，也可手动修改
    const [status, setStatus] = useState('pending'); // 默认状态 

    useEffect(() => {
        if (!orderId) return;

        // 每5秒轮询后端接口 
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/orders/${orderId}`);
                if (response.ok) {
                    const data = await response.json();
                    setStatus(data.status); // 更新状态值 
                }
            } catch (error) {
                console.error("轮询失败:", error);
            }
        }, 5000);


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