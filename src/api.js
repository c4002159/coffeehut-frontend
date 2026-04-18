const BASE_URL = 'http://localhost:8080';

export async function login(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
}

export async function fetchActiveOrders() {
    const res = await fetch(`${BASE_URL}/api/staff/orders/active`);
    const data = await res.json();
    return data.map(o => ({
        id: String(o.order.id),
        orderNumber: o.order.orderNumber || String(o.order.id),
        status: o.order.status === 'pending' ? 'new' : o.order.status,
        pickupTime: o.order.pickupTime,
        customerName: o.order.customerName,
        allergies: o.order.notes || '',
        items: o.items.map(item => ({
            id: String(item.id || Math.random()),
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            customizations: item.customizations ? item.customizations.split(',') : []
        }))
    }));
}

export async function fetchOrderDetail(orderId) {
    const res = await fetch(`${BASE_URL}/api/staff/orders/${orderId}`);
    const o = await res.json();
    return {
        id: String(o.order.id),
        orderNumber: o.order.orderNumber || String(o.order.id),
        status: o.order.status === 'pending' ? 'new' : o.order.status,
        pickupTime: o.order.pickupTime,
        customerName: o.order.customerName,
        allergies: o.order.notes || '',
        items: o.items.map(item => ({
            id: String(item.id || Math.random()),
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            customizations: item.customizations ? item.customizations.split(',') : []
        }))
    };
}

export async function updateOrderStatus(orderId, newStatus) {
    const backendStatus = newStatus === 'new' ? 'pending' : newStatus;
    const res = await fetch(`${BASE_URL}/api/staff/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: backendStatus })
    });
    const data = await res.json();
    return { id: orderId, status: newStatus };
}

export async function cancelOrder(orderId) {
    const res = await fetch(`${BASE_URL}/api/staff/orders/${orderId}/cancel`, {
        method: 'POST'
    });
    return { id: orderId };
}

export async function addOrderNote(orderId, note) {
    const res = await fetch(`${BASE_URL}/api/staff/orders/${orderId}/note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
    });
    return { id: orderId };
}

export async function fetchArchivedOrders() {
    const res = await fetch(`${BASE_URL}/api/staff/orders/archived`);
    const data = await res.json();
    const result = { TODAY: [], YESTERDAY: [], LAST_7_DAYS: [] };
    for (const [group, orders] of Object.entries(data)) {
        result[group] = orders.map(o => ({
            id: String(o.id),
            orderNumber: o.orderNumber || String(o.id),
            status: o.status,
            customerName: o.customerName,
            pickupTime: o.pickupTime,
            items: [],
            createdAt: o.createdAt
        }));
    }
    return result;
}

export async function searchArchivedOrders(keyword) {
    const res = await fetch(`${BASE_URL}/api/staff/orders/archived/search?keyword=${encodeURIComponent(keyword)}`);
    const data = await res.json();
    return data.map(o => ({
        id: String(o.id),
        orderNumber: o.orderNumber || String(o.id),
        status: o.status,
        customerName: o.customerName,
        pickupTime: o.pickupTime,
        items: [],
        createdAt: o.createdAt
    }));
}
