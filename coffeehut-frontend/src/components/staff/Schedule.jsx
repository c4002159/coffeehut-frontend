import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Store, PauseCircle, PlusCircle, PartyPopper } from 'lucide-react';

const SCHEDULE_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuCpUOIXm1RvanJ87MDTH8SVcB_BzcwgVGH6NBpVgVYs7iTV6T_kM88KQTVziOZpbAdzqjYCWlkSZG47nr9olPZwwqwa5nIuAlVq-RwxQIfHoWvEgfLTtnEaa4POFd0ZughfD4pe3hc_u-l0sZ-Achn2NJsi4TjHDmhGFuqKXC75Tu-y09WyUdWJjzXtq6HrHmDrXu-heArLGV4OT6GaIQAO-cE30AhAj8aZPmfl-hSXJSlITcbCMVGiwLEyw0crNcjHgSTNj_EapzY";

export default function Schedule() {
    const navigate = useNavigate();
    const openingHours = [
        { day: "Monday - Friday", open: "09:00 AM", close: "06:00 PM", isClosed: false },
        { day: "Saturday", open: "10:00 AM", close: "04:00 PM", isClosed: false },
        { day: "Sunday", open: "Closed All Day", close: "", isClosed: true }
    ];

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center p-4 sticky top-0 z-10 bg-background-light"><button onClick={() => navigate('/settings')} className="text-primary p-2 rounded-full bg-primary/10"><ArrowLeft className="size-6" /></button><h1 className="text-lg font-bold flex-1 text-center pr-10">Manage Schedule</h1></header>
            <main className="p-4 space-y-8 pb-24 overflow-y-auto">
                <section><div className="bg-white rounded-xl shadow-sm border border-primary/5 overflow-hidden"><div className="w-full h-32 bg-center bg-cover relative" style={{ backgroundImage: `url(${SCHEDULE_IMAGE})` }}><div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px]" /><div className="absolute inset-0 flex items-center justify-center"><Store className="text-white size-10" /></div></div><div className="p-5 space-y-4"><div className="flex items-center justify-between"><p className="text-primary text-sm font-semibold uppercase tracking-wider">Live Status</p><span className="size-2 rounded-full bg-green-500 animate-pulse" /></div><h2 className="text-xl font-bold text-left">Currently Open</h2><p className="text-slate-600 text-left">Your business is visible to customers as "Open" until 6:00 PM today.</p><button className="w-full bg-primary text-white font-bold h-12 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"><PauseCircle className="size-5" /> Temporarily Mark Closed</button></div></div></section>
                <section className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Weekly Schedule</h2><span className="text-primary text-sm font-medium">Auto-Sync Enabled</span></div><div className="space-y-3">{openingHours.map(hour => (<div key={hour.day} className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex items-center justify-between"><div className="flex items-center gap-4 text-left"><div className={`p-3 rounded-lg ${hour.isClosed ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'}`}>{hour.isClosed ? <PauseCircle className="size-6" /> : <Calendar className="size-6" />}</div><div><p className="font-semibold">{hour.day}</p><p className={`text-sm ${hour.isClosed ? 'text-slate-500 italic' : 'text-slate-500'}`}>{hour.isClosed ? 'Closed All Day' : `${hour.open} - ${hour.close}`}</p></div></div><button className="px-4 py-1.5 bg-background-light text-slate-700 text-sm font-semibold rounded-lg">Edit</button></div>))}</div></section>
                <section className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Holiday Exceptions</h2><button className="text-primary text-sm font-bold flex items-center gap-1"><PlusCircle className="size-4" /> Add New</button></div><div className="bg-primary/5 border border-dashed border-primary/20 rounded-xl p-8 flex flex-col items-center text-center"><div className="bg-primary/10 p-3 rounded-full mb-3"><PartyPopper className="size-6 text-primary" /></div><p className="font-semibold">No upcoming exceptions</p><p className="text-slate-500 text-sm mt-1">Add special hours for upcoming holidays or company events.</p></div></section>
            </main>
        </div>
    );
}