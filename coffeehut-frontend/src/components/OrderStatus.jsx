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
   STYLES — Premium Minimal
   Espresso: #2C1A0E / Cream: #FAF8F5
───────────────────────────────────────────── */
const css = `
  .os-wrap {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #FAF8F5;
    min-height: 100%;
    color: #1A1008;
    max-width: 100%;
    margin: 0 auto;
    position: relative;
  }

  /* ── Shared header ── */
  .os-header {
    position: sticky; top: 0; z-index: 50;
    background: rgba(250,248,245,0.92);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid rgba(44,26,14,0.09);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .os-header-title { font-size: 0.95rem; font-weight: 700; letter-spacing: 0.01em; }
  .os-icon-btn {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%; background: #F2EDE6; border: none;
    cursor: pointer; font-size: 1rem; color: #4A3621;
    transition: background 0.15s;
  }
  .os-icon-btn:hover { background: #EAE3D8; }
  .os-w10 { width: 36px; }

  /* ── Tab nav (Active / History) ── */
  .os-tab-nav {
    display: flex;
    border-bottom: 1px solid rgba(44,26,14,0.09);
    background: rgba(250,248,245,0.92);
    backdrop-filter: blur(14px);
  }
  .os-tab-btn {
    flex: 1; padding: 13px 0;
    font-size: 0.875rem; font-weight: 700;
    border: none; border-bottom: 2px solid transparent;
    background: none; cursor: pointer;
    color: #A89A8A;
    transition: all 0.15s;
    letter-spacing: 0.01em;
  }
  .os-tab-btn.active { border-bottom-color: #2C1A0E; color: #2C1A0E; }

  /* ── History filter tabs ── */
  .os-filter-nav {
    display: flex;
    border-bottom: 1px solid rgba(44,26,14,0.06);
    background: rgba(250,248,245,0.92);
    backdrop-filter: blur(14px);
  }
  .os-filter-btn {
    flex: 1; padding: 10px 0;
    font-size: 0.75rem; font-weight: 700;
    border: none; border-bottom: 2px solid transparent;
    background: none; cursor: pointer;
    color: #A89A8A;
    transition: all 0.15s;
  }
  .os-filter-btn.active { border-bottom-color: #2C1A0E; color: #2C1A0E; }

  /* ── Main scroll area ── */
  .os-main { padding: 16px; padding-bottom: 100px; }

  /* ── Section title ── */
  .os-section-title {
    font-size: 0.72rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: #A89A8A; margin-bottom: 14px;
  }

  /* ── Active order card ── */
  .os-active-card {
    background: #fff;
    border-radius: 18px;
    border: 1px solid rgba(44,26,14,0.09);
    box-shadow: 0 2px 8px rgba(44,26,14,0.06), 0 8px 24px rgba(44,26,14,0.04);
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
    padding: 3px 9px;
    background: #fff3e0; color: #b45309;
    border-radius: 999px; font-size: 0.62rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em;
    margin-bottom: 4px;
  }
  .os-badge-ready {
    display: inline-block;
    padding: 3px 9px;
    background: #dcfce7; color: #15803d;
    border-radius: 999px; font-size: 0.62rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em;
    margin-bottom: 4px;
  }
  .os-badge-pending {
    display: inline-block;
    padding: 3px 9px;
    background: #F2EDE6; color: #7A6A5A;
    border-radius: 999px; font-size: 0.62rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em;
    margin-bottom: 4px;
  }
  .os-order-id { font-size: 1.2rem; font-weight: 800; letter-spacing: -0.01em; color: #1A1008; }
  .os-pickup-label {
    font-size: 0.62rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: #A89A8A; margin-bottom: 2px;
  }
  .os-pickup-val { font-weight: 700; color: #1A1008; }
  .os-drink-row {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 0; border-top: 1px solid rgba(44,26,14,0.06);
    border-bottom: 1px solid rgba(44,26,14,0.06); margin-bottom: 12px;
    font-size: 0.875rem; color: #7A6A5A;
  }
  .os-btn-track {
    width: 100%; height: 48px;
    background: #2C1A0E; color: #fff;
    border: none; border-radius: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.9rem; font-weight: 700;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
    box-shadow: 0 3px 12px rgba(44,26,14,0.28);
    letter-spacing: 0.01em;
  }
  .os-btn-track:hover { background: #1e1008; box-shadow: 0 4px 16px rgba(44,26,14,0.38); }
  .os-btn-track:active { transform: scale(0.97); }

  .os-btn-cancel {
    width: 100%; height: 40px;
    background: transparent; color: #dc2626;
    border: 1.5px solid rgba(220,38,38,0.3); border-radius: 12px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.875rem; font-weight: 700;
    cursor: pointer; margin-top: 10px;
    transition: background 0.15s, transform 0.1s;
  }
  .os-btn-cancel:hover { background: #fff1f2; }
  .os-btn-cancel:active { transform: scale(0.97); }
  .os-btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }

  .os-cancel-confirm {
    position: fixed; inset: 0; z-index: 1100;
    background: rgba(26,16,8,0.5);
    display: flex; align-items: flex-end; justify-content: center;
  }
  .os-cancel-confirm-sheet {
    background: #fff; border-radius: 24px 24px 0 0;
    width: 100%; max-width: 480px;
    padding: 28px 24px 40px;
  }
  .os-cancel-confirm-title {
    font-size: 1.1rem; font-weight: 800; margin-bottom: 8px; color: #1A1008; letter-spacing: -0.01em;
  }
  .os-cancel-confirm-sub {
    font-size: 0.875rem; color: #7A6A5A; margin-bottom: 24px; line-height: 1.6;
  }
  .os-cancel-confirm-yes {
    width: 100%; height: 48px;
    background: #dc2626; color: #fff;
    border: none; border-radius: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.95rem; font-weight: 700;
    cursor: pointer; margin-bottom: 10px;
  }
  .os-cancel-confirm-no {
    width: 100%; height: 44px;
    background: #F2EDE6; color: #1A1008;
    border: none; border-radius: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.95rem; font-weight: 700;
    cursor: pointer;
  }

  /* ── Empty state ── */
  .os-empty {
    padding: 36px; text-align: center;
    background: white; border-radius: 18px;
    border: 1.5px dashed rgba(44,26,14,0.15);
    color: #A89A8A; font-size: 0.875rem;
  }

  /* ── History cards ── */
  .os-hist-card {
    background: #fff;
    border-radius: 18px;
    border: 1px solid rgba(44,26,14,0.09);
    box-shadow: 0 2px 8px rgba(44,26,14,0.06);
    overflow: hidden;
    margin-bottom: 14px;
  }
  .os-hist-card-img {
    width: 100%; height: 128px; object-fit: cover;
  }
  .os-hist-card-body { padding: 16px; }
  .os-hist-card-top {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 14px;
  }
  .os-hist-id { font-size: 1.05rem; font-weight: 800; color: #1A1008; letter-spacing: -0.01em; }
  .os-hist-meta { font-size: 0.73rem; color: #A89A8A; margin-top: 3px; font-weight: 500; }
  .os-badge-collected {
    padding: 3px 10px;
    background: #dcfce7; color: #15803d;
    border-radius: 999px; font-size: 0.65rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .os-badge-cancelled {
    padding: 3px 10px;
    background: #fee2e2; color: #dc2626;
    border-radius: 999px; font-size: 0.65rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .os-badge-other {
    padding: 3px 10px;
    background: #F2EDE6; color: #7A6A5A;
    border-radius: 999px; font-size: 0.65rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .os-hist-card-bottom {
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 14px; border-top: 1px solid rgba(44,26,14,0.07);
  }
  .os-thumb-group { display: flex; }
  .os-thumb {
    width: 32px; height: 32px;
    border-radius: 50%; border: 2px solid #fff;
    overflow: hidden; background: #F2EDE6;
    margin-left: -8px;
  }
  .os-thumb:first-child { margin-left: 0; }
  .os-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .os-btn-reorder {
    padding: 8px 18px;
    background: #2C1A0E; color: #fff;
    border: none; border-radius: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem; font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(44,26,14,0.25);
    transition: background 0.15s, box-shadow 0.15s;
    letter-spacing: 0.01em;
  }
  .os-btn-reorder:hover { background: #1e1008; box-shadow: 0 3px 12px rgba(44,26,14,0.35); }

  /* ════════════════════════════════════════
     ORDER TRACKING PAGE
  ════════════════════════════════════════ */
  .os-tracking-wrap {
    background: #FAF8F5;
    min-height: 100%;
    padding-bottom: 100px;
  }
  .os-ref-bar {
    padding: 20px 16px 16px;
    display: flex; justify-content: space-between; align-items: flex-end;
    background: #FAF8F5;
  }
  .os-ref-label {
    font-size: 0.62rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: #A89A8A; margin-bottom: 3px;
  }
  .os-ref-id { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; color: #1A1008; }
  .os-est-label {
    font-size: 0.62rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: #A89A8A; text-align: right; margin-bottom: 3px;
  }
  .os-est-time { font-size: 1.3rem; font-weight: 800; color: #2C1A0E; text-align: right; letter-spacing: -0.02em; }

  /* Status card */
  .os-status-card {
    margin: 0 16px 20px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(44,26,14,0.12), 0 1px 4px rgba(44,26,14,0.08);
    border: 1px solid rgba(44,26,14,0.09);
    background: white;
  }
  .os-status-card-img {
    width: 100%; height: 220px; object-fit: cover;
    display: block;
  }
  .os-status-card-body { padding: 18px 20px; }
  .os-status-pulse-row {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 6px;
  }
  .os-pulse-dot {
    width: 9px; height: 9px; border-radius: 50%;
    background: #f97316;
    animation: osPulse 1.6s ease-in-out infinite;
  }
  .os-pulse-dot.ready-dot  { background: #16a34a; }
  .os-pulse-dot.done-dot   { background: #A89A8A; animation: none; }
  @keyframes osPulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:0.35; transform:scale(0.72); }
  }
  .os-status-title { font-size: 1.05rem; font-weight: 800; color: #1A1008; letter-spacing: -0.01em; }
  .os-status-sub { font-size: 0.85rem; color: #7A6A5A; line-height: 1.6; margin-top: 5px; }

  /* Cancelled card */
  .os-cancelled-card {
    margin: 0 16px 20px;
    background: #fff1f2; border: 1px solid #fecdd3;
    border-radius: 20px; padding: 24px;
    text-align: center;
  }
  .os-cancelled-icon { font-size: 2.5rem; margin-bottom: 8px; }
  .os-cancelled-title { font-size: 1.05rem; font-weight: 800; color: #dc2626; margin-bottom: 6px; }
  .os-cancelled-sub { font-size: 0.875rem; color: #7A6A5A; line-height: 1.6; }

  /* Timeline */
  .os-timeline-section { padding: 0 16px 20px; }
  .os-timeline-title {
    font-size: 0.72rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: #A89A8A; margin-bottom: 20px;
  }
  .os-tl-list { position: relative; }
  .os-tl-list::before {
    content: '';
    position: absolute; left: 16px; top: 8px; bottom: 8px;
    width: 2px; background: rgba(44,26,14,0.1);
  }
  .os-tl-item {
    display: flex; align-items: flex-start; gap: 16px;
    position: relative; z-index: 1;
    margin-bottom: 26px;
  }
  .os-tl-item:last-child { margin-bottom: 0; }
  .os-tl-dot {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; font-weight: 700;
    flex-shrink: 0;
    border: 3px solid #FAF8F5;
    box-shadow: 0 0 0 2px rgba(44,26,14,0.15);
  }
  .os-tl-dot.done    { background: #2C1A0E; color: #fff; box-shadow: 0 0 0 2px #2C1A0E; }
  .os-tl-dot.current { background: #FAF8F5; color: #2C1A0E; box-shadow: 0 0 0 2px #2C1A0E; }
  .os-tl-dot.future  { background: #F2EDE6; color: #C4B8A8; box-shadow: 0 0 0 2px rgba(44,26,14,0.1); }
  .os-tl-content { padding-top: 4px; }
  .os-tl-label { font-size: 0.9rem; font-weight: 700; color: #1A1008; }
  .os-tl-label.future { color: #A89A8A; font-weight: 500; }
  .os-tl-sub { font-size: 0.75rem; color: #A89A8A; margin-top: 2px; font-weight: 500; }
  .os-tl-time { font-size: 0.7rem; color: #A89A8A; margin-top: 2px; }

  /* Pickup location */
  .os-location-section { padding: 0 16px; margin-bottom: 16px; }
  .os-location-card {
    background: white; border-radius: 20px;
    padding: 18px 20px; border: 1px solid rgba(44,26,14,0.09);
    box-shadow: 0 1px 4px rgba(44,26,14,0.06);
  }
  .os-location-row {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 14px;
  }
  .os-location-label {
    font-size: 0.62rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: #A89A8A; margin-bottom: 3px;
  }
  .os-location-name { font-weight: 700; color: #1A1008; font-size: 0.95rem; }
  .os-btn-directions {
    background: #2C1A0E; color: #fff;
    border: none; border-radius: 10px;
    padding: 8px 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.78rem; font-weight: 700;
    cursor: pointer; text-decoration: none;
    display: inline-block;
    box-shadow: 0 2px 8px rgba(44,26,14,0.28);
    transition: background 0.15s, box-shadow 0.15s;
  }
  .os-btn-directions:hover { background: #1e1008; box-shadow: 0 3px 12px rgba(44,26,14,0.38); }
  .os-map-box {
    height: 152px; border-radius: 14px; overflow: hidden;
    border: 1px solid rgba(44,26,14,0.09);
    background: linear-gradient(135deg, #F2EDE6 0%, #E8DDD0 100%);
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .os-map-box::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(44,26,14,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(44,26,14,0.06) 1px, transparent 1px);
    background-size: 28px 28px;
  }
  .os-map-pin { font-size: 2.5rem; position: relative; z-index: 1; }

  /* ── Spinner ── */
  .os-spinner-wrap {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 80px 20px; gap: 14px;
    color: #A89A8A; font-size: 0.9rem; font-weight: 500;
  }
  .os-spinner {
    width: 30px; height: 30px;
    border: 2.5px solid rgba(44,26,14,0.12);
    border-top-color: #2C1A0E;
    border-radius: 50%;
    animation: ospin 0.7s linear infinite;
  }
  @keyframes ospin { to { transform: rotate(360deg); } }

  /* ── Ready banner ── */
  .os-ready-banner {
    position: sticky; top: 0; left: 0; right: 0;
    width: 100%; z-index: 200;
    background: #2C1A0E; color: #fff;
    padding: 16px 20px;
    display: flex; justify-content: space-between; align-items: center;
    box-shadow: 0 4px 20px rgba(44,26,14,0.35);
    animation: slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-100%); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .os-ready-text { font-size: 0.9rem; font-weight: 700; letter-spacing: 0.01em; }
  .os-ready-sub  { font-size: 0.75rem; opacity: 0.75; margin-top: 2px; }
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
    z-index: 1000;
  }
  .os-sheet {
    position: fixed; bottom: 0;
    left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 100%;
    background: #fff; border-radius: 32px 32px 0 0;
    padding: 24px 24px env(safe-area-inset-bottom, 36px);
    padding-bottom: max(36px, env(safe-area-inset-bottom, 36px));
    z-index: 1001;
    max-height: 85vh;
    overflow-y: auto;
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

  /* ── Desktop Responsiveness ── */
  @media (min-width: 769px) {
    .os-wrap {
      max-width: 100%;
    }
    .os-main {
      padding: 20px 20px 100px;
    }
    .os-active-card {
      display: grid;
      grid-template-columns: 200px 1fr;
    }
    .os-active-card-img {
      height: 100%;
    }
    .os-hist-card {
      display: grid;
      grid-template-columns: 180px 1fr;
    }
    .os-hist-card-img {
      height: 100%;
    }
    .os-status-card-img {
      height: 300px;
    }
  }
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
function ReorderSheet({ order, onClose, onAddToCart, onEditCart, onNavigateTrain }) {
  const [tab, setTab] = useState('time');
  const items = order?.items || order?.orderItems || [];

  return (
    <>
      <div className="os-sheet-overlay" onClick={onClose} />
      <div className="os-sheet">
        <div className="os-sheet-handle" />
        <div className="os-sheet-title">Reorder {order?.orderNumber || `#${order?.id}`}</div>

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
        <button className="os-sheet-edit" onClick={onEditCart || onClose}>Edit before ordering</button>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   ORDER TRACKING PAGE
───────────────────────────────────────────── */
function TrackingPage({ order, loading, error, onBack, onCancel, cancelling }) {
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
          <div className="os-ref-id">{order.orderNumber || `#${order.id}`}</div>
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

      {/* Cancel button — for all non-cancelled orders */}
      {!isCancelled && onCancel && (
        <div style={{ padding: '0 16px 16px' }}>
          <button
            className="os-btn-cancel"
            disabled={cancelling}
            onClick={onCancel}
          >
            {cancelling ? 'Cancelling…' : 'Cancel Order'}
          </button>
        </div>
      )}
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

  // Cancel order
  const [confirmCancelId, setConfirmCancelId] = useState(null); // orderId to confirm
  const [cancellingId,    setCancellingId]    = useState(null); // orderId being cancelled

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
      const ids = JSON.parse(localStorage.getItem('myOrderIds') || '[]');
      let list = [];

      if (ids.length > 0) {
        const orders = await Promise.all(
          ids.map(id => fetch(`${API_BASE}/api/orders/${id}`).then(r => r.ok ? r.json() : null).catch(() => null))
        );
        // For each order, also fetch its items
        list = await Promise.all(
          orders.filter(Boolean).map(async order => {
            try {
              const itemsRes = await fetch(`${API_BASE}/api/orders/${order.id}/items`);
              const items = itemsRes.ok ? await itemsRes.json() : [];
              return { ...order, items: Array.isArray(items) ? items : [] };
            } catch {
              return { ...order, items: [] };
            }
          })
        );
      } else {
        // fallback: query by name
        const member = JSON.parse(localStorage.getItem('member') || '{}');
        const name = member.name || localStorage.getItem('lastOrderCustomerName') || '';
        if (!name) { setHubLoading(false); return; }
        const res = await fetch(`${API_BASE}/api/orders/customer?name=${encodeURIComponent(name)}`);
        if (!res.ok) { setHubLoading(false); return; }
        list = await res.json();
        if (!Array.isArray(list)) list = [];
      }

      const active = list.filter(o => !['collected','cancelled'].includes(o.status));
      setActiveOrder(active);
      setHistoryOrders(list.filter(o => ['collected','cancelled'].includes(o.status)));
    } catch {
      /* silent */
    } finally {
      setHubLoading(false);
    }
  };

  /* ── Cancel order ── */
  const cancelOrder = async (orderId) => {
    setCancellingId(orderId);
    setConfirmCancelId(null);
    try {
      // Fetch order details for refund page only — do NOT cancel yet
      let customerName = '';
      let totalPrice = 0;
      try {
        const orderRes = await fetch(`${API_BASE}/api/orders/${orderId}`);
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          customerName = orderData?.customerName || '';
          totalPrice = orderData?.totalPrice || 0;
        }
      } catch { /* use defaults */ }

      const customerId = `CUST-${customerName.replace(/\s+/g, '_')}-${orderId}`;
      // Navigate to refund page — actual cancellation happens after refund succeeds
      navigate('/payment', {
        state: { refundMode: true, orderId, customerName, totalPrice, customerId },
      });
    } catch {
      /* silent */
    } finally {
      setCancellingId(null);
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
  const buildCartItems = (order) => {
    const items = order?.items || order?.orderItems || [];
    return items.map(item => ({
      id: item.itemId || item.id,
      name: item.name || item.itemName || 'Coffee',
      size: item.size || 'Regular',
      price: item.unitPrice
        || (item.quantity ? (item.subtotal || 0) / item.quantity : 0)
        || item.price
        || 0,
      quantity: item.quantity || 1,
      customization: {},
    }));
  };

  const handleReorderAddToCart = () => {
    if (!reorderOrder) return;
    navigate('/', { state: { page: 'cart', cartItems: buildCartItems(reorderOrder) } });
    setReorderOrder(null);
  };

  const handleReorderEditCart = () => {
    if (!reorderOrder) return;
    navigate('/', { state: { page: 'cart', cartItems: buildCartItems(reorderOrder) } });
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
            onCancel={trackOrder ? () => setConfirmCancelId(trackOrder.id) : null}
            cancelling={trackOrder ? cancellingId === trackOrder.id : false}
          />

          {/* 底部导航由 App.js CustomerLayout 统一管理 */}

          {/* Cancel confirmation sheet (tracking view) */}
          {confirmCancelId && (
            <div className="os-cancel-confirm" onClick={() => setConfirmCancelId(null)}>
              <div className="os-cancel-confirm-sheet" onClick={e => e.stopPropagation()}>
                <div className="os-cancel-confirm-title">Cancel this order?</div>
                <div className="os-cancel-confirm-sub">
                  Once cancelled, your order cannot be reinstated. You won't be charged if you haven't been already.
                </div>
                <button
                  className="os-cancel-confirm-yes"
                  onClick={() => cancelOrder(confirmCancelId)}
                >
                  Yes, cancel order
                </button>
                <button
                  className="os-cancel-confirm-no"
                  onClick={() => setConfirmCancelId(null)}
                >
                  Keep my order
                </button>
              </div>
            </div>
          )}
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
            <button
              className="os-icon-btn"
              style={{ position: 'absolute', right: 16, fontSize: '1rem' }}
              onClick={fetchHubOrders}
              title="Refresh"
            >
              ↻
            </button>
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
          {/* Ongoing Order */}
          <div className="os-section-title">Ongoing Order</div>
          {hubLoading ? (
            <div className="os-spinner-wrap"><div className="os-spinner" /><span>Loading orders…</span></div>
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
                      <div className="os-order-id">{order.orderNumber || `Order #${order.id}`}</div>
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
                  <button
                    className="os-btn-cancel"
                    disabled={cancellingId === order.id}
                    onClick={() => setConfirmCancelId(order.id)}
                  >
                    {cancellingId === order.id ? 'Cancelling…' : 'Cancel Order'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="os-empty" style={{ padding: '28px 20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>☕</div>
              <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#475569', fontSize: '0.95rem' }}>No active orders</p>
              <p style={{ margin: '0 0 18px', fontSize: '0.8rem' }}>Place an order and track it here in real time.</p>
              <button
                onClick={() => navigate('/', { state: { page: 'menu' } })}
                style={{ padding: '10px 24px', background: '#4a3621', color: 'white', border: 'none', borderRadius: '10px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(74,54,33,0.25)' }}
              >
                Order Now
              </button>
            </div>
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
                          <div className="os-hist-id">{order.orderNumber || `Order #${order.id}`}</div>
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
                          <div className="os-hist-id">{order.orderNumber || `Order #${order.id}`}</div>
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

        {/* 底部导航由 App.js CustomerLayout 统一管理 */}

        {/* Reorder sheet */}
        {reorderOrder && (
          <ReorderSheet
            order={reorderOrder}
            onClose={() => setReorderOrder(null)}
            onAddToCart={handleReorderAddToCart}
            onEditCart={handleReorderEditCart}
            onNavigateTrain={() => navigate('/train')}
          />
        )}

        {/* Cancel confirmation sheet */}
        {confirmCancelId && (
          <div className="os-cancel-confirm" onClick={() => setConfirmCancelId(null)}>
            <div className="os-cancel-confirm-sheet" onClick={e => e.stopPropagation()}>
              <div className="os-cancel-confirm-title">Cancel this order?</div>
              <div className="os-cancel-confirm-sub">
                Once cancelled, your order cannot be reinstated. You won't be charged if you haven't been already.
              </div>
              <button
                className="os-cancel-confirm-yes"
                onClick={() => cancelOrder(confirmCancelId)}
              >
                Yes, cancel order
              </button>
              <button
                className="os-cancel-confirm-no"
                onClick={() => setConfirmCancelId(null)}
              >
                Keep my order
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
