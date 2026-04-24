const USE_MOCK = true;// 改为 false 则连接真实后端


// ----- 可变模拟数据 -----
let activeOrders = [
    {
        id: '1',
        orderNumber: 'A-492',
        status: 'new',
        type: 'Pickup',
        priority: 'high',
        isPrepaid: true,
        pickupTime: new Date(Date.now() + 12 * 60000).toISOString(),
        customerName: 'Alex Johnson',
        allergies: 'Nut Allergy: Please ensure no cross-contamination with almond products. Customer is highly sensitive to walnuts and almonds.',
        items: [
            { id: 'i1', name: 'Caramel Macchiato', size: 'Large (Venti)', quantity: 2, customizations: ['Extra Drizzle', 'Oat Milk'] }
        ]
    },
    {
        id: '2',
        orderNumber: 'A-495',
        status: 'new',
        type: 'Express',
        priority: 'medium',
        isPrepaid: true,
        pickupTime: new Date(Date.now() + 17 * 60000).toISOString(),
        customerName: 'Sarah Miller',
        items: [
            { id: 'i2', name: 'Cold Brew (L)', size: 'Large', quantity: 1, customizations: ['Double Espresso'] }
        ]
    },
    {
        id: '3',
        orderNumber: 'A-480',
        status: 'preparing',
        type: 'Pickup',
        priority: 'high',
        isPrepaid: true,
        pickupTime: new Date(Date.now() + 5 * 60000).toISOString(),
        customerName: 'Michael Chen',
        items: [
            { id: 'i3', name: 'Matcha Latte', size: 'Medium', quantity: 1, customizations: [] },
            { id: 'i4', name: 'Avocado Toast', size: 'Standard', quantity: 1, customizations: [] }
        ]
    },
    {
        id: '4',
        orderNumber: 'A-475',
        status: 'ready',
        type: 'Delivery',
        priority: 'low',
        isPrepaid: true,
        pickupTime: new Date(Date.now() + 2 * 60000).toISOString(),
        customerName: 'Emma Wilson',
        items: [
            { id: 'i5', name: 'Flat White', size: 'Small', quantity: 1, customizations: [] },
            { id: 'i6', name: 'Blueberry Muffin', size: 'Standard', quantity: 1, customizations: [] }
        ]
    }
];

let archivedOrders = [
    {
        id: 'a1',
        orderNumber: 'ORD-8842',
        status: 'collected',
        customerName: 'John Doe',
        priority: 'low',
        pickupTime: new Date(Date.now() - 30 * 60000).toISOString(),
        items: [
            { id: 'i7', name: 'Latte', size: 'Medium', quantity: 2, customizations: [] },
            { id: 'i8', name: 'Butter Croissant', size: 'Standard', quantity: 1, customizations: [] }
        ],
        createdAt: new Date().toISOString()
    },
    {
        id: 'a2',
        orderNumber: 'ORD-8841',
        status: 'collected',
        customerName: 'Jane Smith',
        priority: 'low',
        pickupTime: new Date(Date.now() - 90 * 60000).toISOString(),
        items: [
            { id: 'i9', name: 'Iced Americano', size: 'Large', quantity: 1, customizations: [] }
        ],
        createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: 'a3',
        orderNumber: 'ORD-8820',
        status: 'collected',
        customerName: 'Bob Johnson',
        priority: 'medium',
        pickupTime: new Date(Date.now() - 150 * 60000).toISOString(),
        items: [
            { id: 'i10', name: 'Hot Chocolate', size: 'Medium', quantity: 2, customizations: ['Whipped cream'] }
        ],
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    }
];

// ----- API 函数 -----
export async function login(email, password) {
    if (USE_MOCK) {
        if (email && password) return { memberId: 1, name: 'Staff User' };
        throw new Error('Invalid email or password');
    }
    // 真实后端调用略
}

export async function fetchActiveOrders() {
    if (USE_MOCK) {
        // 深拷贝，并确保 customizations 为数组
        return JSON.parse(JSON.stringify(activeOrders)).map(order => ({
            ...order,
            items: order.items.map(item => ({
                ...item,
                customizations: Array.isArray(item.customizations) ? item.customizations : []
            }))
        }));
    }
    // 真实后端调用略
}

export async function fetchOrderDetail(orderId) {
    if (USE_MOCK) {
        const order = [...activeOrders, ...archivedOrders].find(o => o.id === orderId);
        if (!order) throw new Error('Order not found');
        const copy = JSON.parse(JSON.stringify(order));
        copy.items = copy.items.map(item => ({
            ...item,
            customizations: Array.isArray(item.customizations) ? item.customizations : []
        }));
        return copy;
    }
    // 真实后端调用略
}

export async function updateOrderStatus(orderId, newStatus) {
    if (USE_MOCK) {
        const index = activeOrders.findIndex(o => o.id === orderId);
        if (index === -1) throw new Error('Order not found');
        activeOrders[index].status = newStatus;
        if (newStatus === 'collected') {
            archivedOrders.push({ ...activeOrders[index], createdAt: new Date().toISOString() });
            activeOrders.splice(index, 1);
        }
        return { id: orderId, status: newStatus };
    }
    // 真实后端调用略
}

export async function cancelOrder(orderId) {
    if (USE_MOCK) {
        const index = activeOrders.findIndex(o => o.id === orderId);
        if (index !== -1) activeOrders.splice(index, 1);
        return { id: orderId };
    }
    // 真实后端调用略
}

export async function addOrderNote(orderId, note) {
    if (USE_MOCK) {
        console.log(`Note added to ${orderId}: ${note}`);
        return { id: orderId };
    }
    // 真实后端调用略
}

export async function fetchArchivedOrders() {
    if (USE_MOCK) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const weekAgo = new Date(todayStart);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const TODAY = archivedOrders.filter(o => new Date(o.createdAt) >= todayStart);
        const YESTERDAY = archivedOrders.filter(o => new Date(o.createdAt) < todayStart && new Date(o.createdAt) >= yesterdayStart);
        const LAST_7_DAYS = archivedOrders.filter(o => new Date(o.createdAt) < yesterdayStart && new Date(o.createdAt) >= weekAgo);
        return { TODAY, YESTERDAY, LAST_7_DAYS };
    }
    // 真实后端调用略
}

export async function searchArchivedOrders(keyword) {
    if (USE_MOCK) {
        const lower = keyword.toLowerCase();
        return archivedOrders.filter(o => o.orderNumber.toLowerCase().includes(lower) || o.customerName.toLowerCase().includes(lower));
    }
    // 真实后端调用略
}