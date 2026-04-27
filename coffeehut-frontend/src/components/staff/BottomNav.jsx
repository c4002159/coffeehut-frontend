import { useNavigate } from 'react-router-dom';

const navStyle = {
  position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
  background: 'white', borderTop: '1px solid #e5e7eb',
  display: 'flex', alignItems: 'center',
  paddingTop: '10px', paddingBottom: 'env(safe-area-inset-bottom, 16px)',
};

const itemStyle = (active) => ({
  flex: 1, textAlign: 'center', cursor: 'pointer',
  color: active ? '#4A3621' : '#9ca3af',
});

const labelStyle = (active) => ({
  margin: '2px 0 0', fontSize: '10px', fontWeight: '500',
  display: 'block', minWidth: 0,
});

// active: 'home' | 'menu' | 'orders' | 'profile'
// onHome / onMenu: optional overrides for instant in-page switching
export default function BottomNav({ active, onHome, onMenu }) {
  const navigate = useNavigate();

  const items = [
    {
      key: 'home',
      icon: '🏠',
      label: 'Home',
      action: onHome || (() => navigate('/', { state: { page: 'home' } })),
    },
    {
      key: 'menu',
      icon: '☕',
      label: 'Menu',
      action: onMenu || (() => navigate('/', { state: { page: 'menu' } })),
    },
    {
      key: 'orders',
      icon: '📦',
      label: 'Orders',
      action: () => navigate('/order-status'),
    },
    {
      key: 'profile',
      icon: '👤',
      label: 'Profile',
      action: () => {
        const m = localStorage.getItem('member');
        navigate(m ? '/loyalty/profile' : '/loyalty/register');
      },
    },
  ];

  return (
    <nav style={navStyle}>
      {items.map(({ key, icon, label, action }) => (
        <div key={key} onClick={action} style={itemStyle(active === key)}>
          <div style={{ fontSize: '22px' }}>{icon}</div>
          <span style={labelStyle(active === key)}>{label}</span>
        </div>
      ))}
    </nav>
  );
}
