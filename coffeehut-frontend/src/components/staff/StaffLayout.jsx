import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, Settings as SettingsIcon } from 'lucide-react';

export default function StaffLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { id: 'archive', label: 'Archive', icon: History, path: '/archive' },
        { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' },
    ];

    const currentPath = location.pathname;
    const activeTab = tabs.find(tab => currentPath.startsWith(tab.path))?.id || 'dashboard';

    return (
        <div className="flex flex-col h-screen">
            <div className="flex-1 overflow-y-auto pb-20">
                <Outlet />
            </div>
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