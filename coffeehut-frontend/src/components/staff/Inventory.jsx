// Inventory.jsx — Inventory Management Page / 员工端库存管理页面 -WeiqiWang
// items state is managed by App.js to persist across page navigation
// items state 由 App.js 管理，切换页面时数据不丢失

import { useState } from 'react';
import { Coffee, Search, AlertTriangle, CheckCircle2, XCircle, Minus, Plus, Power, Bell, AlertCircle } from 'lucide-react';

// Low stock range: 1–5 inclusive / 低库存范围：1到5（含）
const LOW_STOCK_THRESHOLD = 5;

// Effective state of an item / 商品实际状态
function getItemState(item) {
    if (!item.available)                                       return 'offline';
    if (item.stock === 0)                                      return 'out';
    if (item.stock >= 1 && item.stock <= LOW_STOCK_THRESHOLD)  return 'low';
    return 'ok';
}

// State display config / 状态展示配置
const STATE_CONFIG = {
    ok:      { label: 'In Stock',     color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-500', iconBg: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2 },
    low:     { label: 'Low Stock',    color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-500',   iconBg: 'bg-amber-100 text-amber-600',     icon: AlertTriangle },
    out:     { label: 'Out of Stock', color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-500',     iconBg: 'bg-red-100 text-red-500',         icon: XCircle },
    offline: { label: 'Offline',      color: 'text-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-300',   iconBg: 'bg-slate-100 text-slate-500',     icon: Power },
};

// Derive alert list directly from items — no separate state needed
// 直接从 items 派生通知列表，无需单独维护 alert state
// Any item that is 'out' or 'low' while available appears in the bell panel
// available 且状态为 out 或 low 的商品实时出现在铃铛面板中
function deriveAlerts(items) {
    return items
        .filter(item => item.available && (item.stock === 0 || (item.stock >= 1 && item.stock <= LOW_STOCK_THRESHOLD)))
        .map(item => ({
            id:   item.id,
            name: item.name,
            type: item.stock === 0 ? 'out' : 'low',
        }));
}

export default function Inventory({ items, setItems }) {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [notificationOpen, setNotificationOpen] = useState(false);

    // Alerts are always derived from the current items — always in sync, no stale state
    // 通知列表始终从当前 items 派生，永远与库存同步，不存在过期问题
    const alertItems = deriveAlerts(items);

    // Stock stepper / 步进器
    const handleStockChange = (id, delta) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item
        ));
    };

    // Direct stock input / 直接输入库存数量
    const handleStockInput = (id, value) => {
        const parsed = parseInt(value, 10);
        const clamped = isNaN(parsed) ? 0 : Math.max(0, parsed);
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, stock: clamped } : item
        ));
    };

    // Toggle availability / 切换上下架
    const handleToggleAvailability = (id) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, available: !item.available } : item
        ));
    };

    // Click alert → jump to relevant filter tab / 点击通知 → 跳转对应 Tab
    const handleAlertClick = (type) => {
        setFilterType(type === 'out' ? 'Out' : 'Low');
        setNotificationOpen(false);
    };

    // Search filter / 搜索过滤
    const applySearch = (list) => {
        if (!searchKeyword.trim()) return list;
        const kw = searchKeyword.toLowerCase();
        return list.filter(i => i.name.toLowerCase().includes(kw));
    };

    // Tab filter / Tab 过滤
    const filteredItems = applySearch(items.filter(item => {
        if (filterType === 'All')       return true;
        const state = getItemState(item);
        if (filterType === 'Available') return state === 'ok' || state === 'low';
        if (filterType === 'Low')       return state === 'low';
        if (filterType === 'Out')       return state === 'out';
        if (filterType === 'Offline')   return state === 'offline';
        return true;
    }));

    // Summary counters / 汇总数量
    const summary = {
        total:   items.length,
        ok:      items.filter(i => getItemState(i) === 'ok').length,
        low:     items.filter(i => getItemState(i) === 'low').length,
        out:     items.filter(i => getItemState(i) === 'out').length,
        offline: items.filter(i => getItemState(i) === 'offline').length,
    };

    return (
        <div className="flex flex-col h-full">
            {/* Sticky header / 固定顶栏 */}
            <header className="sticky top-0 z-20 bg-background-light/80 backdrop-blur-md border-b border-primary/10">
                <div className="flex items-center p-4">
                    <div className="bg-primary/10 p-2 rounded-lg mr-3">
                        <Coffee className="text-primary size-6" />
                    </div>
                    <h2 className="text-lg font-bold flex-1 text-left">Inventory</h2>

                    {/* Notification bell — derived alerts, always in sync with items
                        通知铃铛 — 实时派生，始终与库存同步 */}
                    <div className="relative">
                        <button
                            onClick={() => setNotificationOpen(!notificationOpen)}
                            className="bg-primary/10 p-2 rounded-full text-primary relative"
                        >
                            <Bell className="size-6" />
                            {alertItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 size-3 bg-red-600 rounded-full" />
                            )}
                        </button>

                        {/* Notification panel / 通知面板 */}
                        {notificationOpen && (
                            <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border p-2 w-72 z-30 max-h-96 overflow-y-auto">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
                                    Stock Alerts
                                </p>
                                {alertItems.length === 0 && (
                                    <p className="text-sm text-slate-400 px-3 py-4 text-center">No alerts</p>
                                )}
                                {alertItems.map(alert => (
                                    <button
                                        key={alert.id}
                                        onClick={() => handleAlertClick(alert.type)}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-start gap-2 mb-1 ${alert.type === 'out' ? 'bg-red-50 hover:bg-red-100' : 'bg-amber-50 hover:bg-amber-100'}`}
                                    >
                                        <AlertCircle className={`size-3 shrink-0 mt-1 ${alert.type === 'out' ? 'text-red-500' : 'text-amber-500'}`} />
                                        <div className="flex-1">
                                            <p className={`text-sm font-semibold ${alert.type === 'out' ? 'text-red-600' : 'text-amber-600'}`}>
                                                {alert.name} · {alert.type === 'out' ? 'Out of Stock' : 'Low Stock'}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {alert.type === 'out'
                                                    ? 'Tap to view Out of Stock items'
                                                    : 'Tap to view Low Stock items'}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Search bar / 搜索框 */}
                <div className="px-4 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                        <input
                            type="text"
                            value={searchKeyword}
                            onChange={e => setSearchKeyword(e.target.value)}
                            placeholder="Search items..."
                            className="w-full h-11 bg-white border-none rounded-xl pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 shadow-sm"
                        />
                    </div>
                </div>

                {/* Filter tabs / 筛选标签 */}
                <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
                    {[
                        { key: 'All',       label: `All (${summary.total})` },
                        { key: 'Available', label: `Available (${summary.ok + summary.low})` },
                        { key: 'Low',       label: `Low (${summary.low})` },
                        { key: 'Out',       label: `Out (${summary.out})` },
                        { key: 'Offline',   label: `Offline (${summary.offline})` },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilterType(f.key)}
                            className={`h-9 px-5 rounded-full text-sm font-medium transition-colors shrink-0 ${filterType === f.key ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-slate-100'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </header>

            <main className="p-4 space-y-4 pb-24 overflow-y-auto">
                <h3 className="text-primary text-sm font-bold uppercase tracking-wider px-1 text-left">
                    Items ({filteredItems.length})
                </h3>

                <div className="space-y-3">
                    {filteredItems.length === 0 ? (
                        <div className="text-center text-slate-400 py-10 text-sm bg-white rounded-xl border border-primary/5">
                            No items match the current filter
                        </div>
                    ) : filteredItems.map(item => {
                        const state = getItemState(item);
                        const cfg = STATE_CONFIG[state];
                        const Icon = cfg.icon;
                        return (
                            <div
                                key={item.id}
                                className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${cfg.border} ${state === 'offline' ? 'opacity-70' : ''}`}
                            >
                                {/* Top row / 顶部行 */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={`p-2 rounded-lg shrink-0 ${cfg.iconBg}`}>
                                            <Icon className="size-5" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-slate-900">{item.name}</h4>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {!item.available
                                                    ? 'Manually taken offline'
                                                    : item.stock === 0
                                                        ? 'Customers cannot order this item'
                                                        : `${item.stock} in stock`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Online / Offline toggle / 上下架开关 */}
                                    <div
                                        onClick={() => handleToggleAvailability(item.id)}
                                        className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors shrink-0 ml-2 ${item.available ? 'bg-primary' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${item.available ? 'left-6' : 'left-1'}`} />
                                    </div>
                                </div>

                                {/* Stock stepper + direct input / 步进器 + 直接输入 */}
                                <div className="flex items-center gap-2 pl-11">
                                    <span className="text-xs font-medium text-slate-500">Stock:</span>
                                    <div className={`flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-lg ${!item.available ? 'opacity-40' : ''}`}>
                                        <button
                                            onClick={() => handleStockChange(item.id, -1)}
                                            disabled={!item.available || item.stock === 0}
                                            className="text-primary p-1 hover:bg-primary/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Minus className="size-4" />
                                        </button>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.stock}
                                            disabled={!item.available}
                                            onChange={e => handleStockInput(item.id, e.target.value)}
                                            className="w-12 text-center text-sm font-bold bg-transparent outline-none focus:bg-white focus:rounded focus:ring-1 focus:ring-primary/30 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button
                                            onClick={() => handleStockChange(item.id, 1)}
                                            disabled={!item.available}
                                            className="text-primary p-1 hover:bg-primary/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Plus className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
