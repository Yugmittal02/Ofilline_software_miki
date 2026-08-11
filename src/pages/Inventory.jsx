import { useEffect, useState, useRef } from 'react'
import { useInventoryStore } from '../store/inventoryStore'
import BarcodeLabelPrint from '../components/BarcodeLabelPrint'

// ═══════════════════════════════════════════════════════════
// Status helpers
// ═══════════════════════════════════════════════════════════
const STATUS_MAP = {
  active: { label: 'Active', color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
  low_stock: { label: 'Low Stock', color: '#d97706', bg: '#fffbeb', icon: '⚠️' },
  out_of_stock: { label: 'Out of Stock', color: '#dc2626', bg: '#fef2f2', icon: '🚫' },
  disabled: { label: 'Disabled', color: '#6b7280', bg: '#f3f4f6', icon: '⏸️' },
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.active
  return (
    <span className="status-badge" style={{ color: s.color, background: s.bg }}>
      {s.icon} {s.label}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════
// Main Inventory Page
// ═══════════════════════════════════════════════════════════
export default function Inventory() {
  const {
    products, loading, searchQuery, filterStatus,
    fetchProducts, setSearchQuery, setFilterStatus,
    createProduct, updateProduct, deleteProduct, toggleProduct,
    addStock, reduceStock, fetchHistory, history,
    fetchDashboardStats, dashboardStats, fetchLowStockProducts, lowStockProducts,
    bulkImport,
  } = useInventoryStore()

  const [activeSection, setActiveSection] = useState('dashboard')
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showStockModal, setShowStockModal] = useState(null) // { product, mode: 'add'|'reduce' }
  const [showImportModal, setShowImportModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(null) // product to assign barcode to
  const [showLabelPrint, setShowLabelPrint] = useState(false)
  const [selectedForPrint, setSelectedForPrint] = useState([]) // products selected for label printing
  const [toast, setToast] = useState(null)
  const searchRef = useRef(null)

  // ── Export CSV ──
  const handleExportCSV = () => {
    if (products.length === 0) { showToast('No products to export', 'error'); return }
    const header = 'Name,Barcode,SKU,Category,PurchasePrice,SellingPrice,CurrentStock,MinStock,Status'
    const rows = products.map(p =>
      [p.name, p.barcode, p.sku, p.category, p.purchase_price, p.selling_price, p.current_stock, p.min_stock, p.status]
        .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`Exported ${products.length} products`)
  }

  // ── Toggle label selection ──
  const togglePrintSelect = (product) => {
    setSelectedForPrint(prev => {
      const exists = prev.find(p => p.id === product.id)
      return exists ? prev.filter(p => p.id !== product.id) : [...prev, product]
    })
  }

  useEffect(() => {
    fetchProducts()
    fetchDashboardStats()
    fetchLowStockProducts()
    fetchHistory()
  }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Dashboard Section ──
  const DashboardSection = () => {
    const stats = dashboardStats || {}
    const statCards = [
      { label: 'Total Products', value: stats.total_products || 0, icon: '📦', color: '#6366f1' },
      { label: 'Active', value: stats.active_products || 0, icon: '✅', color: '#16a34a' },
      { label: 'Low Stock', value: stats.low_stock || 0, icon: '⚠️', color: '#d97706' },
      { label: 'Out of Stock', value: stats.out_of_stock || 0, icon: '🚫', color: '#dc2626' },
      { label: 'Added Today', value: stats.added_today || 0, icon: '📥', color: '#0891b2' },
      { label: 'Updated Today', value: stats.updated_today || 0, icon: '🔄', color: '#7c3aed' },
    ]

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {statCards.map(c => (
            <div key={c.label} className="inv-stat-card" style={{ borderLeft: `4px solid ${c.color}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono" style={{ color: c.color }}>{c.value}</div>
                  <div className="text-xs text-stone-500 font-medium mt-0.5">{c.label}</div>
                </div>
                <span className="text-2xl opacity-60">{c.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Low Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <div>
            <div className="settings-section-title">⚠️ Low Stock Alerts</div>
            <div className="settings-card">
              {lowStockProducts.slice(0, 10).map(p => (
                <div key={p.id} className="settings-row">
                  <span className="text-sm font-medium text-stone-700 flex-1">{p.name}</span>
                  <span className="font-mono text-sm font-bold" style={{
                    color: p.current_stock === 0 ? '#dc2626' : '#d97706'
                  }}>{p.current_stock} left</span>
                  <span className="text-xs text-stone-400">min: {p.min_stock}</span>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <div className="settings-section-title">📋 Recent Activity</div>
          <div className="settings-card">
            {history.length === 0 ? (
              <div className="settings-row justify-center"><span className="text-sm text-stone-400">No activity yet</span></div>
            ) : history.slice(0, 8).map(h => (
              <div key={h.id} className="settings-row">
                <span className="inv-action-badge">{h.action.replace(/_/g, ' ')}</span>
                <span className="text-sm text-stone-700 flex-1 truncate">{h.product_name}</span>
                <span className="font-mono text-xs text-stone-500">
                  {h.qty_changed > 0 ? '+' : ''}{h.qty_changed} → {h.current_stock}
                </span>
                <span className="text-xs text-stone-400">{new Date(h.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Products Section ──
  const ProductsSection = () => (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="pos-search flex-1">
          <span className="search-icon">🔍</span>
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products, barcodes, SKUs…"
            autoComplete="off" spellCheck="false"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input-premium text-sm py-2.5 w-40"
        >
          <option value="">All Status</option>
          <option value="active">✅ Active</option>
          <option value="low_stock">⚠️ Low Stock</option>
          <option value="out_of_stock">🚫 Out of Stock</option>
          <option value="disabled">⏸️ Disabled</option>
        </select>
        <button onClick={() => { setEditingProduct(null); setShowProductModal(true) }} className="btn-primary text-sm py-2.5 px-4 whitespace-nowrap">
          + Add Product
        </button>
        <button onClick={() => setShowImportModal(true)} className="btn-secondary text-sm py-2.5 px-4 whitespace-nowrap">
          📥 Import
        </button>
        <button onClick={handleExportCSV} className="btn-secondary text-sm py-2.5 px-4 whitespace-nowrap">
          📤 Export
        </button>
        {selectedForPrint.length > 0 && (
          <button onClick={() => setShowLabelPrint(true)} className="btn-secondary text-sm py-2.5 px-4 whitespace-nowrap" style={{ borderColor: '#7c3aed', color: '#7c3aed' }}>
            🏷️ Print Labels ({selectedForPrint.length})
          </button>
        )}
      </div>

      {/* Products Table */}
      <div className="settings-card">
        {/* Header */}
        <div className="settings-row bg-stone-50/80 font-semibold text-xs text-stone-500 uppercase tracking-wider">
          <span className="w-48">Product</span>
          <span className="w-32">Barcode</span>
          <span className="w-24">SKU</span>
          <span className="w-20 text-right">Price</span>
          <span className="w-16 text-center">Stock</span>
          <span className="w-24 text-center">Status</span>
          <span className="w-40 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="settings-row justify-center py-8">
            <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="settings-row justify-center py-8">
            <div className="text-center">
              <div className="text-3xl opacity-30 mb-2">📦</div>
              <p className="text-sm text-stone-400">{searchQuery ? 'No products match' : 'No products yet'}</p>
            </div>
          </div>
        ) : products.map(p => (
          <div key={p.id} className={`settings-row group hover:bg-orange-50/30 ${p.status === 'disabled' ? 'opacity-50' : ''}`}>
            <div className="w-48 min-w-0">
              <div className="text-sm font-medium text-stone-800 truncate">{p.name}</div>
              <div className="text-xs text-stone-400 truncate">{p.category || '—'}</div>
            </div>
            <div className="w-32">
              <span className="font-mono text-xs text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">{p.barcode || '—'}</span>
            </div>
            <div className="w-24">
              <span className="text-xs text-stone-500">{p.sku || '—'}</span>
            </div>
            <div className="w-20 text-right font-mono text-sm font-semibold text-orange-600">
              ₹{p.selling_price}
            </div>
            <div className="w-16 text-center">
              <span className={`font-mono text-sm font-bold ${
                p.current_stock < 0 ? 'text-stone-400' :
                p.current_stock === 0 ? 'text-red-600' :
                p.current_stock <= p.min_stock ? 'text-amber-600' : 'text-stone-700'
              }`}>
                {p.current_stock < 0 ? '∞' : p.current_stock}
              </span>
            </div>
            <div className="w-24 text-center"><StatusBadge status={p.status} /></div>
            <div className="w-40 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <input type="checkbox" checked={!!selectedForPrint.find(x => x.id === p.id)} onChange={() => togglePrintSelect(p)} title="Select for label print" className="w-3.5 h-3.5 accent-purple-600 cursor-pointer" />
              <button onClick={() => setShowStockModal({ product: p, mode: 'add' })} className="inv-action-btn green" title="Add Stock">+</button>
              <button onClick={() => setShowStockModal({ product: p, mode: 'reduce' })} className="inv-action-btn red" title="Reduce Stock">−</button>
              <button onClick={() => setShowAssignModal(p)} className="inv-action-btn gray" title="Assign Barcode">🔗</button>
              <button onClick={() => { setEditingProduct(p); setShowProductModal(true) }} className="inv-action-btn blue" title="Edit">✏️</button>
              <button onClick={() => toggleProduct(p.id, p.status === 'disabled')} className="inv-action-btn gray" title={p.status === 'disabled' ? 'Enable' : 'Disable'}>
                {p.status === 'disabled' ? '▶' : '⏸'}
              </button>
              <button onClick={() => { if (confirm('Delete this product?')) deleteProduct(p.id).then(() => showToast('Product deleted')) }} className="inv-action-btn red" title="Delete">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── History Section ──
  const HistorySection = () => (
    <div>
      <div className="settings-card">
        <div className="settings-row bg-stone-50/80 font-semibold text-xs text-stone-500 uppercase tracking-wider">
          <span className="w-40">Date</span>
          <span className="w-32">Action</span>
          <span className="flex-1">Product</span>
          <span className="w-24">Barcode</span>
          <span className="w-20 text-right">Change</span>
          <span className="w-16 text-right">Stock</span>
          <span className="w-24">Invoice</span>
        </div>
        {history.length === 0 ? (
          <div className="settings-row justify-center py-8">
            <span className="text-sm text-stone-400">No history records</span>
          </div>
        ) : history.map(h => (
          <div key={h.id} className="settings-row text-sm">
            <span className="w-40 text-xs text-stone-500">{new Date(h.created_at).toLocaleString()}</span>
            <span className="w-32"><span className="inv-action-badge">{h.action.replace(/_/g, ' ')}</span></span>
            <span className="flex-1 text-stone-700 truncate">{h.product_name}</span>
            <span className="w-24 font-mono text-xs text-stone-500">{h.barcode || '—'}</span>
            <span className={`w-20 text-right font-mono font-bold ${h.qty_changed > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {h.qty_changed > 0 ? '+' : ''}{h.qty_changed}
            </span>
            <span className="w-16 text-right font-mono text-stone-700">{h.current_stock}</span>
            <span className="w-24 text-xs text-stone-400">{h.invoice_number || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#f5f5f7' }}>
      {/* Sidebar */}
      <div className="w-52 flex flex-col glass-dark border-r border-gray-100">
        <div className="px-4 py-4 border-b border-gray-100">
          <span className="font-semibold text-gray-900 text-sm">📦 Inventory</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'products', label: 'Products', icon: '📋' },
            { id: 'history', label: 'Audit Log', icon: '📜' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSection(s.id)
                if (s.id === 'history') fetchHistory()
                if (s.id === 'dashboard') { fetchDashboardStats(); fetchLowStockProducts(); fetchHistory() }
                if (s.id === 'products') fetchProducts()
              }}
              className={`w-full text-left px-4 py-3 text-sm font-medium transition-all border-l-[3px] ${
                activeSection === s.id
                  ? 'bg-orange-50/80 border-l-orange-500 text-orange-700'
                  : 'border-l-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {activeSection === 'dashboard' && <DashboardSection />}
          {activeSection === 'products' && <ProductsSection />}
          {activeSection === 'history' && <HistorySection />}
        </div>
      </div>

      {/* ── Product Modal ── */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          onSave={async (data) => {
            try {
              if (editingProduct) {
                await updateProduct({ id: editingProduct.id, ...data })
                showToast('Product updated')
              } else {
                await createProduct(data)
                showToast('Product created')
              }
              setShowProductModal(false)
              setEditingProduct(null)
            } catch (e) { showToast(typeof e === 'string' ? e : 'Save failed', 'error') }
          }}
          onClose={() => { setShowProductModal(false); setEditingProduct(null) }}
        />
      )}

      {/* ── Stock Modal ── */}
      {showStockModal && (
        <StockModal
          product={showStockModal.product}
          mode={showStockModal.mode}
          onSave={async (qty, remarks) => {
            try {
              if (showStockModal.mode === 'add') await addStock(showStockModal.product.id, qty, remarks)
              else await reduceStock(showStockModal.product.id, qty, remarks)
              showToast(`Stock ${showStockModal.mode === 'add' ? 'added' : 'reduced'}`)
              setShowStockModal(null)
              fetchDashboardStats()
              fetchLowStockProducts()
            } catch (e) { showToast(typeof e === 'string' ? e : 'Failed', 'error') }
          }}
          onClose={() => setShowStockModal(null)}
        />
      )}

      {/* ── Import Modal ── */}
      {showImportModal && (
        <ImportModal
          onImport={async (csvData) => {
            try {
              const result = await bulkImport(csvData)
              showToast(`Imported ${result.imported}, skipped ${result.skipped}`)
              fetchProducts()
              fetchDashboardStats()
              setShowImportModal(false)
              return result
            } catch (e) { showToast(typeof e === 'string' ? e : 'Import failed', 'error') }
          }}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* ── Assign Barcode Modal ── */}
      {showAssignModal && (
        <AssignBarcodeModal
          product={showAssignModal}
          onSave={async (barcode) => {
            try {
              await useInventoryStore.getState().assignBarcode(showAssignModal.id, barcode)
              showToast('Barcode assigned')
              setShowAssignModal(null)
            } catch (e) { showToast(typeof e === 'string' ? e : 'Failed', 'error') }
          }}
          onClose={() => setShowAssignModal(null)}
        />
      )}

      {/* ── Barcode Label Print ── */}
      {showLabelPrint && selectedForPrint.length > 0 && (
        <BarcodeLabelPrint
          products={selectedForPrint}
          onClose={() => setShowLabelPrint(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium z-50 toast-enter ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`}>{toast.msg}</div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Product Create/Edit Modal
// ═══════════════════════════════════════════════════════════
function ProductModal({ product, onSave, onClose }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    barcode: product?.barcode || '',
    sku: product?.sku || '',
    category: product?.category || '',
    purchase_price: product?.purchase_price || 0,
    selling_price: product?.selling_price || 0,
    current_stock: product?.current_stock ?? 0,
    min_stock: product?.min_stock || 0,
    barcode_type: product?.barcode_type || 'internal',
    item_id: product?.item_id || null,
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        <div className="modal-body space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="inv-label">Product Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} className="input-premium text-sm" placeholder="e.g. Pepsi 250ml" autoFocus />
            </div>
            <div>
              <label className="inv-label">Category</label>
              <input value={form.category} onChange={e => set('category', e.target.value)} className="input-premium text-sm" placeholder="e.g. Beverages" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="inv-label">Barcode <span className="text-xs text-stone-400">(blank = auto)</span></label>
              <input value={form.barcode} onChange={e => set('barcode', e.target.value)} className="input-premium text-sm font-mono" placeholder="Auto-generated" />
            </div>
            <div>
              <label className="inv-label">SKU <span className="text-xs text-stone-400">(blank = auto)</span></label>
              <input value={form.sku} onChange={e => set('sku', e.target.value)} className="input-premium text-sm font-mono" placeholder="Auto-generated" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="inv-label">Purchase Price (₹)</label>
              <input type="number" min="0" step="0.5" value={form.purchase_price} onChange={e => set('purchase_price', parseFloat(e.target.value) || 0)} className="input-premium text-sm" />
            </div>
            <div>
              <label className="inv-label">Selling Price (₹)</label>
              <input type="number" min="0" step="0.5" value={form.selling_price} onChange={e => set('selling_price', parseFloat(e.target.value) || 0)} className="input-premium text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {!product && (
              <div>
                <label className="inv-label">Opening Stock</label>
                <input type="number" min="0" value={form.current_stock} onChange={e => set('current_stock', parseInt(e.target.value) || 0)} className="input-premium text-sm" />
              </div>
            )}
            <div>
              <label className="inv-label">Min Stock (alert threshold)</label>
              <input type="number" min="0" value={form.min_stock} onChange={e => set('min_stock', parseInt(e.target.value) || 0)} className="input-premium text-sm" />
            </div>
          </div>
          <div>
            <label className="inv-label">Barcode Type</label>
            <select value={form.barcode_type} onChange={e => set('barcode_type', e.target.value)} className="input-premium text-sm">
              <option value="internal">Internal (Generated)</option>
              <option value="manufacturer">Manufacturer</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary text-sm py-2.5 px-5">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.name.trim()} className="btn-primary text-sm py-2.5 px-5">{product ? 'Update' : 'Create'}</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Stock Adjustment Modal
// ═══════════════════════════════════════════════════════════
function StockModal({ product, mode, onSave, onClose }) {
  const [qty, setQty] = useState(1)
  const [remarks, setRemarks] = useState('')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{mode === 'add' ? '📥 Add Stock' : '📤 Reduce Stock'}</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        <div className="modal-body space-y-3">
          <div className="text-sm text-stone-600 font-medium">{product.name}</div>
          <div className="text-xs text-stone-400">Current: <span className="font-mono font-bold text-stone-700">{product.current_stock < 0 ? 'Untracked' : product.current_stock}</span></div>
          <div>
            <label className="inv-label">Quantity</label>
            <input type="number" min="1" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} className="input-premium text-sm" autoFocus />
          </div>
          <div>
            <label className="inv-label">Remarks (optional)</label>
            <input value={remarks} onChange={e => setRemarks(e.target.value)} className="input-premium text-sm" placeholder="e.g. Restocked from supplier" />
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary text-sm py-2.5 px-5">Cancel</button>
          <button onClick={() => onSave(qty, remarks)} className="btn-primary text-sm py-2.5 px-5">{mode === 'add' ? 'Add Stock' : 'Reduce Stock'}</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Bulk Import Modal
// ═══════════════════════════════════════════════════════════
function ImportModal({ onImport, onClose }) {
  const [csvText, setCsvText] = useState('')
  const [result, setResult] = useState(null)
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCsvText(ev.target.result)
    reader.readAsText(file)
  }

  const handleImport = async () => {
    const r = await onImport(csvText)
    if (r) setResult(r)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📥 Bulk Import Products</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        <div className="modal-body space-y-3">
          <div className="text-xs text-stone-500">
            CSV format: <code className="bg-stone-100 px-1 rounded">Name, Barcode, SKU, Category, PurchasePrice, SellingPrice, OpeningStock, MinStock</code>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="btn-secondary text-xs py-2 px-4">📎 Choose CSV</button>
          </div>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder="Name,Barcode,SKU,Category,PurchasePrice,SellingPrice,OpeningStock,MinStock&#10;Pepsi 250ml,8901234567890,,Beverages,18,25,100,10"
            className="input-premium text-xs font-mono"
            style={{ height: 160, resize: 'vertical' }}
          />
          {result && (
            <div className="bg-stone-50 rounded-xl p-3 text-xs">
              <div className="text-green-600 font-medium">✅ Imported: {result.imported}</div>
              <div className="text-amber-600 font-medium">⏭️ Skipped: {result.skipped}</div>
              {result.errors.length > 0 && (
                <div className="mt-2 text-red-500 space-y-0.5">
                  {result.errors.slice(0, 10).map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary text-sm py-2.5 px-5">Close</button>
          <button onClick={handleImport} disabled={!csvText.trim()} className="btn-primary text-sm py-2.5 px-5">Import</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Assign Barcode Modal
// ═══════════════════════════════════════════════════════════
function AssignBarcodeModal({ product, onSave, onClose }) {
  const [barcode, setBarcode] = useState(product.barcode || '')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔗 Assign Barcode</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        <div className="modal-body space-y-3">
          <div className="text-sm text-stone-600 font-medium">{product.name}</div>
          <div className="text-xs text-stone-400">
            Current: <span className="font-mono font-bold text-stone-700">{product.barcode || 'None'}</span>
          </div>
          <div>
            <label className="inv-label">Scan or type barcode</label>
            <input
              type="text"
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              className="input-premium text-sm font-mono"
              placeholder="Scan barcode here…"
              autoFocus
              autoComplete="off"
              onKeyDown={e => { if (e.key === 'Enter' && barcode.trim()) onSave(barcode.trim()) }}
            />
          </div>
          <div className="text-xs text-stone-400">
            💡 Point your barcode scanner at the product, then press the scanner trigger. The barcode will appear above.
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary text-sm py-2.5 px-5">Cancel</button>
          <button onClick={() => onSave(barcode.trim())} disabled={!barcode.trim()} className="btn-primary text-sm py-2.5 px-5">Assign</button>
        </div>
      </div>
    </div>
  )
}
