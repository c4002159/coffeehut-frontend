import { useNavigate } from 'react-router-dom';
import './MenuPage.css';

function MenuPage() {
  const navigate = useNavigate();

  return (
    <main className="menu-page">
      <header className="menu-header">
        <h1 className="menu-brand">Whistlestop</h1>
        <button
          type="button"
          className="menu-profile-btn"
          aria-label="Open register page"
          onClick={() => navigate('/loyalty/register')}
        >
          👤
        </button>
      </header>

      <section className="menu-hero">
        <p>Fresh brews, every journey.</p>
      </section>

      <section className="menu-actions">
        <button type="button" className="menu-btn primary" onClick={() => navigate('/loyalty')}>
          Loyalty
        </button>
        <button type="button" className="menu-btn" onClick={() => navigate('/payment')}>
          Payment Demo
        </button>
      </section>
    </main>
  );
}

export default MenuPage;