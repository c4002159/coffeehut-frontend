// src/components/staff/OrdersDashboard.jsx (完整诊断版)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Bell, Search, SlidersHorizontal } from 'lucide-react';
import { fetchActiveOrders, updateOrderStatus } from '../../api';

export default function OrdersDashboard() {
    const [orders, setOrders] = useState([]);
    const [filterType, setFilterType] = useState('All');
    const [notificationOpen, setNotificationOpen] = useState(false);
    const navigate = useNavigate();

    const loadOrders = async () => {
        console.log('loadOrders 开始');
        try {
            const data = await fetchActiveOrders();
            console.log('获取到订单数据:', data);
            setOrders(data);
        } catch (err) {
            console.error('加载订单失败:', err);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const updateStatus = async (id, newStatus) => {
        console.log(`尝试更新订单 ${id} 状态为 ${newStatus}`);
        try {
            const result = await updateOrderStatus(id, newStatus);
            console.log('更新成功:', result);
            await loadOrders(); // 重新加载
        } catch (err) {
            console.error('更新失败:', err);
            alert('更新状态失败: ' + err.message);
        }
    };

    const sections = [
        { title: 'New Orders', status: 'new', color: 'blue', buttonText: 'Accept Order', nextStatus: 'preparing' },
        { title: 'Preparing', status: 'preparing', color: 'orange', buttonText: 'Mark Ready', nextStatus: 'ready' },
        { title: 'Ready', status: 'ready', color: 'emerald', buttonText: 'Mark Collected', nextStatus: 'collected' },
    ];

    const filteredOrders = (status) => {
        let filtered = orders.filter(o => o.status === status);
        if (filterType !== 'All') filtered = filtered.filter(o => o.type === filterType);
        return filtered;
    };

    return (
        <div className="flex flex-col h-full">
            <header className="sticky top-0 z-20 bg-background-light/80 backdrop-blur-md border-b border-primary/10">
                <div className="flex items-center p-4">
                    <div className="bg-primary/10 p-2 rounded-lg mr-3"><Coffee className="text-primary size-6" /></div>
                    <h2 className="text-lg font-bold flex-1">Orders Dashboard</h2>
                    <button onClick={() => setNotificationOpen(!notificationOpen)} className="bg-primary/10 p-2 rounded-full text-primary relative">
                        <Bell className="size-6" />
                    </button>
                </div>
                {notificationOpen && (
                    <div className="absolute right-4 top-16 bg-white rounded-xl shadow-lg border p-4 w-64 z-30">
                        <p className="text-sm font-semibold">🔔 New order #A-492</p>
                        <p className="text-xs text-slate-500">2 min ago</p>
                        <hr className="my-2" />
                        <p className="text-sm font-semibold">✅ Order #A-480 is ready</p>
                        <p className="text-xs text-slate-500">5 min ago</p>
                    </div>
                )}
                <div className="px-4 pb-4 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                        <input type="text" placeholder="Search orders..." className="w-full h-11 bg-white border-none rounded-xl pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 shadow-sm" />
                    </div>
                    <button className="size-11 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600"><SlidersHorizontal className="size-5" /></button>
                </div>
                <div className="flex gap-3 px-4 pb-3 overflow-x-auto no-scrollbar">
                    {['All', 'Express', 'Pickup', 'Delivery'].map(f => (
                        <button key={f} onClick={() => setFilterType(f)} className={`h-9 px-5 rounded-full text-sm font-medium transition-colors shrink-0 ${filterType === f ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-slate-100'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </header>
            <main className="p-4 space-y-8 pb-24 overflow-y-auto">
                {sections.map(section => (
                    <section key={section.status}>
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className={`font-bold flex items-center gap-2 ${section.color === 'blue' ? 'text-blue-600' : section.color === 'orange' ? 'text-orange-600' : 'text-emerald-600'}`}>
                                <span className={`size-2 rounded-full ${section.color === 'blue' ? 'bg-blue-500 animate-pulse' : section.color === 'orange' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                                {section.title} ({filteredOrders(section.status).length})
                            </h3>
                            {section.status === 'new' && filteredOrders('new').length > 0 && <span className="text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Urgent</span>}
                        </div>
                        <div className="space-y-3">
                            {filteredOrders(section.status).map(order => (
                                <div key={order.id} onClick={() => navigate(`/order/${order.id}`, { state: { from: '/dashboard' } })} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 cursor-pointer active:scale-[0.98] transition-transform ${section.color === 'blue' ? 'border-blue-500' : section.color === 'orange' ? 'border-orange-500' : 'border-emerald-500'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-left">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">#{order.orderNumber}</span>
                                            <h4 className="font-bold text-slate-900">{order.items.map(i => i.name).join(', ')}</h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-medium text-slate-400">{order.type}</p>
                                            <p className={`text-sm font-bold ${section.color === 'blue' ? 'text-blue-600' : section.color === 'orange' ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                {order.status === 'preparing' ? 'In Progress' : order.pickupTime ? new Date(order.pickupTime).toLocaleTimeString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    {order.status === 'preparing' && <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4 overflow-hidden"><div className="bg-orange-500 h-full w-2/3" /></div>}
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{order.items.length} Items</span>
                                        {order.isPrepaid && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">Prepaid</span>}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateStatus(order.id, section.nextStatus);
                                        }}
                                        className={`w-full text-white font-bold py-2.5 rounded-lg text-sm transition-colors ${section.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : section.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                    >
                                        {section.buttonText}
                                    </button>
                                </div>
                            ))}
                            {filteredOrders(section.status).length === 0 && <div className="text-center text-slate-400 py-6 text-sm">No orders</div>}
                        </div>
                    </section>
                ))}
            </main>
        </div>
    );
}