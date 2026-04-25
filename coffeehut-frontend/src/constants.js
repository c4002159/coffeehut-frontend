// 静态图片 URL
export const HERO_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuCaSaE_ht4FOQFnIV2yZR8OwH_TAvQ9cyi5TwTWDqHNDAboLQuC-BH2s8hgiQP4Up3dZg5VycqNU7GLiqFvq-I30okA17i4r8PML_jI0TU4qFvsBqTc2QH5cxfEkjLCgYXkjsGqBgKt5OuNs1HQrTusuQJ1qFT5-I0kz-bF0lQrsM93uETVVTHXSLnE-dDmflPyChtfRK5Dv5yVJ7jK2SnAFEsP1T60jTWzT5a3YP0ic38K8dyBRJhVci3qoRgraSPmTKzZoMFjrM8";
export const CUSTOMER_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuABngbGnSBQDIYgoiI2BP8C4HFwdiUOUh-d5tLuz1Nyn4Ce_DU7CBbCyZW89QXw7RwhRHSl19sxSWqtQLkKR9e0n4nfLaRFrRAC1IuS0DGsmh5JLWxN4gw85UV_I5wvIaEGoR99yCNegQDvc-n_XasSAKT-wyj8k5CdZRH3m78d2tGQT_J1TBZNx6Sbk949Q2HOhKpJ7UmnSHPP4DdYhProzh8tNr7UZo5M5_XBI8fl3g80a3ii3k9ewFA0w5hQDE4Kg-jxG5nitBc";
export const MANAGER_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuByjTuOC6eai_yyloPL9UHaYqog5y3ajyf6E56oo0egTeeTrgZjpZp_f7t8GuFbJ0ZV918tCt27VGpjx3RgLd5SOVe73FUGsj4xHoSQvax8ycRdhjwY8xIo0aTyyCdK46gtyOaldNSJQ5BOW9KPb7J3kGlV8jiunlzFsSXhhvS4fBhKrTVPpk8AHcUC7UsQEG5iHWP5VKCqGWx5WDtTtmzwOI0NAwmTdNvQh0LORyoE-hDM41c9C53Dh83fh4u773dTp-eZ-gKE4Cw";
export const SCHEDULE_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuCpUOIXm1RvanJ87MDTH8SVcB_BzcwgVGH6NBpVgVYs7iTV6T_kM88KQTVziOZpbAdzqjYCWlkSZG47nr9olPZwwqwa5nIuAlVq-RwxQIfHoWvEgfLTtnEaa4POFd0ZughfD4pe3hc_u-l0sZ-Achn2NJsi4TjHDmhGFuqKXC75Tu-y09WyUdWJjzXtq6HrHmDrXu-heArLGV4OT6GaIQAO-cE30AhAj8aZPmfl-hSXJSlITcbCMVGiwLEyw0crNcjHgSTNj_EapzY";

// 模拟订单数据（保留，不删除）
export const MOCK_ORDERS = [
  {
    id: '1',
    orderNumber: 'A-492',
    status: 'new',
    items: [
      { id: 'i1', name: 'Caramel Macchiato', size: 'Large (Venti)', quantity: 2, customizations: ['Extra Drizzle', 'Oat Milk'], icon: 'coffee' }
    ],
    customer: { name: 'Alex Johnson', loyaltyStatus: 'Gold Loyalty Member', avatar: CUSTOMER_AVATAR },
    pickupTime: '8:45 AM',
    pickupInMinutes: 12,
    priority: 'high',
    type: 'Pickup',
    isPrepaid: true,
    allergies: 'Nut Allergy: Please ensure no cross-contamination with almond products. Customer is highly sensitive to walnuts and almonds.'
  },
  {
    id: '2',
    orderNumber: 'A-495',
    status: 'new',
    items: [
      { id: 'i2', name: 'Cold Brew (L)', size: 'Large', quantity: 1, customizations: ['Double Espresso'], icon: 'coffee' }
    ],
    customer: { name: 'Sarah Miller', loyaltyStatus: 'Silver Member', avatar: CUSTOMER_AVATAR },
    pickupTime: '8:50 AM',
    pickupInMinutes: 17,
    priority: 'medium',
    type: 'Pickup',
    isPrepaid: true
  },
  {
    id: '3',
    orderNumber: 'A-480',
    status: 'preparing',
    items: [
      { id: 'i3', name: 'Matcha Latte', size: 'Medium', quantity: 1, customizations: [], icon: 'coffee' },
      { id: 'i4', name: 'Avocado Toast', size: 'Standard', quantity: 1, customizations: [], icon: 'bakery_dining' }
    ],
    customer: { name: 'Michael Chen', loyaltyStatus: 'Regular', avatar: CUSTOMER_AVATAR },
    pickupTime: '4:30 PM',
    pickupInMinutes: 5,
    priority: 'high',
    type: 'Pickup',
    isPrepaid: true
  },
  {
    id: '4',
    orderNumber: 'A-475',
    status: 'ready',
    items: [
      { id: 'i5', name: 'Flat White', size: 'Small', quantity: 1, customizations: [], icon: 'coffee' },
      { id: 'i6', name: 'Blueberry Muffin', size: 'Standard', quantity: 1, customizations: [], icon: 'bakery_dining' }
    ],
    customer: { name: 'Emma Wilson', loyaltyStatus: 'Gold Loyalty Member', avatar: CUSTOMER_AVATAR },
    pickupTime: 'Arrived',
    pickupInMinutes: 0,
    priority: 'low',
    type: 'Pickup',
    isPrepaid: true
  }
];

export const MOCK_ARCHIVE = [
  {
    id: 'a1',
    orderNumber: 'ORD-8842',
    status: 'collected',
    items: [
      { id: 'i7', name: 'Latte', size: 'Medium', quantity: 2, icon: 'coffee' },
      { id: 'i8', name: 'Butter Croissant', size: 'Standard', quantity: 1, icon: 'bakery_dining' }
    ],
    customer: { name: 'John Doe', loyaltyStatus: 'Regular', avatar: CUSTOMER_AVATAR },
    pickupTime: '2:30 PM',
    pickupInMinutes: 0,
    priority: 'low',
    type: 'Pickup',
    isPrepaid: true
  },
  {
    id: 'a2',
    orderNumber: 'ORD-8841',
    status: 'collected',
    items: [
      { id: 'i9', name: 'Iced Americano', size: 'Large', quantity: 1, icon: 'coffee' }
    ],
    customer: { name: 'Jane Smith', loyaltyStatus: 'Regular', avatar: CUSTOMER_AVATAR },
    pickupTime: '1:15 PM',
    pickupInMinutes: 0,
    priority: 'low',
    type: 'Pickup',
    isPrepaid: true
  }
];

// 默认店铺设置
export const DEFAULT_STORE_SETTINGS = {
  name: "Cramlington Station",
  openingHours: [
    { day: "Monday - Friday", open: "09:00 AM", close: "06:00 PM", isClosed: false },
    { day: "Saturday", open: "10:00 AM", close: "04:00 PM", isClosed: false },
    { day: "Sunday", open: "Closed All Day", close: "", isClosed: true }
  ],
  defaultPrepTime: 10,
  isTemporarilyClosed: false
};