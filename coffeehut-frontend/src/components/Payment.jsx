import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Payment.css';

const CART_STORAGE_KEY = 'coffeehut_checkout_cart';

function normalizeCart(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const customerName =
    typeof raw.customerName === 'string' && raw.customerName.trim()
      ? raw.customerName.trim()
      : 'Guest';
  const pickupTime =
    typeof raw.pickupTime === 'string' && raw.pickupTime.trim()
      ? raw.pickupTime.trim()
      : 'ASAP';
  const items = Array.isArray(raw.items) ? raw.items : [];
  const normalizedItems = items.map((item, i) => {
    const name =
      typeof item?.name === 'string' && item.name.trim()
        ? item.name.trim()
        : `Item ${i + 1}`;
    const qty = Math.max(1, Number(item?.quantity) || 1);
    const price = Number(item?.price);
    const unit = Number.isFinite(price) ? price : 0;
    return { name, quantity: qty, price: unit };
  });
  return { customerName, pickupTime, items: normalizedItems };
}

function totals(cart) {
  const subtotal = cart.items.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );
  const taxRate =
    typeof cart.taxRate === 'number' && cart.taxRate >= 0
      ? cart.taxRate
      : 0;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { subtotal, tax, total };
}

function paymentSucceeded(res, data) {
  if (!res.ok) return false;
  if (data && data.success === false) return false;
  const st = data?.status;
  if (typeof st === 'string' && /fail|declin|error/i.test(st)) return false;
  return true;
}

function failureMessage(data, res) {
  if (data && typeof data === 'object') {
    const m =
      data.reason ??
      data.message ??
      data.error ??
      data.detail ??
      data.description;
    if (typeof m === 'string' && m.trim()) return m.trim();
  }
  if (res.status >= 400) return `Request failed (${res.status}).`;
  return 'Payment could not be completed.';
}

function orderIdFromResponse(data) {
  if (!data || typeof data !== 'object') return null;
  return (
    data.orderId ??
    data.id ??
    data.order?.id ??
    data.order?.orderId ??
    null
  );
}

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => {
    const fromState = normalizeCart(location.state);
    if (fromState) {
      try {
        sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(fromState));
      } catch {
        /* ignore */
      }
      return fromState;
    }
    try {
      const raw = sessionStorage.getItem(CART_STORAGE_KEY);
      if (raw) return normalizeCart(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    return null;
  });
  const [payError, setPayError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [checkoutCustomerId, setCheckoutCustomerId] = useState('');

  useEffect(() => {
    const next = normalizeCart(location.state);
    if (next) {
      setCart(next);
      try {
        sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (!cart) return;
    setCheckoutCustomerId((prev) =>
      prev
        ? prev
        : `CUST-${String(cart.customerName).replace(/\s+/g, '_')}-${Date.now()}`
    );
  }, [cart]);

  const { subtotal, tax, total } = useMemo(
    () => (cart ? totals(cart) : { subtotal: 0, tax: 0, total: 0 }),
    [cart]
  );

  const runPayment = useCallback(async () => {
    if (!cart || cart.items.length === 0) return;
    setPayError(null);
    setOrderError(null);
    setLoading(true);
    const idForRequest =
      checkoutCustomerId ||
      `CUST-${String(cart.customerName).replace(/\s+/g, '_')}-${Date.now()}`;

    try {
      const payRes = await fetch('/api/payment/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: idForRequest,
          amount: total,
          customerName: cart.customerName,
          pickupTime: cart.pickupTime,
          items: cart.items,
        }),
      });
      let payData = null;
      try {
        payData = await payRes.json();
      } catch {
        payData = null;
      }

      if (!paymentSucceeded(payRes, payData)) {
        setPayError(failureMessage(payData, payRes));
        setLoading(false);
        return;
      }

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: idForRequest,
          customerName: cart.customerName,
          pickupTime: cart.pickupTime,
          items: cart.items,
          subtotal,
          tax,
          total,
        }),
      });
      let orderData = null;
      try {
        orderData = await orderRes.json();
      } catch {
        orderData = null;
      }

      if (!orderRes.ok) {
        const msg = failureMessage(orderData, orderRes);
        setOrderError(
          `Payment succeeded but the order could not be saved: ${msg}`
        );
        setLoading(false);
        return;
      }

      const oid = orderIdFromResponse(orderData);
      navigate('/order-status', {
        state: { orderId: oid != null ? String(oid) : idForRequest },
      });
    } catch (e) {
      setPayError(
        e instanceof Error ? e.message : 'Network error. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [cart, checkoutCustomerId, navigate, subtotal, tax, total]);

  const persistCartAndGoBack = useCallback(() => {
    if (cart) {
      try {
        sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch {
        /* ignore */
      }
    }
    navigate(-1);
  }, [cart, navigate]);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="payment-page">
        <div className="payment-empty">
          <p>No checkout data. Open the menu and add items, then proceed to payment.</p>
          <p>
            <button
              type="button"
              className="payment-back"
              onClick={() => navigate('/')}
            >
              Back to home
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <header className="payment-header">
        <button
          type="button"
          className="payment-back"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        <h1 className="payment-title">Payment</h1>
      </header>

      <section className="payment-card">
        <h2>Order summary</h2>
        <div className="payment-row">
          <span>Customer</span>
          <span>{cart.customerName}</span>
        </div>
        <div className="payment-row payment-row-muted">
          <span>Pickup time</span>
          <span>{cart.pickupTime}</span>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          {cart.items.map((it, idx) => (
            <div key={`${it.name}-${idx}`} className="payment-drink-line">
              <div className="payment-row">
                <span>
                  {it.name}
                  {it.quantity > 1 ? ` × ${it.quantity}` : ''}
                </span>
                <span>
                  £{(it.price * it.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="payment-row">
          <span>Subtotal</span>
          <span>£{subtotal.toFixed(2)}</span>
        </div>
        {tax > 0 && (
          <div className="payment-row payment-row-muted">
            <span>Tax</span>
            <span>£{tax.toFixed(2)}</span>
          </div>
        )}
        <div className="payment-row payment-total">
          <span>Total</span>
          <span>£{total.toFixed(2)}</span>
        </div>
        <p className="payment-customer-id">
          Reference: {checkoutCustomerId || '…'}
        </p>
      </section>

      {payError && (
        <div className="payment-failure-card">
          <h3>Payment failed</h3>
          <p>{payError}</p>
          <p className="payment-not-charged">You have not been charged.</p>
        </div>
      )}

      {orderError && (
        <div className="payment-failure-card">
          <h3>Order error</h3>
          <p>{orderError}</p>
        </div>
      )}

      {!payError && !orderError && (
        <button
          type="button"
          className="payment-pay-btn"
          disabled={loading}
          onClick={runPayment}
        >
          {loading ? 'Processing…' : 'Pay'}
        </button>
      )}

      {(payError || orderError) && (
        <div className="payment-actions" style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="payment-action-btn primary"
            disabled={loading}
            onClick={runPayment}
          >
            Try Again
          </button>
          <button
            type="button"
            className="payment-action-btn"
            onClick={() => {
              window.alert('Payment method management is not available in this demo.');
            }}
          >
            Try a different payment method
          </button>
          <button
            type="button"
            className="payment-action-btn"
            onClick={persistCartAndGoBack}
          >
            Edit my order before retrying
          </button>
          <button
            type="button"
            className="payment-action-btn danger-text"
            onClick={() => navigate('/')}
          >
            Cancel Order
          </button>
        </div>
      )}
    </div>
  );
}
