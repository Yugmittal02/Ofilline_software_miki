import { useState } from 'react'
import { useInventoryStore } from '../store/inventoryStore'

/**
 * UnknownBarcodeModal — shown when a scanned barcode doesn't match any product.
 * Options:
 *   1. Quick-create a new product with this barcode
 *   2. Assign barcode to an existing product
 *   3. Dismiss
 */
export default function UnknownBarcodeModal({ barcode, onCreated, onClose }) {
  const { createProduct, products, fetchProducts, assignBarcode } = useInventoryStore()
  const [mode, setMode] = useState('choose') // 'choose' | 'create' | 'assign'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Quick Create ──
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')

  // ── Assign to existing ──
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)

  const handleCreate = async () => {
    if (!name.trim()) { setError('Product name is required'); return }
    setLoading(true)
    setError('')
    try {
      const product = await createProduct({
        name: name.trim(),
        barcode,
        sku: '',
        category: category.trim(),
        purchase_price: 0,
        selling_price: parseFloat(price) || 0,
        current_stock: 0,
        min_stock: 0,
        barcode_type: 'manufacturer',
        item_id: null,
      })
      onCreated?.(product)
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Creation failed')
    } finally { setLoading(false) }
  }

  const handleAssign = async () => {
    if (!selectedProduct) { setError('Select a product first'); return }
    setLoading(true)
    setError('')
    try {
      await assignBarcode(selectedProduct.id, barcode)
      // Re-fetch to get updated product with barcode
      const updated = await useInventoryStore.getState().lookupBarcode(barcode)
      onCreated?.(updated)
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Assignment failed')
    } finally { setLoading(false) }
  }

  const filteredProducts = products.filter(p => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  }).filter(p => !p.barcode || p.barcode === barcode) // Only show products without barcodes or same barcode

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔍 Unknown Barcode</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <div className="modal-body space-y-3">
          {/* Barcode display */}
          <div className="text-center py-2">
            <div className="text-xs text-stone-400 mb-1">Scanned barcode</div>
            <div className="font-mono text-lg font-bold text-stone-800 bg-stone-50 rounded-lg py-2 px-4 inline-block">
              {barcode}
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
          )}

          {/* ── Mode: Choose ── */}
          {mode === 'choose' && (
            <div className="space-y-2">
              <button
                onClick={() => setMode('create')}
                className="w-full text-left px-4 py-3 rounded-xl border border-stone-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all group"
              >
                <div className="text-sm font-semibold text-stone-800 group-hover:text-orange-700">➕ Create New Product</div>
                <div className="text-xs text-stone-400">Register this barcode as a new product</div>
              </button>
              <button
                onClick={() => { setMode('assign'); fetchProducts() }}
                className="w-full text-left px-4 py-3 rounded-xl border border-stone-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
              >
                <div className="text-sm font-semibold text-stone-800 group-hover:text-blue-700">🔗 Assign to Existing</div>
                <div className="text-xs text-stone-400">Link this barcode to a product already in inventory</div>
              </button>
              <button
                onClick={onClose}
                className="w-full text-center px-4 py-2.5 rounded-xl text-sm text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all"
              >
                Skip
              </button>
            </div>
          )}

          {/* ── Mode: Quick Create ── */}
          {mode === 'create' && (
            <div className="space-y-3">
              <div>
                <label className="inv-label">Product Name *</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  className="input-premium text-sm" placeholder="e.g. Pepsi 250ml"
                  autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="inv-label">Selling Price (₹)</label>
                  <input
                    type="number" min="0" step="0.5" value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="input-premium text-sm"
                  />
                </div>
                <div>
                  <label className="inv-label">Category</label>
                  <input
                    value={category} onChange={e => setCategory(e.target.value)}
                    className="input-premium text-sm" placeholder="e.g. Beverages"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Mode: Assign ── */}
          {mode === 'assign' && (
            <div className="space-y-3">
              <div>
                <label className="inv-label">Search product</label>
                <input
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="input-premium text-sm" placeholder="Type product name…"
                  autoFocus
                />
              </div>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-stone-100">
                {filteredProducts.length === 0 ? (
                  <div className="py-4 text-center text-xs text-stone-400">No unmapped products found</div>
                ) : filteredProducts.slice(0, 20).map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`w-full text-left px-3 py-2 text-sm border-b border-stone-50 transition-all ${
                      selectedProduct?.id === p.id
                        ? 'bg-orange-50 border-l-2 border-l-orange-500'
                        : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-medium text-stone-700">{p.name}</div>
                    <div className="text-xs text-stone-400">₹{p.selling_price} · SKU: {p.sku || '—'}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {mode !== 'choose' && (
          <div className="modal-footer">
            <button onClick={() => { setMode('choose'); setError('') }} className="btn-secondary text-sm py-2.5 px-5">← Back</button>
            <button
              onClick={mode === 'create' ? handleCreate : handleAssign}
              disabled={loading || (mode === 'create' && !name.trim()) || (mode === 'assign' && !selectedProduct)}
              className="btn-primary text-sm py-2.5 px-5"
            >
              {loading ? '…' : mode === 'create' ? 'Create & Add' : 'Assign & Add'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
