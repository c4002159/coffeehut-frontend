import { useState, useEffect } from 'react';

const statusColors = {
  pending: '#999',
  accepted: '#2196F3',
  in_progress: '#FF9800',
  ready: '#4CAF50',
  collected: '#6f4e37',
  cancelled: '#f44336'
};

const statusLabels = {
  pending: '⏳ Pending',
  accepted: '✅ Accepted',
  in_progress: '☕ In Progress',
  ready: '🔔 Ready',
  collected: '✔ Collected',
  cancelled: '❌ Cancelled'
};

function StaffDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    fetch('http://localhost:8080/api/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
    // 每10秒自动刷新
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = (id, status) => {
    fetch(`http://localhost:8080/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(() => fetchOrders());
  };

  if (loading) return <p style={{ padding: '20px' }}>Loading orders...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>☕ Staff Dashboard</h1>
        <button onClick={fetchOrders} style={{
          background: '#6f4e37', color: 'white', border: 'none',
          padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'
        }}>🔄 Refresh</button>
      </div>

      {orders.length === 0 ? (
        <p style={{ color: '#999', fontSize: '18px' }}>No active orders</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {orders.map(order => (
            <div key={order.id} style={{
              border: '1px solid #ccc', borderRadius: '8px',
              padding: '16px', width: '280px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Order #{order.id}</h3>
                <span style={{
                  padding: '4px 10px', borderRadius: '20px', color: 'white', fontSize: '12px',
                  background: statusColors[order.status] || '#999'
                }}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>

              <p style={{ margin: '8px 0 4px 0' }}><strong>👤</strong> {order.customerName}</p>
              <p style={{ margin: '4px 0' }}><strong>🕐</strong> {new Date(order.pickupTime).toLocaleString()}</p>
              <p style={{ margin: '4px 0' }}><strong>💰</strong> £{order.totalPrice}</p>

              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {order.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(order.id, 'accepted')} style={{
                      background: '#2196F3', color: 'white', border: 'none',
                      padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                    }}>✅ Accept</button>
                    <button onClick={() => updateStatus(order.id, 'cancelled')} style={{
                      background: '#f44336', color: 'white', border: 'none',
                      padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                    }}>❌ Cancel</button>
                  </>
                )}
                {order.status === 'accepted' && (
                  <button onClick={() => updateStatus(order.id, 'in_progress')} style={{
                    background: '#FF9800', color: 'white', border: 'none',
                    padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                  }}>☕ Start Making</button>
                )}
                {order.status === 'in_progress' && (
                  <button onClick={() => updateStatus(order.id, 'ready')} style={{
                    background: '#4CAF50', color: 'white', border: 'none',
                    padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                  }}>🔔 Ready</button>
                )}
                {order.status === 'ready' && (
                  <button onClick={() => updateStatus(order.id, 'collected')} style={{
                    background: '#6f4e37', color: 'white', border: 'none',
                    padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                  }}>✔ Collected</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StaffDashboard;