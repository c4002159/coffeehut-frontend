import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */
const API_BASE      = 'http://localhost:8080';
const POLL_INTERVAL = 15000;
const KIOSK_NAME    = 'Whistlestop Coffee Hut';
const MAPS_URL      = 'https://maps.google.com/?q=Whistlestop+Coffee+Hut+Newcastle';

// Status steps for Order Tracking page
const TIMELINE_STEPS = [
  { key: 'accepted',    label: 'Order Accepted',       sub: 'Your order has been confirmed' },
  { key: 'in_progress', label: 'In Progress',           sub: 'Chef is cooking your order' },
  { key: 'ready',       label: 'Ready for Collection',  sub: 'Waiting at the pickup counter' },
  { key: 'collected',   label: 'Collected',             sub: 'Order has been picked up' },
];

function getTimelineIndex(status) {
  if (status === 'pending' || status === 'accepted') return 0;
  if (status === 'in_progress') return 1;
  if (status === 'ready')       return 2;
  if (status === 'collected')   return 3;
  return 0;
}

/* ─────────────────────────────────────────────
   STYLES — matches App.tsx design system
   Primary brown: #4a3621 / bg: #f7f7f6
───────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .os-wrap {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #f7f7f6;
    min-height: 100vh;
    color: #0f0f0f;
    max-width: 430px;
    margin: 0 auto;
    position: relative;
  }

  /* ── Shared header ── */
  .os-header {
    position: sticky; top: 0; z-index: 50;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid #f1f5f9;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .os-header-title { font-size: 1.05rem; font-weight: 700; }
  .os-icon-btn {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%; background: none; border: none;
    cursor: pointer; font-size: 1.1rem; color: #0f0f0f;
    transition: background 0.15s;
  }
  .os-icon-btn:hover { background: #f1f5f9; }
  .os-w10 { width: 40px; }

  /* ── Tab nav (Active / History) ── */
  .os-tab-nav {
    display: flex;
    border-bottom: 1px solid #f1f5f9;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(12px);
  }
  .os-tab-btn {
    flex: 1; padding: 14px 0;
    font-size: 0.875rem; font-weight: 700;
    border: none; border-bottom: 2px solid transparent;
    background: none; cursor: pointer;
    color: #94a3b8;
    transition: all 0.15s;
  }
  .os-tab-btn.active { border-bottom-color: #4a3621; color: #4a3621; }

  /* ── History filter tabs ── */
  .os-filter-nav {
    display: flex;
    border-bottom: 1px solid #f8fafc;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(12px);
  }
  .os-filter-btn {
    flex: 1; padding: 10px 0;
    font-size: 0.75rem; font-weight: 700;
    border: none; border-bottom: 2px solid transparent;
    background: none; cursor: pointer;
    color: #94a3b8;
    transition: all 0.15s;
  }
  .os-filter-btn.active { border-bottom-color: #4a3621; color: #4a3621; }

  /* ── Main scroll area ── */
  .os-main { padding: 16px; padding-bottom: 100px; }

  /* ── Hero image ── */
  .os-hero {
    width: 100%; height: 192px;
    border-radius: 16px; overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 1px 8px rgba(0,0,0,0.08);
  }
  .os-hero img { width: 100%; height: 100%; object-fit: cover; }

  /* ── Section title ── */
  .os-section-title {
    font-size: 1.1rem; font-weight: 700;
    margin-bottom: 14px;
  }

  /* ── Active order card ── */
  .os-active-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #f1f5f9;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    overflow: hidden;
  }
  .os-active-card-img {
    width: 100%; height: 160px; object-fit: cover;
  }
  .os-active-card-body { padding: 16px; }
  .os-active-card-top {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 10px;
  }
  .os-badge-preparing {
    display: inline-block;
    padding: 2px 8px;
    background: #ffedd5; color: #c2410c;
    border-radius: 999px; font-size: 0.65rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.05em;
    margin-bottom: 4px;
  }
  .os-badge-ready {
    display: inline-block;
    padding: 2px 8px;
    background: #dcfce7; color: #15803d;
    border-radius: 999px; font-size: 0.65rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.05em;
    margin-bottom: 4px;
  }
  .os-badge-pending {
    display: inline-block;
    padding: 2px 8px;
    background: #e0e7ff; color: #4338ca;
    border-radius: 999px; font-size: 0.65rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.05em;
    margin-bottom: 4px;
  }
  .os-order-id { font-size: 1.25rem; font-weight: 700; }
  .os-pickup-label {
    font-size: 0.65rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: #94a3b8; margin-bottom: 2px;
  }
  .os-pickup-val { font-weight: 700; }
  .os-drink-row {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 0; border-top: 1px solid #f8fafc;
    border-bottom: 1px solid #f8fafc; margin-bottom: 12px;
    font-size: 0.875rem; color: #475569;
  }
  .os-btn-track {
    width: 100%; height: 48px;
    background: #4a3621; color: #fff;
    border: none; border-radius: 12px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.95rem; font-weight: 700;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    box-shadow: 0 4px 12px rgba(74,54,33,0.2);
  }
  .os-btn-track:hover { background: #3d2b1a; }
  .os-btn-track:active { transform: scale(0.97); }

  /* ── Empty state ── */
  .os-empty {
    padding: 32px; text-align: center;
    background: #f8fafc; border-radius: 16px;
    border: 2px dashed #e2e8f0;
    color: #94a3b8; font-size: 0.875rem;
  }

  /* ── History cards ── */
  .os-hist-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #f1f5f9;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    overflow: hidden;
    margin-bottom: 20px;
  }
  .os-hist-card-img {
    width: 100%; height: 128px; object-fit: cover;
  }
  .os-hist-card-body { padding: 16px; }
  .os-hist-card-top {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 14px;
  }
  .os-hist-id { font-size: 1.1rem; font-weight: 700; }
  .os-hist-meta { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }
  .os-badge-collected {
    padding: 3px 10px;
    background: #dcfce7; color: #15803d;
    border-radius: 999px; font-size: 0.7rem; font-weight: 700;
    text-transform: uppercase;
  }
  .os-badge-cancelled {
    padding: 3px 10px;
    background: #fee2e2; color: #dc2626;
    border-radius: 999px; font-size: 0.7rem; font-weight: 700;
    text-transform: uppercase;
  }
  .os-badge-other {
    padding: 3px 10px;
    background: #f1f5f9; color: #64748b;
    border-radius: 999px; font-size: 0.7rem; font-weight: 700;
    text-transform: uppercase;
  }
  .os-hist-card-bottom {
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 14px; border-top: 1px solid #f8fafc;
  }
  .os-thumb-group { display: flex; }
  .os-thumb {
    width: 32px; height: 32px;
    border-radius: 50%; border: 2px solid #fff;
    overflow: hidden; background: #f1f5f9;
    margin-left: -8px;
  }
  .os-thumb:first-child { margin-left: 0; }
  .os-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .os-btn-reorder {
    padding: 8px 20px;
    background: #4a3621; color: #fff;
    border: none; border-radius: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem; font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(74,54,33,0.2);
    transition: background 0.15s;
  }
  .os-btn-reorder:hover { background: #3d2b1a; }

  /* ════════════════════════════════════════
     ORDER TRACKING PAGE
  ════════════════════════════════════════ */
  .os-tracking-wrap {
    background: #fff;
    min-height: 100vh;
    padding-bottom: 100px;
  }
  .os-ref-bar {
    padding: 20px 16px 16px;
    display: flex; justify-content: space-between; align-items: flex-end;
    background: #fff;
  }
  .os-ref-label {
    font-size: 0.65rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: #94a3b8; margin-bottom: 2px;
  }
  .os-ref-id { font-size: 2rem; font-weight: 700; }
  .os-est-label {
    font-size: 0.65rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: #94a3b8; text-align: right; margin-bottom: 2px;
  }
  .os-est-time { font-size: 1.3rem; font-weight: 700; color: #4a3621; text-align: right; }

  /* Status card with image */
  .os-status-card {
    margin: 0 16px 24px;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    border: 1px solid #f1f5f9;
  }
  .os-status-card-img {
    width: 100%; height: 220px; object-fit: cover;
    display: block;
  }
  .os-status-card-body { padding: 20px; }
  .os-status-pulse-row {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 6px;
  }
  .os-pulse-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: #f97316;
    animation: osPulse 1.6s ease-in-out infinite;
  }
  .os-pulse-dot.ready-dot  { background: #22c55e; }
  .os-pulse-dot.done-dot   { background: #94a3b8; animation: none; }
  @keyframes osPulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:0.4; transform:scale(0.75); }
  }
  .os-status-title { font-size: 1.1rem; font-weight: 700; }
  .os-status-sub { font-size: 0.875rem; color: #64748b; line-height: 1.5; margin-top: 4px; }

  /* Cancelled card */
  .os-cancelled-card {
    margin: 0 16px 24px;
    background: #fff1f2; border: 1px solid #fecdd3;
    border-radius: 24px; padding: 24px;
    text-align: center;
  }
  .os-cancelled-icon { font-size: 2.5rem; margin-bottom: 8px; }
  .os-cancelled-title { font-size: 1.1rem; font-weight: 700; color: #dc2626; margin-bottom: 6px; }
  .os-cancelled-sub { font-size: 0.875rem; color: #64748b; line-height: 1.5; }

  /* Timeline */
  .os-timeline-section { padding: 0 16px 24px; }
  .os-timeline-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 20px; }
  .os-tl-list { position: relative; }
  .os-tl-list::before {
    content: '';
    position: absolute; left: 16px; top: 8px; bottom: 8px;
    width: 2px; background: #f1f5f9;
  }
  .os-tl-item {
    display: flex; align-items: flex-start; gap: 16px;
    position: relative; z-index: 1;
    margin-bottom: 28px;
  }
  .os-tl-item:last-child { margin-bottom: 0; }
  .os-tl-dot {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.85rem; font-weight: 700;
    flex-shrink: 0;
    border: 3px solid #fff;
    box-shadow: 0 0 0 2px #e2e8f0;
  }
  .os-tl-dot.done    { background: #4a3621; color: #fff; box-shadow: 0 0 0 2px #4a3621; }
  .os-tl-dot.current { background: #fff; color: #4a3621; box-shadow: 0 0 0 2px #4a3621; }
  .os-tl-dot.future  { background: #f8fafc; color: #cbd5e1; box-shadow: 0 0 0 2px #e2e8f0; }
  .os-tl-content { padding-top: 4px; }
  .os-tl-label { font-size: 0.95rem; font-weight: 700; }
  .os-tl-label.future { color: #94a3b8; font-weight: 500; }
  .os-tl-sub { font-size: 0.78rem; color: #94a3b8; margin-top: 2px; }
  .os-tl-time { font-size: 0.72rem; color: #94a3b8; margin-top: 2px; }

  /* Pickup location */
  .os-location-section { padding: 0 16px; margin-bottom: 16px; }
  .os-location-card {
    background: #f8fafc; border-radius: 24px;
    padding: 20px; border: 1px solid #f1f5f9;
  }
  .os-location-row {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 14px;
  }
  .os-location-label {
    font-size: 0.65rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: #94a3b8; margin-bottom: 2px;
  }
  .os-location-name { font-weight: 700; color: #1e293b; }
  .os-btn-directions {
    background: #4a3621; color: #fff;
    border: none; border-radius: 10px;
    padding: 8px 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.78rem; font-weight: 700;
    cursor: pointer; text-decoration: none;
    display: inline-block;
    box-shadow: 0 2px 8px rgba(74,54,33,0.25);
    transition: background 0.15s;
  }
  .os-btn-directions:hover { background: #3d2b1a; }
  .os-map-box {
    height: 160px; border-radius: 16px; overflow: hidden;
    border: 1px solid #e2e8f0;
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%);
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .os-map-box::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.25) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px);
    background-size: 28px 28px;
  }
  .os-map-pin { font-size: 2.5rem; position: relative; z-index: 1; }

  /* ── Bottom nav ── */
  .os-bottom-nav {
    position: fixed; bottom: 0;
    left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 430px;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(12px);
    border-top: 1px solid #f1f5f9;
    display: flex; justify-content: space-around;
    align-items: center;
    padding: 12px 0 18px;
    z-index: 100;
  }
  .os-nav-btn {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    background: none; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.65rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.05em;
    color: #94a3b8; padding: 4px 20px;
    transition: color 0.15s;
  }
  .os-nav-btn.active { color: #4a3621; }
  .os-nav-btn:hover { color: #4a3621; }
  .os-nav-icon { font-size: 1.25rem; }

  /* ── Spinner ── */
  .os-spinner-wrap {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 80px 20px; gap: 14px;
    color: #94a3b8; font-size: 0.9rem;
  }
  .os-spinner {
    width: 32px; height: 32px;
    border: 3px solid #f1f5f9;
    border-top-color: #4a3621;
    border-radius: 50%;
    animation: ospin 0.7s linear infinite;
  }
  @keyframes ospin { to { transform: rotate(360deg); } }

  /* ── Ready banner ── */
  .os-ready-banner {
    position: fixed; top: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 430px; z-index: 200;
    background: #4a3621; color: #fff;
    padding: 16px 20px;
    display: flex; justify-content: space-between; align-items: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    animation: slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes slideDown {
    from { transform: translateX(-50%) translateY(-100%); }
    to   { transform: translateX(-50%) translateY(0); }
  }
  .os-ready-text { font-size: 0.9rem; font-weight: 700; }
  .os-ready-sub  { font-size: 0.75rem; opacity: 0.8; margin-top: 2px; }
  .os-ready-close {
    background: rgba(255,255,255,0.2); border: none; border-radius: 50%;
    width: 28px; height: 28px; cursor: pointer; font-size: 1rem;
    color: #fff; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* ── Reorder sheet ── */
  .os-sheet-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 150;
  }
  .os-sheet {
    position: fixed; bottom: 0;
    left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 430px;
    background: #fff; border-radius: 32px 32px 0 0;
    padding: 24px 24px 40px;
    z-index: 160;
    box-shadow: 0 -8px 40px rgba(0,0,0,0.15);
    animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes slideUp {
    from { transform: translateX(-50%) translateY(100%); }
    to   { transform: translateX(-50%) translateY(0); }
  }
  .os-sheet-handle {
    width: 48px; height: 5px; border-radius: 999px;
    background: #e2e8f0; margin: 0 auto 20px;
  }
  .os-sheet-title { font-size: 1.4rem; font-weight: 700; color: #4a3621; margin-bottom: 20px; }
  .os-sheet-item {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 18px;
  }
  .os-sheet-item-left { display: flex; align-items: center; gap: 14px; }
  .os-sheet-thumb {
    width: 48px; height: 48px; border-radius: 50%;
    overflow: hidden; background: #f1f5f9;
    flex-shrink: 0;
  }
  .os-sheet-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .os-sheet-item-name { font-weight: 700; color: #334155; }
  .os-sheet-item-price { font-weight: 700; color: #334155; }
  .os-sheet-divider { border: none; border-top: 1px solid #f1f5f9; margin: 16px 0; }

  .os-pickup-tabs {
    display: flex; padding: 4px; background: #f8fafc;
    border-radius: 12px; margin-bottom: 14px;
  }
  .os-pickup-tab {
    flex: 1; padding: 10px; border: none; border-radius: 8px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.875rem; font-weight: 700;
    cursor: pointer; background: none; color: #94a3b8;
    transition: all 0.15s;
  }
  .os-pickup-tab.active { background: #fff; color: #4a3621; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

  .os-asap-btn {
    width: 100%; height: 56px;
    background: rgba(74,54,33,0.06);
    border: none; border-radius: 16px;
    display: flex; justify-content: space-between; align-items: center;
    padding: 0 18px; cursor: pointer; margin-bottom: 20px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .os-asap-text { font-weight: 700; color: #4a3621; }

  .os-sheet-cta {
    width: 100%; height: 60px;
    background: #3d2b1a; color: #fff;
    border: none; border-radius: 16px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1.1rem; font-weight: 700;
    cursor: pointer; margin-bottom: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    transition: background 0.15s, transform 0.1s;
  }
  .os-sheet-cta:hover { background: #2d2010; }
  .os-sheet-cta:active { transform: scale(0.98); }
  .os-sheet-edit {
    display: block; width: 100%; text-align: center;
    padding: 8px; background: none; border: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.875rem; font-weight: 700;
    color: #4a3621; cursor: pointer;
  }
  .os-sheet-edit:hover { text-decoration: underline; }

  /* Coffee icon placeholder */
  .os-coffee-icon { font-size: 1.1rem; }
`;

/* ─────────────────────────────────────────────
   HELPER: get status badge component
───────────────────────────────────────────── */
function StatusBadge({ status }) {
  if (!status) return null;
  const s = status.toLowerCase();
  let cls = 'os-badge-other';
  let label = status;
  if (s === 'collected')              { cls = 'os-badge-collected'; label = 'Collected'; }
  else if (s === 'cancelled')         { cls = 'os-badge-cancelled'; label = 'Cancelled'; }
  else if (s === 'ready')             { cls = 'os-badge-ready';     label = 'Ready'; }
  else if (s === 'in_progress')       { cls = 'os-badge-preparing'; label = 'Preparing'; }
  else if (s === 'accepted' || s === 'pending') { cls = 'os-badge-pending'; label = 'Accepted'; }
  return <span className={cls}>{label}</span>;
}

/* ─────────────────────────────────────────────
   COFFEE IMAGE — Unsplash placeholder
───────────────────────────────────────────── */
const COFFEE_IMG = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop';
const HERO_IMG   = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800&auto=format&fit=crop';

function formatTime(t) {
  if (!t) return '';
  try {
    return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return t; }
}
function formatDateTime(t) {
  if (!t) return '';
  try {
    const d = new Date(t);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      + ', ' + formatTime(t);
  } catch { return t; }
}

/* ─────────────────────────────────────────────
   REORDER SHEET
───────────────────────────────────────────── */
function ReorderSheet({ order, onClose, onAddToCart, onNavigateTrain }) {
  const [tab, setTab] = useState('time');
  const items = order?.items || order?.orderItems || [];

  return (
    <>
      <div className="os-sheet-overlay" onClick={onClose} />
      <div className="os-sheet">
        <div className="os-sheet-handle" />
        <div className="os-sheet-title">Reorder #{order?.id}</div>

        {items.map((item, i) => (
          <div key={i} className="os-sheet-item">
            <div className="os-sheet-item-left">
              <div className="os-sheet-thumb">
                <img src={item.imageUrl || COFFEE_IMG} alt={item.name || item.itemName} onError={e => e.target.src = COFFEE_IMG} />
              </div>
              <span className="os-sheet-item-name">{item.size || 'Regular'} {item.name || item.itemName}</span>
            </div>
            <span className="os-sheet-item-price">
              £{item.subtotal ? Number(item.subtotal).toFixed(2) : item.price ? Number(item.price).toFixed(2) : '—'}
            </span>
          </div>
        ))}

        <hr className="os-sheet-divider" />

        <div style={{ marginBottom: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Pickup Time
        </div>
        <div className="os-pickup-tabs">
          <button className={`os-pickup-tab ${tab === 'time' ? 'active' : ''}`} onClick={() => setTab('time')}>Set a time</button>
          <button className={`os-pickup-tab ${tab === 'train' ? 'active' : ''}`} onClick={() => { setTab('train'); onClose(); onNavigateTrain && onNavigateTrain(); }}>Link my train</button>
        </div>
        <button className="os-asap-btn">
          <span className="os-asap-text">ASAP (in 5–10 mins)</span>
          <span style={{ color: '#4a3621' }}>▾</span>
        </button>

        <button className="os-sheet-cta" onClick={onAddToCart}>Add to Cart</button>
        <button className="os-sheet-edit" onClick={onClose}>Edit before ordering</button>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   ORDER TRACKING PAGE
───────────────────────────────────────────── */
function TrackingPage({ order, loading, error, onBack }) {
  if (loading) {
    return (
      <div className="os-tracking-wrap">
        <div className="os-header">
          <button className="os-icon-btn" onClick={onBack}>←</button>
          <span className="os-header-title">Order Status</span>
          <div className="os-w10" />
        </div>
        <div className="os-spinner-wrap"><div className="os-spinner" /><span>Loading order…</span></div>
      </div>
    );
  }
  if (error || !order) {
    return (
      <div className="os-tracking-wrap">
        <div className="os-header">
          <button className="os-icon-btn" onClick={onBack}>←</button>
          <span className="os-header-title">Order Status</span>
          <div className="os-w10" />
        </div>
        <div className="os-spinner-wrap" style={{ color: '#dc2626' }}>{error || 'Order not found.'}</div>
      </div>
    );
  }

  const idx = getTimelineIndex(order.status);
  const ts  = order.statusTimestamps || {};
  const isCancelled = order.status === 'cancelled';

  const getStatusBanner = () => {
    switch (order.status) {
      case 'pending':
      case 'accepted':    return { title: 'Order Accepted',          sub: 'Your order has been confirmed and is queued.',        dot: '' };
      case 'in_progress': return { title: 'Currently being prepared', sub: 'Our baristas are carefully crafting your drink. It will be ready for collection shortly.', dot: '' };
      case 'ready':       return { title: 'Ready for Collection! 🎉', sub: 'Your drink is at the pickup counter. Come grab it!',  dot: 'ready-dot' };
      case 'collected':   return { title: 'Order Collected',          sub: 'Thanks for visiting Whistlestop Coffee Hut! ☕',      dot: 'done-dot' };
      default:            return { title: 'Processing…',              sub: 'Please wait a moment.',                               dot: '' };
    }
  };
  const banner = getStatusBanner();

  return (
    <div className="os-tracking-wrap">
      <div className="os-header">
        <button className="os-icon-btn" onClick={onBack}>←</button>
        <span className="os-header-title">Order Status</span>
        <div className="os-w10" />
      </div>

      {/* Reference + pickup time */}
      <div className="os-ref-bar">
        <div>
          <div className="os-ref-label">Reference</div>
          <div className="os-ref-id">Order #{order.id}</div>
        </div>
        <div>
          <div className="os-est-label">Est. Pickup</div>
          <div className="os-est-time">{formatTime(order.pickupTime) || '—'}</div>
        </div>
      </div>

      {/* Status card */}
      {isCancelled ? (
        <div className="os-cancelled-card">
          <div className="os-cancelled-icon">❌</div>
          <div className="os-cancelled-title">Order Cancelled</div>
          <div className="os-cancelled-sub">Your order has been cancelled. Please place a new order or speak to a member of staff.</div>
        </div>
      ) : (
        <div className="os-status-card">
          <img
            className="os-status-card-img"
            src={order.imageUrl || COFFEE_IMG}
            alt="Order"
            onError={e => e.target.src = COFFEE_IMG}
          />
          <div className="os-status-card-body">
            <div className="os-status-pulse-row">
              <div className={`os-pulse-dot ${banner.dot}`} />
              <div className="os-status-title">{banner.title}</div>
            </div>
            <div className="os-status-sub">{banner.sub}</div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {!isCancelled && (
        <div className="os-timeline-section">
          <div className="os-timeline-title">Order Timeline</div>
          <div className="os-tl-list">
            {TIMELINE_STEPS.map((step, i) => {
              const isDone    = i < idx;
              const isCurrent = i === idx;
              const isFuture  = i > idx;
              const dotCls    = isDone ? 'done' : isCurrent ? 'current' : 'future';
              const stepTsKey = ['accepted','in_progress','ready','collected'][i];
              const stepTs    = ts[stepTsKey];
              return (
                <div key={step.key} className="os-tl-item">
                  <div className={`os-tl-dot ${dotCls}`}>
                    {isDone ? '✓' : isCurrent ? <span style={{fontSize:'0.7rem'}}>☕</span> : ''}
                  </div>
                  <div className="os-tl-content">
                    <div className={`os-tl-label ${isFuture ? 'future' : ''}`}>{step.label}</div>
                    <div className="os-tl-sub">{step.sub}</div>
                    {stepTs && <div className="os-tl-time">Today, {formatTime(stepTs)}</div>}
                    {!stepTs && isDone && <div className="os-tl-time">Today, {formatTime(order.updatedAt || order.createdAt)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pickup location */}
      <div className="os-location-section">
        <div className="os-location-card">
          <div className="os-location-row">
            <div>
              <div className="os-location-label">Pickup Location</div>
              <div className="os-location-name">{KIOSK_NAME}</div>
            </div>
            <a className="os-btn-directions" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              Get Directions
            </a>
          </div>
          <div className="os-map-box">
            <span className="os-map-pin">📍</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function OrderStatus() {
  const navigate = useNavigate();
  const location = useLocation();

  // Which view: 'hub' (Orders Hub) or 'tracking' (Order Status detail)
  const [view,       setView]       = useState(() => location.state?.view || 'hub');
  const [tab,        setTab]        = useState('active');   // active / history
  const [filterTab,  setFilterTab]  = useState('All');      // All / Collected / Cancelled

  // From Payment.jsx: navigate('/order-status', { state: { orderId, view: 'tracking' } })
  const routeOrderId = location.state?.orderId;

  // Current tracking order
  const [trackOrder,  setTrackOrder]  = useState(null);
  const [trackLoad,   setTrackLoad]   = useState(false);
  const [trackError,  setTrackError]  = useState('');

  // Orders hub data
  const [activeOrder,  setActiveOrder]  = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [hubLoading,   setHubLoading]   = useState(false);

  // Ready banner
  const [showReadyBanner, setShowReadyBanner] = useState(false);

  // Reorder sheet
  const [reorderOrder, setReorderOrder] = useState(null);

  const lastStatus  = useRef(null);
  const intervalRef = useRef(null);

  /* ── Fetch single order for tracking ── */
  const fetchTrackOrder = async (id, silent = false) => {
    if (!id) return;
    if (!silent) setTrackLoad(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${id}`);
      if (!res.ok) { setTrackError('Order not found.'); return; }
      const data = await res.json();
      const o = Array.isArray(data) ? data[0] : data;
      if (o.status === "preparing") o.status = "in_progress";
      setTrackOrder(o);
      setTrackError('');
      if (o.status === 'ready' && lastStatus.current !== 'ready') {
        setShowReadyBanner(true);
      }
      lastStatus.current = o.status;
    } catch {
      if (!silent) setTrackError('Cannot connect to server. Is the backend running?');
    } finally {
      if (!silent) setTrackLoad(false);
    }
  };

  /* ── Fetch hub orders ── */
  const fetchHubOrders = async () => {
    setHubLoading(true);
    try {
      const member = JSON.parse(localStorage.getItem('member') || '{}');
      const name   = member.name || 'YourName';
      if (!name) { setHubLoading(false); return; }
      const res  = await fetch(`${API_BASE}/api/orders/customer?name=${encodeURIComponent(name)}`);
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      // Active = not collected, not cancelled
      const active = list.filter(o => !['collected','cancelled'].includes(o.status));
      setActiveOrder(active || null);
      setHistoryOrders(list.filter(o => ['collected','cancelled'].includes(o.status)));
    } catch {
      /* silent */
    } finally {
      setHubLoading(false);
    }
  };

  /* ── On mount ── */
  useEffect(() => {
    if (routeOrderId) {
      setView('tracking');
      fetchTrackOrder(routeOrderId);
      intervalRef.current = setInterval(() => fetchTrackOrder(routeOrderId, true), POLL_INTERVAL);
    } else {
      fetchHubOrders();
       intervalRef.current = setInterval(fetchHubOrders, POLL_INTERVAL);
    }
    return () => clearInterval(intervalRef.current);
  }, [routeOrderId]);

  /* ── When switching to tracking from hub ── */
  const openTracking = (orderId) => {
    setTrackOrder(null); setTrackError('');
    setView('tracking');
    fetchTrackOrder(orderId);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchTrackOrder(orderId, true), POLL_INTERVAL);
  };

  const backToHub = () => {
    clearInterval(intervalRef.current);
    setView('hub');
    fetchHubOrders();
  };

  /* ── Filtered history ── */
  const filteredHistory = historyOrders.filter(o => {
    if (filterTab === 'All')       return true;
    if (filterTab === 'Collected') return o.status === 'collected';
    if (filterTab === 'Cancelled') return o.status === 'cancelled';
    return true;
  });

  /* ── Reorder ── */
  const handleReorderAddToCart = async () => {
    if (!reorderOrder) return;
    try {
      const items = reorderOrder.items || reorderOrder.orderItems || [];
      // Navigate to menu with reorder state (role 1 handles cart)
      navigate('/', { state: { reorderItems: items } });
    } catch { /* noop */ }
    setReorderOrder(null);
  };

  /* ════════════════════════════════════════
     RENDER — TRACKING VIEW
  ════════════════════════════════════════ */
  if (view === 'tracking') {
    return (
      <>
        <style>{css}</style>
        <div className="os-wrap">
          {showReadyBanner && (
            <div className="os-ready-banner">
              <div>
                <div className="os-ready-text">🎉 Your order is ready!</div>
                <div className="os-ready-sub">Come to the counter to collect your drink.</div>
              </div>
              <button className="os-ready-close" onClick={() => setShowReadyBanner(false)}>✕</button>
            </div>
          )}

          <TrackingPage
            order={trackOrder}
            loading={trackLoad}
            error={trackError}
            onBack={backToHub}
          />

          <nav className="os-bottom-nav">
            <button className="os-nav-btn" onClick={() => navigate('/')}>
              <span className="os-nav-icon">🏠</span> Home
            </button>
            <button className="os-nav-btn active">
              <span className="os-nav-icon">🧾</span> Orders
            </button>
            <button className="os-nav-btn" onClick={() => navigate('/payment')}>
              <span className="os-nav-icon">👤</span> Profile
            </button>
          </nav>
        </div>
      </>
    );
  }

  /* ════════════════════════════════════════
     RENDER — ORDERS HUB VIEW
  ════════════════════════════════════════ */
  return (
    <>
      <style>{css}</style>
      <div className="os-wrap">

        {/* Sticky header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
          <div className="os-header" style={{ justifyContent: 'center', position: 'relative' }}>
            <button className="os-icon-btn" style={{ position: 'absolute', left: 16 }} onClick={() => navigate('/')}>←</button>
            <span className="os-header-title">Whistlestop Coffee Hut</span>
          </div>

          <div className="os-tab-nav">
            <button className={`os-tab-btn ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>Active</button>
            <button className={`os-tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
          </div>

          {tab === 'history' && (
            <div className="os-filter-nav">
              {['All', 'Collected', 'Cancelled'].map(f => (
                <button key={f} className={`os-filter-btn ${filterTab === f ? 'active' : ''}`} onClick={() => setFilterTab(f)}>{f}</button>
              ))}
            </div>
          )}
        </div>

        <div className="os-main">

          {/* ── ACTIVE TAB ── */}
          {tab === 'active' && (
            <>
              {/* Hero image */}
              <div className="os-hero">
                <img src={COFFEE_IMG} alt="Orders" />
              </div>

          {/* Ongoing Order */}
          <div className="os-section-title">Ongoing Order</div>
          {hubLoading ? (
            <div className="os-spinner-wrap"><div className="os-spinner" /></div>
          ) : (activeOrder && activeOrder.length > 0) ? (
            // ─── 修改处：使用 map 循环渲染 ───
            activeOrder.map(order => (
              <div key={order.id} className="os-active-card" style={{ marginBottom: '16px' }}>
                <img 
                  className="os-active-card-img" 
                  src={order.imageUrl || COFFEE_IMG} 
                  alt="Order"
                  onError={e => e.target.src = COFFEE_IMG} 
                />
                <div className="os-active-card-body">
                  <div className="os-active-card-top">
                    <div>
                      <StatusBadge status={order.status} />
                      <div className="os-order-id">Order #{order.id}</div>
                    </div>
                    <div>
                      <div className="os-pickup-label">Pickup</div>
                      <div className="os-pickup-val">{formatTime(order.pickupTime)}</div>
                    </div>
                  </div>
                  <div className="os-drink-row">
                    <span className="os-coffee-icon">☕</span>
                    <span>
                      {(() => {
                        const items = order.items || order.orderItems || [];
                        const first = items[0];
                        const text = first ? `${first.size || 'Regular'} ${first.name || first.itemName || 'Coffee'}` : 'Coffee';
                        return items.length > 1 ? `${text} (and ${items.length - 1} more)` : text;
                      })()}
                    </span>
                  </div>
                  <button className="os-btn-track" onClick={() => openTracking(order.id)}>
                    Track Order
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="os-empty">No active orders right now.</div>
          )}

              

              {/* Recent History (in Active tab) */}
              <div className="os-section-title" style={{ marginTop: 28 }}>Recent History</div>
              {historyOrders.length === 0 ? (
                <div className="os-empty">No order history yet.</div>
              ) : (
                historyOrders.slice(0, 2).map(order => (
                  <div key={order.id} className="os-hist-card">
                    <img className="os-hist-card-img" src={order.imageUrl || COFFEE_IMG} alt="Order"
                      onError={e => e.target.src = COFFEE_IMG} />
                    <div className="os-hist-card-body">
                      <div className="os-hist-card-top">
                        <div>
                          <div className="os-hist-id">Order #{order.id}</div>
                          <div className="os-hist-meta">
                            {(order.items || order.orderItems || []).length} Items • {formatDateTime(order.createdAt)}
                          </div>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="os-hist-card-bottom">
                        <div className="os-thumb-group">
                          {(order.items || order.orderItems || []).slice(0, 3).map((item, i) => (
                            <div key={i} className="os-thumb">
                              <img src={item.imageUrl || COFFEE_IMG} alt="" onError={e => e.target.src = COFFEE_IMG} />
                            </div>
                          ))}
                        </div>
                        <button className="os-btn-reorder" onClick={() => setReorderOrder(order)}>Reorder</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* ── HISTORY TAB ── */}
          {tab === 'history' && (
            <>
              <div className="os-hero" style={{ marginTop: 0 }}>
                <img src={HERO_IMG} alt="History" />
              </div>

              {filteredHistory.length === 0 ? (
                <div className="os-empty">No orders found.</div>
              ) : (
                filteredHistory.map(order => (
                  <div key={order.id} className="os-hist-card">
                    <img className="os-hist-card-img" src={order.imageUrl || COFFEE_IMG} alt="Order"
                      onError={e => e.target.src = COFFEE_IMG} />
                    <div className="os-hist-card-body">
                      <div className="os-hist-card-top">
                        <div>
                          <div className="os-hist-id">Order #{order.id}</div>
                          <div className="os-hist-meta">
                            {(order.items || order.orderItems || []).length} Items • {formatDateTime(order.createdAt)}
                          </div>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="os-hist-card-bottom">
                        <div className="os-thumb-group">
                          {(order.items || order.orderItems || []).slice(0, 3).map((item, i) => (
                            <div key={i} className="os-thumb">
                              <img src={item.imageUrl || COFFEE_IMG} alt="" onError={e => e.target.src = COFFEE_IMG} />
                            </div>
                          ))}
                        </div>
                        <button className="os-btn-reorder" onClick={() => setReorderOrder(order)}>Reorder</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Bottom nav */}
        <nav className="os-bottom-nav">
          <button className="os-nav-btn" onClick={() => navigate('/')}>
            <span className="os-nav-icon">🏠</span> Home
          </button>
          <button className="os-nav-btn active">
            <span className="os-nav-icon">🧾</span> Orders
          </button>
          <button className="os-nav-btn" onClick={() => navigate('/payment')}>
            <span className="os-nav-icon">👤</span> Profile
          </button>
        </nav>

        {/* Reorder sheet */}
        {reorderOrder && (
          <ReorderSheet
            order={reorderOrder}
            onClose={() => setReorderOrder(null)}
            onAddToCart={handleReorderAddToCart}
            onNavigateTrain={() => navigate('/train')}
          />
        )}
      </div>
    </>
  );
}