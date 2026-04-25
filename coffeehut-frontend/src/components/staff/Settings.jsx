import { useNavigate } from 'react-router-dom';
import { Coffee, Store, Clock, PauseCircle, HelpCircle, LockKeyhole, LogIn, Minus, Plus, ChevronRight } from 'lucide-react';

const MANAGER_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuByjTuOC6eai_yyloPL9UHaYqog5y3ajyf6E56oo0egTeeTrgZjpZp_f7t8GuFbJ0ZV918tCt27VGpjx3RgLd5SOVe73FUGsj4xHoSQvax8ycRdhjwY8xIo0aTyyCdK46gtyOaldNSJQ5BOW9KPb7J3kGlV8jiunlzFsSXhhvS4fBhKrTVPpk8AHcUC7UsQEG5iHWP5VKCqGWx5WDtTtmzwOI0NAwmTdNvQh0LORyoE-hDM41c9C53Dh83fh4u773dTp-eZ-gKE4Cw";

export default function Settings() {
    const navigate = useNavigate();
    const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate('/staff'); };

    return (
        <div className="flex flex-col h-full">
            <header className="sticky top-0 z-10 bg-background-light/80 backdrop-blur-md border-b border-primary/10 p-4 flex items-center gap-3">
                <div className="bg-primary text-white p-2 rounded-lg"><Coffee className="size-6" /></div>
                <div className="text-left"><h1 className="text-lg font-bold leading-none">Settings</h1><p className="text-xs text-primary/60">Whistlestop Coffee Hut</p></div>
                <button className="ml-auto p-2 hover:bg-primary/5 rounded-full"><HelpCircle className="size-6 text-slate-400" /></button>
            </header>
            <main className="p-4 space-y-6 pb-24 overflow-y-auto">
                <section className="space-y-3"><h2 className="text-sm font-bold uppercase tracking-wider text-primary/60 px-1 text-left">Account</h2>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-primary/5"><div className="flex items-center gap-4 mb-6"><img src={MANAGER_AVATAR} alt="Manager" className="size-16 rounded-full border-2 border-primary/20" referrerPolicy="no-referrer" /><div className="flex-1 text-left"><h3 className="text-lg font-bold text-primary">Alex Johnson</h3><p className="text-sm text-slate-500">alex@whistlestop.com</p><span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-tighter">Manager</span></div></div>
                        <div className="grid grid-cols-2 gap-3"><button className="flex items-center justify-center gap-2 py-2.5 px-4 bg-primary/5 text-primary text-sm font-semibold rounded-lg"><LockKeyhole className="size-4" /> Password</button><button onClick={handleLogout} className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 text-red-600 text-sm font-semibold rounded-lg"><LogIn className="size-4 rotate-180" /> Sign Out</button></div>
                    </div>
                </section>
                <section className="space-y-3"><h2 className="text-sm font-bold uppercase tracking-wider text-primary/60 px-1 text-left">Store Settings</h2>
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-primary/5 divide-y divide-primary/5"><div className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><Store className="text-primary/70 size-5" /><span className="font-medium">Store Name</span></div><span className="text-sm text-slate-500">Cramlington Station</span></div>
                        <button onClick={() => navigate('/schedule')} className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors"><div className="flex items-center gap-3"><Clock className="text-primary/70 size-5" /><span className="font-medium">Opening Hours</span></div><ChevronRight className="text-slate-400 size-5" /></button>
                        <div className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><PauseCircle className="text-primary/70 size-5" /><span className="font-medium">Temporary Close</span></div><div className="w-11 h-6 rounded-full bg-slate-200 relative cursor-pointer"><div className="absolute top-1 left-1 size-4 bg-white rounded-full" /></div></div>
                        <div className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><Clock className="text-primary/70 size-5" /><span className="font-medium">Default Prep Time</span></div><div className="flex items-center gap-2 bg-primary/5 px-2 py-1 rounded-lg"><button className="text-primary p-1"><Minus className="size-4" /></button><span className="text-sm font-bold w-12 text-center">10 min</span><button className="text-primary p-1"><Plus className="size-4" /></button></div></div>
                    </div>
                </section>
            </main>
        </div>
    );
}