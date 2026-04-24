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

export default function LoyaltyScheme({ initialView = 'landing' }) {
  const navigate = useNavigate();
  const [member, setMember] = useState(() => readMember());
  const [view, setView] = useState(initialView);
  const [orderStatusOn, setOrderStatusOn] = useState(true);
  const [readyOn, setReadyOn] = useState(true);
  const [promosOn, setPromosOn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    const onStorage = () => setMember(readMember());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

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
    setMember(null);
    setView('landing');
    navigate('/');
  }, [navigate]);

  const saveMember = useCallback((nextMember) => {
    localStorage.setItem('member', JSON.stringify(nextMember));
    setMember(nextMember);
  }, []);

  const handleLogin = useCallback(
    (e) => {
      e.preventDefault();
      const email = loginForm.email.trim();
      if (!email) return;
      const nextMember = {
        name: email.split('@')[0] || 'Member',
        email,
        totalOrders: member?.totalOrders ?? 0,
      };
      saveMember(nextMember);
      setView('profile');
      navigate('/loyalty/profile');
    },
    [loginForm.email, member?.totalOrders, navigate, saveMember]
  );

  const handleRegister = useCallback(
    (e) => {
      e.preventDefault();
      const name = registerForm.name.trim() || 'Member';
      const email = registerForm.email.trim();
      if (!email) return;
      const nextMember = { name, email, totalOrders: 0 };
      saveMember(nextMember);
      setView('profile');
      navigate('/loyalty/profile');
    },
    [navigate, registerForm.email, registerForm.name, saveMember]
  );

  if (!member && view === 'landing') {
    return (
      <div className="loyalty-page">
        <section className="loyalty-hero">
          <h1 className="loyalty-brand">Whistlestop</h1>
          <div className="loyalty-promo">Collect 9 orders and get your next one free</div>
          <button
            type="button"
            className="loyalty-cta primary"
            onClick={() => {
              setView('register');
              navigate('/loyalty/register');
            }}
          >
            Join Loyalty
          </button>
          <button
            type="button"
            className="loyalty-cta"
            onClick={() => {
              setView('login');
              navigate('/loyalty/login');
            }}
          >
            Login
          </button>
        </section>
      </div>
    );
  }

  if (!member && view === 'login') {
    return (
      <div className="loyalty-page">
        <header className="loyalty-header">
          <button type="button" className="loyalty-back" onClick={() => navigate('/loyalty')}>
            Back
          </button>
          <h1 className="loyalty-title">Welcome Back</h1>
        </header>
        <form className="loyalty-form-card" onSubmit={handleLogin}>
          <label className="loyalty-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="loyalty-input"
            type="email"
            required
            value={loginForm.email}
            onChange={(e) => setLoginForm((v) => ({ ...v, email: e.target.value }))}
          />
          <label className="loyalty-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="loyalty-input"
            type="password"
            required
            value={loginForm.password}
            onChange={(e) => setLoginForm((v) => ({ ...v, password: e.target.value }))}
          />
          <button type="submit" className="loyalty-cta primary">Sign in</button>
          <p className="loyalty-switch">
            New customer?{' '}
            <button
              type="button"
              className="loyalty-link-btn"
              onClick={() => {
                setView('register');
                navigate('/loyalty/register');
              }}
            >
              Create an account
            </button>
          </p>
        </form>
      </div>
    );
  }

  if (!member && view === 'register') {
    return (
      <div className="loyalty-page">
        <header className="loyalty-header">
          <button type="button" className="loyalty-back" onClick={() => navigate('/')}>
            Back
          </button>
          <h1 className="loyalty-title">Create Account</h1>
        </header>
        <form className="loyalty-form-card" onSubmit={handleRegister}>
          <label className="loyalty-label" htmlFor="register-name">Name</label>
          <input
            id="register-name"
            className="loyalty-input"
            type="text"
            required
            value={registerForm.name}
            onChange={(e) => setRegisterForm((v) => ({ ...v, name: e.target.value }))}
          />
          <label className="loyalty-label" htmlFor="register-email">Email</label>
          <input
            id="register-email"
            className="loyalty-input"
            type="email"
            required
            value={registerForm.email}
            onChange={(e) => setRegisterForm((v) => ({ ...v, email: e.target.value }))}
          />
          <label className="loyalty-label" htmlFor="register-password">Password</label>
          <input
            id="register-password"
            className="loyalty-input"
            type="password"
            required
            value={registerForm.password}
            onChange={(e) => setRegisterForm((v) => ({ ...v, password: e.target.value }))}
          />
          <button type="submit" className="loyalty-cta primary">Create account</button>
        </form>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="loyalty-page">
        <div className="loyalty-guest">
          <p>You are not signed in.</p>
          <button type="button" className="loyalty-cta primary" onClick={() => navigate('/loyalty')}>
            Return to loyalty
          </button>
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
