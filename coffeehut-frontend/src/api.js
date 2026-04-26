const USE_MOCK = false;
//staff-end test: If set to false, then connect to the real backend.-WeiqiWang

// Thresholds (seconds) that turn an order card red. Separate from auto-cancel logic. -WeiqiWang
export const OVERDUE_THRESHOLDS = {
    pending:     45, // card turns red if not accepted within 45s
    in_progress: 45, // test value — replace with pickupTime-based logic after client integration
};

// All staff REST endpoints live under /api/staff/ to stay separate from customer endpoints. -WeiqiWang
const BASE   = 'http://localhost:8080/api/staff';
const ORDERS = `${BASE}/orders`;

const APP_START = Date.now();

// --- Mock data (only used when USE_MOCK = true) ---

let runtimeActiveOrders = [
    {
        id: '1',
        orderNumber: 'A-492',
        status: 'pending',
        type: 'Pickup',
        isPrepaid: true,
        customerName: 'Alex Johnson',
        allergies: 'Nut Allergy: Please ensure no cross-contamination with almond products. Customer is highly sensitive to walnuts and almonds.',
        createdAt: new Date(APP_START - 5 * 1000).toISOString(),
        acceptedAt: null,
        readyAt: null,
        pickupTime: new Date(APP_START + 5 * 60 * 1000).toISOString(),
        items: [
            { id: 'i1', name: 'Caramel Macchiato', size: 'Large (Venti)', quantity: 2, customizations: ['Extra Drizzle', 'Oat Milk'] }
        ]
    },
    {
        id: '2',
        orderNumber: 'A-495',
        status: 'pending',
        type: 'Pickup',
        isPrepaid: true,
        customerName: 'Sarah Miller',
        createdAt: new Date(APP_START - 10 * 1000).toISOString(),
        acceptedAt: null,
        readyAt: null,
        pickupTime: new Date(APP_START + 3 * 60 * 1000).toISOString(),
        items: [
            { id: 'i2', name: 'Cold Brew (L)', size: 'Large', quantity: 1, customizations: ['Double Espresso'] }
        ]
    },
    {
        id: '3',
        orderNumber: 'A-480',
        status: 'in_progress',
        type: 'Pickup',
        isPrepaid: true,
        customerName: 'Michael Chen',
        createdAt: new Date(APP_START - 60 * 1000).toISOString(),
        acceptedAt: new Date(APP_START - 10 * 1000).toISOString(),
        readyAt: null,
        pickupTime: new Date(APP_START + 2 * 60 * 1000).toISOString(),
        items: [
            { id: 'i3', name: 'Matcha Latte', size: 'Medium', quantity: 1, customizations: [] },
            { id: 'i4', name: 'Avocado Toast', size: 'Standard', quantity: 1, customizations: [] }
        ]
    },
    {
        id: '4',
        orderNumber: 'A-475',
        status: 'ready',
        type: 'Pickup',
        isPrepaid: true,
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

let runtimeArchivedExtra = []; // populated at runtime when orders are cancelled or collected -WeiqiWang

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
        ...rest,
        completedAt,
        pickupTime,
        createdAt: new Date(new Date(completedAt).getTime() - 30 * 60 * 1000).toISOString(),
        items: rest.items.map(item => ({
            ...item,
            customizations: Array.isArray(item.customizations) ? item.customizations : []
        }))
    };
}

// --- Shared helpers ---

// Returns overdue info used to turn cards red. Independent of auto-cancel logic. -WeiqiWang
export function getOrderOverdueInfo(order) {
    const now = Date.now();
    if (order.status === 'pending') {
        const elapsed = (now - new Date(order.createdAt).getTime()) / 1000;
        const overdue = elapsed > OVERDUE_THRESHOLDS.pending;
        return { overdue, elapsedSeconds: Math.floor(elapsed), reason: overdue ? 'Waiting to be accepted' : null };
    }
    if (order.status === 'in_progress') {
        const startTime = order.acceptedAt ? new Date(order.acceptedAt).getTime() : new Date(order.createdAt).getTime();
        const elapsed   = (now - startTime) / 1000;
        const overdue   = elapsed > OVERDUE_THRESHOLDS.in_progress;
        return { overdue, elapsedSeconds: Math.floor(elapsed), reason: overdue ? 'Taking too long to prepare' : null };
    }
    return { overdue: false, elapsedSeconds: 0, reason: null };
}

// --- API functions ---

// POST /api/auth/login — shared with customer side for now -WeiqiWang
export async function login(email, password) {
    if (USE_MOCK) {
        if (email && password) return { memberId: 1, name: 'Staff User' };
        throw new Error('Invalid email or password');
    }
    const res  = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
}

// GET /api/staff/orders/active -WeiqiWang
export async function fetchActiveOrders() {
    if (USE_MOCK) return JSON.parse(JSON.stringify(runtimeActiveOrders));
    const res  = await fetch(`${ORDERS}/active`);
    if (!res.ok) throw new Error('Failed to fetch active orders');
    const data = await res.json();
    // Backend returns List<OrderWithItemsDTO>: { order, items } -WeiqiWang
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

// GET /api/staff/orders/{id} -WeiqiWang
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

// PATCH /api/staff/orders/{id}/status -WeiqiWang
// Passing "pending" or "in_progress" acts as a restore — backend clears isArchived.
export async function updateOrderStatus(orderId, newStatus) {
    if (USE_MOCK) {
        const now = new Date().toISOString();
        if (newStatus === 'pending' || newStatus === 'in_progress') {
            const archiveIndex = runtimeArchivedExtra.findIndex(o => o.id === orderId);
            if (archiveIndex !== -1) {
                const order = { ...runtimeArchivedExtra[archiveIndex] };
                order.status        = newStatus;
                order.completedAt   = null;
                order.cancelledFrom = null;
                order.createdAt     = now; // reset so auto-cancel doesn't fire immediately -WeiqiWang
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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
}

// POST /api/staff/orders/{id}/cancel -WeiqiWang
// Stores cancelledFrom on the order so the detail page can offer Restore.
export async function cancelOrder(orderId) {
    if (USE_MOCK) {
        const index = runtimeActiveOrders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            const order = runtimeActiveOrders[index];
            runtimeArchivedExtra.push({
                ...order,
                completedAt:   new Date().toISOString(),
                status:        'cancelled',
                cancelledFrom: order.status,
            });
            runtimeActiveOrders.splice(index, 1);
        }
        return { id: orderId };
    }
    const res = await fetch(`${ORDERS}/${orderId}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to cancel order');
    return res.json();
}

// PATCH /api/staff/orders/{id}/note -WeiqiWang
export async function addOrderNote(orderId, note) {
    if (USE_MOCK) {
        console.log(`Note saved for order ${orderId}:`, note);
        return { id: orderId };
    }
    const res = await fetch(`${ORDERS}/${orderId}/note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
    });
    if (!res.ok) throw new Error('Failed to add note');
    return res.json();
}

// GET /api/staff/orders/archived -WeiqiWang
export async function fetchArchivedOrders() {
    if (USE_MOCK) {
        const now            = new Date();
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

// GET /api/staff/orders/archived/search?keyword=xxx -WeiqiWang
export async function searchArchivedOrders(keyword) {
    if (USE_MOCK) {
        const lower      = keyword.toLowerCase();
        const allArchived = [...archivedOrderTemplates.map(buildArchivedOrder), ...runtimeArchivedExtra];
        return allArchived
            .filter(o => o.orderNumber.toLowerCase().includes(lower) || o.customerName.toLowerCase().includes(lower))
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    }
    const res = await fetch(`${ORDERS}/archived/search?keyword=${encodeURIComponent(keyword)}`);
    if (!res.ok) throw new Error('Failed to search');
    return [...await res.json()].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}
