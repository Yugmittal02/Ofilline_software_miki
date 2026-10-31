/**
 * BillEasy Browser Mock Backend
 * Unified Inventory & Billing System
 * localStorage-backed persistence for all Tauri commands when running on localhost.
 */

const STORAGE_KEYS = {
  SETTINGS: 'billeasy_settings',
  LOGO: 'billeasy_logo',
  CATEGORIES: 'billeasy_categories',
  ITEMS: 'billeasy_items',
  ORDERS: 'billeasy_orders',
  PRODUCTS: 'billeasy_products',
  INVENTORY_HISTORY: 'billeasy_inv_history',
  ORDER_COUNTER: 'billeasy_order_counter',
}

function getItem(key, fallback) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : fallback
  } catch { return fallback }
}

function setItem(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) }
  catch (e) { console.warn(`[Mock] save ${key}:`, e) }
}

function nextOrderId() {
  const c = getItem(STORAGE_KEYS.ORDER_COUNTER, 1000)
  setItem(STORAGE_KEYS.ORDER_COUNTER, c + 1)
  return c
}

// ── Default Shop Settings ──
const DEFAULT_SETTINGS = {
  shop_name: 'BillEasy Store',
  shop_tagline: 'Fast & Easy Billing',
  shop_address: '123 Market Street',
  shop_phone: '+91 98765 43210',
  bill_footer: 'Thank you for your visit! ❤️',
  printer_name: 'Browser Print',
  printer_type: 'usb',
  logo_enabled: false,
  has_cutter: true,
  gst_percent: 5,
  payment_mode: 'Cash',
  cloudinary_cloud_name: '',
  cloudinary_upload_preset: '',
  admin_pin_hash: '',
}

// ── Default Categories (All 14 Cafe & Restaurant Categories) ──
const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Chinese', sort_order: 1, is_active: true },
  { id: 2, name: 'Mojito', sort_order: 2, is_active: true },
  { id: 3, name: 'Wrap', sort_order: 3, is_active: true },
  { id: 4, name: 'Pasta', sort_order: 4, is_active: true },
  { id: 5, name: 'French Fries', sort_order: 5, is_active: true },
  { id: 6, name: 'Coffee & Shakes', sort_order: 6, is_active: true },
  { id: 7, name: 'Sandwich', sort_order: 7, is_active: true },
  { id: 8, name: 'Maggi', sort_order: 8, is_active: true },
  { id: 9, name: 'Pizza', sort_order: 9, is_active: true },
  { id: 10, name: 'Burger', sort_order: 10, is_active: true },
  { id: 11, name: 'Patties', sort_order: 11, is_active: true },
  { id: 12, name: 'Pastries', sort_order: 12, is_active: true },
  { id: 13, name: 'Cakes', sort_order: 13, is_active: true },
  { id: 14, name: 'Momos', sort_order: 14, is_active: true },
]

// ── Default Products (Unified 106 Products Catalog) ──
// track_inventory is OPTIONAL per product:
// false = untracked (always available in billing, e.g. cooked food, fresh shakes, snacks)
// true = tracked (stock decrements on billing, e.g. packaged goods, limited items)
const DEFAULT_PRODUCTS = [
  // Chinese
  { id: 101, name: 'Chilly Paneer', category: 'Chinese', purchase_price: 50, selling_price: 100, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1001', sku: 'CHN-001', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 102, name: 'Honey Chilli Potato', category: 'Chinese', purchase_price: 60, selling_price: 120, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1002', sku: 'CHN-002', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 103, name: 'Garlic Chili Potato', category: 'Chinese', purchase_price: 65, selling_price: 130, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1003', sku: 'CHN-003', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 104, name: 'Chili Potato', category: 'Chinese', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1004', sku: 'CHN-004', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 105, name: 'Singapore Noodles', category: 'Chinese', purchase_price: 50, selling_price: 100, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1005', sku: 'CHN-005', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 106, name: 'Chili Garlic Noodles', category: 'Chinese', purchase_price: 45, selling_price: 90, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1006', sku: 'CHN-006', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 107, name: 'Hakka Noodles', category: 'Chinese', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1007', sku: 'CHN-007', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 108, name: 'Veg Noodles', category: 'Chinese', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1008', sku: 'CHN-008', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Mojito
  { id: 201, name: 'Classic Mojito', category: 'Mojito', purchase_price: 30, selling_price: 70, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1009', sku: 'MOJ-001', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 202, name: 'Black Cobra', category: 'Mojito', purchase_price: 35, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1010', sku: 'MOJ-002', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 203, name: 'Blue Ocean', category: 'Mojito', purchase_price: 35, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1011', sku: 'MOJ-003', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 204, name: 'Virgin Mojito', category: 'Mojito', purchase_price: 35, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1012', sku: 'MOJ-004', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 205, name: 'Apple Peach Mojito', category: 'Mojito', purchase_price: 35, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1013', sku: 'MOJ-005', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 206, name: 'Watermelon Mojito', category: 'Mojito', purchase_price: 35, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1014', sku: 'MOJ-006', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 207, name: 'Blackcurrant Mojito', category: 'Mojito', purchase_price: 35, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1015', sku: 'MOJ-007', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 208, name: 'Strawberry Mojito', category: 'Mojito', purchase_price: 35, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1016', sku: 'MOJ-008', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Wrap
  { id: 301, name: 'Veg Wrap', category: 'Wrap', purchase_price: 35, selling_price: 70, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1017', sku: 'WRP-001', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 302, name: 'Paneer Wrap', category: 'Wrap', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1018', sku: 'WRP-002', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 303, name: 'SPB Wrap', category: 'Wrap', purchase_price: 45, selling_price: 90, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1019', sku: 'WRP-003', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Pasta
  { id: 401, name: 'Red Sauce Pasta', category: 'Pasta', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1020', sku: 'PST-001', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 402, name: 'White Sauce Pasta', category: 'Pasta', purchase_price: 35, selling_price: 70, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1021', sku: 'PST-002', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 403, name: 'Cheese Red Pasta', category: 'Pasta', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1022', sku: 'PST-003', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 404, name: 'Tandoori Sauce Pasta', category: 'Pasta', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1023', sku: 'PST-004', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 405, name: 'Makhani Sauce Pasta', category: 'Pasta', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1024', sku: 'PST-005', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 406, name: 'Pink Sauce Pasta', category: 'Pasta', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1025', sku: 'PST-006', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // French Fries
  { id: 501, name: 'Salt Fries', category: 'French Fries', purchase_price: 25, selling_price: 50, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1026', sku: 'FF-001', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 502, name: 'Masala Fries', category: 'French Fries', purchase_price: 25, selling_price: 50, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1027', sku: 'FF-002', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 503, name: 'Peri Peri Fries', category: 'French Fries', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1028', sku: 'FF-003', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 504, name: 'Cheese Loaded Fries', category: 'French Fries', purchase_price: 35, selling_price: 70, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1029', sku: 'FF-004', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 505, name: 'Tandoori Fries', category: 'French Fries', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1030', sku: 'FF-005', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Coffee & Shakes
  { id: 601, name: 'Vanilla Shake', category: 'Coffee & Shakes', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1031', sku: 'SHK-001', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 602, name: 'Strawberry Shake', category: 'Coffee & Shakes', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1032', sku: 'SHK-002', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 603, name: 'Butterscotch Shake', category: 'Coffee & Shakes', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1033', sku: 'SHK-003', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 604, name: 'Pineapple Shake', category: 'Coffee & Shakes', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1034', sku: 'SHK-004', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 605, name: 'Oreo Shake', category: 'Coffee & Shakes', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1035', sku: 'SHK-005', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 606, name: 'Cold Coffee', category: 'Coffee & Shakes', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1036', sku: 'SHK-006', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 607, name: 'KitKat Shake', category: 'Coffee & Shakes', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1037', sku: 'SHK-007', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 608, name: 'Blueberry Shake', category: 'Coffee & Shakes', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1038', sku: 'SHK-008', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 609, name: 'Rajbhog Shake', category: 'Coffee & Shakes', purchase_price: 50, selling_price: 100, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1039', sku: 'SHK-009', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 610, name: 'American Nuts Shake', category: 'Coffee & Shakes', purchase_price: 50, selling_price: 100, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1040', sku: 'SHK-010', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 611, name: 'Kesar Pista Shake', category: 'Coffee & Shakes', purchase_price: 50, selling_price: 100, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1041', sku: 'SHK-011', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 612, name: 'Rose Milk Shake', category: 'Coffee & Shakes', purchase_price: 50, selling_price: 100, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1042', sku: 'SHK-012', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 613, name: 'Pan Shake', category: 'Coffee & Shakes', purchase_price: 50, selling_price: 100, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1043', sku: 'SHK-013', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 614, name: 'Black Current Shake', category: 'Coffee & Shakes', purchase_price: 50, selling_price: 100, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1044', sku: 'SHK-014', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 615, name: 'Anjeer Shake', category: 'Coffee & Shakes', purchase_price: 55, selling_price: 110, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1045', sku: 'SHK-015', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 616, name: 'Cold Coffee with Ice Cream', category: 'Coffee & Shakes', purchase_price: 35, selling_price: 70, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1046', sku: 'SHK-016', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 617, name: 'Papaya Shake', category: 'Coffee & Shakes', purchase_price: 25, selling_price: 50, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1047', sku: 'SHK-017', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 618, name: 'Mango Shake', category: 'Coffee & Shakes', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1048', sku: 'SHK-018', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 619, name: 'Chocolate Shake', category: 'Coffee & Shakes', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1049', sku: 'SHK-019', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Sandwich
  { id: 701, name: 'Veg Sandwich', category: 'Sandwich', purchase_price: 35, selling_price: 70, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1050', sku: 'SND-001', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 702, name: 'Paneer Sandwich', category: 'Sandwich', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1051', sku: 'SND-002', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 703, name: 'Corn Mayo Sandwich', category: 'Sandwich', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1052', sku: 'SND-003', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 704, name: 'Tandoori Sandwich', category: 'Sandwich', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1053', sku: 'SND-004', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 705, name: 'Paneer Special Sandwich', category: 'Sandwich', purchase_price: 45, selling_price: 90, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1054', sku: 'SND-005', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 706, name: 'Sev Onion Sandwich', category: 'Sandwich', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1055', sku: 'SND-006', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 707, name: 'Tandoori Paneer Corn Sandwich', category: 'Sandwich', purchase_price: 50, selling_price: 100, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1056', sku: 'SND-007', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 708, name: 'Pizza Sandwich', category: 'Sandwich', purchase_price: 60, selling_price: 120, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1057', sku: 'SND-008', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Maggi
  { id: 801, name: 'Plain Maggi', category: 'Maggi', purchase_price: 25, selling_price: 50, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1058', sku: 'MAG-001', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 802, name: 'Veg Maggi', category: 'Maggi', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1059', sku: 'MAG-002', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 803, name: 'Paneer Maggi', category: 'Maggi', purchase_price: 35, selling_price: 70, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1060', sku: 'MAG-003', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 804, name: 'Tandoori Maggi', category: 'Maggi', purchase_price: 35, selling_price: 70, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1061', sku: 'MAG-004', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 805, name: 'Corn Cheese Maggi', category: 'Maggi', purchase_price: 35, selling_price: 70, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1062', sku: 'MAG-005', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 806, name: 'Cheese Butter Maggi', category: 'Maggi', purchase_price: 35, selling_price: 70, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1063', sku: 'MAG-006', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 807, name: 'Butter Maggi', category: 'Maggi', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1064', sku: 'MAG-007', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 808, name: 'Pizza Maggi', category: 'Maggi', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1065', sku: 'MAG-008', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 809, name: 'Pizza Paneer Maggi', category: 'Maggi', purchase_price: 45, selling_price: 90, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1066', sku: 'MAG-009', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 810, name: 'Tandoori Paneer Maggi', category: 'Maggi', purchase_price: 45, selling_price: 90, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1067', sku: 'MAG-010', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Pizza
  { id: 901, name: 'OTC Pizza', category: 'Pizza', purchase_price: 60, selling_price: 120, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1068', sku: 'PIZ-001', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 902, name: 'Sweet Corn Pizza', category: 'Pizza', purchase_price: 70, selling_price: 140, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1069', sku: 'PIZ-002', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 903, name: 'Paneer Pizza', category: 'Pizza', purchase_price: 85, selling_price: 170, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1070', sku: 'PIZ-003', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 904, name: 'Double Cheese Pizza', category: 'Pizza', purchase_price: 100, selling_price: 200, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1071', sku: 'PIZ-004', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 905, name: 'Four In One Pizza', category: 'Pizza', purchase_price: 115, selling_price: 230, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1072', sku: 'PIZ-005', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 906, name: 'Golden Baby Pizza', category: 'Pizza', purchase_price: 125, selling_price: 250, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1073', sku: 'PIZ-006', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 907, name: 'Extra Cheese Loaded Pizza', category: 'Pizza', purchase_price: 135, selling_price: 270, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1074', sku: 'PIZ-007', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 908, name: 'Tandoori Paneer Pizza', category: 'Pizza', purchase_price: 145, selling_price: 290, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1075', sku: 'PIZ-008', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 909, name: 'Makhani Pizza', category: 'Pizza', purchase_price: 110, selling_price: 220, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1076', sku: 'PIZ-009', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 910, name: 'Makhani Paneer Pizza', category: 'Pizza', purchase_price: 125, selling_price: 250, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1077', sku: 'PIZ-010', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 911, name: 'Tandoori Pizza', category: 'Pizza', purchase_price: 110, selling_price: 220, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1078', sku: 'PIZ-011', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 912, name: 'SPB Special Pizza', category: 'Pizza', purchase_price: 150, selling_price: 300, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1079', sku: 'PIZ-012', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Burger
  { id: 1001, name: 'Aloo Tikki Burger', category: 'Burger', purchase_price: 25, selling_price: 50, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1080', sku: 'BGR-001', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1002, name: 'Veg Burger', category: 'Burger', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1081', sku: 'BGR-002', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1003, name: 'Veg Paneer Burger', category: 'Burger', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1082', sku: 'BGR-003', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1004, name: 'Veg Cheese Burger', category: 'Burger', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1083', sku: 'BGR-004', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1005, name: 'Tandoori Burger', category: 'Burger', purchase_price: 35, selling_price: 70, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1084', sku: 'BGR-005', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1006, name: 'Schezwan Burger', category: 'Burger', purchase_price: 35, selling_price: 70, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1085', sku: 'BGR-006', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1007, name: 'Makhani Burger', category: 'Burger', purchase_price: 35, selling_price: 70, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1086', sku: 'BGR-007', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1008, name: 'Makhani Paneer Burger', category: 'Burger', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1087', sku: 'BGR-008', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1009, name: 'Tandoori Paneer Burger', category: 'Burger', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1088', sku: 'BGR-009', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1010, name: 'Chilly Burger', category: 'Burger', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1089', sku: 'BGR-010', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1011, name: 'Mexican Burger', category: 'Burger', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1090', sku: 'BGR-011', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1012, name: 'SPB Special Burger', category: 'Burger', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1091', sku: 'BGR-012', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Patties
  { id: 1101, name: 'Plain Masala Patties', category: 'Patties', purchase_price: 8, selling_price: 15, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1092', sku: 'PAT-001', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1102, name: 'Masala Patties', category: 'Patties', purchase_price: 12, selling_price: 25, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1093', sku: 'PAT-002', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1103, name: 'Paneer Patties', category: 'Patties', purchase_price: 18, selling_price: 35, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1094', sku: 'PAT-003', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1104, name: 'Tandoori Patties', category: 'Patties', purchase_price: 20, selling_price: 40, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1095', sku: 'PAT-004', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1105, name: 'Cheese Patties', category: 'Patties', purchase_price: 20, selling_price: 40, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1096', sku: 'PAT-005', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1106, name: 'Cheese Tandoori Patties', category: 'Patties', purchase_price: 25, selling_price: 50, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1097', sku: 'PAT-006', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1107, name: 'Cheese Paneer Patties', category: 'Patties', purchase_price: 25, selling_price: 50, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1098', sku: 'PAT-007', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1108, name: 'Cheese Tandoori Paneer Patties', category: 'Patties', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1099', sku: 'PAT-008', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1109, name: 'Tandoori Paneer Patties', category: 'Patties', purchase_price: 25, selling_price: 50, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1100', sku: 'PAT-009', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1110, name: 'Tandoori Mayo Patties', category: 'Patties', purchase_price: 25, selling_price: 50, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1101', sku: 'PAT-010', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1111, name: 'Cheese Tandoori Paneer Mayo', category: 'Patties', purchase_price: 35, selling_price: 70, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1102', sku: 'PAT-011', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1112, name: 'Mayonnaise Patties', category: 'Patties', purchase_price: 12, selling_price: 25, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1103', sku: 'PAT-012', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Pastries
  { id: 1201, name: 'Vanilla Pastry', category: 'Pastries', purchase_price: 15, selling_price: 30, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1104', sku: 'PAS-001', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1202, name: 'Butterscotch Pastry', category: 'Pastries', purchase_price: 20, selling_price: 40, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1105', sku: 'PAS-002', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1203, name: 'Black Forest Pastry', category: 'Pastries', purchase_price: 20, selling_price: 40, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1106', sku: 'PAS-003', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1204, name: 'Dark Chocolate Pastry', category: 'Pastries', purchase_price: 25, selling_price: 50, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1107', sku: 'PAS-004', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Cakes
  { id: 1301, name: 'Vanilla Cake 1 Pound', category: 'Cakes', purchase_price: 100, selling_price: 200, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1108', sku: 'CAK-001', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1302, name: 'Vanilla Cake 2 Pound', category: 'Cakes', purchase_price: 190, selling_price: 380, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1109', sku: 'CAK-002', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1303, name: 'Strawberry Cake 1 Pound', category: 'Cakes', purchase_price: 110, selling_price: 220, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1110', sku: 'CAK-003', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1304, name: 'Strawberry Cake 2 Pound', category: 'Cakes', purchase_price: 210, selling_price: 420, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1111', sku: 'CAK-004', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1305, name: 'Butterscotch Cake 1 Pound', category: 'Cakes', purchase_price: 125, selling_price: 250, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1112', sku: 'CAK-005', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1306, name: 'Butterscotch Cake 2 Pound', category: 'Cakes', purchase_price: 230, selling_price: 460, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1113', sku: 'CAK-006', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1307, name: 'Black Forest Cake 1 Pound', category: 'Cakes', purchase_price: 135, selling_price: 270, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1114', sku: 'CAK-007', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1308, name: 'Black Forest Cake 2 Pound', category: 'Cakes', purchase_price: 240, selling_price: 480, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1115', sku: 'CAK-008', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1309, name: 'Dark Chocolate Cake 1 Pound', category: 'Cakes', purchase_price: 150, selling_price: 300, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1116', sku: 'CAK-009', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1310, name: 'Dark Chocolate Cake 2 Pound', category: 'Cakes', purchase_price: 275, selling_price: 550, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1117', sku: 'CAK-010', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Momos
  { id: 1401, name: 'Veg Momos', category: 'Momos', purchase_price: 30, selling_price: 60, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1118', sku: 'MOM-001', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1402, name: 'Veg Fried Momos', category: 'Momos', purchase_price: 35, selling_price: 70, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1119', sku: 'MOM-002', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1403, name: 'Paneer Steam Momos', category: 'Momos', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1120', sku: 'MOM-003', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1404, name: 'Paneer Fried Momos', category: 'Momos', purchase_price: 45, selling_price: 90, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1121', sku: 'MOM-004', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1405, name: 'Veg Kurkure Momos', category: 'Momos', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1122', sku: 'MOM-005', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1406, name: 'Tandoori Veg Fried Momos', category: 'Momos', purchase_price: 50, selling_price: 100, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1123', sku: 'MOM-006', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1407, name: 'Paneer Kurkure Momos', category: 'Momos', purchase_price: 50, selling_price: 100, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1124', sku: 'MOM-007', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1408, name: 'Tandoori Paneer Fried Momos', category: 'Momos', purchase_price: 60, selling_price: 120, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1125', sku: 'MOM-008', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1409, name: 'Veg Tandoori Momos', category: 'Momos', purchase_price: 40, selling_price: 80, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1126', sku: 'MOM-009', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1410, name: 'Veg Afghani Momos', category: 'Momos', purchase_price: 45, selling_price: 90, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1127', sku: 'MOM-010', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1411, name: 'Paneer Tandoori Momos', category: 'Momos', purchase_price: 50, selling_price: 100, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1128', sku: 'MOM-011', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1412, name: 'Paneer Afghani Momos', category: 'Momos', purchase_price: 60, selling_price: 120, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1129', sku: 'MOM-012', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1413, name: 'Paneer Gravy Momos', category: 'Momos', purchase_price: 65, selling_price: 130, track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1130', sku: 'MOM-013', barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

// ── Unified Products helper with automatic catalog migration ──
function getUnifiedProducts() {
  let products = getItem(STORAGE_KEYS.PRODUCTS, null)
  let categories = getItem(STORAGE_KEYS.CATEGORIES, null)
  const isMigrated = getItem('billeasy_catalog_migrated_v2', false)
  const deletedIds = getItem('billeasy_deleted_product_ids', [])

  // Ensure all 14 categories exist in localStorage
  if (!categories || categories.length < DEFAULT_CATEGORIES.length) {
    const existingCats = categories || []
    const mergedCats = [...existingCats]
    DEFAULT_CATEGORIES.forEach(dc => {
      if (!mergedCats.some(c => (c.name || '').toLowerCase() === dc.name.toLowerCase())) {
        mergedCats.push(dc)
      }
    })
    categories = mergedCats
    setItem(STORAGE_KEYS.CATEGORIES, categories)
  }

  // If products is null/empty, seed with full catalog
  if (!products || products.length === 0) {
    products = DEFAULT_PRODUCTS.filter(p => !deletedIds.includes(String(p.id)))
    setItem(STORAGE_KEYS.PRODUCTS, products)
    setItem('billeasy_catalog_migrated_v2', true)
  } else if (!isMigrated) {
    // One-time catalog migration to ensure all 14 categories and 106 items are present
    let hasAdditions = false
    DEFAULT_PRODUCTS.forEach(dp => {
      if (deletedIds.includes(String(dp.id))) return
      const exists = products.some(p => (p.name || '').trim().toLowerCase() === dp.name.trim().toLowerCase())
      if (!exists) {
        products.push(dp)
        hasAdditions = true
      }
    })
    if (hasAdditions) {
      setItem(STORAGE_KEYS.PRODUCTS, products)
    }
    setItem('billeasy_catalog_migrated_v2', true)
  }

  return products
}

function ensureCategoryExists(catName) {
  if (!catName || !catName.trim()) return
  const trimmed = catName.trim()
  let cats = getItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES)
  if (!cats.some(c => (c.name || '').toLowerCase() === trimmed.toLowerCase())) {
    cats.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: trimmed,
      sort_order: cats.length + 1,
      is_active: true,
    })
    setItem(STORAGE_KEYS.CATEGORIES, cats)
  }
}

// ── Date helpers (Local-time aware) ──
function getLocalDateStr(d = new Date()) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function todayStr() { return getLocalDateStr(new Date()) }
function weekAgoStr() {
  const d = new Date(); d.setDate(d.getDate() - 7)
  return getLocalDateStr(d)
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ── Realistic Thermal Receipt HTML Generator (80mm) ──
function generateReceiptHtml(args = {}) {
  const settings = getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  const orderId = args.orderId || 0
  const items = args.items || []
  const subtotal = items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1), 0)
  const total = args.total != null && Number(args.total) > 0 ? Number(args.total) : subtotal

  const shopName = args.shopName || settings.shop_name || 'BillEasy Store'
  const shopTagline = settings.shop_tagline || ''
  const shopAddress = args.shopAddress || settings.shop_address || ''
  const shopPhone = settings.shop_phone || ''
  const billFooter = args.billFooter || settings.bill_footer || 'Thank you for your visit! ❤️'
  const gstPercent = Number(settings.gst_percent) || 0
  const paymentMode = settings.payment_mode || 'Cash'

  const logoRaw = localStorage.getItem(STORAGE_KEYS.LOGO) || null
  const logoEnabled = settings.logo_enabled !== false && !!logoRaw
  const logoDataUri = logoRaw ? (logoRaw.startsWith('data:') ? logoRaw : `data:image/png;base64,${logoRaw}`) : null

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  const invoice = orderId > 0 ? `Bill No: #${String(orderId).padStart(4, '0')}` : 'Bill No: (Preview)'
  const gstAmount = gstPercent > 0 ? (subtotal * gstPercent / 100) : 0
  const grandTotal = gstPercent > 0 ? (subtotal + gstAmount) : total

  const itemsHtml = items.map(item => {
    const qty = Number(item.qty) || 1
    const price = Number(item.price) || 0
    const lt = price * qty
    return `<tr>
      <td style="padding:6px 0;max-width:55%;word-break:break-word;">
        <div style="font-weight:600;color:#0f172a;">${escapeHtml(item.name || 'Item')}</div>
      </td>
      <td style="text-align:center;padding:6px 0;font-family:'JetBrains Mono','Courier New',monospace;color:#475569;">${qty}</td>
      <td style="text-align:right;padding:6px 0;font-family:'JetBrains Mono','Courier New',monospace;color:#64748b;">₹${price.toFixed(0)}</td>
      <td style="text-align:right;padding:6px 0;font-family:'JetBrains Mono','Courier New',monospace;font-weight:700;color:#0f172a;">₹${lt.toFixed(0)}</td>
    </tr>`
  }).join('\n')

  const watermarkHtml = (logoEnabled && logoDataUri) ? `
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:65%;height:65%;background:url('${logoDataUri}') center/contain no-repeat;opacity:0.06;z-index:0;pointer-events:none;"></div>
  ` : ''

  const logoTopHtml = (logoEnabled && logoDataUri) ? `
    <div style="text-align:center;margin-bottom:10px;">
      <img src="${logoDataUri}" alt="Logo" style="max-height:55px;max-width:140px;object-fit:contain;margin:0 auto;display:block;" />
    </div>
  ` : ''

  const gstRowHtml = gstPercent > 0 ? `
    <div class="summary-row">
      <span style="color:#64748b;">GST (${gstPercent}%)</span>
      <span style="font-family:'JetBrains Mono',monospace;font-weight:600;">₹${gstAmount.toFixed(0)}</span>
    </div>
  ` : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Receipt Preview</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:100%; min-height:100%; }
body {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  background: #f1f5f9;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 12px;
  color: #1e293b;
  -webkit-font-smoothing: antialiased;
}

/* 80mm standard thermal receipt card */
.receipt-paper {
  width: 80mm;
  max-width: 80mm;
  min-width: 80mm;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
  position: relative;
  overflow: hidden;
}

/* Scissor cut edge line */
.cut-top {
  border: 0;
  border-top: 2px dashed #cbd5e1;
  margin: 0;
  position: relative;
}
.cut-top::after {
  content: '✂';
  position: absolute;
  top: -11px;
  left: 14px;
  font-size: 13px;
  background: #fff;
  color: #94a3b8;
  padding: 0 6px;
}

.receipt-body {
  position: relative;
  padding: 20px 18px 18px;
  overflow: hidden;
}
.receipt-body > * {
  position: relative;
  z-index: 1;
}

/* Shop title */
.shop-name {
  font-family: 'Plus Jakarta Sans', sans-serif;
  text-align: center;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #0f172a;
  line-height: 1.25;
  margin-bottom: 3px;
  word-break: break-word;
}
.tagline {
  text-align: center;
  font-size: 11px;
  color: #64748b;
  font-style: italic;
  margin-bottom: 6px;
  letter-spacing: 0.2px;
}
.contact-info {
  text-align: center;
  font-size: 10.5px;
  color: #475569;
  line-height: 1.45;
  margin: 2px 0;
  word-break: break-word;
}

/* Dashed divider */
.dash-sep {
  border: 0;
  border-top: 1.5px dashed #cbd5e1;
  margin: 10px 0;
}
.dash-sep-thick {
  border: 0;
  border-top: 2px dashed #94a3b8;
  margin: 10px 0;
}

/* Meta block */
.meta-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #334155;
  margin: 3px 0;
}
.meta-bold {
  font-weight: 700;
  color: #0f172a;
}

/* Items table */
table.receipt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
  margin: 8px 0;
}
table.receipt-table th {
  font-family: 'Plus Jakarta Sans', sans-serif;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.6px;
  color: #475569;
  padding: 6px 0;
  border-bottom: 1.5px dashed #94a3b8;
}
table.receipt-table th.r { text-align: right; }
table.receipt-table th.c { text-align: center; }
table.receipt-table th.l { text-align: left; }
table.receipt-table tbody tr {
  border-bottom: 1px dotted #e2e8f0;
}
table.receipt-table tbody tr:last-child {
  border-bottom: none;
}

/* Summary */
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11.5px;
  padding: 3px 0;
  color: #334155;
}
.grand-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0 6px;
}
.grand-total-label {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.grand-total-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 19px;
  font-weight: 800;
  color: #ea580c;
}

.payment-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  color: #0f172a;
  background: #f1f5f9;
  padding: 2px 7px;
  border-radius: 4px;
  margin: 4px 0;
}

.footer-text {
  text-align: center;
  font-size: 10.5px;
  color: #64748b;
  margin-top: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.branding {
  text-align: center;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px dashed #e2e8f0;
}
.branding b {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 10px;
  letter-spacing: 0.8px;
  color: #475569;
  text-transform: uppercase;
}
.branding small {
  display: block;
  font-size: 9px;
  color: #94a3b8;
  margin-top: 2px;
}

/* Print Styles for Windows Printer / PDF */
@media print {
  body {
    background: #ffffff !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .receipt-paper {
    box-shadow: none !important;
    border-radius: 0 !important;
    width: 80mm !important;
    max-width: 80mm !important;
    min-width: 80mm !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .receipt-body {
    padding: 4mm 3mm 3mm 3mm !important;
  }
  .cut-top::after {
    display: none !important;
  }
  @page {
    size: 80mm auto;
    margin: 0;
  }
}
</style>
</head>
<body>
<div class="receipt-paper">
  <hr class="cut-top" />
  <div class="receipt-body">
    ${watermarkHtml}
    ${logoTopHtml}
    <div class="shop-name">${escapeHtml(shopName)}</div>
    ${shopTagline ? `<div class="tagline">${escapeHtml(shopTagline)}</div>` : ''}
    ${shopAddress ? `<div class="contact-info">${escapeHtml(shopAddress)}</div>` : ''}
    ${shopPhone ? `<div class="contact-info">Ph: ${escapeHtml(shopPhone)}</div>` : ''}

    <hr class="dash-sep" />

    <div class="meta-grid">
      <span class="meta-bold">${invoice}</span>
      <span>${dateStr}</span>
    </div>
    <div class="meta-grid">
      <span>Time: ${timeStr}</span>
      <span class="payment-badge">Paid: ${escapeHtml(paymentMode)}</span>
    </div>

    <hr class="dash-sep-thick" />

    <table class="receipt-table">
      <thead>
        <tr>
          <th class="l">Item</th>
          <th class="c">Qty</th>
          <th class="r">Rate</th>
          <th class="r">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml || '<tr><td colspan="4" style="text-align:center;padding:12px;color:#94a3b8;">No items</td></tr>'}
      </tbody>
    </table>

    <hr class="dash-sep" />

    <div class="summary-row">
      <span style="color:#64748b;">Subtotal</span>
      <span style="font-family:'JetBrains Mono',monospace;font-weight:600;">₹${subtotal.toFixed(0)}</span>
    </div>
    ${gstRowHtml}

    <hr class="dash-sep-thick" />

    <div class="grand-total-row">
      <span class="grand-total-label">Grand Total</span>
      <span class="grand-total-value">₹${grandTotal.toFixed(0)}</span>
    </div>

    <hr class="dash-sep" />

    ${billFooter ? `<div class="footer-text">${escapeHtml(billFooter)}</div>` : ''}

    <div class="branding">
      <b>BillEasy POS</b>
      <small>Thank You · Visit Again</small>
    </div>
  </div>
  <hr class="cut-top" />
</div>
</body>
</html>`
}

export async function handleMockCommand(command, args = {}) {

  // ════════ LICENSE ════════
  if (command === 'get_license_status' || command === 'revalidate_license_with_server') {
    return { valid: true, vendor_name: 'BillEasy Dev', expires_at: '2099-12-31', message: null }
  }
  if (command === 'validate_license') return { valid: true, message: 'OK' }
  if (command === 'get_machine_id') return 'BROWSER-DEV-001'

  // ════════ SETTINGS ════════
  if (command === 'get_settings') return getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  if (command === 'save_settings') {
    const cur = getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
    setItem(STORAGE_KEYS.SETTINGS, { ...cur, ...(args.settings || {}) })
    return null
  }
  if (command === 'get_logo') return localStorage.getItem(STORAGE_KEYS.LOGO) || null
  if (command === 'save_logo') { localStorage.setItem(STORAGE_KEYS.LOGO, args.base64Data || ''); return null }
  if (command === 'delete_logo') { localStorage.removeItem(STORAGE_KEYS.LOGO); return null }

  // ════════ CATEGORIES (Managed via Inventory) ════════
  if (command === 'get_categories') {
    let cats = getItem(STORAGE_KEYS.CATEGORIES, null)
    if (!cats || !cats.length) {
      cats = [...DEFAULT_CATEGORIES]
      setItem(STORAGE_KEYS.CATEGORIES, cats)
    }
    // Also include any unique categories that exist in products
    const products = getUnifiedProducts()
    const existingNames = new Set(cats.map(c => (c.name || '').toLowerCase()))
    let added = false
    products.forEach(p => {
      if (p.category && !existingNames.has(p.category.toLowerCase())) {
        existingNames.add(p.category.toLowerCase())
        cats.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          name: p.category,
          sort_order: cats.length + 1,
          is_active: true,
        })
        added = true
      }
    })
    if (added) setItem(STORAGE_KEYS.CATEGORIES, cats)
    return cats.filter(c => c.is_active !== false)
  }

  if (command === 'create_category') {
    const name = String(args.name || '').trim()
    if (!name) throw new Error('Category name required')
    const cats = getItem(STORAGE_KEYS.CATEGORIES, [...DEFAULT_CATEGORIES])
    const existing = cats.find(c => c.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      if (!existing.is_active) {
        existing.is_active = true
        setItem(STORAGE_KEYS.CATEGORIES, cats)
      }
      return existing
    }
    const nc = { id: Date.now(), name, sort_order: cats.length + 1, is_active: true }
    cats.push(nc)
    setItem(STORAGE_KEYS.CATEGORIES, cats)
    return nc
  }

  if (command === 'update_category') {
    const cats = getItem(STORAGE_KEYS.CATEGORIES, [...DEFAULT_CATEGORIES])
    const i = cats.findIndex(c => c.id === args.id)
    if (i !== -1) {
      const oldName = cats[i].name
      cats[i] = { ...cats[i], name: args.name !== undefined ? String(args.name).trim() : cats[i].name, is_active: args.isActive !== undefined ? Boolean(args.isActive) : (args.is_active !== undefined ? Boolean(args.is_active) : cats[i].is_active), sort_order: args.sortOrder !== undefined ? Number(args.sortOrder) : (args.sort_order !== undefined ? Number(args.sort_order) : cats[i].sort_order) }
      setItem(STORAGE_KEYS.CATEGORIES, cats)

      // If category renamed, update category field on products too
      if (args.name && args.name !== oldName) {
        const products = getUnifiedProducts()
        let prodChanged = false
        products.forEach(p => {
          if ((p.category || '').toLowerCase() === oldName.toLowerCase()) {
            p.category = args.name
            prodChanged = true
          }
        })
        if (prodChanged) setItem(STORAGE_KEYS.PRODUCTS, products)
      }
    }
    return null
  }

  if (command === 'delete_category') {
    const cats = getItem(STORAGE_KEYS.CATEGORIES, [...DEFAULT_CATEGORIES])
    setItem(STORAGE_KEYS.CATEGORIES, cats.map(c => c.id === args.id ? { ...c, is_active: false } : c))
    return null
  }

  // ════════ ITEMS FOR BILLING (Powered by Unified Products) ════════
  if (command === 'get_items') {
    const products = getUnifiedProducts()
    const cats = getItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES)
    const activeProducts = products.filter(p => p.status !== 'disabled')

    let filtered = activeProducts
    if (args.categoryId != null) {
      const targetCat = cats.find(c => c.id === Number(args.categoryId) || c.id === args.categoryId)
      if (targetCat) {
        filtered = activeProducts.filter(p => (p.category || '').toLowerCase() === targetCat.name.toLowerCase())
      } else {
        filtered = activeProducts.filter(p => (p.category || '').toLowerCase() === String(args.categoryId).toLowerCase())
      }
    }

    return filtered.map(p => {
      const cat = cats.find(c => (c.name || '').toLowerCase() === (p.category || '').toLowerCase())
      const isTracked = p.track_inventory === true
      return {
        id: p.id,
        product_id: p.id,
        category_id: cat ? cat.id : null,
        category: p.category || '',
        name: p.name,
        price: p.selling_price || 0,
        selling_price: p.selling_price || 0,
        purchase_price: p.purchase_price || 0,
        track_inventory: isTracked,
        current_stock: isTracked ? (p.current_stock ?? 0) : -1,
        min_stock: isTracked ? (p.min_stock ?? 0) : 0,
        barcode: p.barcode || '',
        sku: p.sku || '',
        image_url: p.image_url || '',
        is_active: p.status !== 'disabled',
      }
    })
  }

  if (command === 'create_item') {
    // Route creation through create_product for consistency
    const cats = getItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES)
    const cat = cats.find(c => c.id === Number(args.categoryId))
    const catName = cat ? cat.name : 'General'
    return handleMockCommand('create_product', {
      name: args.name,
      category: catName,
      selling_price: Number(args.price) || 0,
      image_url: args.imageUrl || '',
      track_inventory: false,
      current_stock: -1,
    })
  }

  if (command === 'update_item') {
    return handleMockCommand('update_product', {
      id: args.id,
      name: args.name,
      selling_price: Number(args.price) || 0,
      status: args.isActive === false ? 'disabled' : 'active',
    })
  }

  if (command === 'update_item_image') {
    return handleMockCommand('update_product', {
      id: args.id,
      image_url: args.imageUrl || '',
    })
  }

  if (command === 'delete_item') {
    return handleMockCommand('delete_product', { id: args.id })
  }

  if (command === 'seed_default_menu') {
    setItem('billeasy_deleted_product_ids', [])
    setItem('billeasy_catalog_migrated_v2', true)
    setItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES)
    setItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS)
    setItem(STORAGE_KEYS.ITEMS, [])
    return { success: true }
  }

  // ════════ INVENTORY PRODUCT CRUD ════════
  if (command === 'get_products') {
    const products = getUnifiedProducts()
    let filtered = [...products]

    if (args.search) {
      const q = String(args.search).toLowerCase()
      filtered = filtered.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      )
    }

    if (args.category) {
      const c = String(args.category).toLowerCase()
      filtered = filtered.filter(p => (p.category || '').toLowerCase() === c)
    }

    if (args.status) {
      filtered = filtered.filter(p => {
        if (args.status === 'active') return p.status === 'active'
        if (args.status === 'disabled') return p.status === 'disabled'
        if (args.status === 'low_stock') return p.track_inventory && p.current_stock > 0 && p.current_stock <= (p.min_stock || 5)
        if (args.status === 'out_of_stock') return p.track_inventory && p.current_stock <= 0
        if (args.status === 'untracked') return !p.track_inventory || p.current_stock < 0
        return true
      })
    }

    return filtered
  }

  if (command === 'get_product') {
    const products = getUnifiedProducts()
    return products.find(p => p.id === Number(args.id)) || null
  }

  if (command === 'create_product') {
    const products = getUnifiedProducts()
    const catName = String(args.category || 'General').trim() || 'General'
    ensureCategoryExists(catName)

    // Optional inventory tracking
    const track = args.track_inventory !== undefined
      ? Boolean(args.track_inventory)
      : (args.current_stock != null && Number(args.current_stock) >= 0)

    const rawStock = Number(args.current_stock ?? args.currentStock ?? 0)
    const currentStock = track ? (isNaN(rawStock) ? 0 : rawStock) : -1
    const minStock = track ? (Number(args.min_stock ?? args.minStock ?? 5) || 5) : 0

    let status = 'active'
    if (track) {
      if (currentStock <= 0) status = 'out_of_stock'
      else if (currentStock <= minStock) status = 'low_stock'
    }

    const np = {
      id: Date.now(),
      name: String(args.name || '').trim(),
      barcode: String(args.barcode || '').trim() || String(Math.floor(100000000000 + Math.random() * 900000000000)),
      sku: String(args.sku || '').trim() || `SKU-${Date.now().toString().slice(-4)}`,
      category: catName,
      purchase_price: Number(args.purchase_price ?? args.purchasePrice ?? 0) || 0,
      selling_price: Number(args.selling_price ?? args.sellingPrice ?? 0) || 0,
      track_inventory: track,
      current_stock: currentStock,
      min_stock: minStock,
      status,
      barcode_type: args.barcode_type || 'internal',
      image_url: args.image_url || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    products.unshift(np)
    setItem(STORAGE_KEYS.PRODUCTS, products)

    // If initial stock was added, record in history
    if (track && currentStock > 0) {
      const history = getItem(STORAGE_KEYS.INVENTORY_HISTORY, [])
      history.unshift({
        id: Date.now(),
        product_id: np.id,
        product_name: np.name,
        barcode: np.barcode,
        previous_stock: 0,
        qty_changed: currentStock,
        current_stock: currentStock,
        action: 'initial_stock',
        invoice_number: '',
        user_name: 'Owner',
        remarks: 'Opening stock',
        created_at: new Date().toISOString(),
      })
      setItem(STORAGE_KEYS.INVENTORY_HISTORY, history)
    }

    return np
  }

  if (command === 'update_product') {
    const products = getUnifiedProducts()
    const targetId = String(args.id)
    const i = products.findIndex(p => String(p.id) === targetId)
    if (i !== -1) {
      const cur = products[i]
      const catName = args.category !== undefined ? (String(args.category).trim() || 'General') : cur.category
      ensureCategoryExists(catName)

      const track = args.track_inventory !== undefined
        ? Boolean(args.track_inventory)
        : (args.current_stock != null ? Number(args.current_stock) >= 0 : (cur.track_inventory ?? false))

      let stock = cur.current_stock
      if (args.current_stock !== undefined) {
        stock = track ? (Number(args.current_stock) || 0) : -1
      } else if (!track) {
        stock = -1
      } else if (stock < 0) {
        stock = 0
      }

      const minStock = track ? (args.min_stock !== undefined ? (Number(args.min_stock) || 0) : cur.min_stock) : 0

      let status = cur.status === 'disabled' ? 'disabled' : 'active'
      if (status !== 'disabled' && track) {
        if (stock <= 0) status = 'out_of_stock'
        else if (stock <= minStock) status = 'low_stock'
      }

      products[i] = {
        ...cur,
        name: args.name ? String(args.name).trim() : cur.name,
        category: catName,
        track_inventory: track,
        current_stock: stock,
        min_stock: minStock,
        status,
        purchase_price: args.purchase_price !== undefined ? (Number(args.purchase_price) || 0) : cur.purchase_price,
        selling_price: args.selling_price !== undefined ? (Number(args.selling_price) || 0) : cur.selling_price,
        barcode: args.barcode !== undefined ? String(args.barcode).trim() : (cur.barcode || ''),
        sku: args.sku !== undefined ? String(args.sku).trim() : (cur.sku || ''),
        image_url: args.image_url !== undefined ? String(args.image_url) : (cur.image_url || ''),
        updated_at: new Date().toISOString(),
      }
      setItem(STORAGE_KEYS.PRODUCTS, products)
      return products[i]
    }
    return null
  }

  if (command === 'delete_product') {
    const products = getUnifiedProducts()
    const targetId = String(args.id)
    const deletedIds = getItem('billeasy_deleted_product_ids', [])
    if (!deletedIds.includes(targetId)) {
      deletedIds.push(targetId)
      setItem('billeasy_deleted_product_ids', deletedIds)
    }
    const remaining = products.filter(p => String(p.id) !== targetId)
    setItem(STORAGE_KEYS.PRODUCTS, remaining)
    return { success: true }
  }

  if (command === 'toggle_product') {
    const products = getUnifiedProducts()
    const targetId = String(args.id)
    const i = products.findIndex(p => String(p.id) === targetId)
    if (i !== -1) {
      const nextDisabled = !args.enabled
      if (nextDisabled) {
        products[i].status = 'disabled'
      } else {
        const isTracked = products[i].track_inventory === true
        if (isTracked && products[i].current_stock <= 0) products[i].status = 'out_of_stock'
        else if (isTracked && products[i].current_stock <= products[i].min_stock) products[i].status = 'low_stock'
        else products[i].status = 'active'
      }
      setItem(STORAGE_KEYS.PRODUCTS, products)
      return products[i]
    }
    return null
  }

  if (command === 'lookup_barcode') {
    const products = getUnifiedProducts()
    const b = String(args.barcode || '').trim()
    const found = products.find(p => p.barcode === b); return found ? { ...found, item_id: found.id } : null
  }

  if (command === 'assign_barcode') {
    const products = getUnifiedProducts()
    const targetId = String(args.id)
    const i = products.findIndex(p => String(p.id) === targetId)
    if (i !== -1) {
      products[i].barcode = String(args.barcode || '').trim()
      products[i].updated_at = new Date().toISOString()
      setItem(STORAGE_KEYS.PRODUCTS, products)
      return products[i]
    }
    return null
  }

  // ── Stock Adjustments ──
  if (command === 'add_stock' || command === 'reduce_stock') {
    const products = getUnifiedProducts()
    const targetId = String(args.id)
    const i = products.findIndex(p => String(p.id) === targetId)
    if (i !== -1) {
      const prod = products[i]
      const delta = command === 'add_stock' ? Math.abs(Number(args.qty) || 0) : -Math.abs(Number(args.qty) || 0)
      const prevStock = prod.current_stock < 0 ? 0 : prod.current_stock
      const nextStock = Math.max(0, prevStock + delta)

      prod.track_inventory = true
      prod.current_stock = nextStock
      if (nextStock === 0) prod.status = 'out_of_stock'
      else if (nextStock <= (prod.min_stock || 5)) prod.status = 'low_stock'
      else prod.status = 'active'
      prod.updated_at = new Date().toISOString()

      setItem(STORAGE_KEYS.PRODUCTS, products)

      // Audit history
      const history = getItem(STORAGE_KEYS.INVENTORY_HISTORY, [])
      history.unshift({
        id: Date.now(),
        product_id: prod.id,
        product_name: prod.name,
        barcode: prod.barcode || '',
        previous_stock: prevStock,
        qty_changed: delta,
        current_stock: nextStock,
        action: command === 'add_stock' ? 'restock' : 'adjustment',
        invoice_number: '',
        user_name: 'Owner',
        remarks: args.remarks || (command === 'add_stock' ? 'Manual stock added' : 'Manual stock reduced'),
        created_at: new Date().toISOString(),
      })
      setItem(STORAGE_KEYS.INVENTORY_HISTORY, history)
      return prod
    }
    return null
  }

  // ── Stock Validation (Checkout) ──
  if (command === 'validate_cart_stock') {
    const products = getUnifiedProducts()
    for (const item of (args.items || [])) {
      const prod = products.find(p => p.id === Number(item.product_id) || p.barcode === item.barcode)
      if (prod) {
        const isTracked = prod.track_inventory === true
        // Only validate for tracked items
        if (isTracked && prod.current_stock >= 0 && prod.current_stock < (item.qty || 1)) {
          throw new Error(`Insufficient stock for "${prod.name}" (Available: ${prod.current_stock})`)
        }
      }
    }
    return { success: true }
  }

  // ── Deduct Inventory (On Order) ──
  if (command === 'deduct_inventory') {
    const products = getUnifiedProducts()
    const history = getItem(STORAGE_KEYS.INVENTORY_HISTORY, [])
    let changed = false

    for (const item of (args.items || [])) {
      const pIdx = products.findIndex(p =>
        String(p.id) === String(item.product_id || item.item_id || item.id) ||
        (item.barcode && p.barcode === item.barcode) ||
        (p.name || '').toLowerCase() === (item.name || '').toLowerCase()
      )
      if (pIdx !== -1) {
        const prod = products[pIdx]
        const isTracked = prod.track_inventory === true
        const deductQty = Number(item.qty) || 1
        const prev = prod.current_stock

        if (isTracked) {
          const nextStock = Math.max(0, (prev >= 0 ? prev : 0) - deductQty)
          prod.current_stock = nextStock
          if (nextStock === 0) prod.status = 'out_of_stock'
          else if (nextStock <= (prod.min_stock || 5)) prod.status = 'low_stock'
          changed = true

          history.unshift({
            id: Date.now() + Math.random(),
            product_id: prod.id,
            product_name: prod.name,
            barcode: prod.barcode || '',
            previous_stock: prev,
            qty_changed: -deductQty,
            current_stock: nextStock,
            action: 'sale_deduct',
            invoice_number: String(args.invoiceNumber || ''),
            user_name: 'Cashier',
            remarks: `Bill sale #${args.invoiceNumber || ''}`,
            created_at: new Date().toISOString(),
          })
        } else {
          // Untracked sale record
          history.unshift({
            id: Date.now() + Math.random(),
            product_id: prod.id,
            product_name: prod.name,
            barcode: prod.barcode || '',
            previous_stock: -1,
            qty_changed: -deductQty,
            current_stock: -1,
            action: 'sale',
            invoice_number: String(args.invoiceNumber || ''),
            user_name: 'Cashier',
            remarks: `Bill sale #${args.invoiceNumber || ''}`,
            created_at: new Date().toISOString(),
          })
          changed = true
        }
      }
    }

    if (changed) {
      setItem(STORAGE_KEYS.PRODUCTS, products)
      setItem(STORAGE_KEYS.INVENTORY_HISTORY, history)
    }
    return { success: true }
  }

  // ════════ ORDERS ════════
  if (command === 'save_order') {
    const orders = getItem(STORAGE_KEYS.ORDERS, [])
    const orderId = nextOrderId()
    const newOrder = {
      id: orderId,
      items: args.items || [],
      subtotal: Number(args.subtotal) || 0,
      total: Number(args.total) || 0,
      created_at: new Date().toISOString(),
    }
    orders.unshift(newOrder)
    setItem(STORAGE_KEYS.ORDERS, orders)

    // Inventory deduction is handled separately via deduct_inventory command

    return orderId
  }

  if (command === 'get_orders') {
    const rawOrders = getItem(STORAGE_KEYS.ORDERS, [])
    const orders = rawOrders.map(o => ({
      ...o,
      items: Array.isArray(o.items)
        ? o.items
        : (typeof o.items === 'string' ? (() => { try { return JSON.parse(o.items) } catch { return [] } })() : [])
    }))
    if (args.date) {
      return orders.filter(o => {
        if (!o.created_at) return false
        const localD = getLocalDateStr(new Date(o.created_at))
        return localD === args.date || String(o.created_at).startsWith(args.date)
      })
    }
    return orders
  }

  if (command === 'get_summary') {
    const orders = getItem(STORAGE_KEYS.ORDERS, [])
    const today = todayStr()
    const weekStart = weekAgoStr()
    const todayOrders = orders.filter(o => {
      if (!o.created_at) return false
      const localD = getLocalDateStr(new Date(o.created_at))
      return localD === today || o.created_at.startsWith(today)
    })
    const weekOrders = orders.filter(o => {
      if (!o.created_at) return false
      const localD = getLocalDateStr(new Date(o.created_at))
      return localD >= weekStart
    })
    return {
      total_orders: orders.length,
      total_sales: orders.reduce((s, o) => s + (o.total || 0), 0),
      total_items: orders.reduce((s, o) => s + (o.items?.reduce((a, i) => a + (i.qty || 1), 0) || 0), 0),
      today_count: todayOrders.length,
      today_total: todayOrders.reduce((s, o) => s + (o.total || 0), 0),
      week_total: weekOrders.reduce((s, o) => s + (o.total || 0), 0),
      week_count: weekOrders.length,
    }
  }

  if (command === 'get_data_info') {
    return { order_count: getItem(STORAGE_KEYS.ORDERS, []).length, database_size: 'Local Storage (Browser)' }
  }

  if (command === 'open_orders_csv') {
    const orders = getItem(STORAGE_KEYS.ORDERS, [])
    let csv = 'Order ID,Date,Items,Subtotal,Total\n'
    orders.forEach(o => {
      const is = (o.items || []).map(i => `${i.name} x${i.qty}`).join('; ')
      csv += `"${o.id}","${o.created_at}","${is}",${o.subtotal},${o.total}\n`
    })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'BillEasy_Orders.csv'; a.click()
    URL.revokeObjectURL(url)
    return null
  }

  // ════════ PRINTERS ════════
  if (command === 'list_printers') {
    return [
      { name: 'Browser Default (Print Window)', driver: 'Browser', port_name: 'N/A' },
      { name: 'Receipt Thermal (Simulated)', driver: 'Thermal POS', port_name: 'USB001' },
    ]
  }
  if (command === 'print_receipt') {
    console.log('[Mock] Print receipt:', args)
    return { success: true }
  }
  if (command === 'generate_receipt_html') {
    return generateReceiptHtml(args)
  }

  // ════════ INVENTORY STATS & HISTORY ════════
  if (command === 'get_inventory_history') return getItem(STORAGE_KEYS.INVENTORY_HISTORY, [])

  if (command === 'get_dashboard_stats') {
    const p = getUnifiedProducts()
    const today = todayStr()
    const tracked = p.filter(x => x.track_inventory === true)
    return {
      total_products: p.length,
      active_products: p.filter(x => x.status === 'active').length,
      low_stock: tracked.filter(x => x.current_stock > 0 && x.current_stock <= (x.min_stock || 5)).length,
      out_of_stock: tracked.filter(x => x.current_stock <= 0).length,
      untracked_count: p.filter(x => !x.track_inventory || x.current_stock < 0).length,
      added_today: p.filter(x => x.created_at?.startsWith(today)).length,
      updated_today: p.filter(x => x.updated_at?.startsWith(today)).length,
    }
  }

  if (command === 'get_low_stock_products') {
    const p = getUnifiedProducts()
    return p.filter(x => x.track_inventory === true && x.current_stock <= (x.min_stock || 5))
  }

  if (command === 'bulk_import_products') {
    const products = getUnifiedProducts()
    const lines = (args.csvData || '').split('\n').filter(l => l.trim())
    let imported = 0
    let skipped = 0
    const errors = []

    // Expect header: Name,Barcode,SKU,Category,PurchasePrice,SellingPrice,OpeningStock,MinStock,TrackInventory
    const startIdx = lines[0].toLowerCase().includes('name') ? 1 : 0
    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''))
      const name = parts[0]
      if (!name) { skipped++; continue }
      const barcode = parts[1] || ''
      const sku = parts[2] || ''
      const category = parts[3] || 'General'
      const purchasePrice = parseFloat(parts[4]) || 0
      const sellingPrice = parseFloat(parts[5]) || 0
      const stockVal = parts[6] ? parseInt(parts[6]) : null
      const minStock = parts[7] ? parseInt(parts[7]) : 5
      const trackVal = parts[8] ? parts[8].toLowerCase() === 'true' : (stockVal != null && stockVal >= 0)

      ensureCategoryExists(category)

      products.push({
        id: Date.now() + i,
        name,
        barcode: barcode || String(Math.floor(100000000000 + Math.random() * 900000000000)),
        sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
        category,
        purchase_price: purchasePrice,
        selling_price: sellingPrice,
        track_inventory: trackVal,
        current_stock: trackVal ? (stockVal ?? 0) : -1,
        min_stock: trackVal ? minStock : 0,
        status: trackVal && (stockVal ?? 0) <= 0 ? 'out_of_stock' : 'active',
        barcode_type: 'internal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      imported++
    }

    setItem(STORAGE_KEYS.PRODUCTS, products)
    return { imported, skipped, errors }
  }

  console.warn(`[Mock] Unhandled: "${command}"`, args)
  return null
}
