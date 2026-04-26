import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Store, PauseCircle, PlusCircle, PartyPopper, Trash2, Download, Check } from 'lucide-react';

const SCHEDULE_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuCpUOIXm1RvanJ87MDTH8SVcB_BzcwgVGH6NBpVgVYs7iTV6T_kM88KQTVziOZpbAdzqjYCWlkSZG47nr9olPZwwqwa5nIuAlVq-RwxQIfHoWvEgfLTtnEaa4POFd0ZughfD4pe3hc_u-l0sZ-Achn2NJsi4TjHDmhGFuqKXC75Tu-y09WyUdWJjzXtq6HrHmDrXu-heArLGV4OT6GaIQAO-cE30AhAj8aZPmfl-hSXJSlITcbCMVGiwLEyw0crNcjHgSTNj_EapzY";

const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

function parseTime(str) {
    if (!str || str === 'Closed All Day') return { hour: '9', minute: '00', period: 'AM' };
    const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return { hour: '9', minute: '00', period: 'AM' };
    return { hour: String(parseInt(match[1], 10)), minute: match[2], period: match[3].toUpperCase() };
}

function formatTime(hour, minute, period) {
    return `${hour}:${minute} ${period}`;
}

function TimePicker({ value, onChange }) {
    const { hour, minute, period } = parseTime(value);
    const update = (h, m, p) => onChange(formatTime(h, m, p));
    return (
        <div className="flex gap-2 items-center">
            <select value={hour} onChange={e => update(e.target.value, minute, period)}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="text-slate-400 font-bold">:</span>
            <select value={minute} onChange={e => update(hour, e.target.value, period)}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                {['AM', 'PM'].map(p => (
                    <button key={p} type="button" onClick={() => update(hour, minute, p)}
                        className={`px-3 py-2.5 text-sm font-semibold transition-colors ${period === p ? 'bg-primary text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                        {p}
                    </button>
                ))}
            </div>
        </div>
    );
}

// 格式化单个日期：2026-04-10 → 10 Apr
function formatShortDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// 格式化日期范围显示：startDate – endDate Year（同年只显示一次年份）
function formatDateRange(startDate, endDate) {
    if (!startDate) return '';
    if (!endDate || endDate === startDate) {
        const d = new Date(startDate + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const startStr = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startStr} – ${endStr}`;
}

// 把 UK API 返回的连续节假日合并成假期段
// 例：Good Friday(3 Apr) + Easter Monday(6 Apr) → 不合并（不连续）
// Christmas Day(25 Dec) + Boxing Day(26 Dec) → 合并成 Christmas · 25-26 Dec
function groupUKHolidays(holidays) {
    if (!holidays.length) return [];

    // 先按日期排序
    const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date));
    const groups = [];

    sorted.forEach(h => {
        const prev = groups[groups.length - 1];
        if (!prev) {
            groups.push({ name: h.localName, startDate: h.date, endDate: h.date, dates: [h.date] });
            return;
        }

        // 判断是否是连续的一天（前一天的第二天）
        const prevEnd = new Date(prev.endDate + 'T00:00:00');
        const curr = new Date(h.date + 'T00:00:00');
        const diffDays = Math.round((curr - prevEnd) / (1000 * 60 * 60 * 24));

        // 连续（间隔1天）且名称相关（Christmas/Boxing、Bank Holiday 组合等）→ 合并
        const relatedNames = [
            ['Christmas Day', 'Boxing Day'],
        ];
        const isRelated = relatedNames.some(pair =>
            pair.includes(prev.dates[0] === prev.endDate ? h.localName : '') ||
            (pair.some(n => prev.name.includes(n.split(' ')[0])) && pair.some(n => h.localName.includes(n.split(' ')[0])))
        );

        if (diffDays === 1 && isRelated) {
            // 合并：名称取第一个的前缀（去掉 Day/Monday 等）
            prev.endDate = h.date;
            prev.dates.push(h.date);
            prev.name = 'Christmas'; // 专门处理 Christmas + Boxing
        } else {
            groups.push({ name: h.localName, startDate: h.date, endDate: h.date, dates: [h.date] });
        }
    });

    return groups;
}

export default function Schedule() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(true);

    const [openingHours, setOpeningHours] = useState([
        { day: "Monday - Friday", open: "9:00 AM", close: "6:00 PM", isClosed: false },
        { day: "Saturday", open: "10:00 AM", close: "4:00 PM", isClosed: false },
        { day: "Sunday", open: "Closed All Day", close: "", isClosed: true }
    ]);

    const [holidays, setHolidays] = useState([]);

    // 编辑每周时间弹窗
    const [editingIndex, setEditingIndex] = useState(null);
    const [editOpen, setEditOpen] = useState('9:00 AM');
    const [editClose, setEditClose] = useState('6:00 PM');
    const [editIsClosed, setEditIsClosed] = useState(false);

    // 手动新增假日弹窗
    const [showHolidayModal, setShowHolidayModal] = useState(false);
    const [holidayStartDate, setHolidayStartDate] = useState('');
    const [holidayEndDate, setHolidayEndDate] = useState('');
    const [holidayName, setHolidayName] = useState('');
    const [holidayIsClosed, setHolidayIsClosed] = useState(true);
    const [holidayOpen, setHolidayOpen] = useState('9:00 AM');
    const [holidayClose, setHolidayClose] = useState('5:00 PM');

    // 编辑已有假日弹窗
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [editHolidayIsClosed, setEditHolidayIsClosed] = useState(true);
    const [editHolidayOpen, setEditHolidayOpen] = useState('9:00 AM');
    const [editHolidayClose, setEditHolidayClose] = useState('5:00 PM');

    const [showDeleteModal, setShowDeleteModal] = useState(null);

    // UK 节假日导入
    const [showImportModal, setShowImportModal] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState('');
    const [ukGroups, setUkGroups] = useState([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState(new Set());

    const fetchUKHolidays = async () => {
        setImportLoading(true);
        setImportError('');
        setUkGroups([]);
        setSelectedGroupIds(new Set());
        try {
            const year = new Date().getFullYear();
            const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/GB`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            // 只取 England 适用的
            const filtered = data.filter(h =>
                !h.counties || h.counties.some(c => c === 'GB-ENG' || c === 'GB-WLS')
            );
            // 合并连续假期
            const groups = groupUKHolidays(filtered);
            // 过滤掉已添加的（只要 startDate 重复就算已添加）
            const existingStarts = new Set(holidays.map(h => h.startDate));
            const available = groups.filter(g => !existingStarts.has(g.startDate));
            setUkGroups(available);
            setSelectedGroupIds(new Set(available.map(g => g.startDate)));
        } catch {
            setImportError('Unable to load UK holidays. Please check your network and try again.');
        } finally {
            setImportLoading(false);
        }
    };

    const openImportModal = () => {
        setShowImportModal(true);
        fetchUKHolidays();
    };

    const toggleGroupSelect = (startDate) => {
        setSelectedGroupIds(prev => {
            const next = new Set(prev);
            next.has(startDate) ? next.delete(startDate) : next.add(startDate);
            return next;
        });
    };

    const handleImportSelected = () => {
        const toImport = ukGroups
            .filter(g => selectedGroupIds.has(g.startDate))
            .map(g => ({
                id: Date.now() + Math.random(),
                name: g.name,
                startDate: g.startDate,
                endDate: g.endDate,
                isClosed: true,
                open: '',
                close: ''
            }));
        setHolidays(prev => [...prev, ...toImport]);
        setShowImportModal(false);
    };

    const handleOpenEdit = (index) => {
        const h = openingHours[index];
        setEditingIndex(index);
        setEditOpen(h.isClosed ? '9:00 AM' : h.open);
        setEditClose(h.isClosed ? '6:00 PM' : h.close);
        setEditIsClosed(h.isClosed);
    };

    const handleSaveEdit = () => {
        const updated = [...openingHours];
        updated[editingIndex] = {
            ...updated[editingIndex],
            open: editIsClosed ? 'Closed All Day' : editOpen,
            close: editIsClosed ? '' : editClose,
            isClosed: editIsClosed
        };
        setOpeningHours(updated);
        setEditingIndex(null);
    };

    const handleSaveHoliday = () => {
        if (!holidayStartDate || !holidayName) { alert('Please fill in date and name'); return; }
        setHolidays([...holidays, {
            id: Date.now(),
            name: holidayName,
            startDate: holidayStartDate,
            endDate: holidayEndDate || holidayStartDate,
            isClosed: holidayIsClosed,
            open: holidayIsClosed ? '' : holidayOpen,
            close: holidayIsClosed ? '' : holidayClose
        }]);
        setHolidayStartDate(''); setHolidayEndDate(''); setHolidayName('');
        setHolidayIsClosed(true); setHolidayOpen('9:00 AM'); setHolidayClose('5:00 PM');
        setShowHolidayModal(false);
    };

    const handleOpenEditHoliday = (h) => {
        setEditingHoliday(h);
        setEditHolidayIsClosed(h.isClosed);
        setEditHolidayOpen(h.open || '9:00 AM');
        setEditHolidayClose(h.close || '5:00 PM');
    };

    const handleSaveEditHoliday = () => {
        setHolidays(holidays.map(h => h.id === editingHoliday.id ? {
            ...h,
            isClosed: editHolidayIsClosed,
            open: editHolidayIsClosed ? '' : editHolidayOpen,
            close: editHolidayIsClosed ? '' : editHolidayClose
        } : h));
        setEditingHoliday(null);
    };

    const handleDeleteHoliday = (id) => {
        setHolidays(holidays.filter(h => h.id !== id));
        setShowDeleteModal(null);
    };

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
                                {isOpen ? 'Your business is visible to customers as "Open" until 6:00 PM today.'
                                    : 'Your business is currently marked as closed. Customers cannot place orders.'}
                            </p>
                            <button onClick={() => setIsOpen(!isOpen)}
                                className={`w-full font-bold h-12 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors ${isOpen ? 'bg-primary text-white shadow-primary/20' : 'bg-green-600 text-white shadow-green-600/20'}`}>
                                <PauseCircle className="size-5" />
                                {isOpen ? 'Temporarily Mark Closed' : 'Reopen Store'}
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
                    <div className="space-y-3">
                        {openingHours.map((hour, index) => (
                            <div key={hour.day} className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4 text-left">
                                    <div className={`p-3 rounded-lg ${hour.isClosed ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'}`}>
                                        {hour.isClosed ? <PauseCircle className="size-6" /> : <Calendar className="size-6" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{hour.day}</p>
                                        <p className={`text-sm ${hour.isClosed ? 'text-slate-500 italic' : 'text-slate-500'}`}>
                                            {hour.isClosed ? 'Closed All Day' : `${hour.open} – ${hour.close}`}
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
                </section>

                {/* Holiday Exceptions */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Holiday Exceptions</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={openImportModal}
                                className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                                <Download className="size-4" /> UK Holidays
                            </button>
                            <span className="text-slate-300">|</span>
                            <button onClick={() => setShowHolidayModal(true)}
                                className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                                <PlusCircle className="size-4" /> Add New
                            </button>
                        </div>
                    </div>

                    {holidays.length === 0 ? (
                        <div className="bg-primary/5 border border-dashed border-primary/20 rounded-xl p-8 flex flex-col items-center text-center">
                            <div className="bg-primary/10 p-3 rounded-full mb-3"><PartyPopper className="size-6 text-primary" /></div>
                            <p className="font-semibold">No upcoming exceptions</p>
                            <p className="text-slate-500 text-sm mt-1">Import UK public holidays or add custom exceptions.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {holidays.map(h => (
                                <div key={h.id} className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-left flex-1">
                                        <div className="bg-primary/10 p-3 rounded-lg text-primary shrink-0">
                                            <PartyPopper className="size-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold">{h.name}</p>
                                            <p className="text-sm text-slate-500">
                                                {formatDateRange(h.startDate, h.endDate)} · {h.isClosed ? 'Closed' : `${h.open} – ${h.close}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 ml-2">
                                        <button onClick={() => handleOpenEditHoliday(h)}
                                            className="px-3 py-1.5 bg-background-light text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors">
                                            Edit
                                        </button>
                                        <button onClick={() => setShowDeleteModal(h.id)}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* 编辑每周时间弹窗 */}
            {editingIndex !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-xl font-bold mb-4">Edit {openingHours[editingIndex].day}</h3>
                        <label className="flex items-center gap-2 mb-5 cursor-pointer">
                            <input type="checkbox" checked={editIsClosed} onChange={e => setEditIsClosed(e.target.checked)}
                                className="rounded text-primary border-slate-300" />
                            <span className="text-sm font-medium">Closed All Day</span>
                        </label>
                        {!editIsClosed && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Open</label>
                                    <TimePicker value={editOpen} onChange={setEditOpen} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Close</label>
                                    <TimePicker value={editClose} onChange={setEditClose} />
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setEditingIndex(null)} className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={handleSaveEdit} className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 手动新增假日弹窗 */}
            {showHolidayModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-xl font-bold mb-4">Add Holiday Exception</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
                                <input type="text" value={holidayName} onChange={e => setHolidayName(e.target.value)}
                                    placeholder="e.g. Christmas"
                                    className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Start date</label>
                                    <input type="date" value={holidayStartDate} onChange={e => setHolidayStartDate(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">End date <span className="text-slate-400 font-normal">(optional)</span></label>
                                    <input type="date" value={holidayEndDate} onChange={e => setHolidayEndDate(e.target.value)}
                                        min={holidayStartDate}
                                        className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={holidayIsClosed} onChange={e => setHolidayIsClosed(e.target.checked)}
                                    className="rounded text-primary border-slate-300" />
                                <span className="text-sm font-medium">Closed All Day</span>
                            </label>
                            {!holidayIsClosed && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-2">Open</label>
                                        <TimePicker value={holidayOpen} onChange={setHolidayOpen} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-2">Close</label>
                                        <TimePicker value={holidayClose} onChange={setHolidayClose} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowHolidayModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={handleSaveHoliday} className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 编辑已有假日营业时间弹窗 */}
            {editingHoliday && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-xl font-bold mb-1">Edit {editingHoliday.name}</h3>
                        <p className="text-sm text-slate-500 mb-5">{formatDateRange(editingHoliday.startDate, editingHoliday.endDate)}</p>
                        <label className="flex items-center gap-2 mb-5 cursor-pointer">
                            <input type="checkbox" checked={editHolidayIsClosed} onChange={e => setEditHolidayIsClosed(e.target.checked)}
                                className="rounded text-primary border-slate-300" />
                            <span className="text-sm font-medium">Closed All Day</span>
                        </label>
                        {!editHolidayIsClosed && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Open</label>
                                    <TimePicker value={editHolidayOpen} onChange={setEditHolidayOpen} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Close</label>
                                    <TimePicker value={editHolidayClose} onChange={setEditHolidayClose} />
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setEditingHoliday(null)} className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={handleSaveEditHoliday} className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 导入英国节假日弹窗 */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-xl font-bold">UK Public Holidays</h3>
                            <span className="text-xs text-slate-400">{new Date().getFullYear()}</span>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            All are set to <span className="font-medium">Closed</span> by default — edit after importing to set special hours.
                        </p>
                        <div className="flex-1 overflow-y-auto -mx-1 px-1">
                            {importLoading && <div className="py-8 text-center text-slate-400 text-sm">Loading UK holidays...</div>}
                            {importError && (
                                <div className="py-6 text-center">
                                    <p className="text-red-500 text-sm mb-3">{importError}</p>
                                    <button onClick={fetchUKHolidays} className="text-primary text-sm font-semibold underline">Try again</button>
                                </div>
                            )}
                            {!importLoading && !importError && ukGroups.length === 0 && (
                                <div className="py-6 text-center text-slate-400 text-sm">All UK public holidays for this year have already been added.</div>
                            )}
                            {!importLoading && ukGroups.length > 0 && (
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setSelectedGroupIds(
                                            selectedGroupIds.size === ukGroups.length
                                                ? new Set()
                                                : new Set(ukGroups.map(g => g.startDate))
                                        )}
                                        className="w-full text-left px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg mb-1">
                                        {selectedGroupIds.size === ukGroups.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                    {ukGroups.map(g => (
                                        <button key={g.startDate} onClick={() => toggleGroupSelect(g.startDate)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${selectedGroupIds.has(g.startDate) ? 'bg-primary/5' : 'hover:bg-slate-50'}`}>
                                            <div className={`size-5 rounded flex items-center justify-center shrink-0 border transition-colors ${selectedGroupIds.has(g.startDate) ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                                                {selectedGroupIds.has(g.startDate) && <Check className="size-3 text-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold">{g.name}</p>
                                                <p className="text-xs text-slate-400">{formatDateRange(g.startDate, g.endDate)}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                            <button onClick={() => setShowImportModal(false)}
                                className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={handleImportSelected}
                                disabled={selectedGroupIds.size === 0 || importLoading}
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
                                Import ({selectedGroupIds.size})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 删除假日确认弹窗 */}
            {showDeleteModal !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <div className="flex items-center justify-center size-12 bg-red-100 rounded-full mx-auto mb-4">
                            <Trash2 className="size-6 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-center mb-1">Remove this holiday?</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">
                            {holidays.find(h => h.id === showDeleteModal)?.name} will be removed.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(null)}
                                className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Keep</button>
                            <button onClick={() => handleDeleteHoliday(showDeleteModal)}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Remove</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
