// Schedule.jsx — Manage Schedule Page -WeiqiWang
// Weekly hours and holiday exceptions are now persisted to DB. -WeiqiWang
// Time inputs use 24-hour format (HH:mm) to avoid AM/PM ambiguity. -WeiqiWang

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Store, PauseCircle, PlusCircle, PartyPopper, Trash2 } from 'lucide-react';

const BASE               = 'http://localhost:8080/api/staff/schedule';
const HOURS_API          = `${BASE}/hours`;
const HOLIDAYS_API       = `${BASE}/holidays`;
const STORE_STATUS_API   = 'http://localhost:8080/api/staff/store/status';
const STORE_STATUS_READ  = 'http://localhost:8080/api/store/status';

const SCHEDULE_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuCpUOIXm1RvanJ87MDTH8SVcB_BzcwgVGH6NBpVgVYs7iTV6T_kM88KQTVziOZpbAdzqjYCWlkSZG47nr9olPZwwqwa5nIuAlVq-RwxQIfHoWvEgfLTtnEaa4POFd0ZughfD4pe3hc_u-l0sZ-Achn2NJsi4TjHDmhGFuqKXC75Tu-y09WyUdWJjzXtq6HrHmDrXu-heArLGV4OT6GaIQAO-cE30AhAj8aZPmfl-hSXJSlITcbCMVGiwLEyw0crNcjHgSTNj_EapzY";

const MINUTES_24 = ['00','05','10','15','20','25','30','35','40','45','50','55'];
const HOURS_24   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')); // 00-23

// Parse "HH:mm" (24-hr). Falls back gracefully for legacy "h:mm AM/PM" values
// already stored in DB so existing data still displays correctly. -WeiqiWang
function parseTime24(str) {
    if (!str || str === 'Closed All Day') return { hour: '09', minute: '00' };
    // Try 24-hr first
    const m24 = str.match(/^(\d{2}):(\d{2})$/);
    if (m24) return { hour: m24[1], minute: m24[2] };
    // Legacy 12-hr fallback (e.g. "9:00 AM" already in DB) -WeiqiWang
    const m12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m12) {
        let h = parseInt(m12[1], 10);
        const period = m12[3].toUpperCase();
        if (period === 'AM' && h === 12) h = 0;
        if (period === 'PM' && h !== 12) h += 12;
        return { hour: String(h).padStart(2, '0'), minute: m12[2] };
    }
    return { hour: '09', minute: '00' };
}

function formatTime24(h, m) { return `${h}:${m}`; }

// Convert "HH:mm" to total minutes for comparison -WeiqiWang
function timeToMinutes24(str) {
    const { hour, minute } = parseTime24(str);
    return parseInt(hour, 10) * 60 + parseInt(minute, 10);
}

// Display helper — show as "09:00" -WeiqiWang
function displayTime(str) {
    if (!str) return '—';
    const { hour, minute } = parseTime24(str);
    return `${hour}:${minute}`;
}

// 24-hour time picker — no AM/PM -WeiqiWang
function TimePicker({ value, onChange }) {
    const { hour, minute } = parseTime24(value);
    const update = (h, m) => onChange(formatTime24(h, m));
    return (
        <div className="flex gap-2 items-center">
            <select value={hour} onChange={e => update(e.target.value, minute)}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                {HOURS_24.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="text-slate-400 font-bold">:</span>
            <select value={minute} onChange={e => update(hour, e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                {MINUTES_24.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>
    );
}

function formatDateRange(startDate, endDate) {
    if (!startDate) return '';
    if (!endDate || endDate === startDate)
        return new Date(startDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const s = new Date(startDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const e = new Date(endDate   + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${s} – ${e}`;
}

// Check if two date ranges overlap -WeiqiWang
function rangesOverlap(s1, e1, s2, e2) {
    return s1 <= e2 && e1 >= s2;
}

// Default rows used while loading / if backend has no data yet -WeiqiWang
const DEFAULT_HOURS = [
    { id: 1, dayLabel: 'Monday - Friday', openTime: '09:00', closeTime: '18:00', isClosed: false },
    { id: 2, dayLabel: 'Saturday',         openTime: '10:00', closeTime: '16:00', isClosed: false },
    { id: 3, dayLabel: 'Sunday',           openTime: null,    closeTime: null,    isClosed: true  },
];

export default function Schedule() {
    const navigate = useNavigate();

    // ── Live Status ───────────────────────────────────────────────────────
    const [isOpen,        setIsOpen]        = useState(true);
    const [statusLoading, setStatusLoading] = useState(false);

    useEffect(() => {
        fetch(STORE_STATUS_READ)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setIsOpen(d.isOpen); })
            .catch(() => {});
    }, []);

    const handleToggleStatus = async () => {
        setStatusLoading(true);
        try {
            const res  = await fetch(STORE_STATUS_API, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isTemporarilyClosed: isOpen }),
            });
            if (res.ok) { const d = await res.json(); setIsOpen(d.isOpen); }
        } catch (e) { console.error('Failed to update store status:', e); }
        finally { setStatusLoading(false); }
    };

    // ── Weekly hours (loaded from DB) ─────────────────────────────────────
    const [openingHours, setOpeningHours] = useState(DEFAULT_HOURS);
    const [hoursLoading, setHoursLoading] = useState(true);

    useEffect(() => {
        fetch(HOURS_API)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d && d.length) setOpeningHours(d); })
            .catch(() => {})
            .finally(() => setHoursLoading(false));
    }, []);

    const persistHours = async (rows) => {
        try {
            await fetch(HOURS_API, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rows),
            });
        } catch (e) { console.error('Failed to save hours:', e); }
    };

    // ── Holiday exceptions (loaded from DB) ───────────────────────────────
    const [holidays,         setHolidays]         = useState([]);
    const [holidaysLoading,  setHolidaysLoading]  = useState(true);

    useEffect(() => {
        fetch(HOLIDAYS_API)
            .then(r => r.ok ? r.json() : [])
            .then(d => setHolidays(d))
            .catch(() => {})
            .finally(() => setHolidaysLoading(false));
    }, []);

    // ── Edit weekly hours modal ───────────────────────────────────────────
    const [editingIndex,  setEditingIndex]  = useState(null);
    const [editOpen,      setEditOpen]      = useState('09:00');
    const [editClose,     setEditClose]     = useState('18:00');
    const [editIsClosed,  setEditIsClosed]  = useState(false);
    const [editTimeError, setEditTimeError] = useState('');

    const handleOpenEdit = (index) => {
        const h = openingHours[index];
        setEditingIndex(index);
        setEditOpen(h.isClosed || h.openTime === null ? '09:00' : h.openTime);
        setEditClose(h.isClosed || h.closeTime === null ? '18:00' : h.closeTime);
        setEditIsClosed(!!h.isClosed);
        setEditTimeError('');
    };

    const handleSaveEdit = async () => {
        if (!editIsClosed && timeToMinutes24(editClose) <= timeToMinutes24(editOpen)) {
            setEditTimeError('Closing time must be later than opening time.'); return;
        }
        const updated = openingHours.map((h, i) => i !== editingIndex ? h : {
            ...h,
            openTime:  editIsClosed ? null : editOpen,
            closeTime: editIsClosed ? null : editClose,
            isClosed:  editIsClosed,
        });
        setOpeningHours(updated);
        setEditingIndex(null);
        setEditTimeError('');
        await persistHours(updated);
    };

    // ── Add holiday modal ─────────────────────────────────────────────────
    const [showHolidayModal, setShowHolidayModal] = useState(false);
    const [holidayStartDate, setHolidayStartDate] = useState('');
    const [holidayEndDate,   setHolidayEndDate]   = useState('');
    const [holidayName,      setHolidayName]      = useState('');
    const [holidayIsClosed,  setHolidayIsClosed]  = useState(true);
    const [holidayOpen,      setHolidayOpen]      = useState('09:00');
    const [holidayClose,     setHolidayClose]     = useState('17:00');
    const [holidayTimeError, setHolidayTimeError] = useState('');

    const handleSaveHoliday = async () => {
        if (!holidayStartDate || !holidayName) { alert('Please fill in date and name'); return; }
        const effectiveEnd = holidayEndDate || holidayStartDate;

        // Check for overlapping date ranges with existing holidays -WeiqiWang
        const overlap = holidays.some(h => {
            if (!h.startDate || !h.endDate) return false;
            return rangesOverlap(holidayStartDate, effectiveEnd, h.startDate, h.endDate);
        });
        if (overlap) { alert('A holiday exception already exists for this date range. Please choose different dates.'); return; }

        if (!holidayIsClosed && timeToMinutes24(holidayClose) <= timeToMinutes24(holidayOpen)) {
            setHolidayTimeError('Closing time must be later than opening time.'); return;
        }
        const body = {
            name: holidayName,
            startDate: holidayStartDate,
            endDate: effectiveEnd,
            isClosed: holidayIsClosed,
            openTime:  holidayIsClosed ? null : holidayOpen,
            closeTime: holidayIsClosed ? null : holidayClose,
        };
        try {
            const res  = await fetch(HOLIDAYS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const saved = await res.json();
            setHolidays(prev => [...prev, saved]);
        } catch (e) { console.error('Failed to save holiday:', e); }
        setHolidayStartDate(''); setHolidayEndDate(''); setHolidayName('');
        setHolidayIsClosed(true); setHolidayOpen('09:00'); setHolidayClose('17:00');
        setHolidayTimeError('');
        setShowHolidayModal(false);
    };

    // ── Edit holiday modal ────────────────────────────────────────────────
    const [editingHoliday,       setEditingHoliday]       = useState(null);
    const [editHolidayIsClosed,  setEditHolidayIsClosed]  = useState(true);
    const [editHolidayOpen,      setEditHolidayOpen]      = useState('09:00');
    const [editHolidayClose,     setEditHolidayClose]     = useState('17:00');
    const [editHolidayTimeError, setEditHolidayTimeError] = useState('');

    const handleOpenEditHoliday = (h) => {
        setEditingHoliday(h);
        setEditHolidayIsClosed(!!h.isClosed);
        setEditHolidayOpen(h.openTime   || '09:00');
        setEditHolidayClose(h.closeTime || '17:00');
        setEditHolidayTimeError('');
    };

    const handleSaveEditHoliday = async () => {
        if (!editHolidayIsClosed && timeToMinutes24(editHolidayClose) <= timeToMinutes24(editHolidayOpen)) {
            setEditHolidayTimeError('Closing time must be later than opening time.'); return;
        }
        try {
            await fetch(`${HOLIDAYS_API}/${editingHoliday.id}`, { method: 'DELETE' });
            const body = { ...editingHoliday, isClosed: editHolidayIsClosed, openTime: editHolidayIsClosed ? null : editHolidayOpen, closeTime: editHolidayIsClosed ? null : editHolidayClose };
            delete body.id;
            const res  = await fetch(HOLIDAYS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const saved = await res.json();
            setHolidays(prev => prev.map(h => h.id === editingHoliday.id ? saved : h));
        } catch (e) { console.error('Failed to update holiday:', e); }
        setEditingHoliday(null); setEditHolidayTimeError('');
    };

    // ── Delete / Clear All ────────────────────────────────────────────────
    const [showDeleteModal,   setShowDeleteModal]   = useState(null);
    const [showClearAllModal, setShowClearAllModal] = useState(false);

    const handleDeleteHoliday = async (id) => {
        try { await fetch(`${HOLIDAYS_API}/${id}`, { method: 'DELETE' }); } catch (e) { console.error(e); }
        setHolidays(prev => prev.filter(h => h.id !== id));
        setShowDeleteModal(null);
    };

    const handleClearAll = async () => {
        try { await fetch(HOLIDAYS_API, { method: 'DELETE' }); } catch (e) { console.error(e); }
        setHolidays([]);
        setShowClearAllModal(false);
    };

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center p-4 sticky top-0 z-10 bg-background-light">
                <button onClick={() => navigate('/settings')} className="text-primary p-2 rounded-full bg-primary/10">
                    <ArrowLeft className="size-6" />
                </button>
                <h1 className="text-lg font-bold flex-1 text-center pr-10">Manage Schedule</h1>
            </header>

            <main className="p-4 space-y-8 pb-24 overflow-y-auto">

                {/* Live Status */}
                <section>
                    <div className="bg-white rounded-xl shadow-sm border border-primary/5 overflow-hidden">
                        <div className="w-full h-32 bg-center bg-cover relative" style={{ backgroundImage: `url(${SCHEDULE_IMAGE})` }}>
                            <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px]" />
                            <div className="absolute inset-0 flex items-center justify-center"><Store className="text-white size-10" /></div>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-primary text-sm font-semibold uppercase tracking-wider">Live Status</p>
                                <span className={`size-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            </div>
                            <h2 className="text-xl font-bold text-left">{isOpen ? 'Currently Open' : 'Temporarily Closed'}</h2>
                            <p className="text-slate-600 text-left">
                                {isOpen ? 'Your business is visible to customers as "Open".'
                                        : 'Your business is currently marked as closed. Customers cannot place orders.'}
                            </p>
                            <button onClick={handleToggleStatus} disabled={statusLoading}
                                className={`w-full font-bold h-12 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${isOpen ? 'bg-primary text-white shadow-primary/20' : 'bg-green-600 text-white shadow-green-600/20'}`}>
                                <PauseCircle className="size-5" />
                                {statusLoading ? 'Updating…' : isOpen ? 'Temporarily Mark Closed' : 'Reopen Store'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Weekly Schedule */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Weekly Schedule</h2>
                        <span className="text-primary text-sm font-medium">Auto-Sync Enabled</span>
                    </div>
                    {hoursLoading ? (
                        <div className="text-center text-slate-400 py-6 text-sm">Loading…</div>
                    ) : (
                        <div className="space-y-3">
                            {openingHours.map((hour, index) => (
                                <div key={hour.id ?? index} className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-left">
                                        <div className={`p-3 rounded-lg ${hour.isClosed ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'}`}>
                                            {hour.isClosed ? <PauseCircle className="size-6" /> : <Calendar className="size-6" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{hour.dayLabel}</p>
                                            <p className={`text-sm ${hour.isClosed ? 'text-slate-500 italic' : 'text-slate-500'}`}>
                                                {hour.isClosed ? 'Closed All Day' : `${displayTime(hour.openTime)} – ${displayTime(hour.closeTime)}`}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleOpenEdit(index)}
                                        className="px-4 py-1.5 bg-background-light text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors">
                                        Edit
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Holiday Exceptions */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Holiday Exceptions</h2>
                        <div className="flex items-center gap-2">
                            {holidays.length > 0 && (
                                <>
                                    <button onClick={() => setShowClearAllModal(true)} className="text-red-500 text-sm font-bold hover:underline">Clear All</button>
                                    <span className="text-slate-300">|</span>
                                </>
                            )}
                            <button onClick={() => { setHolidayTimeError(''); setShowHolidayModal(true); }}
                                className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                                <PlusCircle className="size-4" /> Add New
                            </button>
                        </div>
                    </div>
                    {holidaysLoading ? (
                        <div className="text-center text-slate-400 py-6 text-sm">Loading…</div>
                    ) : holidays.length === 0 ? (
                        <div className="bg-primary/5 border border-dashed border-primary/20 rounded-xl p-8 flex flex-col items-center text-center">
                            <div className="bg-primary/10 p-3 rounded-full mb-3"><PartyPopper className="size-6 text-primary" /></div>
                            <p className="font-semibold">No upcoming exceptions</p>
                            <p className="text-slate-500 text-sm mt-1">Add custom holiday exceptions using the button above.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {holidays.map(h => (
                                <div key={h.id} className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-left flex-1">
                                        <div className="bg-primary/10 p-3 rounded-lg text-primary shrink-0"><PartyPopper className="size-6" /></div>
                                        <div className="flex-1">
                                            <p className="font-semibold">{h.name}</p>
                                            <p className="text-sm text-slate-500">
                                                {formatDateRange(h.startDate, h.endDate)} · {h.isClosed ? 'Closed' : `${displayTime(h.openTime)} – ${displayTime(h.closeTime)}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 ml-2">
                                        <button onClick={() => handleOpenEditHoliday(h)} className="px-3 py-1.5 bg-background-light text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors">Edit</button>
                                        <button onClick={() => setShowDeleteModal(h.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="size-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Edit weekly hours modal */}
            {editingIndex !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-xl font-bold mb-4">Edit {openingHours[editingIndex]?.dayLabel}</h3>
                        <label className="flex items-center gap-2 mb-5 cursor-pointer">
                            <input type="checkbox" checked={editIsClosed} onChange={e => { setEditIsClosed(e.target.checked); setEditTimeError(''); }} className="rounded text-primary border-slate-300" />
                            <span className="text-sm font-medium">Closed All Day</span>
                        </label>
                        {!editIsClosed && (
                            <div className="space-y-4">
                                <div><label className="block text-sm font-medium text-slate-600 mb-2">Open (24h)</label><TimePicker value={editOpen} onChange={v => { setEditOpen(v); setEditTimeError(''); }} /></div>
                                <div><label className="block text-sm font-medium text-slate-600 mb-2">Close (24h)</label><TimePicker value={editClose} onChange={v => { setEditClose(v); setEditTimeError(''); }} /></div>
                                {editTimeError && <p className="text-sm text-red-500 font-medium">{editTimeError}</p>}
                            </div>
                        )}
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setEditingIndex(null); setEditTimeError(''); }} className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={handleSaveEdit} className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add holiday modal */}
            {showHolidayModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-xl font-bold mb-4">Add Holiday Exception</h3>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium text-slate-600 mb-1">Name</label><input type="text" value={holidayName} onChange={e => setHolidayName(e.target.value)} placeholder="e.g. Christmas" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-sm font-medium text-slate-600 mb-1">Start date</label><input type="date" value={holidayStartDate} onChange={e => setHolidayStartDate(e.target.value)} className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
                                <div><label className="block text-sm font-medium text-slate-600 mb-1">End date <span className="text-slate-400 font-normal">(optional)</span></label><input type="date" value={holidayEndDate} onChange={e => setHolidayEndDate(e.target.value)} min={holidayStartDate} className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={holidayIsClosed} onChange={e => { setHolidayIsClosed(e.target.checked); setHolidayTimeError(''); }} className="rounded text-primary border-slate-300" /><span className="text-sm font-medium">Closed All Day</span></label>
                            {!holidayIsClosed && (
                                <div className="space-y-4">
                                    <div><label className="block text-sm font-medium text-slate-600 mb-2">Open (24h)</label><TimePicker value={holidayOpen} onChange={v => { setHolidayOpen(v); setHolidayTimeError(''); }} /></div>
                                    <div><label className="block text-sm font-medium text-slate-600 mb-2">Close (24h)</label><TimePicker value={holidayClose} onChange={v => { setHolidayClose(v); setHolidayTimeError(''); }} /></div>
                                    {holidayTimeError && <p className="text-sm text-red-500 font-medium">{holidayTimeError}</p>}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setShowHolidayModal(false); setHolidayTimeError(''); }} className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={handleSaveHoliday} className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit holiday modal */}
            {editingHoliday && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-xl font-bold mb-1">Edit {editingHoliday.name}</h3>
                        <p className="text-sm text-slate-500 mb-5">{formatDateRange(editingHoliday.startDate, editingHoliday.endDate)}</p>
                        <label className="flex items-center gap-2 mb-5 cursor-pointer"><input type="checkbox" checked={editHolidayIsClosed} onChange={e => { setEditHolidayIsClosed(e.target.checked); setEditHolidayTimeError(''); }} className="rounded text-primary border-slate-300" /><span className="text-sm font-medium">Closed All Day</span></label>
                        {!editHolidayIsClosed && (
                            <div className="space-y-4">
                                <div><label className="block text-sm font-medium text-slate-600 mb-2">Open (24h)</label><TimePicker value={editHolidayOpen} onChange={v => { setEditHolidayOpen(v); setEditHolidayTimeError(''); }} /></div>
                                <div><label className="block text-sm font-medium text-slate-600 mb-2">Close (24h)</label><TimePicker value={editHolidayClose} onChange={v => { setEditHolidayClose(v); setEditHolidayTimeError(''); }} /></div>
                                {editHolidayTimeError && <p className="text-sm text-red-500 font-medium">{editHolidayTimeError}</p>}
                            </div>
                        )}
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setEditingHoliday(null); setEditHolidayTimeError(''); }} className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={handleSaveEditHoliday} className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete holiday confirmation */}
            {showDeleteModal !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <div className="flex items-center justify-center size-12 bg-red-100 rounded-full mx-auto mb-4"><Trash2 className="size-6 text-red-500" /></div>
                        <h3 className="text-lg font-bold text-center mb-1">Remove this holiday?</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">{holidays.find(h => h.id === showDeleteModal)?.name} will be removed.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(null)} className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Keep</button>
                            <button onClick={() => handleDeleteHoliday(showDeleteModal)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Remove</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear All confirmation */}
            {showClearAllModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <div className="flex items-center justify-center size-12 bg-red-100 rounded-full mx-auto mb-4"><Trash2 className="size-6 text-red-500" /></div>
                        <h3 className="text-lg font-bold text-center mb-1">Clear all holidays?</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">All {holidays.length} holiday exception{holidays.length !== 1 ? 's' : ''} will be removed. This cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowClearAllModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={handleClearAll} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Clear All</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
