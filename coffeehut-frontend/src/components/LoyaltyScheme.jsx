import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoyaltyScheme.css';

function readMember() {
  try {
    const raw = localStorage.getItem('member');
    if (!raw) return null;
    const m = JSON.parse(raw);
    if (!m || typeof m !== 'object') return null;
    return m;
  } catch {
    return null;
  }
}

export default function LoyaltyScheme() {
  const navigate = useNavigate();
  const [member, setMember] = useState(() => readMember());
  const [orderStatusOn, setOrderStatusOn] = useState(true);
  const [readyOn, setReadyOn] = useState(true);
  const [promosOn, setPromosOn] = useState(false);

  useEffect(() => {
    const onStorage = () => setMember(readMember());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const totalOrders = useMemo(() => {
    const n = Number(member?.totalOrders);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }, [member]);

  const stamps = totalOrders % 10;
  const nextOrderFree = stamps === 9;

  const displayName =
    typeof member?.name === 'string' && member.name.trim()
      ? member.name.trim()
      : 'Member';
  const email =
    typeof member?.email === 'string' && member.email.trim()
      ? member.email.trim()
      : '';

  const initial = displayName.charAt(0).toUpperCase() || '?';

  const stampHint = useMemo(() => {
    if (nextOrderFree) return null;
    const remaining = 9 - stamps;
    if (remaining <= 0) return null;
    return `${remaining} more to your next free drink!`;
  }, [nextOrderFree, stamps]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    navigate('/');
  }, [navigate]);

  if (!member) {
    return (
      <div className="loyalty-page">
        <header className="loyalty-header">
          <button
            type="button"
            className="loyalty-back"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
          <h1 className="loyalty-title">Profile</h1>
        </header>
        <div className="loyalty-guest">
          <p>You are not signed in.</p>
          <p>
            <a href="/">Return home</a> to log in or register.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="loyalty-page">
      <header className="loyalty-header">
        <button
          type="button"
          className="loyalty-back"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        <h1 className="loyalty-title">Profile</h1>
      </header>

      <section className="loyalty-profile">
        <div className="loyalty-avatar" aria-hidden>
          {initial}
        </div>
        <h2 className="loyalty-name">{displayName}</h2>
        {email ? <p className="loyalty-email">{email}</p> : null}
      </section>

      <section className="loyalty-section" aria-label="Loyalty rewards">
        <div className="loyalty-stamp-head">
          <h2 style={{ margin: 0 }}>Loyalty rewards</h2>
          <span className="loyalty-stamp-count">
            {stamps}/9
          </span>
        </div>
        {nextOrderFree ? (
          <p className="loyalty-stamp-hint free">Next order is FREE!</p>
        ) : (
          <p className="loyalty-stamp-hint">{stampHint}</p>
        )}
        <div className="loyalty-cups" role="list">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              role="listitem"
              className={`loyalty-cup${i < stamps ? ' filled' : ''}`}
              aria-label={i < stamps ? 'Stamp earned' : 'Empty stamp'}
            >
              {i < stamps ? '☕' : '○'}
            </div>
          ))}
        </div>
      </section>

      <section className="loyalty-section" aria-label="Payment methods">
        <h2>Payment methods</h2>
        <button
          type="button"
          className="loyalty-row"
          onClick={() =>
            window.alert('Payment management would open here.')
          }
        >
          Visa ending in **** 1243
        </button>
        <button
          type="button"
          className="loyalty-row"
          onClick={() =>
            window.alert('Payment management would open here.')
          }
        >
          Apple Pay
        </button>
      </section>

      <section className="loyalty-section" aria-label="Notifications">
        <h2>Notifications</h2>
        <div className="loyalty-row loyalty-toggle-row">
          <span>Order Status Updates</span>
          <button
            type="button"
            className={`loyalty-toggle${orderStatusOn ? ' on' : ''}`}
            onClick={() => setOrderStatusOn((v) => !v)}
            aria-pressed={orderStatusOn}
            aria-label="Order status updates"
          />
        </div>
        <div className="loyalty-row loyalty-toggle-row">
          <span>Ready for Collection Alerts</span>
          <button
            type="button"
            className={`loyalty-toggle${readyOn ? ' on' : ''}`}
            onClick={() => setReadyOn((v) => !v)}
            aria-pressed={readyOn}
            aria-label="Ready for collection alerts"
          />
        </div>
        <div className="loyalty-row loyalty-toggle-row">
          <span>Promotions</span>
          <button
            type="button"
            className={`loyalty-toggle${promosOn ? ' on' : ''}`}
            onClick={() => setPromosOn((v) => !v)}
            aria-pressed={promosOn}
            aria-label="Promotions"
          />
        </div>
      </section>

      <button type="button" className="loyalty-logout" onClick={handleLogout}>
        <span aria-hidden>⎋</span> Log Out
      </button>
    </div>
  );
}
