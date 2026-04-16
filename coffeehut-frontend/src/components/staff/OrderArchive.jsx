import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, History, ChevronRight } from 'lucide-react';
import { fetchArchivedOrders, searchArchivedOrders } from '../../api';

export default function OrderArchive() {
    const [groups, setGroups] = useState({ TODAY: [], YESTERDAY: [], LAST_7_DAYS: [] });
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const loadArchived = async (search) => {
        setLoading(true);
        try {
            if (search) {
                const data = await searchArchivedOrders(search);
                setGroups({ TODAY: data, YESTERDAY: [], LAST_7_DAYS: [] });
            } else {
                const data = await fetchArchivedOrders();
                setGroups(data);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadArchived(); }, []);

    return (
        <div className="flex flex-col h-full">
            <header className="sticky top-0 z-10 bg-background-light/80 backdrop-blur-md border-b border-primary/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/dashboard')} className="text-primary p-2 rounded-full hover:bg-primary/10"><ArrowLeft className="size-6" /></button>
                    <h1 className="text-xl font-bold tracking-tight">Order Archive</h1>
                </div>
                <button onClick={() => loadArchived(keyword)} className="text-primary p-2 rounded-full hover:bg-primary/10"><Search className="size-6" /></button>
            </header>
            <div className="p-4">
                <input type="text" placeholder="Search by order number or customer name" value={keyword} onChange={e => setKeyword(e.target.value)} onKeyPress={e => e.key === 'Enter' && loadArchived(keyword)} className="w-full p-3 border border-primary/20 rounded-lg bg-white" />
            </div>
            <main className="flex-1 pb-24 overflow-y-auto">
                {loading && <div className="text-center py-8">Loading...</div>}
                {!loading && Object.entries(groups).map(([title, orders]) => orders.length > 0 && (
                    <section key={title} className="mt-6">
                        <h2 className="px-4 text-sm font-bold uppercase tracking-wider text-primary/60 mb-3 text-left">{title}</h2>
                        <div className="flex flex-col gap-px bg-primary/5">
                            {orders.map(order => (
                                <div key={order.id} onClick={() => navigate(`/order/${order.id}`, { state: { from: '/archive' } })} className="bg-white px-4 py-4 flex items-center justify-between active:bg-primary/5 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="bg-primary/10 p-2 rounded-lg text-primary"><History className="size-6" /></div>
                                        <div>
                                            <p className="font-bold">#{order.orderNumber}</p>
                                            <p className="text-sm text-slate-500">{order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || '-'}</p>
                                            <p className="text-xs text-primary font-medium mt-1">Completed</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-400 size-5" />
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
                {!loading && groups.TODAY.length === 0 && groups.YESTERDAY.length === 0 && groups.LAST_7_DAYS.length === 0 && <div className="text-center text-slate-400 py-12">No archived orders found</div>}
            </main>
        </div>
    );
}