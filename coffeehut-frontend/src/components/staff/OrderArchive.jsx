// OrderArchive.jsx — Order Archive Page -WeiqiWang

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, History, ChevronRight, X, XCircle } from 'lucide-react';
import { fetchArchivedOrders, searchArchivedOrders } from '../../api';

function formatCompletedAt(timeStr, status) {
    if (!timeStr) return 'Unknown time';
    const d = new Date(timeStr);
    const formatted = d.toLocaleString('en-GB', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
    });
    return status === 'cancelled' ? `Cancelled ${formatted}` : `Collected ${formatted}`;
}

export default function OrderArchive() {
    const [groups, setGroups] = useState({ TODAY: [], YESTERDAY: [], LAST_7_DAYS: [] });
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const navigate = useNavigate();

    const loadArchived = async (search) => {
        setLoading(true);
        try {
            if (search && search.trim()) {
                const data = await searchArchivedOrders(search);
                const sorted = [...data].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
                setGroups({ TODAY: sorted, YESTERDAY: [], LAST_7_DAYS: [] });
            } else {
                const data = await fetchArchivedOrders();
                setGroups({
                    TODAY:       [...(data.TODAY       || [])].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)),
                    YESTERDAY:   [...(data.YESTERDAY   || [])].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)),
                    LAST_7_DAYS: [...(data.LAST_7_DAYS || [])].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)),
                });
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadArchived(); }, []);

    useEffect(() => {
        if (keyword === '') loadArchived();
    }, [keyword]);

    const handleToggleSearch = () => {
        setShowSearch(prev => {
            if (prev) setKeyword('');
            return !prev;
        });
    };

    const groupLabels = { TODAY: 'Today', YESTERDAY: 'Yesterday', LAST_7_DAYS: 'Last 7 days' };

    return (
        <div className="flex flex-col h-full">
            <header className="sticky top-0 z-10 bg-background-light/80 backdrop-blur-md border-b border-primary/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/dashboard')} className="text-primary p-2 rounded-full hover:bg-primary/10">
                        <ArrowLeft className="size-6" />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight">Order Archive</h1>
                </div>
                <button onClick={handleToggleSearch}
                    className={`p-2 rounded-full transition-colors ${showSearch ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'}`}>
                    {showSearch ? <X className="size-6" /> : <Search className="size-6" />}
                </button>
            </header>

            {/* Search input — Chinese placeholder removed -WeiqiWang */}
            {showSearch && (
                <div className="px-4 pt-3 pb-2">
                    <input autoFocus type="text"
                        placeholder="Search by order number or customer name"
                        value={keyword}
                        onChange={e => setKeyword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && loadArchived(keyword)}
                        className="w-full p-3 border border-primary/20 rounded-lg bg-white" />
                </div>
            )}

            <main className="flex-1 pb-24 overflow-y-auto">
                {loading && <div className="text-center py-8">Loading...</div>}

                {!loading && Object.entries(groups).map(([key, orders]) => orders.length > 0 && (
                    <section key={key} className="mt-6">
                        <h2 className="px-4 text-sm font-bold uppercase tracking-wider text-primary/60 mb-3 text-left">
                            {groupLabels[key] || key}
                        </h2>
                        <div className="flex flex-col gap-px bg-primary/5">
                            {orders.map(order => {
                                const isCancelled = order.status === 'cancelled';
                                return (
                                    <div key={order.id}
                                        onClick={() => navigate(`/order/${order.id}`, { state: { from: '/archive' } })}
                                        className={`px-4 py-4 flex items-center justify-between active:opacity-80 transition-colors cursor-pointer ${isCancelled ? 'bg-slate-50' : 'bg-white'}`}>
                                        <div className="flex items-center gap-4 text-left">
                                            <div className={`p-2 rounded-lg ${isCancelled ? 'bg-red-50 text-red-400' : 'bg-primary/10 text-primary'}`}>
                                                {isCancelled ? <XCircle className="size-6" /> : <History className="size-6" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-bold ${isCancelled ? 'text-slate-400' : 'text-slate-900'}`}>
                                                        #{order.orderNumber || '---'}
                                                    </p>
                                                    {isCancelled && (
                                                        <span className="text-xs font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                                            Cancelled
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-sm mt-0.5 ${isCancelled ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {order.items?.map(i => `${i.quantity}x ${i.name || 'Unknown'}`).join(', ') || '-'}
                                                </p>
                                                <p className={`text-xs font-medium mt-1 ${isCancelled ? 'text-red-400' : 'text-primary'}`}>
                                                    {formatCompletedAt(order.completedAt, order.status)}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-slate-400 size-5 shrink-0" />
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}

                {!loading && groups.TODAY.length === 0 && groups.YESTERDAY.length === 0 && groups.LAST_7_DAYS.length === 0 && (
                    <div className="text-center text-slate-400 py-12">No archived orders found</div>
                )}
            </main>
        </div>
    );
}
