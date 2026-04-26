// OrderDetail.jsx — Order Detail Page / 订单详情页面 -WeiqiWang

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Star, MessageSquare, Play, MoreHorizontal, AlertTriangle, Coffee, Check, Utensils, Package, Handshake, X, RotateCcw } from 'lucide-react';
import { fetchOrderDetail, updateOrderStatus, cancelOrder, addOrderNote, getOrderOverdueInfo, OVERDUE_THRESHOLDS } from '../../api';

function useStepStatusLabel(order) {
    const [label, setLabel] = useState('');
    const [color, setColor] = useState('text-slate-500');
    const [clockBg, setClockBg] = useState('bg-primary/10 text-primary');

    useEffect(() => {
        if (!order) return;
        const update = () => {
            const { overdue } = getOrderOverdueInfo(order);
            const now = Date.now();
            if (order.status === 'collected') {
                setLabel('Order collected'); setColor('text-emerald-600 font-semibold'); setClockBg('bg-emerald-100 text-emerald-600'); return;
            }
            if (order.status === 'cancelled') {
                setLabel('Order cancelled'); setColor('text-red-500 font-semibold'); setClockBg('bg-red-100 text-red-500'); return;
            }
            if (order.status === 'pending') {
                const elapsed = Math.floor((now - new Date(order.createdAt).getTime()) / 1000);
                const remaining = OVERDUE_THRESHOLDS.pending - elapsed;
                if (overdue) {
                    setLabel('Overdue · Awaiting acceptance'); setColor('text-red-500 font-semibold'); setClockBg('bg-red-100 text-red-500');
                } else {
                    const m = Math.floor(remaining / 60), s = remaining % 60;
                    setLabel(`Accept within ${m > 0 ? m + 'm ' : ''}${s}s`); setColor('text-slate-500'); setClockBg('bg-primary/10 text-primary');
                }
                return;
            }
            if (order.status === 'in_progress') {
                const startTime = order.acceptedAt ? new Date(order.acceptedAt).getTime() : new Date(order.createdAt).getTime();
                const elapsed = Math.floor((now - startTime) / 1000);
                const remaining = OVERDUE_THRESHOLDS.in_progress - elapsed;
                if (overdue) {
                    setLabel('Overdue · Taking too long'); setColor('text-red-500 font-semibold'); setClockBg('bg-red-100 text-red-500');
                } else {
                    const m = Math.floor(remaining / 60), s = remaining % 60;
                    setLabel(`Be making within ${m > 0 ? m + 'm ' : ''}${s}s`); setColor('text-slate-500'); setClockBg('bg-primary/10 text-primary');
                }
                return;
            }
            if (order.status === 'ready') {
                setLabel('Ready for pickup'); setColor('text-slate-500'); setClockBg('bg-primary/10 text-primary');
            }
        };
        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [order]);

    return { label, color, clockBg };
}

// Determine the status the order was in when it was cancelled.
// Priority: use cancelledFrom field set by cancelOrder() in api.js (most reliable).
// Fallback: infer from timestamp fields (covers edge cases / real backend).
// 判断订单取消时所处的状态：
//   优先读 cancelledFrom 字段（cancelOrder() 写入，最可靠）
//   退而推断时间戳（兜底，兼容真实后端）
function getCancelledFrom(order) {
    if (!order || order.status !== 'cancelled') return null;
    // Primary: explicit field set by cancelOrder mock
    // 优先：mock cancelOrder 写入的显式字段
    if (order.cancelledFrom) return order.cancelledFrom;
    // Fallback: infer from timestamps
    // 退而：通过时间戳推断
    if (!order.acceptedAt) return 'pending';
    if (!order.readyAt)    return 'in_progress';
    return 'ready';
}

// Label shown in restore confirmation modal / 恢复确认弹窗里显示的目标区域名称
const SECTION_LABEL = {
    pending:     'New Orders',
    in_progress: 'Preparing',
};

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [noteText, setNoteText] = useState('');

    useEffect(() => {
        fetchOrderDetail(id).then(setOrder).catch(console.error);
    }, [id]);

    const isFinished  = order?.status === 'collected' || order?.status === 'cancelled';
    const isCancelled = order?.status === 'cancelled';

    const cancelledFrom = getCancelledFrom(order);
    const canRestore    = isCancelled && (cancelledFrom === 'pending' || cancelledFrom === 'in_progress');
    // Restore target: the exact status the order was in before it was cancelled
    // 恢复目标：取消前的原始状态，不固定为 pending
    const restoreTarget = cancelledFrom;

    const { label: stepLabel, color: stepColor, clockBg } = useStepStatusLabel(order);

    const refreshOrder = async () => {
        const updated = await fetchOrderDetail(id);
        setOrder(updated);
    };

    const updateStatus = async (newStatus) => {
        try { await updateOrderStatus(id, newStatus); await refreshOrder(); }
        catch (err) { alert('Failed to update status'); }
    };

    const handleCancel = async () => {
        try {
            await cancelOrder(id);
            setShowCancelModal(false);
            navigate(location.state?.from || '/dashboard');
        } catch (err) { alert('Failed to cancel order'); }
    };

    // Restore order to its original status (pending or in_progress)
    // 将订单恢复到取消前的原始状态（pending 或 in_progress）
    const handleRestore = async () => {
        try {
            await updateOrderStatus(id, restoreTarget);
            setShowRestoreModal(false);
            await refreshOrder();
        } catch (err) { alert('Failed to restore order'); }
    };

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        try {
            await addOrderNote(id, noteText);
            await refreshOrder();
            setShowNoteModal(false);
            setNoteText('');
        } catch (err) { alert('Failed to add note'); }
    };

    const handleBack = () => {
        if (location.state?.from) navigate(location.state.from);
        else navigate(-1);
    };

    if (!order) return <div className="p-8 text-center">Loading...</div>;

    const steps = ['pending', 'in_progress', 'ready', 'collected'];
    const stepLabels = ['Accepted', 'Preparing', 'Ready', 'Collected'];
    const currentStep = steps.indexOf(order.status);
    const nextStatus = { 'pending': 'in_progress', 'in_progress': 'ready', 'ready': 'collected' };

    const formatPickupTime = (time) => {
        if (!time) return 'N/A';
        return new Date(time).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const actionLabel = () => {
        if (order.status === 'pending')     return 'Start Preparing';
        if (order.status === 'in_progress') return 'Mark Ready';
        if (order.status === 'ready')       return 'Mark Collected';
        return '';
    };

    return (
        <div className="flex flex-col h-screen">
            <header className="sticky top-0 z-50 bg-white border-b border-primary/10">
                <div className="flex items-center p-4">
                    <button onClick={handleBack} className="text-primary p-2 rounded-full hover:bg-primary/10">
                        <ArrowLeft className="size-6" />
                    </button>
                    <div className="flex-1 text-center">
                        <h2 className="text-lg font-bold">Order #{order.orderNumber || '---'}</h2>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Kitchen Display System</span>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="p-4 space-y-6 pb-32 overflow-y-auto">
                {/* Customer Info */}
                <section>
                    <h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-3 text-left">Customer Info</h3>
                    <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-primary/5 shadow-sm">
                        <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl">{order.customerName?.[0] || '?'}</div>
                        <div className="flex-1 text-left">
                            <p className="font-bold">{order.customerName || 'Unknown'}</p>
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                <Star className="size-3 text-amber-500 fill-amber-500" />Regular
                            </div>
                        </div>
                        <button className="bg-primary/10 p-2 rounded-full text-primary" onClick={() => alert('Chat with customer (simulated)')}>
                            <MessageSquare className="size-5" />
                        </button>
                    </div>
                </section>

                {/* Pickup Time */}
                <section>
                    <h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-3 text-left">Pickup Time</h3>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-primary/5 shadow-sm">
                        <div className={`p-2 rounded-lg ${clockBg}`}><Clock className="size-6" /></div>
                        <div className="text-left">
                            <p className="font-bold">{formatPickupTime(order.pickupTime)}</p>
                            <p className={`text-xs ${stepColor}`}>{stepLabel}</p>
                        </div>
                    </div>
                </section>

                {/* Preparation Status */}
                <section>
                    <h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-4 text-left">Preparation Status</h3>
                    <div className="relative flex justify-between px-2">
                        <div className="absolute top-4 left-4 right-4 h-1 bg-slate-200 -z-0">
                            {!isCancelled && (
                                <div className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} />
                            )}
                        </div>
                        {stepLabels.map((label, idx) => {
                            const isPast = !isCancelled && idx <= currentStep;
                            const Icon = [Check, Utensils, Package, Handshake][idx];
                            return (
                                <div key={label} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`size-8 rounded-full flex items-center justify-center border-4 border-background-light transition-colors ${isPast ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
                                        <Icon className="size-4" />
                                    </div>
                                    <span className={`text-[10px] font-bold ${isPast ? 'text-primary' : 'text-slate-400'}`}>{label}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Order Items */}
                <section>
                    <h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-3 text-left">Order Items ({order.items.length})</h3>
                    <div className="space-y-3">
                        {order.items.map(item => (
                            <div key={item.id} className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex gap-4">
                                <div className="size-16 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                                    <Coffee className="text-primary size-8" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold">{item.name || 'Unknown item'}</p>
                                        <span className="text-primary font-bold">x{item.quantity}</span>
                                    </div>
                                    <p className="text-slate-500 text-sm">Size: {item.size}</p>
                                    {item.customizations && item.customizations.length > 0 && (
                                        <ul className="text-slate-500 text-xs mt-1 space-y-0.5">
                                            {item.customizations.map(c => <li key={c}>• {c}</li>)}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Allergy alert */}
                {order.allergies && (
                    <section>
                        <h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-3 text-left">Staff Notes & Allergies</h3>
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                            <AlertTriangle className="text-amber-600 shrink-0" />
                            <div className="text-left">
                                <p className="text-amber-800 font-bold text-sm">Allergy Alert</p>
                                <p className="text-amber-700 text-xs mt-1 leading-relaxed">{order.allergies}</p>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* Bottom action bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-primary/10 p-4 pb-8">
                <div className="flex gap-3">
                    {!isFinished && (
                        <button onClick={() => updateStatus(nextStatus[order.status])}
                            className="flex-1 bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                            <Play className="size-5 fill-white" />{actionLabel()}
                        </button>
                    )}
                    {order.status === 'collected' && (
                        <div className="flex-1 bg-emerald-50 text-emerald-600 font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-emerald-200">
                            <Check className="size-5" /> Order Collected
                        </div>
                    )}
                    {isCancelled && (
                        <>
                            <div className={`bg-red-50 text-red-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-red-200 ${canRestore ? 'flex-none px-4' : 'flex-1'}`}>
                                <X className="size-4" />
                                <span className={canRestore ? 'text-sm' : ''}>Order Cancelled</span>
                            </div>
                            {canRestore && (
                                <button onClick={() => setShowRestoreModal(true)}
                                    className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-blue-700">
                                    <RotateCcw className="size-4" /> Restore Order
                                </button>
                            )}
                        </>
                    )}
                    <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)}
                            className="size-14 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center active:scale-95 transition-transform">
                            <MoreHorizontal className="size-6" />
                        </button>
                        {showMenu && (
                            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-lg border p-2 w-48 z-50">
                                {/* Cancel only available for pending and in_progress, NOT ready
                                    仅 pending 和 in_progress 可取消，ready 不允许 */}
                                {(order.status === 'pending' || order.status === 'in_progress') && (
                                    <button onClick={() => { setShowCancelModal(true); setShowMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                                        Cancel Order
                                    </button>
                                )}
                                <button onClick={() => { setShowNoteModal(true); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-2 hover:bg-primary/5 rounded-lg">
                                    Add Note
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cancel modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <div className="flex items-center justify-center size-12 bg-red-100 rounded-full mx-auto mb-4">
                            <X className="size-6 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-center mb-1">Cancel this order?</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">
                            Order #{order.orderNumber} will be cancelled. You can restore it afterwards if needed.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                Keep Order
                            </button>
                            <button onClick={handleCancel}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Restore modal */}
            {showRestoreModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <div className="flex items-center justify-center size-12 bg-blue-100 rounded-full mx-auto mb-4">
                            <RotateCcw className="size-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-center mb-1">Restore this order?</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">
                            Order #{order.orderNumber} will be moved back to{' '}
                            <span className="font-semibold">{SECTION_LABEL[restoreTarget]}</span>.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowRestoreModal(false)}
                                className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                Keep Cancelled
                            </button>
                            <button onClick={handleRestore}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                                Restore
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Note modal */}
            {showNoteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-xl font-bold mb-2">Add Note</h3>
                        <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
                            className="w-full border rounded-lg p-3 mb-4" rows={3} placeholder="e.g., Extra napkins, no ice..." />
                        <div className="flex gap-3">
                            <button onClick={() => setShowNoteModal(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                            <button onClick={handleAddNote} className="flex-1 bg-primary text-white py-2 rounded-lg">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
