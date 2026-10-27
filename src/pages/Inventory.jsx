import { useEffect, useState, useRef } from 'react'
import { useInventoryStore } from '../store/inventoryStore'
import { useMenuStore } from '../store/menuStore'
import { useCloudinaryStore } from '../store/cloudinaryStore'
import BarcodeLabelPrint from '../components/BarcodeLabelPrint'
import { call } from '../lib/tauri'

// ═══════════════════════════════════════════════════════════
// Status Helpers
// ═══════════════════════════════════════════════════════════
const STATUS_MAP = {
  active: { label: 'Active', color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
  low_stock: { label: 'Low Stock', color: '#d97706', bg: '#fffbeb', icon: '⚠️' },
  out_of_stock: { label: 'Out of Stock', color: '#dc2626', bg: '#fef2f2', icon: '🚫' },
  disabled: { label: 'Disabled', color: '#6b7280', bg: '#f3f4f6', icon: '⏸️' },
  untracked: { label: 'Untracked', color: '#0284c7', bg: '#f0f9ff', icon: '♾️' },
}

function StatusBadge({ status, trackInventory, currentStock }) {
  if (trackInventory === false || currentStock < 0) {
    return (
      <span className="status-badge" style={{ color: '#0284c7', background: '#f0f9ff', borderColor: '#bae6fd' }}>
        ♾️ Unlimited
      </span>
    )
  }
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
    products, categories, loading, searchQuery, filterCategory, filterStatus,
    fetchProducts, fetchCategories, setSearchQuery, setFilterCategory, setFilterStatus,
    createProduct, updateProduct, deleteProduct, toggleProduct,
    createCategory, updateCategory, deleteCategory,
    addStock, reduceStock, fetchHistory, history,
    fetchDashboardStats, dashboardStats, fetchLowStockProducts, lowStockProducts,
    bulkImport,
  } = useInventoryStore()

  const [activeSection, setActiveSection] = useState('products')
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showStockModal, setShowStockModal] = useState(null) // { product, mode: 'add'|'reduce' }
  const [showImportModal, setShowImportModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(null)
  const [showLabelPrint, setShowLabelPrint] = useState(false)
  const [selectedForPrint, setSelectedForPrint] = useState([])
  const [toast, setToast] = useState(null)

  // Categories management state
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [editingCatId, setEditingCatId] = useState(null)
  const [editingCatName, setEditingCatName] = useState('')

  const searchRef = useRef(null)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchDashboardStats()
    fetchLowStockProducts()
    fetchHistory()
  }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Sync with Billing / POS menuStore
  const syncBillingStore = async () => {
    try {
      await useMenuStore.getState().fetchCategories?.()
    } catch (e) {
      console.warn('Sync billing store error:', e)
    }
  }

  // ── Export CSV ──
  const handleExportCSV = () => {
    if (products.length === 0) { showToast('No products to export', 'error'); return }
    const header = 'Name,Barcode,SKU,Category,PurchasePrice,SellingPrice,TrackInventory,CurrentStock,MinStock,Status'
    const rows = products.map(p =>
      [
        p.name, p.barcode, p.sku, p.category, p.purchase_price, p.selling_price,
        p.track_inventory ? 'TRUE' : 'FALSE',
        p.track_inventory ? p.current_stock : 'UNTRACKED',
        p.min_stock, p.status
      ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
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

  // ── Category Handlers ──
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    try {
      await createCategory(newCatName.trim())
      setNewCatName('')
      setShowAddCat(false)
      await syncBillingStore()
      showToast('Category created')
    } catch (e) { showToast(typeof e === 'string' ? e : 'Failed', 'error') }
  }

  const handleRenameCategory = async (cat) => {
    if (!editingCatName.trim() || editingCatName.trim() === cat.name) {
      setEditingCatId(null)
      return
    }
    try {
      await updateCategory(cat.id, editingCatName.trim(), cat.is_active, cat.sort_order)
      setEditingCatId(null)
      await syncBillingStore()
      showToast('Category renamed')
    } catch (e) { showToast(typeof e === 'string' ? e : 'Failed', 'error') }
  }

  const handleToggleCategory = async (cat) => {
    try {
      await updateCategory(cat.id, cat.name, !cat.is_active, cat.sort_order)
      await syncBillingStore()
    } catch (e) { showToast(typeof e === 'string' ? e : 'Failed', 'error') }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category? Items under this category will remain, but will lose this category tag.')) return
    try {
      await deleteCategory(id)
      await syncBillingStore()
      showToast('Category deleted')
    } catch (e) { showToast(typeof e === 'string' ? e : 'Failed', 'error') }
  }

  const handleSeedMenu = async () => {
    if (!confirm('This will load the default demo categories and products (Masala Chai, Burger, etc.). Continue?')) return
    try {
      await call('seed_default_menu')
      await fetchCategories()
      await fetchProducts()
      await fetchDashboardStats()
      await syncBillingStore()
      showToast('Default catalog loaded!')
    } catch (e) { showToast('Failed to seed menu', 'error') }
  }

  // ── Dashboard Section ──
  const DashboardSection = () => {
    const stats = dashboardStats || {}
    const statCards = [
      { label: 'Total Items', value: stats.total_products || 0, icon: '📦', color: '#6366f1' },
      { label: 'Active in Billing', value: stats.active_products || 0, icon: '✅', color: '#16a34a' },
      { label: 'Untracked (Made to Order)', value: stats.untracked_count || 0, icon: '♾️', color: '#0284c7' },
      { label: 'Low Stock Alerts', value: stats.low_stock || 0, icon: '⚠️', color: '#d97706' },
      { label: 'Out of Stock', value: stats.out_of_stock || 0, icon: '🚫', color: '#dc2626' },
      { label: 'Added Today', value: stats.added_today || 0, icon: '📥', color: '#0891b2' },
    ]

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-stone-800">📊 Inventory & Menu Overview</h2>
          <p className="text-xs text-stone-500 mt-0.5">Quick summary of products, stock levels, and alert status</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {statCards.map(c => (
            <div key={c.label} className="inv-stat-card bg-white p-4 rounded-xl border border-stone-200 shadow-sm" style={{ borderLeft: `4px solid ${c.color}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono" style={{ color: c.color }}>{c.value}</div>
                  <div className="text-xs text-stone-500 font-medium mt-0.5">{c.label}</div>
                </div>
                <span className="text-2xl opacity-70">{c.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Low Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <div>
            <div className="settings-section-title">⚠️ Low Stock Alerts (Needs Restocking)</div>
            <div className="settings-card bg-white rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-100 shadow-sm">
              {lowStockProducts.slice(0, 8).map(p => (
                <div key={p.id} className="settings-row p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-sm font-semibold text-stone-800 truncate">{p.name}</div>
                    <div className="text-xs text-stone-400">{p.category || 'General'}</div>
                  </div>
                  <span className="font-mono text-sm font-bold mr-4" style={{
                    color: p.current_stock === 0 ? '#dc2626' : '#d97706'
                  }}>
                    {p.current_stock === 0 ? '🚫 Out of Stock' : `⚠️ ${p.current_stock} left`}
                  </span>
                  <span className="text-xs text-stone-400 mr-4 font-mono">Min: {p.min_stock}</span>
                  <button
                    onClick={() => setShowStockModal({ product: p, mode: 'add' })}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    + Restock
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-sm text-orange-950">
            <span>💡</span> Unified Product & Inventory System
          </div>
          <p>
            • All products added here appear immediately in <strong>Billing (POS)</strong> under their respective categories.
          </p>
          <p>
            • <strong>Inventory tracking is optional</strong>: For cooked food, tea, or services, turn off inventory tracking to make them always available without stock limits.
          </p>
          <p>
            • For packaged items (bottles, packaged snacks), enable inventory tracking to auto-deduct stock on billing.
          </p>
        </div>
      </div>
    )
  }

  // ── Products Section ──
  const ProductsSection = () => (
    <div className="space-y-4">
      {/* Top Banner / Controls */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-stone-900">📋 Products & Menu Items</h2>
          <p className="text-xs text-stone-500">All items listed here are available for billing in POS</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingProduct(null); setShowProductModal(true) }}
            className="btn-primary text-sm py-2 px-4 shadow-sm"
          >
            + Add Product
          </button>
          <button onClick={() => setShowImportModal(true)} className="btn-secondary text-sm py-2 px-3">
            📥 Import
          </button>
          <button onClick={handleExportCSV} className="btn-secondary text-sm py-2 px-3">
            📤 Export
          </button>
          {selectedForPrint.length > 0 && (
            <button
              onClick={() => setShowLabelPrint(true)}
              className="btn-secondary text-sm py-2 px-3 text-purple-700 border-purple-300 bg-purple-50 hover:bg-purple-100"
            >
              🏷️ Print Labels ({selectedForPrint.length})
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
        <div className="pos-search flex-1">
          <span className="search-icon">🔍</span>
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products by name, barcode, SKU or category…"
            autoComplete="off" spellCheck="false"
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="input-premium text-sm py-2 w-48"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input-premium text-sm py-2 w-40"
        >
          <option value="">All Status</option>
          <option value="active">✅ Active</option>
          <option value="untracked">♾️ Untracked</option>
          <option value="low_stock">⚠️ Low Stock</option>
          <option value="out_of_stock">🚫 Out of Stock</option>
          <option value="disabled">⏸️ Disabled</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-center px-3 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-12">
                  <span title="Select for label printing">🏷️</span>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider">
                  Product Name & Category
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-36">
                  Barcode
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-28">
                  SKU
                </th>
                <th className="text-right px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-28">
                  Selling Price
                </th>
                <th className="text-center px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-32">
                  Stock Level
                </th>
                <th className="text-center px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-32">
                  Status
                </th>
                <th className="text-right px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-44">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <div className="text-4xl opacity-30 mb-2">📦</div>
                    <p className="text-sm font-semibold text-stone-600">
                      {searchQuery || filterCategory || filterStatus ? 'No products match your filters' : 'No products in inventory yet'}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      Click <span className="text-orange-600 font-semibold">+ Add Product</span> above to add your first billing item
                    </p>
                  </td>
                </tr>
              ) : products.map(p => {
                const isTracked = p.track_inventory === true
                return (
                  <tr
                    key={p.id}
                    className={`group hover:bg-orange-50/40 transition-colors ${
                      p.status === 'disabled' ? 'opacity-50 bg-stone-50' : ''
                    }`}
                  >
                    {/* Checkbox for label print */}
                    <td className="text-center px-3 py-3">
                      <input
                        type="checkbox"
                        checked={!!selectedForPrint.find(x => x.id === p.id)}
                        onChange={() => togglePrintSelect(p)}
                        title="Select for label print"
                        className="w-4 h-4 accent-purple-600 cursor-pointer rounded"
                      />
                    </td>

                    {/* Product & Category */}
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-stone-900 truncate max-w-xs" title={p.name}>
                        {p.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-medium truncate max-w-[140px]">
                          {p.category || 'General'}
                        </span>
                        {!isTracked && (
                          <span className="text-[10px] text-sky-600 font-medium font-mono" title="Stock tracking is disabled for this item">
                            ♾️ unlimited
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Barcode */}
                    <td className="px-4 py-3">
                      {p.barcode ? (
                        <span className="font-mono text-xs text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                          {p.barcode}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-300 font-mono">—</span>
                      )}
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3 font-mono text-xs text-stone-500 truncate" title={p.sku}>
                      {p.sku || '—'}
                    </td>

                    {/* Selling Price */}
                    <td className="px-4 py-3 text-right font-mono text-sm font-bold text-orange-600">
                      ₹{p.selling_price}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3 text-center">
                      {isTracked ? (
                        <span className={`font-mono text-sm font-bold px-2.5 py-0.5 rounded inline-block ${
                          p.current_stock <= 0
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : p.current_stock <= (p.min_stock || 5)
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          {p.current_stock}
                        </span>
                      ) : (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200" title="Unlimited stock">
                          ♾️ Untracked
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={p.status} trackInventory={isTracked} currentStock={p.current_stock} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowStockModal({ product: p, mode: 'add' }) }}
                          className="inv-action-btn green"
                          title="Add / Restock quantity"
                        >+</button>
                        {isTracked && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowStockModal({ product: p, mode: 'reduce' }) }}
                            className="inv-action-btn red"
                            title="Reduce stock"
                          >−</button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowAssignModal(p) }}
                          className="inv-action-btn gray"
                          title="Assign barcode"
                        >🔗</button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingProduct(p)
                            setShowProductModal(true)
                          }}
                          className="inv-action-btn blue font-semibold"
                          title="Edit / Update product"
                        >✏️</button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              await toggleProduct(p.id, p.status === 'disabled')
                              await syncBillingStore()
                              showToast(p.status === 'disabled' ? `"${p.name}" enabled for billing` : `"${p.name}" disabled from billing`)
                            } catch (err) {
                              showToast(typeof err === 'string' ? err : 'Toggle failed', 'error')
                            }
                          }}
                          className="inv-action-btn gray"
                          title={p.status === 'disabled' ? 'Enable for billing' : 'Disable from billing'}
                        >
                          {p.status === 'disabled' ? '▶' : '⏸'}
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (window.confirm(`Delete "${p.name}"? This removes it permanently from Inventory and Billing.`)) {
                              try {
                                await deleteProduct(p.id)
                                await fetchProducts()
                                await fetchCategories()
                                await syncBillingStore()
                                showToast(`"${p.name}" deleted successfully`)
                              } catch (err) {
                                showToast(typeof err === 'string' ? err : 'Failed to delete product', 'error')
                              }
                            }
                          }}
                          className="inv-action-btn red"
                          title="Delete product"
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // ── Categories Section (Managed directly in Inventory) ──
  const CategoriesSection = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-stone-900">🏷️ Categories Management</h2>
          <p className="text-xs text-stone-500">
            Categories organize your products on the Billing (POS) screen and in reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCat(true)}
            className="btn-primary text-sm py-2 px-4 shadow-sm"
          >
            + New Category
          </button>
          <button
            onClick={handleSeedMenu}
            className="btn-secondary text-sm py-2 px-3 text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100"
          >
            📦 Load Default Menu
          </button>
        </div>
      </div>

      {showAddCat && (
        <div className="bg-white p-4 rounded-xl border-2 border-orange-400 shadow-sm flex items-center gap-3">
          <input
            autoFocus
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            placeholder="Enter category name (e.g. Hot Drinks, Chinese, Bakery)…"
            className="input-premium text-sm flex-1"
          />
          <button onClick={handleAddCategory} className="btn-primary text-sm py-2 px-5">Save</button>
          <button onClick={() => { setShowAddCat(false); setNewCatName('') }} className="btn-secondary text-sm py-2 px-4">Cancel</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-center px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-14">#</th>
                <th className="text-left px-5 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider">Category Name</th>
                <th className="text-center px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-36">Products Count</th>
                <th className="text-center px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-36">Billing Tab</th>
                <th className="text-right px-6 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-44">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10">
                    <div className="text-3xl opacity-30 mb-2">🏷️</div>
                    <p className="text-sm font-medium text-stone-500">No categories created yet</p>
                    <p className="text-xs text-stone-400 mt-1">Add a category above or load demo menu</p>
                  </td>
                </tr>
              ) : categories.map((cat, idx) => {
                const itemCount = products.filter(p => (p.category || '').toLowerCase() === (cat?.name || '').toLowerCase()).length
                const isEditing = editingCatId === cat.id

                return (
                  <tr key={cat.id} className={`hover:bg-stone-50/80 transition-colors ${!cat.is_active ? 'opacity-50 bg-stone-50' : ''}`}>
                    <td className="text-center font-mono text-xs text-stone-400 px-4 py-3.5">{idx + 1}</td>
                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 max-w-xs">
                          <input
                            autoFocus
                            value={editingCatName}
                            onChange={e => setEditingCatName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleRenameCategory(cat)}
                            className="input-premium text-sm py-1 px-2 flex-1"
                          />
                          <button onClick={() => handleRenameCategory(cat)} className="text-xs font-bold text-green-600 px-2 py-1">✓</button>
                          <button onClick={() => setEditingCatId(null)} className="text-xs text-stone-400 px-1 py-1">✕</button>
                        </div>
                      ) : (
                        <div className="font-semibold text-sm text-stone-800">
                          {cat.name}
                        </div>
                      )}
                    </td>
                    <td className="text-center px-4 py-3.5">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </td>
                    <td className="text-center px-4 py-3.5">
                      <div className="inline-flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleCategory(cat)}
                          className={`toggle-switch ${cat.is_active ? 'active' : ''}`}
                          style={{ transform: 'scale(0.75)' }}
                        />
                        <span className="text-xs text-stone-500">{cat.is_active ? 'Shown' : 'Hidden'}</span>
                      </div>
                    </td>
                    <td className="text-right px-6 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name) }}
                          className="btn-secondary text-xs py-1.5 px-3"
                          title="Rename category"
                        >
                          ✏️ Rename
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-red-500 hover:text-red-700 text-xs px-2.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                          title="Delete category"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // ── History Section ──
  const HistorySection = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-stone-900">📜 Stock Audit Log</h2>
        <p className="text-xs text-stone-500">Complete chronological history of restocks, sales deductions, and adjustments</p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-44">Date & Time</th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-36">Action</th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-28">Barcode</th>
                <th className="text-right px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-24">Change</th>
                <th className="text-right px-4 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-24">Balance</th>
                <th className="text-right px-6 py-3 font-semibold text-xs text-stone-500 uppercase tracking-wider w-32">Bill / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-sm text-stone-400">
                    No stock history records yet
                  </td>
                </tr>
              ) : history.map(h => (
                <tr key={h.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-stone-500 whitespace-nowrap">
                    {new Date(h.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inv-action-badge">{h.action ? h.action.replace(/_/g, ' ') : 'Record'}</span>
                  </td>
                  <td className="px-4 py-3 text-stone-800 font-medium truncate max-w-xs" title={h.product_name}>
                    {h.product_name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">
                    {h.barcode || '—'}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${h.qty_changed > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {h.qty_changed > 0 ? '+' : ''}{h.qty_changed}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-stone-800">
                    {h.current_stock}
                  </td>
                  <td className="px-6 py-3 text-right text-xs text-stone-400 font-mono">
                    {h.invoice_number ? `#${h.invoice_number}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#f5f5f7' }}>
      {/* ═══════ Left Navigation Sidebar ═══════ */}
      <div className="w-56 flex flex-col glass-dark border-r border-stone-200 bg-white">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
            📦
          </div>
          <span className="font-heading font-bold text-stone-900 text-sm">Inventory & Menu</span>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {[
            { id: 'products', label: 'Products & Items', icon: '📋' },
            { id: 'categories', label: 'Categories', icon: '🏷️' },
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'history', label: 'Stock Audit Log', icon: '📜' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSection(s.id)
                if (s.id === 'history') fetchHistory()
                if (s.id === 'dashboard') { fetchDashboardStats(); fetchLowStockProducts(); fetchHistory() }
                if (s.id === 'products') { fetchProducts(); fetchCategories() }
                if (s.id === 'categories') { fetchCategories(); fetchProducts() }
              }}
              className={`w-full text-left px-4 py-3 text-sm font-medium transition-all flex items-center gap-2.5 border-l-4 ${
                activeSection === s.id
                  ? 'bg-orange-50/90 border-l-orange-500 text-orange-700 font-semibold'
                  : 'border-l-transparent text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span className="text-base">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-stone-200">
          <div className="text-[11px] text-stone-400 text-center">
            BillEasy Unified Inventory v2.0
          </div>
        </div>
      </div>

      {/* ═══════ Right Content Area ═══════ */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {activeSection === 'products' && <ProductsSection />}
          {activeSection === 'categories' && <CategoriesSection />}
          {activeSection === 'dashboard' && <DashboardSection />}
          {activeSection === 'history' && <HistorySection />}
        </div>
      </div>

      {/* ── Product Create / Edit Modal ── */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={async (data) => {
            try {
              if (editingProduct) {
                await updateProduct({ id: editingProduct.id, ...data })
                showToast(`"${data.name}" updated successfully`)
              } else {
                await createProduct(data)
                showToast(`"${data.name}" added to Inventory & Billing`)
              }
              await fetchProducts()
              await fetchCategories()
              await syncBillingStore()
              setShowProductModal(false)
              setEditingProduct(null)
            } catch (e) {
              showToast(typeof e === 'string' ? e : 'Save failed', 'error')
            }
          }}
          onClose={() => { setShowProductModal(false); setEditingProduct(null) }}
        />
      )}

      {/* ── Stock Adjustment Modal ── */}
      {showStockModal && (
        <StockModal
          product={showStockModal.product}
          mode={showStockModal.mode}
          onSave={async (qty, remarks) => {
            try {
              if (showStockModal.mode === 'add') await addStock(showStockModal.product.id, qty, remarks)
              else await reduceStock(showStockModal.product.id, qty, remarks)
              showToast(`Stock ${showStockModal.mode === 'add' ? 'added' : 'reduced'} successfully`)
              setShowStockModal(null)
              fetchDashboardStats()
              fetchLowStockProducts()
              await syncBillingStore()
            } catch (e) { showToast(typeof e === 'string' ? e : 'Failed', 'error') }
          }}
          onClose={() => setShowStockModal(null)}
        />
      )}

      {/* ── Import CSV Modal ── */}
      {showImportModal && (
        <ImportModal
          onImport={async (csvData) => {
            try {
              const result = await bulkImport(csvData)
              showToast(`Imported ${result.imported} products, skipped ${result.skipped}`)
              fetchProducts()
              fetchCategories()
              fetchDashboardStats()
              await syncBillingStore()
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
              await syncBillingStore()
            } catch (e) { showToast(typeof e === 'string' ? e : 'Failed', 'error') }
          }}
          onClose={() => setShowAssignModal(null)}
        />
      )}

      {/* ── Barcode Label Print Modal ── */}
      {showLabelPrint && selectedForPrint.length > 0 && (
        <BarcodeLabelPrint
          products={selectedForPrint}
          onClose={() => setShowLabelPrint(false)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold z-50 toast-enter ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>{toast.msg}</div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Product Create/Edit Modal with Optional Stock Tracking
// ═══════════════════════════════════════════════════════════
function ProductModal({ product, categories, onSave, onClose }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || (categories[0]?.name || 'General'),
    barcode: product?.barcode || '',
    sku: product?.sku || '',
    selling_price: product?.selling_price || '',
    purchase_price: product?.purchase_price || '',
    track_inventory: product?.track_inventory !== undefined ? Boolean(product.track_inventory) : false,
    current_stock: product?.current_stock >= 0 ? product.current_stock : 10,
    min_stock: product?.min_stock || 5,
    barcode_type: product?.barcode_type || 'internal',
    image_url: product?.image_url || '',
  })

  const [newCatInline, setNewCatInline] = useState(false)
  const [inlineCatName, setInlineCatName] = useState('')

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleGenerateBarcode = () => {
    // Generate clean 12-digit barcode
    const randomCode = '890' + Math.floor(100000000 + Math.random() * 900000000)
    set('barcode', randomCode)
  }

  const handleGenerateSku = () => {
    const prefix = form.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'SKU'
    const randomSuffix = Math.floor(100 + Math.random() * 900)
    set('sku', `${prefix}-${randomSuffix}`)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-xl w-full" onClick={e => e.stopPropagation()}>
        <div className="modal-header pb-3 border-b border-stone-200">
          <div>
            <h3 className="text-lg font-bold text-stone-900">{product ? 'Edit Product' : 'Add New Product'}</h3>
            <p className="text-xs text-stone-500 mt-0.5">Product will appear immediately on the billing screen</p>
          </div>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <div className="modal-body space-y-4 py-4 max-h-[75vh] overflow-y-auto">
          {/* Product Name & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="inv-label">Product Name *</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="input-premium text-sm"
                placeholder="e.g. Masala Chai, Veg Burger, Pepsi 250ml"
                autoFocus
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="inv-label mb-0">Category *</label>
                <button
                  type="button"
                  onClick={() => setNewCatInline(!newCatInline)}
                  className="text-[11px] text-orange-600 font-semibold hover:underline"
                >
                  {newCatInline ? 'Select Existing' : '+ New Category'}
                </button>
              </div>

              {newCatInline ? (
                <input
                  value={inlineCatName}
                  onChange={e => { setInlineCatName(e.target.value); set('category', e.target.value) }}
                  className="input-premium text-sm"
                  placeholder="Type new category name…"
                />
              ) : (
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className="input-premium text-sm"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  {categories.length === 0 && <option value="General">General</option>}
                </select>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="inv-label">Selling Price (₹) *</label>
              <input
                type="number" min="0" step="0.5"
                value={form.selling_price}
                onChange={e => set('selling_price', parseFloat(e.target.value) || '')}
                className="input-premium text-sm font-mono font-bold text-orange-600"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="inv-label">Purchase / Cost Price (₹)</label>
              <input
                type="number" min="0" step="0.5"
                value={form.purchase_price}
                onChange={e => set('purchase_price', parseFloat(e.target.value) || '')}
                className="input-premium text-sm font-mono"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* ════════ OPTIONAL INVENTORY TRACKING TOGGLE ════════ */}
          <div className="border border-stone-200 rounded-xl p-3.5 bg-stone-50/70">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-stone-900 block">
                  📦 Manage Inventory / Stock Tracking
                </span>
                <span className="text-xs text-stone-500">
                  {form.track_inventory
                    ? '🟢 Active: Stock will be tracked and auto-deducted on billing'
                    : '♾️ Untracked: Unlimited stock (best for kitchen items, tea, prepared food, services)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => set('track_inventory', !form.track_inventory)}
                className={`toggle-switch ${form.track_inventory ? 'active' : ''}`}
              />
            </div>

            {form.track_inventory ? (
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-stone-200">
                <div>
                  <label className="inv-label">
                    {product ? 'Current Stock Quantity' : 'Opening Stock Quantity'}
                  </label>
                  <input
                    type="number" min="0"
                    value={form.current_stock}
                    onChange={e => set('current_stock', parseInt(e.target.value) || 0)}
                    className="input-premium text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="inv-label">Min Stock (Alert Threshold)</label>
                  <input
                    type="number" min="0"
                    value={form.min_stock}
                    onChange={e => set('min_stock', parseInt(e.target.value) || 0)}
                    className="input-premium text-sm font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="mt-2.5 pt-2 border-t border-stone-200/80 text-[11px] text-sky-800 flex items-center gap-1.5">
                <span>ℹ️</span>
                <span>Shop owner has disabled stock tracking for this product. It will never go out of stock in Billing.</span>
              </div>
            )}
          </div>

          {/* Barcode & SKU */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="inv-label mb-0">Barcode</label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[11px] text-purple-600 font-semibold hover:underline"
                >
                  ⚡ Auto
                </button>
              </div>
              <input
                value={form.barcode}
                onChange={e => set('barcode', e.target.value)}
                className="input-premium text-sm font-mono"
                placeholder="Scan or auto-generate"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="inv-label mb-0">SKU</label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-[11px] text-purple-600 font-semibold hover:underline"
                >
                  ⚡ Auto
                </button>
              </div>
              <input
                value={form.sku}
                onChange={e => set('sku', e.target.value)}
                className="input-premium text-sm font-mono"
                placeholder="e.g. BEV-001"
              />
            </div>
          </div>

          {/* Barcode Type */}
          <div>
            <label className="inv-label">Barcode Type</label>
            <select
              value={form.barcode_type}
              onChange={e => set('barcode_type', e.target.value)}
              className="input-premium text-sm"
            >
              <option value="internal">Internal (Generated by BillEasy)</option>
              <option value="manufacturer">Manufacturer (Packaged barcode on product)</option>
            </select>
          </div>
        </div>

        <div className="modal-footer pt-3 border-t border-stone-200 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-5">Cancel</button>
          <button
            onClick={() => {
              if (!form.name.trim()) return
              onSave({
                ...form,
                selling_price: parseFloat(form.selling_price) || 0,
                purchase_price: parseFloat(form.purchase_price) || 0,
              })
            }}
            disabled={!form.name.trim() || form.selling_price === '' || isNaN(parseFloat(form.selling_price))}
            className="btn-primary text-sm py-2 px-6"
          >
            {product ? '✓ Save Changes' : '+ Create & Show in Billing'}
          </button>
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

  const isUntracked = product.track_inventory === false || product.current_stock < 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="font-bold text-stone-900">{mode === 'add' ? '📥 Add Stock' : '📤 Reduce Stock'}</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        <div className="modal-body space-y-3">
          <div className="text-sm text-stone-800 font-semibold">{product.name}</div>
          <div className="text-xs text-stone-500">
            Current Stock: <span className="font-mono font-bold text-stone-800">
              {isUntracked ? '♾️ Untracked (Will enable tracking)' : product.current_stock}
            </span>
          </div>
          <div>
            <label className="inv-label">Quantity</label>
            <input
              type="number" min="1"
              value={qty}
              onChange={e => setQty(parseInt(e.target.value) || 1)}
              className="input-premium text-sm font-mono"
              autoFocus
            />
          </div>
          <div>
            <label className="inv-label">Remarks (optional)</label>
            <input
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="input-premium text-sm"
              placeholder={mode === 'add' ? 'e.g. Restocked from supplier' : 'e.g. Damaged or returned'}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          <button onClick={() => onSave(qty, remarks)} className="btn-primary text-sm py-2 px-5">
            {mode === 'add' ? 'Add Stock' : 'Reduce Stock'}
          </button>
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
          <h3 className="font-bold text-stone-900">📥 Bulk Import Products</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        <div className="modal-body space-y-3">
          <div className="text-xs text-stone-500">
            CSV format: <code className="bg-stone-100 px-1 rounded text-[11px]">Name, Barcode, SKU, Category, PurchasePrice, SellingPrice, OpeningStock, MinStock, TrackInventory</code>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="btn-secondary text-xs py-2 px-4">📎 Choose CSV File</button>
          </div>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder="Name,Barcode,SKU,Category,PurchasePrice,SellingPrice,OpeningStock,MinStock,TrackInventory&#10;Masala Chai,,,Beverages,5,20,0,0,FALSE&#10;Vanilla Ice Cream,8901234567890,,Desserts,15,40,30,5,TRUE"
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
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-5">Close</button>
          <button onClick={handleImport} disabled={!csvText.trim()} className="btn-primary text-sm py-2 px-5">Import</button>
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
          <h3 className="font-bold text-stone-900">🔗 Assign Barcode</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        <div className="modal-body space-y-3">
          <div className="text-sm text-stone-800 font-semibold">{product.name}</div>
          <div className="text-xs text-stone-400">
            Current Barcode: <span className="font-mono font-bold text-stone-700">{product.barcode || 'None'}</span>
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
            💡 Scan with handheld barcode scanner or type manually and press Enter.
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          <button onClick={() => onSave(barcode.trim())} disabled={!barcode.trim()} className="btn-primary text-sm py-2 px-5">Assign</button>
        </div>
      </div>
    </div>
  )
}
