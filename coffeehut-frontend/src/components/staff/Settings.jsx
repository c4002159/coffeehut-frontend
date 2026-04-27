// Settings.jsx — Staff Settings Page -WeiqiWang

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Store, Clock, PauseCircle, LogIn, ChevronRight, Zap } from 'lucide-react';

const MANAGER_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuByjTuOC6eai_yyloPL9UHaYqog5y3ajyf6E56oo0egTeeTrgZjpZp_f7t8GuFbJ0ZV918tCt27VGpjx3RgLd5SOVe73FUGsj4xHoSQvax8ycRdhjwY8xIo0aTyyCdK46gtyOaldNSJQ5BOW9KPb7J3kGlV8jiunlzFsSXhhvS4fBhKrTVPpk8AHcUC7UsQEG5iHWP5VKCqGWx5WDtTtmzwOI0NAwmTdNvQh0LORyoE-hDM41c9C53Dh83fh4u773dTp-eZ-gKE4Cw";

function Toggle({ enabled, onToggle }) {
    return (
        <div onClick={onToggle}
            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${enabled ? 'bg-primary' : 'bg-slate-200'}`}>
            <div className={`absolute top-1 size-4 bg-white rounded-full shadow-sm transition-all duration-200 ${enabled ? 'left-6' : 'left-1'}`} />
        </div>
    );
}

// MinuteStepper — 5-minute steps. At 5 min, pressing − calls onDisable(). -WeiqiWang
function MinuteStepper({ value, onChange, onDisable }) {
    return (
        <div className="flex items-center gap-2">
            <button onClick={() => value <= 5 ? onDisable() : onChange(value - 5)}
                className="size-8 rounded-lg bg-primary/10 text-primary font-bold text-lg flex items-center justify-center hover:bg-primary/20 transition-colors">
                −
            </button>
            <span className="w-16 text-center text-sm font-bold text-slate-800">{value} min</span>
            <button onClick={() => onChange(value + 5)}
                className="size-8 rounded-lg bg-primary/10 text-primary font-bold text-lg flex items-center justify-center hover:bg-primary/20 transition-colors">
                +
            </button>
        </div>
    );
}

// Props:
//   autoCancel / autoCollect — current saved values (read from DB via App.js) -WeiqiWang
//   onSave(newCancel, newCollect) — saves to DB and updates App.js state -WeiqiWang
export default function Settings({ autoCancel, autoCollect, onSave }) {
    const navigate = useNavigate();

    const [storeName,          setStoreName]         = useState('Cramlington Station');
    const [tempClosed,         setTempClosed]        = useState(false);
    const [showStoreNameModal, setShowStoreNameModal] = useState(false);
    const [storeNameInput,     setStoreNameInput]    = useState(storeName);

    // Order Automation modal -WeiqiWang
    const [showAutomationModal, setShowAutomationModal] = useState(false);
    const [saving,              setSaving]              = useState(false);
    // Local draft — only committed on Save -WeiqiWang
    const [draftCancel,  setDraftCancel]  = useState(autoCancel);
    const [draftCollect, setDraftCollect] = useState(autoCollect);

    const openAutomationModal = () => {
        setDraftCancel(autoCancel);   // reset draft to current saved values -WeiqiWang
        setDraftCollect(autoCollect);
        setShowAutomationModal(true);
    };

    const handleAutomationSave = async () => {
        setSaving(true);
        await onSave(draftCancel, draftCollect); // persists to DB -WeiqiWang
        setSaving(false);
        setShowAutomationModal(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('staff');
        sessionStorage.removeItem('staff');
        navigate('/staff');
    };

    const handleStoreNameSave = () => {
        if (!storeNameInput.trim()) { alert('Store name cannot be empty'); return; }
        setStoreName(storeNameInput.trim());
        setShowStoreNameModal(false);
    };

    const automationStatus = () => {
        const parts = [];
        if (autoCancel.enabled)  parts.push(`Cancel ${autoCancel.mins}m`);
        if (autoCollect.enabled) parts.push(`Collect ${autoCollect.mins}m`);
        return parts.length === 0 ? 'Off' : parts.join(' · ');
    };

    return (
        <div className="flex flex-col h-full">
            <header className="sticky top-0 z-10 bg-background-light/80 backdrop-blur-md border-b border-primary/10 p-4 flex items-center gap-3">
                <div className="bg-primary text-white p-2 rounded-lg"><Coffee className="size-6" /></div>
                <div className="text-left">
                    <h1 className="text-lg font-bold leading-none">Settings</h1>
                    <p className="text-xs text-primary/60">Whistlestop Coffee Hut</p>
                </div>
            </header>

            <main className="p-4 space-y-6 pb-24 overflow-y-auto">

                {/* Account */}
                <section className="space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-primary/60 px-1 text-left">Account</h2>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-primary/5">
                        <div className="flex items-center gap-4 mb-4">
                            <img src={MANAGER_AVATAR} alt="Manager" className="size-16 rounded-full border-2 border-primary/20" referrerPolicy="no-referrer" />
                            <div className="flex-1 text-left">
                                <h3 className="text-lg font-bold text-primary">Alex Johnson</h3>
                                <p className="text-sm text-slate-500">alex@whistlestop.com</p>
                                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-tighter">Manager</span>
                            </div>
                        </div>
                        <button onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors">
                            <LogIn className="size-4 rotate-180" /> Sign Out
                        </button>
                    </div>
                </section>

                {/* Store Settings */}
                <section className="space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-primary/60 px-1 text-left">Store Settings</h2>
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-primary/5 divide-y divide-primary/5">

                        <button onClick={() => { setStoreNameInput(storeName); setShowStoreNameModal(true); }}
                            className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <Store className="text-primary/70 size-5" />
                                <span className="font-medium">Store Name</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">{storeName}</span>
                                <ChevronRight className="text-slate-400 size-4" />
                            </div>
                        </button>

                        <button onClick={() => navigate('/schedule')}
                            className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <Clock className="text-primary/70 size-5" />
                                <span className="font-medium">Opening Hours</span>
                            </div>
                            <ChevronRight className="text-slate-400 size-5" />
                        </button>

                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <PauseCircle className="text-primary/70 size-5" />
                                <span className="font-medium">Temporary Close</span>
                            </div>
                            <Toggle enabled={tempClosed} onToggle={() => setTempClosed(!tempClosed)} />
                        </div>

                        {/* Order Automation — reads from DB via App.js props -WeiqiWang */}
                        <button onClick={openAutomationModal}
                            className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <Zap className="text-primary/70 size-5" />
                                <div className="text-left">
                                    <span className="font-medium">Order Automation</span>
                                    <p className="text-xs text-slate-400 mt-0.5">Auto-cancel new orders · Auto-complete ready orders</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500">{automationStatus()}</span>
                                <ChevronRight className="text-slate-400 size-4" />
                            </div>
                        </button>
                    </div>
                </section>
            </main>

            {/* Store name modal */}
            {showStoreNameModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-xl font-bold mb-4">Edit Store Name</h3>
                        <input type="text" value={storeNameInput} onChange={e => setStoreNameInput(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Store name" />
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowStoreNameModal(false)}
                                className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={handleStoreNameSave}
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Automation modal — saves to DB via onSave prop -WeiqiWang */}
            {showAutomationModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden">

                        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="bg-primary/10 p-2 rounded-lg"><Zap className="size-5 text-primary" /></div>
                                <h3 className="text-lg font-bold text-slate-900">Order Automation</h3>
                            </div>
                            <p className="text-xs text-slate-400 pl-11">Configure automatic order state transitions</p>
                        </div>

                        <div className="px-6 py-5 space-y-5">

                            {/* Auto-cancel */}
                            <div className={`rounded-xl border p-4 transition-colors ${draftCancel.enabled ? 'border-primary/20 bg-primary/[0.03]' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-800 text-sm">Auto-Cancel New Orders</p>
                                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                            {draftCancel.enabled
                                                ? `New orders not accepted within ${draftCancel.mins} min will be automatically cancelled.`
                                                : 'New orders will wait indefinitely until manually accepted.'}
                                        </p>
                                    </div>
                                    <Toggle enabled={draftCancel.enabled}
                                        onToggle={() => setDraftCancel(p => ({ ...p, enabled: !p.enabled }))} />
                                </div>
                                {draftCancel.enabled && (
                                    <div className="flex items-center justify-between pt-3 border-t border-primary/10">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Timeout</span>
                                        <MinuteStepper
                                            value={draftCancel.mins}
                                            onChange={v => setDraftCancel(p => ({ ...p, mins: v }))}
                                            onDisable={() => setDraftCancel(p => ({ ...p, enabled: false }))}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Auto-collect */}
                            <div className={`rounded-xl border p-4 transition-colors ${draftCollect.enabled ? 'border-primary/20 bg-primary/[0.03]' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-800 text-sm">Auto-Complete Ready Orders</p>
                                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                            {draftCollect.enabled
                                                ? `Ready orders not collected within ${draftCollect.mins} min will be automatically marked as collected.`
                                                : 'Ready orders will remain in the queue until manually marked as collected.'}
                                        </p>
                                    </div>
                                    <Toggle enabled={draftCollect.enabled}
                                        onToggle={() => setDraftCollect(p => ({ ...p, enabled: !p.enabled }))} />
                                </div>
                                {draftCollect.enabled && (
                                    <div className="flex items-center justify-between pt-3 border-t border-primary/10">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Timeout</span>
                                        <MinuteStepper
                                            value={draftCollect.mins}
                                            onChange={v => setDraftCollect(p => ({ ...p, mins: v }))}
                                            onDisable={() => setDraftCollect(p => ({ ...p, enabled: false }))}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 pb-6 flex gap-3">
                            <button onClick={() => setShowAutomationModal(false)}
                                className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleAutomationSave} disabled={saving}
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
