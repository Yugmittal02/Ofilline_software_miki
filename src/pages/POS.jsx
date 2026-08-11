import { useEffect, useState, useRef, useCallback } from 'react'
import { useMenuStore } from '../store/menuStore'
import { useCartStore } from '../store/cartStore'
import CategoryTabs from '../components/CategoryTabs'
import ItemCard from '../components/ItemCard'
import Cart from '../components/Cart'
import BarcodeInput from '../components/BarcodeInput'
import UnknownBarcodeModal from '../components/UnknownBarcode'

export default function POS() {
  const { categories, items, selectedCategoryId, fetchCategories, fetchItems, fetchAllItems } = useMenuStore()
  const addByBarcode = useCartStore(s => s.addByBarcode)
  const increment = useCartStore(s => s.increment)
  const [toast, setToast] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [scannerActive, setScannerActive] = useState(true)
  const [unknownBarcode, setUnknownBarcode] = useState(null) // barcode string or null
  const searchRef = useRef(null)

  useEffect(() => { fetchCategories() }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        setScannerActive(false)
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setSearchQuery('')
        searchRef.current?.blur()
        setScannerActive(true)
        setUnknownBarcode(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const handleCategorySelect = (catId) => { setSearchQuery(''); fetchItems(catId) }
  const handleSelectAll = () => { setSearchQuery(''); fetchAllItems() }

  // ── Barcode scan handler — uses new addByBarcode with full stock validation ──
  const handleBarcodeScan = useCallback(async (barcode) => {
    const result = await addByBarcode(barcode)

    if (result.ok) {
      showToast(`✓ ${result.product.name}`, 'success')
      return
    }

    // Handle specific error types
    switch (result.error) {
      case 'unknown':
        // Show interactive Unknown Barcode modal instead of just a toast
        setUnknownBarcode(barcode)
        break
      case 'out_of_stock':
        showToast(`${result.product.name} — Out of Stock`, 'error')
        break
      case 'max_stock':
        showToast(`${result.product.name} — Only ${result.available} in stock`, 'error')
        break
      default:
        showToast(`Scan error: ${result.error}`, 'error')
    }
  }, [addByBarcode])

  // When product is created/assigned from Unknown Barcode modal
  const handleUnknownResolved = (product) => {
    setUnknownBarcode(null)
    if (product) {
      const cartItem = {
        id: product.item_id || `p_${product.id}`,
        name: product.name,
        price: product.selling_price,
        barcode: product.barcode,
        product_id: product.id,
      }
      increment(cartItem)
      showToast(`✓ ${product.name} added`, 'success')
    }
  }

  // Filter active items by search query
  const activeItems = items
    .filter(i => i.is_active)
    .filter(i => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const matchName = i.name.toLowerCase().includes(q)
      const cat = categories.find(c => c.id === i.category_id)
      const matchCat = cat?.name?.toLowerCase().includes(q)
      return matchName || matchCat
    })

  return (
    <div className="flex h-full overflow-hidden">
      {/* ═══════ Left: Product Browsing (70%) ═══════ */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#fff7ed' }}>
        {/* Barcode Scanner Input — always at top */}
        <div className="px-4 pt-3 pb-1">
          <BarcodeInput
            onScan={handleBarcodeScan}
            disabled={!scannerActive || !!unknownBarcode}
            placeholder="Scan barcode or type product code…"
          />
        </div>

        {/* Category chips */}
        <CategoryTabs
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={handleCategorySelect}
          onSelectAll={handleSelectAll}
        />

        {/* Search bar */}
        <div className="px-4 pt-2 pb-2">
          <div className="pos-search">
            <span className="search-icon">🔍</span>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setScannerActive(false)}
              onBlur={() => setScannerActive(true)}
              placeholder="Search items…"
              autoComplete="off"
              spellCheck="false"
            />
            {searchQuery ? (
              <button
                onClick={() => { setSearchQuery(''); searchRef.current?.focus() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-100"
              >
                ✕
              </button>
            ) : (
              <span className="search-shortcut">/</span>
            )}
          </div>
        </div>

        {/* Item grid */}
        {activeItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2 opacity-40">{searchQuery ? '🔍' : '🍞'}</div>
              <p className="text-sm font-medium text-stone-500">
                {searchQuery ? 'No items match' : 'No items here'}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                {searchQuery ? 'Try different keywords' : 'Add items in Setup'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 pb-3">
            <div className="grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
              {activeItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════ Right: Bill Panel (30%) ═══════ */}
      <Cart
        onPrintSuccess={() => showToast('Bill printed!', 'success')}
        onPrintError={(e) => showToast(e ?? 'Print failed', 'error')}
      />

      {/* ── Unknown Barcode Modal ── */}
      {unknownBarcode && (
        <UnknownBarcodeModal
          barcode={unknownBarcode}
          onCreated={handleUnknownResolved}
          onClose={() => setUnknownBarcode(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm font-medium z-50 toast-enter ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
