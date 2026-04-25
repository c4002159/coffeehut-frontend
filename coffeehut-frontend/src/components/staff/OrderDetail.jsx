import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Star, MessageSquare, Play, MoreHorizontal, AlertTriangle, Coffee, Check, Utensils, Package, Handshake } from 'lucide-react';
import { fetchOrderDetail, updateOrderStatus, cancelOrder, addOrderNote } from '../../api';
import { useCountdown } from '../../hooks/useCountdown';

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteText, setNoteText] = useState('');

    useEffect(() => {
        fetchOrderDetail(id).then(setOrder).catch(console.error);
    }, [id]);

    const pickupDate = order?.pickupTime ? new Date(order.pickupTime) : null;
    const countdown = useCountdown(pickupDate);

    const updateStatus = async (newStatus) => {
        try {
            await updateOrderStatus(id, newStatus);
            const updated = await fetchOrderDetail(id);
            setOrder(updated);
        } catch (err) { alert('Failed to update status'); }
    };

    const handleCancel = async () => {
        if (window.confirm('Cancel this order?')) {
            try {
                await cancelOrder(id);
                navigate(location.state?.from || '/dashboard');
            } catch (err) { alert('Failed to cancel order'); }
        }
    };

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        try {
            await addOrderNote(id, noteText);
            const updated = await fetchOrderDetail(id);
            setOrder(updated);
            setShowNoteModal(false);
            setNoteText('');
        } catch (err) { alert('Failed to add note'); }
    };

    const handleBack = () => {
        if (location.state?.from) navigate(location.state.from);
        else navigate(-1);
    };

    if (!order) return <div className="p-8 text-center">Loading...</div>;

    const steps = ['new', 'preparing', 'ready', 'collected'];
    const stepLabels = ['Accepted', 'Preparing', 'Ready', 'Collected'];
    const currentStep = steps.indexOf(order.status);
    const nextStatus = { 'new': 'preparing', 'preparing': 'ready', 'ready': 'collected' };

    return (
        <div className="flex flex-col h-screen">
            <header className="sticky top-0 z-50 bg-white border-b border-primary/10">
                <div className="flex items-center p-4">
                    <button onClick={handleBack} className="text-primary p-2 rounded-full hover:bg-primary/10"><ArrowLeft className="size-6" /></button>
                    <div className="flex-1 text-center"><h2 className="text-lg font-bold">Order #{order.orderNumber}</h2><span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Kitchen Display System</span></div>
                    <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-black tracking-wider rounded-full">PRIORITY: {order.priority?.toUpperCase() || 'N/A'}</span>
                </div>
            </header>
            <main className="p-4 space-y-6 pb-32 overflow-y-auto">
                <section><h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-3 text-left">Customer Info</h3>
                    <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-primary/5 shadow-sm">
                        <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl">{order.customerName?.[0] || '?'}</div>
                        <div className="flex-1 text-left"><p className="font-bold">{order.customerName || 'Unknown'}</p><div className="flex items-center gap-1.5 text-slate-500 text-xs"><Star className="size-3 text-amber-500 fill-amber-500" />Regular</div></div>
                        <button className="bg-primary/10 p-2 rounded-full text-primary" onClick={() => alert('Chat with customer (simulated)')}><MessageSquare className="size-5" /></button>
                    </div>
                </section>
                <section><h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-3 text-left">Pickup Time</h3>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-primary/5 shadow-sm"><div className="bg-primary/10 p-2 rounded-lg text-primary"><Clock className="size-6" /></div><div className="text-left"><p className="font-bold">{order.pickupTime ? new Date(order.pickupTime).toLocaleTimeString() : 'N/A'}</p><p className="text-slate-500 text-xs">Pickup in {countdown}</p></div></div>
                </section>
                <section><h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-4 text-left">Preparation Status</h3>
                    <div className="relative flex justify-between px-2"><div className="absolute top-4 left-4 right-4 h-1 bg-slate-200 -z-0"><div className="h-full bg-primary transition-all duration-500" style={{ width: (currentStep / (steps.length-1)) * 100 + '%' }} /></div>
                        {stepLabels.map((label, idx) => { const isPast = idx <= currentStep; const Icon = [Check, Utensils, Package, Handshake][idx]; return (<div key={label} className="relative z-10 flex flex-col items-center gap-2"><div className={`size-8 rounded-full flex items-center justify-center border-4 border-background-light transition-colors ${isPast ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}><Icon className="size-4" /></div><span className={`text-[10px] font-bold ${isPast ? 'text-primary' : 'text-slate-400'}`}>{label}</span></div>); })}
                    </div>
                </section>
                <section><h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-3 text-left">Order Items ({order.items.length})</h3>
                    <div className="space-y-3">
                        {order.items.map(item => (
                            <div key={item.id} className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex gap-4">
                                <div className="size-16 rounded-lg bg-primary/5 flex items-center justify-center shrink-0"><Coffee className="text-primary size-8" /></div>
                                <div className="flex-1 text-left">
                                    <div className="flex justify-between items-start"><p className="font-bold">{item.name}</p><span className="text-primary font-bold">x{item.quantity}</span></div>
                                    <p className="text-slate-500 text-sm">Size: {item.size}</p>
                                    {item.customizations && item.customizations.length > 0 && (
                                        <ul className="text-slate-500 text-xs mt-1 space-y-0.5">{item.customizations.map(c => <li key={c}>• {c}</li>)}</ul>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                {order.allergies && (
                    <section><h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-3 text-left">Staff Notes & Allergies</h3>
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
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-primary/10 p-4 pb-8">
                <div className="flex gap-3">
                    <button onClick={() => updateStatus(nextStatus[order.status])} className="flex-1 bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <Play className="size-5 fill-white" />{order.status === 'new' ? 'Start Preparing' : order.status === 'preparing' ? 'Mark Ready' : 'Mark Collected'}
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)} className="size-14 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center active:scale-95 transition-transform"><MoreHorizontal className="size-6" /></button>
                        {showMenu && (<div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-lg border p-2 w-48 z-50"><button onClick={() => { handleCancel(); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">Cancel Order</button><button onClick={() => { setShowNoteModal(true); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-primary/5 rounded-lg">Add Note</button></div>)}
                    </div>
                </div>
            </div>
            {showNoteModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl p-6 max-w-sm w-full"><h3 className="text-xl font-bold mb-2">Add Note</h3><textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full border rounded-lg p-3 mb-4" rows={3} placeholder="e.g., Extra napkins, no ice..." /><div className="flex gap-3"><button onClick={() => setShowNoteModal(false)} className="flex-1 py-2 border rounded-lg">Cancel</button><button onClick={handleAddNote} className="flex-1 bg-primary text-white py-2 rounded-lg">Save</button></div></div></div>)}
        </div>
    );
}