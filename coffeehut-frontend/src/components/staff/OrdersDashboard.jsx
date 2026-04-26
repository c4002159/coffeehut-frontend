// OrdersDashboard.jsx — Orders Dashboard / 订单看板页面 -WeiqiWang

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Bell, Search, AlertCircle } from 'lucide-react';
import { fetchActiveOrders, updateOrderStatus, getOrderOverdueInfo, OVERDUE_THRESHOLDS } from '../../api';

const globalReadIds = new Set();

// Compute the label and value shown in the top-right corner of each order card
// 计算每张订单卡片右上角显示的标签和时间值
function getCardTimeInfo(order, now) {
    const { overdue } = getOrderOverdueInfo(order);

    if (order.status === 'pending') {
        const t = order.createdAt
            ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'N/A';
        return { label: 'Ordered', value: t, color: overdue ? 'text-red-600' : 'text-blue-600' };
    }

    if (order.status === 'in_progress') {
        const startTime = order.acceptedAt
            ? new Date(order.acceptedAt).getTime()
            : new Date(order.createdAt).getTime();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = OVERDUE_THRESHOLDS.in_progress - elapsed;
        if (overdue) return { label: 'Preparing', value: 'Overdue', color: 'text-red-600' };
        const mins = Math.ceil(remaining / 60);
        return { label: 'Preparing', value: `${mins}m left`, color: 'text-orange-600' };
    }

    if (order.status === 'ready') {
        const t = order.readyAt
            ? new Date(order.readyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : order.pickupTime
                ? new Date(order.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'N/A';
        return { label: 'Ready at', value: t, color: 'text-emerald-600' };
    }

    if (order.status === 'collected') {
        const t = order.completedAt
            ? new Date(order.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'N/A';
        return { label: 'Collected', value: t, color: 'text-emerald-600' };
    }

    if (order.status === 'cancelled') {
        const t = order.completedAt
            ? new Date(order.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'N/A';
        return { label: 'Cancelled', value: t, color: 'text-slate-400' };
    }

    return { label: '', value: 'N/A', color: 'text-slate-400' };
}

// props: prepTime (minutes) from App.js / prepTime（分钟）由 App.js 传入
export default function OrdersDashboard({ prepTime = 10 }) {
    const [orders, setOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [filterType, setFilterType] = useState('All');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [readVersion, setReadVersion] = useState(0);
    const knownIdsRef = useRef(new Set());
    const [tick, setTick] = useState(0);
    // Track order IDs already handled by auto-transition to avoid duplicate calls
    // 记录已触发过自动切换的订单 ID，防止在同一个超时周期内重复调用
    const autoHandledRef = useRef(new Set());
    const navigate = useNavigate();

    const markRead = (orderId) => {
        globalReadIds.add(orderId);
        setReadVersion(v => v + 1);
    };

    const loadOrders = useCallback(async () => {
        try {
            const data = await fetchActiveOrders();
            setOrders(data);
            const currentIds = new Set(data.map(o => o.id));
            const newlyAppeared = [...currentIds].filter(id => !knownIdsRef.current.has(id));
            if (newlyAppeared.length > 0) {
                newlyAppeared.forEach(id => globalReadIds.delete(id));
                setReadVersion(v => v + 1);
            }
            knownIdsRef.current = currentIds;
        } catch (err) {
            console.error('Failed to load orders:', err);
        }
    }, []);

    const loadAllOrders = useCallback(async () => {
        try {
            const { fetchArchivedOrders } = await import('../../api');
            const archived = await fetchArchivedOrders();
            const active = await fetchActiveOrders();
            const archivedFlat = [
                ...(archived.TODAY || []),
                ...(archived.YESTERDAY || []),
                ...(archived.LAST_7_DAYS || [])
            ];
            setAllOrders([...active, ...archivedFlat]);
        } catch (err) {
            console.error('Failed to load all orders:', err);
        }
    }, []);

    // Poll every 30 seconds / 每30秒轮询
    useEffect(() => {
        loadOrders();
        loadAllOrders();
        const interval = setInterval(() => { loadOrders(); loadAllOrders(); }, 30000);
        return () => clearInterval(interval);
    }, [loadOrders, loadAllOrders]);

    // 1-second tick / 每秒 tick
    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-transition logic — runs every second via tick
    // 自动状态切换逻辑 — 每秒随 tick 触发检查
    //
    // Rule 1: pending order not accepted within prepTime minutes → auto-cancel
    //         pending 订单超过 prepTime 分钟未接单 → 自动取消
    //
    // Rule 2: ready order not collected within prepTime minutes → auto-collect
    //         ready 订单超过 prepTime 分钟未取走 → 自动完成
    useEffect(() => {
        if (!orders.length) return;
        const now = Date.now();
        const thresholdMs = prepTime * 60 * 1000;

        orders.forEach(order => {
            // Avoid triggering multiple times for the same order in the same cycle
            // 同一个订单在同一超时周期只触发一次
            if (autoHandledRef.current.has(order.id)) return;

            if (order.status === 'pending') {
                const elapsed = now - new Date(order.createdAt).getTime();
                if (elapsed >= thresholdMs) {
                    autoHandledRef.current.add(order.id);
                    updateOrderStatus(order.id, 'cancelled')
                        .then(() => { loadOrders(); loadAllOrders(); })
                        .catch(err => console.error('Auto-cancel failed:', err));
                }
            }

            if (order.status === 'ready') {
                const readyStart = order.readyAt
                    ? new Date(order.readyAt).getTime()
                    : new Date(order.createdAt).getTime();
                const elapsed = now - readyStart;
                if (elapsed >= thresholdMs) {
                    autoHandledRef.current.add(order.id);
                    updateOrderStatus(order.id, 'collected')
                        .then(() => { loadOrders(); loadAllOrders(); })
                        .catch(err => console.error('Auto-collect failed:', err));
                }
            }
        });
    }, [tick, orders, prepTime, loadOrders, loadAllOrders]);

    // Clear auto-handled IDs when orders list refreshes (new order cycle)
    // 订单列表刷新后清理已处理 ID（新订单周期重置）
    useEffect(() => {
        const activeIds = new Set(orders.map(o => o.id));
        autoHandledRef.current.forEach(id => {
            if (!activeIds.has(id)) autoHandledRef.current.delete(id);
        });
    }, [orders]);

    void tick;
    void readVersion;

    const now = Date.now();

    const updateStatus = async (id, newStatus) => {
        try {
            await updateOrderStatus(id, newStatus);
            await loadOrders();
            await loadAllOrders();
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        }
    };

    const hasOverdue = orders.some(o => getOrderOverdueInfo(o).overdue);
    const overdueOrders = orders.filter(o => getOrderOverdueInfo(o).overdue);

    const applySearch = (list) => {
        if (!searchKeyword.trim()) return list;
        const kw = searchKeyword.toLowerCase();
        return list.filter(o =>
            (o.orderNumber && o.orderNumber.toLowerCase().includes(kw)) ||
            (o.customerName && o.customerName.toLowerCase().includes(kw)) ||
            (o.items && o.items.some(i => i.name && i.name.toLowerCase().includes(kw)))
        );
    };

    const getFilteredOrders = (status) => {
        let filtered = applySearch(orders.filter(o => o.status === status));
        if (status === 'pending' || status === 'in_progress') {
            filtered = [...filtered].sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
        }
        return filtered;
    };

    const getAllViewOrders   = () => applySearch([...allOrders]);
    const getFinishedOrders  = () => applySearch(allOrders.filter(o => o.status === 'collected'));
    const getCancelledOrders = () => applySearch(allOrders.filter(o => o.status === 'cancelled'));

    const activeSections = [
        { title: 'New Orders',  status: 'pending',     color: 'blue',    buttonText: 'Accept Order',   nextStatus: 'in_progress' },
        { title: 'Preparing',   status: 'in_progress', color: 'orange',  buttonText: 'Mark Ready',     nextStatus: 'ready' },
        { title: 'Ready',       status: 'ready',       color: 'emerald', buttonText: 'Mark Collected', nextStatus: 'collected' },
    ];

    const borderColor = (status, overdue) => {
        if (overdue) return 'border-red-500';
        if (status === 'pending')     return 'border-blue-500';
        if (status === 'in_progress') return 'border-orange-500';
        if (status === 'ready')       return 'border-emerald-500';
        if (status === 'collected')   return 'border-emerald-400';
        if (status === 'cancelled')   return 'border-slate-300';
        return 'border-slate-300';
    };

    const handleNotificationClick = (orderId) => {
        markRead(orderId);
        navigate(`/order/${orderId}`, { state: { from: '/dashboard' } });
        setNotificationOpen(false);
    };

    const handleCardClick = (orderId) => {
        markRead(orderId);
        navigate(`/order/${orderId}`, { state: { from: '/dashboard' } });
    };

    const renderTimeArea = (order) => {
        const { label, value, color } = getCardTimeInfo(order, now);
        return (
            <div className="text-right">
                <p className="text-xs font-medium text-slate-400">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{value}</p>
            </div>
        );
    };

    const renderAllCard = (order) => {
        const isCancelled = order.status === 'cancelled';
        const isCollected = order.status === 'collected';
        const isActive = ['pending', 'in_progress', 'ready'].includes(order.status);
        const { overdue, reason } = getOrderOverdueInfo(order);
        const sectionMap = {
            pending:     { buttonText: 'Accept Order',   nextStatus: 'in_progress', btnClass: overdue ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700' },
            in_progress: { buttonText: 'Mark Ready',     nextStatus: 'ready',       btnClass: overdue ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700' },
            ready:       { buttonText: 'Mark Collected', nextStatus: 'collected',   btnClass: 'bg-emerald-600 hover:bg-emerald-700' },
        };
        const section = sectionMap[order.status];
        return (
            <div key={order.id} onClick={() => handleCardClick(order.id)}
                className={`bg-white rounded-xl p-4 shadow-sm border-l-4 cursor-pointer active:scale-[0.98] transition-transform ${borderColor(order.status, overdue)}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className="text-left">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">#{order.orderNumber || '---'}</span>
                            {overdue && <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Overdue</span>}
                            {isCancelled && <span className="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Cancelled</span>}
                            {isCollected && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Collected</span>}
                        </div>
                        <h4 className="font-bold text-slate-900">{order.items?.map(i => i.name || 'Unknown').join(', ')}</h4>
                        {overdue && reason && <p className="text-xs text-red-400 mt-0.5">{reason}</p>}
                    </div>
                    {renderTimeArea(order)}
                </div>
                {order.status === 'in_progress' && (
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4 overflow-hidden">
                        <div className="bg-orange-500 h-full w-2/3" />
                    </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{order.items?.length || 0} Items</span>
                    {order.isPrepaid && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">Prepaid</span>}
                </div>
                {isActive && section && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(order.id, section.nextStatus); }}
                        className={`w-full text-white font-bold py-2.5 rounded-lg text-sm transition-colors ${section.btnClass}`}>
                        {section.buttonText}
                    </button>
                )}
            </div>
        );
    };

    const renderReadonlyCard = (order) => {
        const isCollected = order.status === 'collected';
        return (
            <div key={order.id} onClick={() => handleCardClick(order.id)}
                className={`bg-white rounded-xl p-4 shadow-sm border-l-4 cursor-pointer active:scale-[0.98] transition-transform ${isCollected ? 'border-emerald-400' : 'border-slate-300'}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className="text-left">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">#{order.orderNumber || '---'}</span>
                            {isCollected  && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Collected</span>}
                            {!isCollected && <span className="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Cancelled</span>}
                        </div>
                        <h4 className="font-bold text-slate-900">{order.items?.map(i => i.name || 'Unknown').join(', ')}</h4>
                    </div>
                    {renderTimeArea(order)}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{order.items?.length || 0} Items</span>
                    {order.isPrepaid && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">Prepaid</span>}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <header className="sticky top-0 z-20 bg-background-light/80 backdrop-blur-md border-b border-primary/10">
                <div className="flex items-center p-4">
                    <div className="bg-primary/10 p-2 rounded-lg mr-3"><Coffee className="text-primary size-6" /></div>
                    <h2 className="text-lg font-bold flex-1">Orders Dashboard</h2>
                    <div className="relative">
                        <button onClick={() => setNotificationOpen(!notificationOpen)}
                            className="bg-primary/10 p-2 rounded-full text-primary relative">
                            <Bell className="size-6" />
                            {hasOverdue && <span className="absolute -top-1 -right-1 size-3 bg-red-600 rounded-full" />}
                        </button>
                        {notificationOpen && (
                            <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border p-2 w-72 z-30 max-h-96 overflow-y-auto">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Overdue Orders</p>
                                {overdueOrders.length === 0 && <p className="text-sm text-slate-400 px-3 py-4 text-center">No overdue orders</p>}
                                {overdueOrders.map(order => {
                                    const { reason } = getOrderOverdueInfo(order);
                                    return (
                                        <button key={order.id} onClick={() => handleNotificationClick(order.id)}
                                            className="w-full text-left px-3 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors flex items-start gap-2 mb-1">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <AlertCircle className="size-3 text-red-500 shrink-0" />
                                                    <p className="text-sm font-semibold text-red-600">#{order.orderNumber} · Overdue</p>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">{order.items.map(i => i.name).join(', ')}</p>
                                                {reason && <p className="text-xs text-red-400 mt-0.5">{reason}</p>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-4 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                        <input type="text" value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)}
                            placeholder="Search orders..."
                            className="w-full h-11 bg-white border-none rounded-xl pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 shadow-sm" />
                    </div>
                </div>

                <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
                    {['All', 'Active', 'Finished', 'Cancelled'].map(f => (
                        <button key={f} onClick={() => setFilterType(f)}
                            className={`h-9 px-5 rounded-full text-sm font-medium transition-colors shrink-0 ${filterType === f ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-slate-100'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            <main className="p-4 space-y-8 pb-24 overflow-y-auto">

                {filterType === 'All' && (() => {
                    const all = getAllViewOrders();
                    const sortOldFirst = arr => [...arr].sort((a, b) =>
                        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );
                    const allSections = [
                        { title: 'New Orders',       color: 'text-blue-600',    dot: 'bg-blue-500 animate-pulse', orders: sortOldFirst(all.filter(o => o.status === 'pending')) },
                        { title: 'Preparing',        color: 'text-orange-600',  dot: 'bg-orange-500',             orders: sortOldFirst(all.filter(o => o.status === 'in_progress')) },
                        { title: 'Ready',            color: 'text-emerald-600', dot: 'bg-emerald-500',            orders: all.filter(o => o.status === 'ready') },
                        { title: 'Completed Orders', color: 'text-emerald-600', dot: 'bg-emerald-400',            orders: all.filter(o => o.status === 'collected') },
                        { title: 'Cancelled Orders', color: 'text-slate-500',   dot: 'bg-slate-300',              orders: all.filter(o => o.status === 'cancelled') },
                    ];
                    return allSections.map(sec => (
                        <section key={sec.title}>
                            <div className="flex items-center mb-3 px-1">
                                <h3 className={`font-bold flex items-center gap-2 ${sec.color}`}>
                                    <span className={`size-2 rounded-full ${sec.dot}`} />
                                    {sec.title} ({sec.orders.length})
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {sec.orders.length === 0
                                    ? <div className="text-center text-slate-400 py-4 text-sm">No orders</div>
                                    : sec.orders.map(order => renderAllCard(order))
                                }
                            </div>
                        </section>
                    ));
                })()}

                {filterType === 'Active' && activeSections.map(section => (
                    <section key={section.status}>
                        <div className="flex items-center mb-3 px-1">
                            <h3 className={`font-bold flex items-center gap-2 ${section.color === 'blue' ? 'text-blue-600' : section.color === 'orange' ? 'text-orange-600' : 'text-emerald-600'}`}>
                                <span className={`size-2 rounded-full ${section.color === 'blue' ? 'bg-blue-500 animate-pulse' : section.color === 'orange' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                                {section.title} ({getFilteredOrders(section.status).length})
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {getFilteredOrders(section.status).map(order => {
                                const { overdue, reason } = getOrderOverdueInfo(order);
                                return (
                                    <div key={order.id} onClick={() => handleCardClick(order.id)}
                                        className={`bg-white rounded-xl p-4 shadow-sm border-l-4 cursor-pointer active:scale-[0.98] transition-transform ${overdue ? 'border-red-500' : section.color === 'blue' ? 'border-blue-500' : section.color === 'orange' ? 'border-orange-500' : 'border-emerald-500'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-left">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">#{order.orderNumber || '---'}</span>
                                                    {overdue && <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Overdue</span>}
                                                </div>
                                                <h4 className="font-bold text-slate-900">{order.items.map(i => i.name || 'Unknown').join(', ')}</h4>
                                                {overdue && reason && <p className="text-xs text-red-400 mt-0.5">{reason}</p>}
                                            </div>
                                            {renderTimeArea(order)}
                                        </div>
                                        {order.status === 'in_progress' && (
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4 overflow-hidden">
                                                <div className="bg-orange-500 h-full w-2/3" />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{order.items.length} Items</span>
                                            {order.isPrepaid && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">Prepaid</span>}
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); updateStatus(order.id, section.nextStatus); }}
                                            className={`w-full text-white font-bold py-2.5 rounded-lg text-sm transition-colors ${overdue ? 'bg-red-600 hover:bg-red-700' : section.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : section.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                            {section.buttonText}
                                        </button>
                                    </div>
                                );
                            })}
                            {getFilteredOrders(section.status).length === 0 && (
                                <div className="text-center text-slate-400 py-6 text-sm">No orders</div>
                            )}
                        </div>
                    </section>
                ))}

                {filterType === 'Finished' && (
                    <section>
                        <div className="flex items-center mb-3 px-1">
                            <h3 className="font-bold flex items-center gap-2 text-emerald-600">
                                <span className="size-2 rounded-full bg-emerald-400" />
                                Completed Orders ({getFinishedOrders().length})
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {getFinishedOrders().length === 0
                                ? <div className="text-center text-slate-400 py-6 text-sm">No completed orders</div>
                                : getFinishedOrders().map(order => renderReadonlyCard(order))
                            }
                        </div>
                    </section>
                )}

                {filterType === 'Cancelled' && (
                    <section>
                        <div className="flex items-center mb-3 px-1">
                            <h3 className="font-bold flex items-center gap-2 text-slate-500">
                                <span className="size-2 rounded-full bg-slate-300" />
                                Cancelled Orders ({getCancelledOrders().length})
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {getCancelledOrders().length === 0
                                ? <div className="text-center text-slate-400 py-6 text-sm">No cancelled orders</div>
                                : getCancelledOrders().map(order => renderReadonlyCard(order))
                            }
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
