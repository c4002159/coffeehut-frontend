// 角色5 负责 - 铁路数据
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function TrainData() {
  const navigate = useNavigate();
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchTrains = () => {
    setLoading(true);
    setError('');
    fetch('http://localhost:8080/api/train?station=CLM')
      .then(res => { if (!res.ok) throw new Error('Failed'); return res.json(); })
      .then(data => { setTrains(data); setLoading(false); })
      .catch(() => { setError('Unable to load train data.'); setLoading(false); });
  };

  useEffect(() => { fetchTrains(); }, []);

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const getDelay = (train) => {
    if (train.status !== 'Delayed') return null;
    return Math.round((new Date(train.expectedArrival) - new Date(train.scheduledArrival)) / 60000);
  };

  const getPickupTime = (train) => {
    const t = new Date(train.expectedArrival || train.scheduledArrival);
    t.setMinutes(t.getMinutes() + 5);
    return formatTime(t.toISOString());
  };

  const handleConfirm = () => {
    if (!selected) return;
    const train = trains.find(t => t.trainId === selected);
    const t = new Date(train.expectedArrival || train.scheduledArrival);
    t.setMinutes(t.getMinutes() + 5);
    navigate('/', { state: { suggestedPickupTime: t.toISOString().slice(0, 16) } });
  };

  const handleSelect = (train) => {
    if (train.status === 'Cancelled') {
      alert('This train has been cancelled. Please select another.');
      return;
    }
    setSelected(train.trainId);
  };

  const getStatusBadge = (train) => {
    const delay = getDelay(train);
    if (train.status === 'Cancelled')
      return <span style={{ padding: '4px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Cancelled</span>;
    if (train.status === 'Delayed')
      return <span style={{ padding: '4px 12px', background: '#fef3c7', color: '#b45309', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Delayed +{delay} min</span>;
    return <span style={{ padding: '4px 12px', background: '#d1fae5', color: '#065f46', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>On time</span>;
  };

  // 响应式 padding：手机16px，电脑32px
  const isMobile = window.innerWidth < 768;
  const sidePad = isMobile ? '16px' : '32px';

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .train-bottom-bar { flex-direction: column !important; gap: 10px !important; }
          .train-bottom-bar .train-status-text { text-align: center; }
          .train-confirm-btn { width: 100% !important; }
          .train-header-actions { gap: 8px !important; }
        }
      `}</style>

      <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", width: '100%', minHeight: '100vh', background: '#f7f7f6', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>

        {/* Header */}
        <nav style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(74,54,33,0.1)', padding: `14px ${sidePad}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', padding: '4px 8px', borderRadius: '8px' }}>←</button>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? '16px' : '20px', fontWeight: 'bold' }}>Choose Your Train</h1>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(74,54,33,0.6)' }}>Whistlestop Coffee Hut</p>
            </div>
          </div>
          <div className="train-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={fetchTrains} style={{ background: '#4A3621', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>🔄 Refresh</button>
            <div style={{ width: '38px', height: '38px', borderRadius: '999px', background: 'rgba(74,54,33,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>☕</div>
          </div>
        </nav>

        {/* Main */}
        <main style={{ flex: 1, padding: `24px ${sidePad} 120px`, boxSizing: 'border-box' }}>

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>🚉</span>
            <input
              placeholder="From which station are you departing?"
              style={{ width: '100%', boxSizing: 'border-box', background: 'white', border: 'none', borderRadius: '12px', padding: '14px 14px 14px 48px', fontSize: '14px', fontWeight: '500', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', outline: 'none' }}
            />
          </div>

          {/* Section title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold' }}>Trains to Cramlington</h2>
            <p style={{ margin: 0, fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live data · Last updated just now</p>
          </div>

          {loading && <p style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>Loading train times...</p>}
          {error && <p style={{ textAlign: 'center', color: 'red', padding: '40px 0' }}>{error}</p>}

          {/* Train cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {trains.map(train => {
              const isCancelled = train.status === 'Cancelled';
              const isSelected = selected === train.trainId;
              const delay = getDelay(train);

              return (
                <div key={train.trainId} onClick={() => handleSelect(train)} style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '16px',
                  border: isSelected ? '2px solid #4A3621' : '2px solid rgba(74,54,33,0.08)',
                  opacity: isCancelled ? 0.6 : 1,
                  cursor: isCancelled ? 'not-allowed' : 'pointer',
                  boxShadow: isSelected ? '0 4px 16px rgba(74,54,33,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '999px', background: isCancelled ? '#f1f1f1' : 'rgba(74,54,33,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🚆</div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '15px', color: isCancelled ? '#aaa' : '#111' }}>{train.origin}</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: isCancelled ? '#aaa' : '#4A3621' }}>{formatTime(train.scheduledArrival)}</div>
                      </div>
                    </div>
                    {getStatusBadge(train)}
                  </div>

                  <div style={{ fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>→ Cramlington {formatTime(train.scheduledArrival)}</span>
                    {delay && <span style={{ color: '#d97706', fontWeight: 'bold' }}>→ {formatTime(train.expectedArrival)}</span>}
                  </div>

                  {isSelected && !isCancelled && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f0ebe4', fontSize: '13px', color: '#4A3621', fontWeight: '600' }}>
                      ☕ Pickup: <strong>{getPickupTime(train)}</strong> (arrival + 5 min)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>

        {/* Bottom bar */}
        <div className="train-bottom-bar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid rgba(74,54,33,0.1)', padding: `14px ${sidePad}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="train-status-text" style={{ fontSize: '14px', color: '#888' }}>
            {selected
              ? `✅ ${trains.find(t => t.trainId === selected)?.origin} → Cramlington · Pickup at ${trains.find(t => t.trainId === selected) ? getPickupTime(trains.find(t => t.trainId === selected)) : ''}`
              : 'Select a train to set your pickup time'}
          </div>
          <button className="train-confirm-btn" onClick={handleConfirm} disabled={!selected} style={{
            padding: '13px 36px', borderRadius: '12px', border: 'none',
            background: selected ? '#4A3621' : 'rgba(74,54,33,0.2)',
            color: 'white', fontSize: '15px', fontWeight: 'bold',
            cursor: selected ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap'
          }}>
            Confirm Train →
          </button>
        </div>
      </div>
    </>
  );
}

export default TrainData;