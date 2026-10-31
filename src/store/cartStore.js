import { create } from 'zustand'
import { call } from '../lib/tauri'

export const useCartStore = create((set, get) => ({
  quantities: {},  // { [itemId]: count }
  items: {},       // { [itemId]: { id, name, price, barcode?, product_id?, track_inventory?, current_stock? } }

  increment: (item) => {
    const s = get()
    const isTracked = item.track_inventory !== undefined 
      ? Boolean(item.track_inventory) 
      : (item.current_stock != null && item.current_stock >= 0)
    const currentQty = s.quantities[item.id] ?? 0

    // Only limit quantity if item stock is actively tracked
    if (isTracked && item.current_stock >= 0 && currentQty >= item.current_stock) {
      return false
    }

    set({
      quantities: { ...s.quantities, [item.id]: currentQty + 1 },
      items: { ...s.items, [item.id]: item },
    })
    return true
  },

  decrement: (itemId) => set(s => {
    const newQty = (s.quantities[itemId] ?? 0) - 1
    const q = { ...s.quantities }
    if (newQty <= 0) delete q[itemId]
    else q[itemId] = newQty
    return { quantities: q }
  }),

  clear: () => set({ quantities: {}, items: {} }),

  // ── Barcode-aware add ──
  addByBarcode: async (barcode) => {
    try {
      const product = await call('lookup_barcode', { barcode })
      if (!product) return { ok: false, error: 'unknown', barcode }

      const isTracked = product.track_inventory !== undefined 
        ? Boolean(product.track_inventory) 
        : (product.current_stock != null && product.current_stock >= 0)

      // Stock validation (tracked items only)
      if (isTracked && (product.current_stock ?? 0) <= 0) {
        return { ok: false, error: 'out_of_stock', product }
      }

      const cartId = product.item_id || product.id
      const currentQty = get().quantities[cartId] ?? 0

      // Prevent adding more than available (if tracked)
      if (isTracked && product.current_stock > 0 && currentQty >= product.current_stock) {
        return { ok: false, error: 'max_stock', product, available: product.current_stock }
      }

      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.selling_price,
        barcode: product.barcode,
        product_id: product.id,
        track_inventory: isTracked,
        current_stock: product.current_stock,
      }
      get().increment(cartItem)
      return { ok: true, product }
    } catch (e) {
      return { ok: false, error: typeof e === 'string' ? e : 'lookup_failed' }
    }
  },

  // Check if adding 1 more of this item would exceed stock
  canAddMore: (itemId, maxStock, trackInventory) => {
    if (!trackInventory || maxStock < 0) return true // untracked
    const currentQty = get().quantities[itemId] ?? 0
    return currentQty < maxStock
  },

  getCartItems: () => {
    const s = get()
    return Object.entries(s.quantities)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = s.items[id] || s.items[Number(id)]
        if (!item) return null
        return { ...item, qty, total: item.price * qty }
      })
      .filter(Boolean)
  },

  getTotal: () => {
    return get().getCartItems().reduce((sum, item) => sum + item.total, 0)
  },
}))
