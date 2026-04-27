// Inventory.jsx — Inventory Management Page -WeiqiWang
// Now backed by real API: GET/PATCH /api/staff/inventory
// Changes are persisted to DB and reflected in customer menu immediately.

import { useState, useEffect, useCallback } from 'react';
import { Coffee, Search, AlertTriangle, CheckCircle2, XCircle, Minus, Plus, Power, Bell, AlertCircle } from 'lucide-react';

const INVENTORY_API = 'http://localhost:8080/api/staff/inventory';
const LOW_STOCK_THRESHOLD = 5;

function getItemState(item) {
    if (!item.available && item.available !== undefined && item.isAvailable === false) return 'offline';
    // Handle both 'available' (frontend) and 'isAvailable' (backend field name) -WeiqiWang
    const avail = item.available ?? item.isAvailable ?? true;
    if (!avail)                                                    return 'offline';
    const stock = item.stock ?? null;
    if (stock !== null && stock === 0)                             return 'out';
    if (stock !== null && stock >= 1 && stock <= LOW_STOCK_THRESHOLD) return 'low';
    return 'ok';
}

const STATE_CONFIG = {
    ok:      { label: 'In Stock',     color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-500', iconBg: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2 },
    low:     { label: 'Low Stock',    color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-500',   iconBg: 'bg-amber-100 text-amber-600',     icon: AlertTriangle },
    out:     { label: 'Out of Stock', color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-500',     iconBg: 'bg-red-100 text-red-500',         icon: XCircle },
    offline: { label: 'Offline',      color: 'text-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-300',   iconBg: 'bg-slate-100 text-slate-500',     icon: Power },
};

function deriveAlerts(items) {
    return items
        .filter(item => {
            const avail = item.available ?? item.isAvailable ?? true;
            const stock = item.stock ?? null;
            return avail && (stock === 0 || (stock !== null && stock >= 1 && stock <= LOW_STOCK_THRESHOLD));
        })
        .map(item => ({ id: item.id, name: item.name, type: (item.stock ?? 1) === 0 ? 'out' : 'low' }));
}

// Normalise backend item shape to a consistent local shape -WeiqiWang
function normalise(item) {
    return {
        ...item,
        available: item.isAvailable ?? item.available ?? true,
        stock:     item.stock ?? null,
    };
}

export default function Inventory() {
    const [items,             setItems]             = useState([]);
    const [loading,           setLoading]           = useState(true);
    const [searchKeyword,     setSearchKeyword]     = useState('');
    const [filterType,        setFilterType]        = useState('All');
    const [notificationOpen,  setNotificationOpen]  = useState(false);
    // Track which item is currently being saved to show per-item loading state -WeiqiWang
    const [savingId,          setSavingId]          = useState(null);

    // Load all items from backend on mount -WeiqiWang
    const loadItems = useCallback(async () => {
        try {
            const res  = await fetch(INVENTORY_API);
            const data = await res.json();
            setItems(data.map(normalise));
        } catch (err) {
            console.error('Failed to load inventory:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadItems(); }, [loadItems]);

    // Persist a single field change to the backend, then update local state -WeiqiWang
    const patchItem = async (id, updates) => {
        setSavingId(id);
        try {
            const res  = await fetch(`${INVENTORY_API}/${id}`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(updates),
            });
            if (res.ok) {
                const updated = await res.json();
                setItems(prev => prev.map(it => it.id === id ? normalise(updated) : it));
            }
        } catch (err) {
            console.error('Failed to update item:', err);
        } finally {
            setSavingId(null);
        }
    };

    const handleStockChange = (id, delta) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        const newStock = Math.max(0, (item.stock ?? 0) + delta);
        // Optimistic update -WeiqiWang
        setItems(prev => prev.map(it => it.id === id ? { ...it, stock: newStock } : it));
        patchItem(id, { stock: newStock });
    };

    const handleStockInput = (id, value) => {
        const parsed  = parseInt(value, 10);
        const clamped = isNaN(parsed) ? 0 : Math.max(0, parsed);
        setItems(prev => prev.map(it => it.id === id ? { ...it, stock: clamped } : it));
        patchItem(id, { stock: clamped });
    };

    const handleToggleAvailability = (id) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        const newAvail = !item.available;
        setItems(prev => prev.map(it => it.id === id ? { ...it, available: newAvail } : it));
        patchItem(id, { isAvailable: newAvail });
    };

    const alertItems = deriveAlerts(items);

    const handleAlertClick = (type) => { setFilterType(type === 'out' ? 'Out' : 'Low'); setNotificationOpen(false); };

    const applySearch = (list) => {
        if (!searchKeyword.trim()) return list;
        const kw = searchKeyword.toLowerCase();
        return list.filter(i => i.name.toLowerCase().includes(kw));
    };

    const filteredItems = applySearch(items.filter(item => {
        if (filterType === 'All')       return true;
        const state = getItemState(item);
        if (filterType === 'Available') return state === 'ok' || state === 'low';
        if (filterType === 'Low')       return state === 'low';
        if (filterType === 'Out')       return state === 'out';
        if (filterType === 'Offline')   return state === 'offline';
        return true;
    }));

    const summary = {
        total:   items.length,
        ok:      items.filter(i => getItemState(i) === 'ok').length,
        low:     items.filter(i => getItemState(i) === 'low').length,
        out:     items.filter(i => getItemState(i) === 'out').length,
        offline: items.filter(i => getItemState(i) === 'offline').length,
    };

    return (
        <div className="flex flex-col h-full">
            <header className="sticky top-0 z-20 bg-background-light/80 backdrop-blur-md border-b border-primary/10">
                <div className="flex items-center p-4">
                    <div className="bg-primary/10 p-2 rounded-lg mr-3"><Coffee className="text-primary size-6" /></div>
                    <h2 className="text-lg font-bold flex-1 text-left">Inventory</h2>
                    <div className="relative">
                        <button onClick={() => setNotificationOpen(!notificationOpen)} className="bg-primary/10 p-2 rounded-full text-primary relative">
                            <Bell className="size-6" />
                            {alertItems.length > 0 && <span className="absolute -top-1 -right-1 size-3 bg-red-600 rounded-full" />}
                        </button>
                        {notificationOpen && (
                            <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border p-2 w-72 z-30 max-h-96 overflow-y-auto">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Stock Alerts</p>
                                {alertItems.length === 0 && <p className="text-sm text-slate-400 px-3 py-4 text-center">No alerts</p>}
                                {alertItems.map(alert => (
                                    <button key={alert.id} onClick={() => handleAlertClick(alert.type)}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-start gap-2 mb-1 ${alert.type === 'out' ? 'bg-red-50 hover:bg-red-100' : 'bg-amber-50 hover:bg-amber-100'}`}>
                                        <AlertCircle className={`size-3 shrink-0 mt-1 ${alert.type === 'out' ? 'text-red-500' : 'text-amber-500'}`} />
                                        <div className="flex-1">
                                            <p className={`text-sm font-semibold ${alert.type === 'out' ? 'text-red-600' : 'text-amber-600'}`}>{alert.name} · {alert.type === 'out' ? 'Out of Stock' : 'Low Stock'}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{alert.type === 'out' ? 'Tap to view Out of Stock items' : 'Tap to view Low Stock items'}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="px-4 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                        <input type="text" value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} placeholder="Search items..."
                            className="w-full h-11 bg-white border-none rounded-xl pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 shadow-sm" />
                    </div>
                </div>
                <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
                    {[
                        { key: 'All',       label: `All (${summary.total})` },
                        { key: 'Available', label: `Available (${summary.ok + summary.low})` },
                        { key: 'Low',       label: `Low (${summary.low})` },
                        { key: 'Out',       label: `Out (${summary.out})` },
                        { key: 'Offline',   label: `Offline (${summary.offline})` },
                    ].map(f => (
                        <button key={f.key} onClick={() => setFilterType(f.key)}
                            className={`h-9 px-5 rounded-full text-sm font-medium transition-colors shrink-0 ${filterType === f.key ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-slate-100'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </header>

            <main className="p-4 space-y-4 pb-24 overflow-y-auto">
                {loading ? (
                    <div className="text-center text-slate-400 py-12 text-sm">Loading inventory…</div>
                ) : (
                    <>
                        <h3 className="text-primary text-sm font-bold uppercase tracking-wider px-1 text-left">Items ({filteredItems.length})</h3>
                        <div className="space-y-3">
                            {filteredItems.length === 0 ? (
                                <div className="text-center text-slate-400 py-10 text-sm bg-white rounded-xl border border-primary/5">No items match the current filter</div>
                            ) : filteredItems.map(item => {
                                const state = getItemState(item);
                                const cfg   = STATE_CONFIG[state];
                                const Icon  = cfg.icon;
                                const isSaving = savingId === item.id;
                                return (
                                    <div key={item.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${cfg.border} ${state === 'offline' ? 'opacity-70' : ''} ${isSaving ? 'opacity-60' : ''}`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className={`p-2 rounded-lg shrink-0 ${cfg.iconBg}`}><Icon className="size-5" /></div>
                                                <div className="text-left flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-slate-900">{item.name}</h4>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                                                        {isSaving && <span className="text-[10px] text-slate-400">Saving…</span>}
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {!item.available ? 'Manually taken offline'
                                                            : item.stock === 0 ? 'Customers cannot order this item'
                                                            : item.stock !== null ? `${item.stock} in stock`
                                                            : 'Stock not tracked'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div onClick={() => handleToggleAvailability(item.id)}
                                                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors shrink-0 ml-2 ${item.available ? 'bg-primary' : 'bg-slate-300'}`}>
                                                <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${item.available ? 'left-6' : 'left-1'}`} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pl-11">
                                            <span className="text-xs font-medium text-slate-500">Stock:</span>
                                            <div className={`flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-lg ${!item.available ? 'opacity-40' : ''}`}>
                                                <button onClick={() => handleStockChange(item.id, -1)} disabled={!item.available || item.stock === 0 || isSaving}
                                                    className="text-primary p-1 hover:bg-primary/10 rounded disabled:opacity-30 disabled:cursor-not-allowed">
                                                    <Minus className="size-4" />
                                                </button>
                                                <input type="number" min="0" value={item.stock ?? ''} disabled={!item.available || isSaving}
                                                    onChange={e => handleStockInput(item.id, e.target.value)}
                                                    placeholder="—"
                                                    className="w-12 text-center text-sm font-bold bg-transparent outline-none focus:bg-white focus:rounded focus:ring-1 focus:ring-primary/30 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                <button onClick={() => handleStockChange(item.id, 1)} disabled={!item.available || isSaving}
                                                    className="text-primary p-1 hover:bg-primary/10 rounded disabled:opacity-30 disabled:cursor-not-allowed">
                                                    <Plus className="size-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
