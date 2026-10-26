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

// ── Default Categories ──
const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Beverages', sort_order: 1, is_active: true },
  { id: 2, name: 'Snacks & Fast Food', sort_order: 2, is_active: true },
  { id: 3, name: 'Meals & Combos', sort_order: 3, is_active: true },
  { id: 4, name: 'Desserts', sort_order: 4, is_active: true },
]

// ── Default Products (Unified Catalog) ──
// track_inventory is OPTIONAL per product:
// false = untracked (always available in billing, e.g. tea, freshly cooked food)
// true = tracked (stock decrements on billing, e.g. packaged goods, ice creams)
const DEFAULT_PRODUCTS = [
  {
    id: 1, name: 'Masala Chai', category: 'Beverages', purchase_price: 6, selling_price: 20,
    track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1001', sku: 'BEV-001',
    barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 2, name: 'Cold Coffee', category: 'Beverages', purchase_price: 20, selling_price: 60,
    track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1002', sku: 'BEV-002',
    barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 3, name: 'Fresh Lime Soda', category: 'Beverages', purchase_price: 12, selling_price: 40,
    track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1003', sku: 'BEV-003',
    barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 4, name: 'Veg Burger', category: 'Snacks & Fast Food', purchase_price: 30, selling_price: 80,
    track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1004', sku: 'SNK-001',
    barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 5, name: 'French Fries', category: 'Snacks & Fast Food', purchase_price: 25, selling_price: 70,
    track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1005', sku: 'SNK-002',
    barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 6, name: 'Grilled Sandwich', category: 'Snacks & Fast Food', purchase_price: 35, selling_price: 90,
    track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1006', sku: 'SNK-003',
    barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 7, name: 'Special Thali', category: 'Meals & Combos', purchase_price: 60, selling_price: 150,
    track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1007', sku: 'MEL-001',
    barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 8, name: 'Paneer Fried Rice', category: 'Meals & Combos', purchase_price: 50, selling_price: 130,
    track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1008', sku: 'MEL-002',
    barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 9, name: 'Gulab Jamun (2 pcs)', category: 'Desserts', purchase_price: 18, selling_price: 50,
    track_inventory: false, current_stock: -1, min_stock: 0, barcode: '1009', sku: 'DES-001',
    barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 10, name: 'Vanilla Ice Cream', category: 'Desserts', purchase_price: 15, selling_price: 40,
    track_inventory: true, current_stock: 30, min_stock: 5, barcode: '1010', sku: 'DES-002',
    barcode_type: 'internal', status: 'active', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
]

// ── Unified Products helper ──
function getUnifiedProducts() {
  let products = getItem(STORAGE_KEYS.PRODUCTS, null)
  let items = getItem(STORAGE_KEYS.ITEMS, null)
  let categories = getItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES)

  if (!products || !products.length) {
    if (items && items.length > 0) {
      // Migrate old menu items to products
      products = items.map((it, idx) => {
        const cat = categories.find(c => c.id === it.category_id)
        return {
          id: it.id,
          name: it.name,
          category: cat ? cat.name : 'General',
          purchase_price: Math.round((it.price || 0) * 0.5),
          selling_price: it.price || 0,
          track_inventory: false,
          current_stock: -1,
          min_stock: 0,
          status: it.is_active ? 'active' : 'disabled',
          barcode: String(1000 + idx + 1),
          sku: `SKU-${idx + 1}`,
          barcode_type: 'internal',
          image_url: it.image_url || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      })
    } else {
      products = DEFAULT_PRODUCTS
    }
    setItem(STORAGE_KEYS.PRODUCTS, products)
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
      cats[i] = { ...cats[i], ...args }
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
    const i = products.findIndex(p => p.id === Number(args.id))
    if (i !== -1) {
      const cur = products[i]
      const catName = args.category !== undefined ? (String(args.category).trim() || 'General') : cur.category
      ensureCategoryExists(catName)

      const track = args.track_inventory !== undefined
        ? Boolean(args.track_inventory)
        : (args.current_stock != null ? Number(args.current_stock) >= 0 : (cur.track_inventory ?? true))

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
        ...args,
        category: catName,
        track_inventory: track,
        current_stock: stock,
        min_stock: minStock,
        status,
        purchase_price: args.purchase_price !== undefined ? Number(args.purchase_price) : cur.purchase_price,
        selling_price: args.selling_price !== undefined ? Number(args.selling_price) : cur.selling_price,
        updated_at: new Date().toISOString(),
      }
      setItem(STORAGE_KEYS.PRODUCTS, products)
      return products[i]
    }
    return null
  }

  if (command === 'delete_product') {
    const products = getUnifiedProducts()
    setItem(STORAGE_KEYS.PRODUCTS, products.filter(p => p.id !== Number(args.id)))
    return null
  }

  if (command === 'toggle_product') {
    const products = getUnifiedProducts()
    const i = products.findIndex(p => p.id === Number(args.id))
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
    }
    return null
  }

  if (command === 'lookup_barcode') {
    const products = getUnifiedProducts()
    const b = String(args.barcode || '').trim()
    return products.find(p => p.barcode === b) || null
  }

  if (command === 'assign_barcode') {
    const products = getUnifiedProducts()
    const i = products.findIndex(p => p.id === Number(args.id))
    if (i !== -1) {
      products[i].barcode = String(args.barcode || '').trim()
      products[i].updated_at = new Date().toISOString()
      setItem(STORAGE_KEYS.PRODUCTS, products)
    }
    return null
  }

  // ── Stock Adjustments ──
  if (command === 'add_stock' || command === 'reduce_stock') {
    const products = getUnifiedProducts()
    const i = products.findIndex(p => p.id === Number(args.id))
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
      const pIdx = products.findIndex(p => p.id === Number(item.product_id) || p.barcode === item.barcode)
      if (pIdx !== -1) {
        const prod = products[pIdx]
        const isTracked = prod.track_inventory === true
        if (isTracked && prod.current_stock > 0) {
          const prev = prod.current_stock
          const deductQty = item.qty || 1
          const nextStock = Math.max(0, prev - deductQty)
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

    // Auto-deduct inventory for tracked products
    try {
      const products = getUnifiedProducts()
      const history = getItem(STORAGE_KEYS.INVENTORY_HISTORY, [])
      let changed = false
      for (const item of (args.items || [])) {
        const pIdx = products.findIndex(p =>
          p.id === Number(item.item_id) ||
          p.id === Number(item.product_id) ||
          (p.name || '').toLowerCase() === (item.name || '').toLowerCase()
        )
        if (pIdx !== -1) {
          const prod = products[pIdx]
          const isTracked = prod.track_inventory === true
          if (isTracked && prod.current_stock > 0) {
            const prev = prod.current_stock
            const deductQty = item.qty || 1
            const nextStock = Math.max(0, prev - deductQty)
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
              invoice_number: String(orderId),
              user_name: 'Cashier',
              remarks: `Sold in Bill #${orderId}`,
              created_at: new Date().toISOString(),
            })
          }
        }
      }
      if (changed) {
        setItem(STORAGE_KEYS.PRODUCTS, products)
        setItem(STORAGE_KEYS.INVENTORY_HISTORY, history)
      }
    } catch (e) { console.warn('[Mock] auto-deduct error:', e) }

    return orderId
  }

  if (command === 'get_orders') {
    const orders = getItem(STORAGE_KEYS.ORDERS, [])
    if (args.date) {
      return orders.filter(o => {
        if (!o.created_at) return false
        const localD = getLocalDateStr(new Date(o.created_at))
        return localD === args.date || o.created_at.startsWith(args.date)
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
