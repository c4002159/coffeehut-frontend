// StaffLayout.jsx — Bottom Navigation Shell / 员工端底部导航布局组件 -WeiqiWang

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, Package, Settings as SettingsIcon } from 'lucide-react';

export default function StaffLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    // Tab definitions — path must match App.js routes
    // 底部导航标签定义 — 路径需与 App.js 路由对应
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { id: 'archive',   label: 'Archive',   icon: History,         path: '/archive' },
        { id: 'inventory', label: 'Inventory', icon: Package,         path: '/inventory' },
        { id: 'settings',  label: 'Settings',  icon: SettingsIcon,    path: '/settings' },
    ];

    const currentPath = location.pathname;
    // Determine active tab by matching current path prefix
    // 通过路径前缀匹配当前激活的标签
    const activeTab = tabs.find(tab => currentPath.startsWith(tab.path))?.id || 'dashboard';

    return (
        <div className="flex flex-col h-screen">
            {/* Page content area — leaves space for fixed bottom nav / 页面内容区，留出底部导航高度 */}
            <div className="flex-1 overflow-y-auto pb-20">
                <Outlet />
            </div>

            {/* Fixed bottom navigation bar / 固定底部导航栏 */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-primary/10 px-4 pb-6 pt-2 z-50">
                <div className="flex justify-around items-end">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === tab.id ? 'text-primary' : 'text-slate-400'}`}
                        >
                            <tab.icon className={`size-6 ${activeTab === tab.id ? 'fill-primary/20' : ''}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
}
