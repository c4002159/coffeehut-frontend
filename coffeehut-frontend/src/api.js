const USE_MOCK = false;

export const OVERDUE_THRESHOLDS = {
    pending: 45, // pending card turns red if not accepted within 45s -WeiqiWang
};

const BASE   = 'http://localhost:8080/api/staff';
const ORDERS = `${BASE}/orders`;

const APP_START = Date.now();

let runtimeActiveOrders = [
    {
        id: '1', orderNumber: 'A-492', status: 'pending', type: 'Pickup', isPrepaid: true,
        customerName: 'Alex Johnson',
        allergies: 'Nut Allergy: Please ensure no cross-contamination with almond products.',
        createdAt: new Date(APP_START - 5 * 1000).toISOString(),
        acceptedAt: null, readyAt: null,
        pickupTime: new Date(APP_START + 5 * 60 * 1000).toISOString(),
        items: [{ id: 'i1', name: 'Caramel Macchiato', size: 'Large (Venti)', quantity: 2, customizations: ['Extra Drizzle', 'Oat Milk'] }]
    },
    {
        id: '2', orderNumber: 'A-495', status: 'pending', type: 'Pickup', isPrepaid: true,
        customerName: 'Sarah Miller',
        createdAt: new Date(APP_START - 10 * 1000).toISOString(),
        acceptedAt: null, readyAt: null,
        pickupTime: new Date(APP_START + 3 * 60 * 1000).toISOString(),
        items: [{ id: 'i2', name: 'Cold Brew (L)', size: 'Large', quantity: 1, customizations: ['Double Espresso'] }]
    },
    {
        id: '3', orderNumber: 'A-480', status: 'in_progress', type: 'Pickup', isPrepaid: true,
        customerName: 'Michael Chen',
        createdAt: new Date(APP_START - 60 * 1000).toISOString(),
        acceptedAt: new Date(APP_START - 10 * 1000).toISOString(), readyAt: null,
        pickupTime: new Date(APP_START + 2 * 60 * 1000).toISOString(),
        items: [
            { id: 'i3', name: 'Matcha Latte', size: 'Medium', quantity: 1, customizations: [] },
            { id: 'i4', name: 'Avocado Toast', size: 'Standard', quantity: 1, customizations: [] }
        ]
    },
    {
        id: '4', orderNumber: 'A-475', status: 'ready', type: 'Pickup', isPrepaid: true,
        customerName: 'Emma Wilson',
        createdAt: new Date(APP_START - 120 * 1000).toISOString(),
        acceptedAt: new Date(APP_START - 90 * 1000).toISOString(),
        readyAt: new Date(APP_START - 5 * 1000).toISOString(),
        pickupTime: new Date(APP_START + 30 * 1000).toISOString(),
        items: [
            { id: 'i5', name: 'Flat White', size: 'Small', quantity: 1, customizations: [] },
            { id: 'i6', name: 'Blueberry Muffin', size: 'Standard', quantity: 1, customizations: [] }
        ]
    }
];

let runtimeArchivedExtra = [];

const archivedOrderTemplates = [
    {
        id: 'a1', orderNumber: 'ORD-8842', status: 'collected', customerName: 'John Doe',
        completedOffsetMs: 30 * 60 * 1000, pickupOffsetMs: 30 * 60 * 1000,
        items: [
            { id: 'i7', name: 'Latte', size: 'Medium', quantity: 2, customizations: [] },
            { id: 'i8', name: 'Butter Croissant', size: 'Standard', quantity: 1, customizations: [] }
        ]
    },
    {
        id: 'a2', orderNumber: 'ORD-8841', status: 'collected', customerName: 'Jane Smith',
        completedOffsetMs: null,
        completedFixed: (() => { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(12, 0, 0, 0); return d.toISOString(); })(),
        pickupFixed:    (() => { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(11, 45, 0, 0); return d.toISOString(); })(),
        items: [{ id: 'i9', name: 'Iced Americano', size: 'Large', quantity: 1, customizations: [] }]
    },
    {
        id: 'a3', orderNumber: 'ORD-8820', status: 'collected', customerName: 'Bob Johnson',
        completedOffsetMs: 3 * 24 * 60 * 60 * 1000, pickupOffsetMs: 3 * 24 * 60 * 60 * 1000,
        items: [{ id: 'i10', name: 'Hot Chocolate', size: 'Medium', quantity: 2, customizations: ['Whipped cream'] }]
    }
];

function buildArchivedOrder(template) {
    const { completedOffsetMs, completedFixed, pickupOffsetMs, pickupFixed, ...rest } = template;
    const completedAt = completedFixed || new Date(Date.now() - completedOffsetMs).toISOString();
    const pickupTime  = pickupFixed   || new Date(Date.now() - (pickupOffsetMs || 0)).toISOString();
    return {
        ...rest, completedAt, pickupTime,
        createdAt: new Date(new Date(completedAt).getTime() - 30 * 60 * 1000).toISOString(),
        items: rest.items.map(item => ({
            ...item,
            customizations: Array.isArray(item.customizations) ? item.customizations : []
        }))
    };
}

// Returns overdue info for card border and overdue badge. -WeiqiWang
// pending: overdue if not accepted within OVERDUE_THRESHOLDS.pending seconds.
// in_progress: overdue if current time is past the customer's pickupTime.
export function getOrderOverdueInfo(order) {
    const now = Date.now();

    if (order.status === 'pending') {
        const elapsed = (now - new Date(order.createdAt).getTime()) / 1000;
        const overdue = elapsed > OVERDUE_THRESHOLDS.pending;
        return { overdue, elapsedSeconds: Math.floor(elapsed), reason: overdue ? 'Waiting to be accepted' : null };
    }

    if (order.status === 'in_progress') {
        // Overdue when past the customer's requested pickup time -WeiqiWang
        if (order.pickupTime) {
            const overdue = Date.now() > new Date(order.pickupTime).getTime();
            return { overdue, reason: overdue ? 'Past pickup time' : null };
        }
        return { overdue: false, reason: null };
    }

    return { overdue: false, elapsedSeconds: 0, reason: null };
}

export async function login(email, password) {
    if (USE_MOCK) {
        if (email && password) return { memberId: 1, name: 'Staff User' };
        throw new Error('Invalid email or password');
    }
    const res  = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
}

export async function fetchActiveOrders() {
    if (USE_MOCK) return JSON.parse(JSON.stringify(runtimeActiveOrders));
    const res  = await fetch(`${ORDERS}/active`);
    if (!res.ok) throw new Error('Failed to fetch active orders');
    const data = await res.json();
    return data.map(dto => ({
        ...dto.order,
        items: (dto.items || []).map(item => ({
            ...item,
            customizations: item.customizations
                ? item.customizations.split(',').map(s => s.trim()).filter(Boolean)
                : []
        }))
    }));
}

export async function fetchOrderDetail(orderId) {
    if (USE_MOCK) {
        const active = runtimeActiveOrders.find(o => o.id === orderId);
        if (active) return JSON.parse(JSON.stringify(active));
        const allArchived = [...archivedOrderTemplates.map(buildArchivedOrder), ...runtimeArchivedExtra];
        const archived    = allArchived.find(o => o.id === orderId);
        if (archived) return JSON.parse(JSON.stringify(archived));
        throw new Error('Order not found');
    }
    const res = await fetch(`${ORDERS}/${orderId}`);
    if (!res.ok) throw new Error('Order not found');
    const dto = await res.json();
    return {
        ...dto.order,
        items: (dto.items || []).map(item => ({
            ...item,
            customizations: item.customizations
                ? item.customizations.split(',').map(s => s.trim()).filter(Boolean)
                : []
        }))
    };
}

export async function updateOrderStatus(orderId, newStatus) {
    if (USE_MOCK) {
        const now = new Date().toISOString();
        if (newStatus === 'pending' || newStatus === 'in_progress') {
            const archiveIndex = runtimeArchivedExtra.findIndex(o => o.id === orderId);
            if (archiveIndex !== -1) {
                const order = { ...runtimeArchivedExtra[archiveIndex] };
                order.status = newStatus; order.completedAt = null; order.cancelledFrom = null;
                order.createdAt = now;
                if (newStatus === 'in_progress') order.acceptedAt = now;
                runtimeArchivedExtra.splice(archiveIndex, 1);
                runtimeActiveOrders.push(order);
                return { id: orderId, status: newStatus };
            }
        }
        const index = runtimeActiveOrders.findIndex(o => o.id === orderId);
        if (index === -1) throw new Error('Order not found');
        runtimeActiveOrders[index].status = newStatus;
        if (newStatus === 'in_progress') runtimeActiveOrders[index].acceptedAt = now;
        if (newStatus === 'ready')       runtimeActiveOrders[index].readyAt    = now;
        if (newStatus === 'collected') {
            runtimeArchivedExtra.push({ ...runtimeActiveOrders[index], completedAt: now, status: 'collected' });
            runtimeActiveOrders.splice(index, 1);
        }
        return { id: orderId, status: newStatus };
    }
    const res = await fetch(`${ORDERS}/${orderId}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
}

export async function cancelOrder(orderId) {
    if (USE_MOCK) {
        const index = runtimeActiveOrders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            const order = runtimeActiveOrders[index];
            runtimeArchivedExtra.push({ ...order, completedAt: new Date().toISOString(), status: 'cancelled', cancelledFrom: order.status });
            runtimeActiveOrders.splice(index, 1);
        }
        return { id: orderId };
    }
    const res = await fetch(`${ORDERS}/${orderId}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to cancel order');
    return res.json();
}

export async function addOrderNote(orderId, note) {
    if (USE_MOCK) { console.log(`Note saved for order ${orderId}:`, note); return { id: orderId }; }
    const res = await fetch(`${ORDERS}/${orderId}/note`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
    });
    if (!res.ok) throw new Error('Failed to add note');
    return res.json();
}

export async function fetchArchivedOrders() {
    if (USE_MOCK) {
        const now = new Date();
        const todayStart     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const weekAgo        = new Date(todayStart); weekAgo.setDate(weekAgo.getDate() - 7);
        const allArchived    = [...archivedOrderTemplates.map(buildArchivedOrder), ...runtimeArchivedExtra];
        const inRange        = (d, from, to) => { const t = new Date(d); return t >= from && (!to || t < to); };
        const sortDesc       = arr => [...arr].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        return {
            TODAY:       sortDesc(allArchived.filter(o => o.completedAt && inRange(o.completedAt, todayStart))),
            YESTERDAY:   sortDesc(allArchived.filter(o => o.completedAt && inRange(o.completedAt, yesterdayStart, todayStart))),
            LAST_7_DAYS: sortDesc(allArchived.filter(o => o.completedAt && inRange(o.completedAt, weekAgo, yesterdayStart))),
        };
    }
    const res      = await fetch(`${ORDERS}/archived`);
    if (!res.ok) throw new Error('Failed to fetch archived orders');
    const data     = await res.json();
    const sortDesc = arr => [...(arr || [])].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    return { TODAY: sortDesc(data.TODAY), YESTERDAY: sortDesc(data.YESTERDAY), LAST_7_DAYS: sortDesc(data.LAST_7_DAYS) };
}

export async function searchArchivedOrders(keyword) {
    if (USE_MOCK) {
        const lower       = keyword.toLowerCase();
        const allArchived = [...archivedOrderTemplates.map(buildArchivedOrder), ...runtimeArchivedExtra];
        return allArchived
            .filter(o => o.orderNumber.toLowerCase().includes(lower) || o.customerName.toLowerCase().includes(lower))
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    }
    const res = await fetch(`${ORDERS}/archived/search?keyword=${encodeURIComponent(keyword)}`);
    if (!res.ok) throw new Error('Failed to search');
    return [...await res.json()].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}
