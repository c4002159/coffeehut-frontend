import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const member = useMemo(() => {
    try {
      const raw = localStorage.getItem('member');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }, []);

  // Refund mode: navigated here from OrderStatus after cancellation
  const refundState = location.state?.refundMode ? location.state : null;
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError]     = useState(null);
  const [refundDone, setRefundDone]       = useState(false);

  const runRefund = useCallback(async () => {
    if (!refundState) return;
    setRefundLoading(true);
    setRefundError(null);
    try {
      const res = await fetch('http://localhost:8080/api/payment/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerID: refundState.customerId,
          transactionAmount: refundState.totalPrice,
          orderId: refundState.orderId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setRefundError(failureMessage(data, res));
      } else {
        setRefundDone(true);
      }
    } catch (e) {
      setRefundError(e instanceof Error ? e.message : 'Network error. Please try again.');
    } finally {
      setRefundLoading(false);
    }
  }, [refundState]);

  // Auto-trigger refund on mount when in refund mode
  const refundTriggered = useRef(false);
  useEffect(() => {
    if (!refundState || refundTriggered.current) return;
    refundTriggered.current = true;
    const { customerId, totalPrice, orderId } = refundState;
    setRefundLoading(true);
    setRefundError(null);

    const doCancel = () =>
      fetch(`http://localhost:8080/api/orders/staff/${orderId}/cancel`, { method: 'POST' })
        .then(() => setRefundDone(true))
        .catch(() => setRefundDone(true));

    fetch('http://localhost:8080/api/payment/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerID: customerId, transactionAmount: totalPrice, orderId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setRefundError(failureMessage(data, res));
        } else {
          // Refund succeeded — now cancel the order
          return doCancel();
        }
      })
      .catch((e) => setRefundError(e instanceof Error ? e.message : 'Network error.'))
      .finally(() => setRefundLoading(false));
  // refundState is stable (from location.state), safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const freeCupsAvailable = Math.max(0, Number(member?.freeCups) || 0);
  const autoRedeemFreeCup =
    Boolean(member?.isLoyaltyMember) && freeCupsAvailable > 0;
  const discountAmount = autoRedeemFreeCup ? total : 0;
  const payableSubtotal = autoRedeemFreeCup ? 0 : subtotal;
  const payableTax = autoRedeemFreeCup ? 0 : tax;
  const payableTotal = autoRedeemFreeCup ? 0 : total;

  const runPayment = useCallback(async () => {
    if (!cart || cart.items.length === 0) return;
    setPayError(null);
    setOrderError(null);
    setLoading(true);
    const idForRequest =
      checkoutCustomerId ||
      `CUST-${String(cart.customerName).replace(/\s+/g, '_')}-${Date.now()}`;

    try {
      const payRes = await fetch('http://localhost:8080/api/payment/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: idForRequest,
          amount: payableTotal,
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

      const orderRes = await fetch('http://localhost:8080/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: idForRequest,
          customerName: cart.customerName,
          pickupTime: cart.pickupTime,
          items: cart.items,
          subtotal: payableSubtotal,
          tax: payableTax,
          total: payableTotal,
          totalPrice: payableTotal,
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
      localStorage.setItem('lastOrderCustomerName', cart.customerName);
      // Only registered loyalty members accumulate stamps.
      try {
        const rawMember = localStorage.getItem('member');
        const parsedMember = rawMember ? JSON.parse(rawMember) : null;
        if (parsedMember && parsedMember.isLoyaltyMember === true) {
          const currentTotal = Math.max(0, Number(parsedMember.totalOrders) || 0);
          const currentFreeCups = Math.max(0, Number(parsedMember.freeCups) || 0);
          const usedFreeCup = autoRedeemFreeCup && currentFreeCups > 0;
          const reachedReward = !usedFreeCup && currentTotal + 1 >= 9;
          const nextTotal = usedFreeCup
            ? currentTotal
            : reachedReward
            ? 0
            : currentTotal + 1;
          const nextFreeCups = usedFreeCup
            ? currentFreeCups - 1
            : reachedReward
            ? currentFreeCups + 1
            : currentFreeCups;
          localStorage.setItem(
            'member',
            JSON.stringify({
              ...parsedMember,
              totalOrders: nextTotal,
              freeCups: nextFreeCups,
            })
          );
        }
      } catch {
        /* ignore member parse/save issues */
      }
      if (oid != null) {
        const saved = JSON.parse(localStorage.getItem('myOrderIds') || '[]');
        if (!saved.includes(Number(oid))) saved.push(Number(oid));
        localStorage.setItem('myOrderIds', JSON.stringify(saved));
      }
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
  }, [autoRedeemFreeCup, cart, checkoutCustomerId, navigate, payableSubtotal, payableTax, payableTotal]);

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

  if (refundState) {
    return (
      <div className="payment-page">
        <header className="payment-header">
          <button type="button" className="payment-back" onClick={() => navigate('/order-status')}>Back</button>
          <h1 className="payment-title">Refund</h1>
        </header>
        <section className="payment-card">
          <h2>Order Cancelled</h2>
          <div className="payment-row">
            <span>Customer</span>
            <span>{refundState.customerName}</span>
          </div>
          <div className="payment-row payment-total">
            <span>Refund amount</span>
            <span>£{Number(refundState.totalPrice).toFixed(2)}</span>
          </div>
          <p className="payment-customer-id">Order #{refundState.orderId}</p>
        </section>
        {refundDone && (
          <div className="payment-failure-card" style={{ borderColor: '#16a34a', background: '#f0fdf4' }}>
            <h3 style={{ color: '#16a34a' }}>✓ Refund processed</h3>
            <p>Your refund of £{Number(refundState.totalPrice).toFixed(2)} has been submitted successfully.</p>
          </div>
        )}
        {refundError && (
          <div className="payment-failure-card">
            <h3>Refund failed</h3>
            <p>{refundError}</p>
          </div>
        )}
        {!refundDone && (
          <button type="button" className="payment-pay-btn" disabled={refundLoading} onClick={runRefund}>
            {refundLoading ? 'Processing refund…' : 'Process Refund'}
          </button>
        )}
        {refundDone && (
          <button type="button" className="payment-pay-btn" onClick={() => navigate('/')}>
            Back to Home
          </button>
        )}
      </div>
    );
  }

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
        {autoRedeemFreeCup && (
          <div className="payment-row payment-row-muted">
            <span>Loyalty free cup discount</span>
            <span>-£{discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="payment-row payment-total">
          <span>Total</span>
          <span>£{payableTotal.toFixed(2)}</span>
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
