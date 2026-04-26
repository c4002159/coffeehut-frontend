import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
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

function pathToGuestView(pathname) {
  if (pathname.startsWith('/loyalty/register')) return 'register';
  if (pathname.startsWith('/loyalty/login')) return 'login';
  if (pathname.startsWith('/loyalty/profile')) return 'profile';
  return 'landing';
}

export default function LoyaltyScheme() {
  const navigate = useNavigate();
  const location = useLocation();
  const [member, setMember] = useState(() => readMember());
  const [guestTab, setGuestTab] = useState(() =>
    location.pathname.startsWith('/loyalty/register') ? 'register' : 'login'
  );
  const [orderStatusOn, setOrderStatusOn] = useState(true);
  const [readyOn, setReadyOn] = useState(true);
  const [promosOn, setPromosOn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const guestView = pathToGuestView(location.pathname);

  useEffect(() => {
    const onStorage = () => setMember(readMember());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/loyalty/register')) setGuestTab('register');
    else if (location.pathname.startsWith('/loyalty/login')) setGuestTab('login');
  }, [location.pathname]);

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
    localStorage.removeItem('member');
    setMember(null);
    navigate('/loyalty');
  }, [navigate]);

  const saveMember = useCallback((nextMember) => {
    localStorage.setItem('member', JSON.stringify(nextMember));
    setMember(nextMember);
  }, []);

  const handleLogin = useCallback(
    (e) => {
      e.preventDefault();
      const em = loginForm.email.trim();
      if (!em) return;
      const nextMember = {
        name: em.split('@')[0] || 'Member',
        email: em,
        totalOrders: member?.totalOrders ?? 0,
      };
      saveMember(nextMember);
      navigate('/loyalty/profile');
    },
    [loginForm.email, member?.totalOrders, navigate, saveMember]
  );

  const handleRegister = useCallback(
    (e) => {
      e.preventDefault();
      const name = registerForm.name.trim() || 'Member';
      const em = registerForm.email.trim();
      if (!em) return;
      const nextMember = { name, email: em, totalOrders: 0 };
      saveMember(nextMember);
      navigate('/loyalty/profile');
    },
    [navigate, registerForm.email, registerForm.name, saveMember]
  );

  const setAuthTab = (tab) => {
    setGuestTab(tab);
    if (tab === 'register') navigate('/loyalty/register');
    else if (tab === 'login') navigate('/loyalty/login');
    else navigate('/loyalty/login');
  };

  if (member && (guestView === 'login' || guestView === 'register')) {
    return <Navigate to="/loyalty/profile" replace />;
  }

  if (!member && guestView === 'profile') {
    return <Navigate to="/loyalty/login" replace />;
  }

  if (!member && guestView === 'landing') {
    return (
      <div className="loyalty-page loyalty-landing">
        <h1 className="loyalty-brand-title">Whistlestop</h1>
        <section className="loyalty-hero-card" aria-label="Loyalty promotion">
          <div className="loyalty-hero-card-bg" />
          <div className="loyalty-hero-card-overlay">
            <p className="loyalty-hero-kicker">The morning ritual</p>
            <p className="loyalty-hero-line">Collect 9 orders and get your next one free</p>
          </div>
        </section>
        <button
          type="button"
          className="loyalty-cta loyalty-cta-primary"
          onClick={() => navigate('/loyalty/register')}
        >
          Join Loyalty
        </button>
        <button
          type="button"
          className="loyalty-cta loyalty-cta-outline"
          onClick={() => navigate('/loyalty/login')}
        >
          Login
        </button>
      </div>
    );
  }

  if (!member && (guestView === 'login' || guestView === 'register')) {
    const tab = guestTab === 'profile' ? 'profile' : guestView === 'register' ? 'register' : 'login';

    return (
      <div className="loyalty-page loyalty-auth-page">
        <div className="loyalty-auth-split">
          <aside className="loyalty-auth-visual" aria-hidden>
            <div className="loyalty-auth-visual-bg" />
            <div className="loyalty-auth-visual-copy">
              <span className="loyalty-auth-visual-brand">Whistlestop</span>
              <p className="loyalty-auth-visual-tagline">Fresh brews, every journey.</p>
            </div>
          </aside>

          <div className="loyalty-auth-panel">
            <div className="loyalty-auth-brand-row">
              <span className="loyalty-cup-mark" aria-hidden>
                ☕
              </span>
              <div>
                <div className="loyalty-auth-brand-name">Whistlestop Loyalty</div>
                <div className="loyalty-auth-brand-sub">Coffee rewards for regular customers</div>
              </div>
            </div>

            <div className="loyalty-scheme-banner">
              <span className="loyalty-scheme-label">Loyalty scheme</span>
              <span className="loyalty-scheme-text">Collect 9 orders and get your next one free.</span>
            </div>

            <div className="loyalty-tabs" role="tablist" aria-label="Account">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'login'}
                className={`loyalty-tab${tab === 'login' ? ' loyalty-tab-active' : ''}`}
                onClick={() => setAuthTab('login')}
              >
                Login
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'register'}
                className={`loyalty-tab${tab === 'register' ? ' loyalty-tab-active' : ''}`}
                onClick={() => setAuthTab('register')}
              >
                Register
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'profile'}
                className={`loyalty-tab${tab === 'profile' ? ' loyalty-tab-active' : ''}`}
                onClick={() => setGuestTab('profile')}
              >
                Profile
              </button>
            </div>

            {tab === 'profile' && (
              <div className="loyalty-profile-placeholder">
                <p>Sign in to see your stamps, rewards, and saved preferences.</p>
                <button type="button" className="loyalty-cta loyalty-cta-primary" onClick={() => setAuthTab('login')}>
                  Go to Login
                </button>
              </div>
            )}

            {tab === 'login' && (
              <form className="loyalty-form-block" onSubmit={handleLogin}>
                <h2 className="loyalty-welcome-back">Welcome back</h2>
                <label className="loyalty-label" htmlFor="login-email">
                  Email address
                </label>
                <input
                  id="login-email"
                  className="loyalty-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((v) => ({ ...v, email: e.target.value }))}
                />
                <label className="loyalty-label" htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  className="loyalty-input"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((v) => ({ ...v, password: e.target.value }))}
                />
                <button type="button" className="loyalty-forgot" onClick={() => window.alert('Password reset would open here.')}>
                  Forgot password?
                </button>
                <button type="submit" className="loyalty-cta loyalty-cta-primary loyalty-cta-submit">
                  Sign In
                </button>
                <p className="loyalty-switch">
                  New customer?{' '}
                  <button type="button" className="loyalty-link-btn" onClick={() => setAuthTab('register')}>
                    Create an account
                  </button>
                </p>
              </form>
            )}

            {tab === 'register' && (
              <form className="loyalty-form-block" onSubmit={handleRegister}>
                <h2 className="loyalty-welcome-back">Create your account</h2>
                <label className="loyalty-label" htmlFor="register-name">
                  Name
                </label>
                <input
                  id="register-name"
                  className="loyalty-input"
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Thompson"
                  required
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm((v) => ({ ...v, name: e.target.value }))}
                />
                <label className="loyalty-label" htmlFor="register-email">
                  Email address
                </label>
                <input
                  id="register-email"
                  className="loyalty-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((v) => ({ ...v, email: e.target.value }))}
                />
                <label className="loyalty-label" htmlFor="register-password">
                  Password
                </label>
                <input
                  id="register-password"
                  className="loyalty-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((v) => ({ ...v, password: e.target.value }))}
                />
                <button type="submit" className="loyalty-cta loyalty-cta-primary loyalty-cta-submit">
                  Create account
                </button>
                <p className="loyalty-switch loyalty-switch-center">
                  Already have an account?{' '}
                  <button type="button" className="loyalty-link-btn" onClick={() => setAuthTab('login')}>
                    Sign in
                  </button>
                </p>
              </form>
            )}

            <div className="loyalty-auth-footer-actions">
              <button type="button" className="loyalty-cta loyalty-cta-outline loyalty-cta-half" onClick={() => navigate('/loyalty')}>
                Back
              </button>
              <button
                type="button"
                className="loyalty-cta loyalty-cta-primary loyalty-cta-half"
                onClick={() => navigate('/', { state: { page: 'menu' } })}
              >
                Go to Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="loyalty-page">
        <div className="loyalty-guest">
          <p>You are not signed in.</p>
          <button type="button" className="loyalty-cta loyalty-cta-primary" onClick={() => navigate('/loyalty')}>
            Return to loyalty
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="loyalty-page loyalty-profile-page">
      <div className="loyalty-profile-shell">
        <header className="loyalty-header loyalty-header-centered">
          <button type="button" className="loyalty-back loyalty-back-icon" onClick={() => navigate(-1)} aria-label="Back">
            ←
          </button>
          <h1 className="loyalty-title">Profile</h1>
        </header>

        <div className="loyalty-profile-layout">
          <aside className="loyalty-profile-aside">
            <section className="loyalty-profile">
              <div className="loyalty-avatar" aria-hidden>
                {initial}
              </div>
              <h2 className="loyalty-name">{displayName}</h2>
              {email ? <p className="loyalty-email">{email}</p> : null}
            </section>
          </aside>

          <div className="loyalty-profile-stack">
            <section className="loyalty-section loyalty-section-rewards" aria-label="Loyalty rewards">
              <div className="loyalty-stamp-head">
                <h2 className="loyalty-section-title-inline">Loyalty Rewards</h2>
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

            <div className="loyalty-profile-columns">
              <section className="loyalty-section" aria-label="Payment methods">
                <h2 className="loyalty-section-heading">Payment methods</h2>
                <button
                  type="button"
                  className="loyalty-row loyalty-row-chevron"
                  onClick={() => window.alert('Payment management would open here.')}
                >
                  Visa ending in **** 4242
                </button>
                <button
                  type="button"
                  className="loyalty-row loyalty-row-chevron"
                  onClick={() => window.alert('Payment management would open here.')}
                >
                  Apple Pay
                </button>
              </section>

              <section className="loyalty-section" aria-label="Notifications">
                <h2 className="loyalty-section-heading">Notifications</h2>
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
            </div>

            <button type="button" className="loyalty-logout" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
