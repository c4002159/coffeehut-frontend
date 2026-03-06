import { useState, useEffect } from 'react';
import StaffDashboard from './StaffDashboard';

function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState('menu');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [trackPage, setTrackPage] = useState(false);
  const [trackId, setTrackId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    fetch('http://localhost:8080/api/menu')
      .then(res => res.json())
      .then(data => setMenuItems(data));
  }, []);

  const addToCart = (item, size) => {
    const price = size === 'Regular' ? item.regularPrice : item.largePrice;
    const existing = cart.find(c => c.id === item.id && c.size === size);
    if (existing) {
      setCart(cart.map(c =>
        c.id === item.id && c.size === size
          ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { ...item, size, quantity: 1, price }]);
    }
  };

  const removeFromCart = (id, size) => {
    setCart(cart.filter(c => !(c.id === id && c.size === size)));
  };

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  // 跳转到支付页（先验证表单）
  const goToPayment = () => {
    if (!customerName || !pickupTime) {
      alert('Please enter your name and pickup time!');
      return;
    }
    setPaymentError('');
    setPage('payment');
  };

  // 调用 HorsePay 然后提交订单
  const handlePayment = () => {
    setPaymentProcessing(true);
    setPaymentError('');

    const customerID = 'CUST-' + customerName.replace(/\s/g, '').toUpperCase() + '-' + Date.now();

    fetch('http://localhost:8080/api/payment/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerID: customerID,
        transactionAmount: parseFloat(total.toFixed(2))
      })
    })
      .then(res => res.json())
      .then(data => {
        const success = data?.paymetSuccess?.Status;
        if (success) {
          // 支付成功，提交订单
          submitOrder();
        } else {
          const reason = data?.paymetSuccess?.reason || 'Payment declined';
          setPaymentError('Payment failed: ' + reason);
          setPaymentProcessing(false);
        }
      })
      .catch(() => {
        setPaymentError('Payment service unavailable. Please try again.');
        setPaymentProcessing(false);
      });
  };

  const submitOrder = () => {
    const orderData = {
      customerName,
      customerPhone,
      pickupTime: pickupTime + ':00',
      totalPrice: total,
      items: cart.map(c => ({
        itemId: c.id,
        size: c.size,
        quantity: c.quantity,
        subtotal: c.price * c.quantity
      }))
    };
    fetch('http://localhost:8080/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })
      .then(res => res.json())
      .then(data => {
        setOrderId(data.id);
        setCart([]);
        setPaymentProcessing(false);
        setPage('confirmation');
      })
      .catch(() => {
        setPaymentError('Order submission failed. Please contact staff.');
        setPaymentProcessing(false);
      });
  };

  const trackOrder = () => {
    setTrackError('');
    setTrackedOrder(null);
    fetch(`http://localhost:8080/api/orders/${trackId}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => setTrackedOrder(data))
      .catch(() => setTrackError('Order not found. Please check your order number.'));
  };

  // 员工仪表盘
  if (window.location.search.includes('staff=true')) return <StaffDashboard />;

  // 查询页
  if (trackPage) return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '500px', margin: '0 auto' }}>
      <h1>☕ Whistlestop Coffee Hut</h1>
      <h2>🔍 Track Your Order</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input value={trackId} onChange={e => setTrackId(e.target.value)}
          placeholder="Enter your order number"
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        <button onClick={trackOrder} style={{
          background: '#6f4e37', color: 'white', border: 'none',
          padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'
        }}>Search</button>
      </div>
      {trackError && <p style={{ color: 'red' }}>{trackError}</p>}
      {trackedOrder && (
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }}>
          <h3>Order #{trackedOrder.id}</h3>
          <p><strong>Name:</strong> {trackedOrder.customerName}</p>
          <p><strong>Pickup Time:</strong> {new Date(trackedOrder.pickupTime).toLocaleString()}</p>
          <p><strong>Total:</strong> £{trackedOrder.totalPrice}</p>
          <p><strong>Status:</strong>
            <span style={{
              marginLeft: '8px', padding: '4px 12px', borderRadius: '20px', color: 'white',
              background: trackedOrder.status === 'pending' ? '#999' :
                trackedOrder.status === 'accepted' ? '#2196F3' :
                trackedOrder.status === 'in_progress' ? '#FF9800' :
                trackedOrder.status === 'ready' ? '#4CAF50' :
                trackedOrder.status === 'collected' ? '#6f4e37' : '#f44336'
            }}>
              {trackedOrder.status === 'pending' ? '⏳ Pending' :
               trackedOrder.status === 'accepted' ? '✅ Accepted' :
               trackedOrder.status === 'in_progress' ? '☕ In Progress' :
               trackedOrder.status === 'ready' ? '🔔 Ready for Collection' :
               trackedOrder.status === 'collected' ? '✔ Collected' : '❌ Cancelled'}
            </span>
          </p>
        </div>
      )}
      <button onClick={() => setTrackPage(false)} style={{
        marginTop: '20px', background: '#ccc', border: 'none',
        padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'
      }}>← Back to Menu</button>
    </div>
  );

  // 菜单页
  if (page === 'menu') return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '900px', margin: '0 auto' }}>
      <h1>☕ Whistlestop Coffee Hut</h1>
      <button onClick={() => setTrackPage(true)} style={{
        background: 'white', color: '#6f4e37', border: '2px solid #6f4e37',
        padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px'
      }}>🔍 Track My Order</button>
      <h2>Our Menu</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {menuItems.map(item => (
          <div key={item.id} style={{
            border: '1px solid #ccc', borderRadius: '8px', padding: '16px', width: '180px'
          }}>
            <h3 style={{ margin: '0 0 8px 0' }}>{item.name}</h3>
            <button onClick={() => addToCart(item, 'Regular')} style={{
              display: 'block', width: '100%', margin: '4px 0', padding: '6px',
              cursor: 'pointer', background: '#6f4e37', color: 'white', border: 'none', borderRadius: '4px'
            }}>Regular £{item.regularPrice}</button>
            {item.largePrice && (
              <button onClick={() => addToCart(item, 'Large')} style={{
                display: 'block', width: '100%', margin: '4px 0', padding: '6px',
                cursor: 'pointer', background: '#4a3728', color: 'white', border: 'none', borderRadius: '4px'
              }}>Large £{item.largePrice}</button>
            )}
          </div>
        ))}
      </div>
      <h2>🛒 Your Cart</h2>
      {cart.length === 0 ? (
        <p style={{ color: '#999' }}>Your cart is empty</p>
      ) : (
        <div>
          {cart.map(c => (
            <div key={`${c.id}-${c.size}`} style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '8px', borderBottom: '1px solid #eee'
            }}>
              <span>{c.name} ({c.size})</span>
              <span>x{c.quantity}</span>
              <span>£{(c.price * c.quantity).toFixed(2)}</span>
              <button onClick={() => removeFromCart(c.id, c.size)} style={{
                background: 'red', color: 'white', border: 'none',
                borderRadius: '4px', padding: '4px 8px', cursor: 'pointer'
              }}>Remove</button>
            </div>
          ))}
          <h3>Total: £{total.toFixed(2)}</h3>
          <button onClick={() => setPage('checkout')} style={{
            background: '#6f4e37', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px'
          }}>Proceed to Order ➜</button>
        </div>
      )}
    </div>
  );

  // 下单页
  if (page === 'checkout') return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '500px', margin: '0 auto' }}>
      <h1>☕ Whistlestop Coffee Hut</h1>
      <h2>Your Order</h2>
      {cart.map(c => (
        <div key={`${c.id}-${c.size}`} style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '8px', borderBottom: '1px solid #eee'
        }}>
          <span>{c.name} ({c.size}) x{c.quantity}</span>
          <span>£{(c.price * c.quantity).toFixed(2)}</span>
        </div>
      ))}
      <h3>Total: £{total.toFixed(2)}</h3>
      <div style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Your Name *</label>
          <input value={customerName} onChange={e => setCustomerName(e.target.value)}
            placeholder="Enter your name"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Phone (optional)</label>
          <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
            placeholder="Enter your phone"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Pickup Time *</label>
          <input type="datetime-local" value={pickupTime} onChange={e => setPickupTime(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setPage('menu')} style={{
            padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
            background: '#ccc', border: 'none', fontSize: '16px'
          }}>← Back</button>
          <button onClick={goToPayment} style={{
            padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
            background: '#6f4e37', color: 'white', border: 'none', fontSize: '16px'
          }}>Pay Now 💳</button>
        </div>
      </div>
    </div>
  );

  // 支付页
  if (page === 'payment') return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '500px', margin: '0 auto' }}>
      <h1>☕ Whistlestop Coffee Hut</h1>
      <h2>💳 Payment</h2>
      <div style={{ background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <p><strong>Name:</strong> {customerName}</p>
        <p><strong>Pickup Time:</strong> {new Date(pickupTime).toLocaleString()}</p>
        <hr />
        {cart.map(c => (
          <div key={`${c.id}-${c.size}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>{c.name} ({c.size}) x{c.quantity}</span>
            <span>£{(c.price * c.quantity).toFixed(2)}</span>
          </div>
        ))}
        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong>Total</strong>
          <strong>£{total.toFixed(2)}</strong>
        </div>
      </div>

      <div style={{ background: '#fff8e1', border: '1px solid #ffc107', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
        <p style={{ margin: 0 }}>🐴 Powered by <strong>HorsePay</strong></p>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>Your payment is processed securely</p>
      </div>

      {paymentError && (
        <div style={{ background: '#ffebee', border: '1px solid #f44336', borderRadius: '4px', padding: '12px', marginBottom: '16px', color: '#c62828' }}>
          ❌ {paymentError}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => setPage('checkout')} disabled={paymentProcessing} style={{
          padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
          background: '#ccc', border: 'none', fontSize: '16px'
        }}>← Back</button>
        <button onClick={handlePayment} disabled={paymentProcessing} style={{
          padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
          background: paymentProcessing ? '#ccc' : '#6f4e37',
          color: 'white', border: 'none', fontSize: '16px', flex: 1
        }}>
          {paymentProcessing ? '⏳ Processing...' : `Pay £${total.toFixed(2)} 🐴`}
        </button>
      </div>
    </div>
  );

  // 确认页
  if (page === 'confirmation') return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <h1>☕ Whistlestop Coffee Hut</h1>
      <div style={{ background: '#f0f8f0', padding: '30px', borderRadius: '12px', marginTop: '20px' }}>
        <h2 style={{ color: 'green' }}>✅ Order Placed!</h2>
        <p style={{ color: '#4CAF50' }}>💳 Payment successful via HorsePay</p>
        <p style={{ fontSize: '18px' }}>Your Order Number is:</p>
        <h1 style={{ color: '#6f4e37', fontSize: '48px' }}>#{orderId}</h1>
        <p>Please keep this number to track your order!</p>
        <button onClick={() => { setPage('menu'); setCustomerName(''); setCustomerPhone(''); setPickupTime(''); }} style={{
          background: '#6f4e37', color: 'white', border: 'none',
          padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px'
        }}>Order Again</button>
      </div>
    </div>
  );
}

export default App;