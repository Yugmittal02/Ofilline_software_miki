import { create } from 'zustand'
import { call } from '../lib/tauri'

export const useInventoryStore = create((set, get) => ({
  products: [],
  history: [],
  dashboardStats: null,
  lowStockProducts: [],
  loading: false,
  searchQuery: '',
  filterCategory: '',
  filterStatus: '',

  // ── Product CRUD ──
  fetchProducts: async () => {
    set({ loading: true })
    try {
      const { searchQuery, filterCategory, filterStatus } = get()
      const products = await call('get_products', {
        search: searchQuery || null,
        category: filterCategory || null,
        status: filterStatus || null,
      })
      set({ products, loading: false })
    } catch (e) {
      console.error('fetchProducts:', e)
      set({ loading: false })
    }
  },

  setSearchQuery: (q) => { set({ searchQuery: q }); get().fetchProducts() },
  setFilterCategory: (c) => { set({ filterCategory: c }); get().fetchProducts() },
  setFilterStatus: (s) => { set({ filterStatus: s }); get().fetchProducts() },

  createProduct: async (data) => {
    const pPrice = parseFloat(data.purchase_price ?? data.purchasePrice ?? 0) || 0
    const sPrice = parseFloat(data.selling_price ?? data.sellingPrice ?? 0) || 0
    const cStock = parseInt(data.current_stock ?? data.currentStock ?? 0) || 0
    const mStock = parseInt(data.min_stock ?? data.minStock ?? 0) || 0
    const bType = String(data.barcode_type ?? data.barcodeType ?? 'internal').trim()
    const iId = data.item_id ?? data.itemId ?? null

    const payload = {
      name: String(data.name || '').trim(),
      barcode: String(data.barcode || '').trim(),
      sku: String(data.sku || '').trim(),
      category: String(data.category || '').trim(),
      purchasePrice: pPrice,
      purchase_price: pPrice,
      sellingPrice: sPrice,
      selling_price: sPrice,
      currentStock: cStock,
      current_stock: cStock,
      minStock: mStock,
      min_stock: mStock,
      barcodeType: bType,
      barcode_type: bType,
      itemId: iId,
      item_id: iId,
    }
    const product = await call('create_product', payload)
    await get().fetchProducts()
    return product
  },

  updateProduct: async (data) => {
    const pPrice = parseFloat(data.purchase_price ?? data.purchasePrice ?? 0) || 0
    const sPrice = parseFloat(data.selling_price ?? data.sellingPrice ?? 0) || 0
    const mStock = parseInt(data.min_stock ?? data.minStock ?? 0) || 0
    const iId = data.item_id ?? data.itemId ?? null

    const payload = {
      id: Number(data.id),
      name: String(data.name || '').trim(),
      barcode: String(data.barcode || '').trim(),
      sku: String(data.sku || '').trim(),
      category: String(data.category || '').trim(),
      purchasePrice: pPrice,
      purchase_price: pPrice,
      sellingPrice: sPrice,
      selling_price: sPrice,
      minStock: mStock,
      min_stock: mStock,
      itemId: iId,
      item_id: iId,
    }
    const product = await call('update_product', payload)
    await get().fetchProducts()
    return product
  },

  deleteProduct: async (id) => {
    await call('delete_product', { id: Number(id) })
    await get().fetchProducts()
  },

  toggleProduct: async (id, enabled) => {
    await call('toggle_product', { id: Number(id), enabled: Boolean(enabled) })
    await get().fetchProducts()
  },

  // ── Barcode ──
  lookupBarcode: async (barcode) => {
    return await call('lookup_barcode', { barcode: String(barcode).trim() })
  },

  assignBarcode: async (productId, barcode) => {
    await call('assign_barcode', { id: Number(productId), barcode: String(barcode).trim() })
    await get().fetchProducts()
  },

  // ── Stock ──
  addStock: async (id, qty, remarks = '') => {
    const product = await call('add_stock', { id, qty, remarks })
    await get().fetchProducts()
    return product
  },

  reduceStock: async (id, qty, remarks = '') => {
    const product = await call('reduce_stock', { id, qty, remarks })
    await get().fetchProducts()
    return product
  },

  deductInventory: async (items, invoiceNumber) => {
    await call('deduct_inventory', { items, invoiceNumber: String(invoiceNumber) })
  },

  validateCartStock: async (items) => {
    await call('validate_cart_stock', { items })
  },

  // ── History & Dashboard ──
  fetchHistory: async (productId = null) => {
    try {
      const history = await call('get_inventory_history', {
        productId: productId ?? null,
        limit: 100,
      })
      set({ history })
    } catch (e) {
      console.error('fetchHistory:', e)
    }
  },

  fetchDashboardStats: async () => {
    try {
      const stats = await call('get_dashboard_stats')
      set({ dashboardStats: stats })
    } catch (e) {
      console.error('fetchDashboardStats:', e)
    }
  },

  fetchLowStockProducts: async () => {
    try {
      const products = await call('get_low_stock_products')
      set({ lowStockProducts: products })
    } catch (e) {
      console.error('fetchLowStockProducts:', e)
    }
  },

  // ── Bulk Import ──
  bulkImport: async (csvData) => {
    return await call('bulk_import_products', { csvData })
  },
}))
