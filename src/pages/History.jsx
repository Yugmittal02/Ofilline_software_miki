import { useEffect, useState, useMemo } from 'react'
import { call } from '../lib/tauri'
import ReceiptPreview from '../components/ReceiptPreview'

const PAGE_SIZE = 20

function getLocalDateStr(d = new Date()) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getOrderDateStr(createdAt) {
  if (!createdAt) return ''
  try {
    const s = String(createdAt).trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      if (s.includes('T') && (s.includes('Z') || /[+-]\d{2}:\d{2}$/.test(s))) {
        const d = new Date(s)
        if (!isNaN(d.getTime())) return getLocalDateStr(d)
      }
      return s.slice(0, 10)
    }
    const d = new Date(s)
    if (!isNaN(d.getTime())) return getLocalDateStr(d)
    return s.slice(0, 10)
  } catch {
    return String(createdAt).slice(0, 10)
  }
}

export default function History() {
  const [summary, setSummary] = useState(null)
  const [orders, setOrders] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [date, setDate] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [previewOrder, setPreviewOrder] = useState(null)
  const [settings, setSettings] = useState(null)
  const [dataInfo, setDataInfo] = useState(null)
  const [activeView, setActiveView] = useState('orders') // 'orders' | 'itemwise'

  // ── Date-wise Item Sales Filter State ──
  const [itemDateFilter, setItemDateFilter] = useState('today') // 'today' | 'yesterday' | '7days' | 'month' | 'all' | 'custom'
  const [customItemDate, setCustomItemDate] = useState(getLocalDateStr(new Date()))
  const [itemSearch, setItemSearch] = useState('')
  const [itemSort, setItemSort] = useState('revenue_desc') // 'revenue_desc' | 'qty_desc' | 'name_asc'

  useEffect(() => {
    loadSummary()
    loadOrders()
    loadSettings()
    loadDataInfo()
    loadAllOrders()
  }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const loadSettings = async () => {
    try { setSettings(await call('get_settings')) } catch (e) { console.error(e) }
  }

  const loadSummary = async () => {
    try { setSummary(await call('get_summary')) } catch (e) { console.error(e) }
  }

  const loadDataInfo = async () => {
    try { setDataInfo(await call('get_data_info')) } catch (e) { console.error(e) }
  }

  const loadAllOrders = async () => {
    try {
      const o = await call('get_orders', { date: null })
      const safe = (o || []).map(order => ({
        ...order,
        items: Array.isArray(order.items)
          ? order.items
          : (typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items) } catch { return [] } })() : [])
      }))
      setAllOrders(safe)
    } catch (e) { console.error(e) }
  }

  const loadOrders = async (selectedDate) => {
    setLoading(true)
    try {
      const d = selectedDate ?? date
      const o = await call('get_orders', { date: d || null })
      const safe = (o || []).map(order => ({
        ...order,
        items: Array.isArray(order.items)
          ? order.items
          : (typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items) } catch { return [] } })() : [])
      }))
      setOrders(safe)
      setPage(0)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleDateChange = (e) => {
    const val = e.target.value
    setDate(val)
    loadOrders(val)
    if (val) {
      setCustomItemDate(val)
      setItemDateFilter('custom')
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadSummary(),
        loadOrders(date),
        loadSettings(),
        loadDataInfo(),
        loadAllOrders(),
      ])
      showToast('Refreshed!')
    } catch {
      showToast('Refresh failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReprint = async (order) => {
    try {
      const s = settings || await call('get_settings')
      await call('print_receipt', {
        orderId: order.id, items: order.items, total: order.total,
        shopName: s.shop_name, shopAddress: s.shop_address, billFooter: s.bill_footer,
      })
      showToast('Receipt reprinted!')
    } catch (e) { showToast(typeof e === 'string' ? e : 'Reprint failed', 'error') }
  }

  const handlePdfPreview = async (order) => {
    if (!settings) {
      try { setSettings(await call('get_settings')) }
      catch (e) { console.warn(e) }
    }
    setPreviewOrder(order)
  }

  const handleOpenExcel = async () => {
    try {
      await call('open_orders_csv')
      showToast('Orders CSV exported!')
    } catch (e) {
      showToast(typeof e === 'string' ? e : 'Failed to export CSV', 'error')
    }
  }

  const formatTime = (dt) => {
    try {
      return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch { return '' }
  }

  const formatDate = (dt) => {
    try {
      return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    } catch { return '' }
  }

  const formatItems = (items) => (items || []).map(i => `${i.name} ×${i.qty}`).join(', ')
  const shortId = (id) => { const s = String(id); return s.length > 6 ? s.slice(-4) : s }

  const paged = orders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(orders.length / PAGE_SIZE)

  // ── Date-wise Orders Filter for Item Sales ──
  const selectedPeriodOrders = useMemo(() => {
    const today = getLocalDateStr(new Date())
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = getLocalDateStr(yesterday)
    const d7 = new Date(); d7.setDate(d7.getDate() - 7)
    const d7Str = getLocalDateStr(d7)
    const currentMonth = today.slice(0, 7) // 'YYYY-MM'

    return (allOrders || []).filter(o => {
      const orderDate = getOrderDateStr(o.created_at)
      if (!orderDate) return false
      switch (itemDateFilter) {
        case 'today':
          return orderDate === today
        case 'yesterday':
          return orderDate === yesterdayStr
        case '7days':
          return orderDate >= d7Str && orderDate <= today
        case 'month':
          return orderDate.startsWith(currentMonth)
        case 'custom':
          return orderDate === customItemDate
        case 'all':
        default:
          return true
      }
    })
  }, [allOrders, itemDateFilter, customItemDate])

  // ── Item-wise Aggregation ──
  const itemSales = useMemo(() => {
    const itemMap = {}
    selectedPeriodOrders.forEach(o => {
      let items = o.items || []
      if (typeof items === 'string') {
        try { items = JSON.parse(items) } catch { items = [] }
      }
      if (!Array.isArray(items)) items = []

      items.forEach(item => {
        const key = (item.name || '').trim() || 'Unknown'
        if (!itemMap[key]) {
          itemMap[key] = {
            name: key,
            qty: 0,
            revenue: 0,
            price: Number(item.price) || 0,
            billCount: 0,
          }
        }
        itemMap[key].qty += Number(item.qty) || 1
        itemMap[key].revenue += (Number(item.price) || 0) * (Number(item.qty) || 1)
        itemMap[key].billCount += 1
      })
    })

    let list = Object.values(itemMap)

    if (itemSearch.trim()) {
      const q = itemSearch.toLowerCase().trim()
      list = list.filter(i => (i.name || '').toLowerCase().includes(q))
    }

    if (itemSort === 'qty_desc') {
      list.sort((a, b) => b.qty - a.qty)
    } else if (itemSort === 'name_asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    } else {
      // default: revenue_desc
      list.sort((a, b) => b.revenue - a.revenue)
    }

    return list
  }, [selectedPeriodOrders, itemSearch, itemSort])

  const totalPeriodQty = useMemo(() => itemSales.reduce((s, i) => s + i.qty, 0), [itemSales])
  const totalPeriodRevenue = useMemo(() => itemSales.reduce((s, i) => s + i.revenue, 0), [itemSales])
  const topProduct = itemSales[0] || null

  const getPeriodLabel = () => {
    const today = new Date()
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    switch (itemDateFilter) {
      case 'today':
        return `Today · ${today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
      case 'yesterday':
        return `Yesterday · ${yesterday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
      case '7days':
        return 'Last 7 Days'
      case 'month':
        return `This Month · ${today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`
      case 'custom':
        return customItemDate ? `Date: ${new Date(customItemDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Selected Date'
      case 'all':
        return 'All Time History'
      default:
        return 'Selected Period'
    }
  }

  const handleExportItemSalesCsv = () => {
    if (!itemSales.length) {
      showToast('No sales data to export', 'error')
      return
    }
    let csv = 'Rank,Item Name,Unit Price (Rs),Quantity Sold,Total Revenue (Rs),Revenue Share (%)\n'
    itemSales.forEach((it, idx) => {
      const share = totalPeriodRevenue > 0 ? ((it.revenue / totalPeriodRevenue) * 100).toFixed(1) : '0'
      csv += `${idx + 1},"${(it.name || '').replace(/"/g, '""')}",${it.price || 0},${it.qty},${it.revenue},${share}%\n`
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BillEasy_Item_Sales_${itemDateFilter}_${getLocalDateStr(new Date())}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Item sales exported to CSV!')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#fff7ed' }}>
      {/* ═══ Summary Bar ═══ */}
      <div className="bg-white border-b border-stone-100 px-6 py-4">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Today */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl px-5 py-3 border border-orange-100">
            <div className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">Today's Revenue</div>
            <div className="font-mono text-2xl font-bold text-stone-900">
              ₹{(summary?.today_total ?? 0).toFixed(0)}
            </div>
            <div className="text-xs text-stone-400">{summary?.today_count ?? 0} bills · {summary?.today_count ? 'active today' : 'ready for sales'}</div>
          </div>

          {/* This Week */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl px-5 py-3 border border-blue-100">
            <div className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">This Week</div>
            <div className="font-mono text-xl font-bold text-stone-700">
              ₹{(summary?.week_total ?? 0).toFixed(0)}
            </div>
            <div className="text-xs text-stone-400">{summary?.week_count ?? 0} bills</div>
          </div>

          {/* All Time */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl px-5 py-3 border border-emerald-100">
            <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">All Time</div>
            <div className="font-mono text-xl font-bold text-stone-700">
              ₹{(summary?.total_sales ?? 0).toFixed(0)}
            </div>
            <div className="text-xs text-stone-400">{summary?.total_orders ?? 0} bills</div>
          </div>

          {/* Top Controls */}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
              title="Refresh sales history"
            >
              🔄 Refresh
            </button>

            <label className="text-sm text-stone-500 font-medium">Filter Date:</label>
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
              className="input-premium text-sm py-2 px-3 w-auto"
            />
            {date && (
              <button
                onClick={() => { setDate(''); loadOrders('') }}
                className="text-xs text-stone-400 hover:text-stone-600 underline"
              >
                Clear
              </button>
            )}

            <button
              onClick={handleOpenExcel}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              title="Export all orders to CSV"
            >
              <span className="text-base">📊</span> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Navigation Tabs ═══ */}
      <div className="bg-white border-b border-stone-100 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('orders')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeView === 'orders'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <span>📋</span>
            <span>Order History</span>
            <span className="text-xs font-mono ml-1 px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView('itemwise')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeView === 'itemwise'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <span>📊</span>
            <span>Date-wise Item Sales</span>
            <span className="text-xs font-mono ml-1 px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
              {totalPeriodQty} pcs
            </span>
          </button>
        </div>

        {activeView === 'itemwise' && itemSales.length > 0 && (
          <button
            onClick={handleExportItemSalesCsv}
            className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg border border-orange-200 transition-colors"
          >
            <span>📥</span> Export Item Sales CSV
          </button>
        )}
      </div>

      {/* ═══ Tab Content ═══ */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'itemwise' ? (
          /* ═════════════════════════════════════════════════════════════
             ITEM-WISE SALES VIEW (Date-wise Analytics & Breakdown)
             ═════════════════════════════════════════════════════════════ */
          <div className="max-w-4xl mx-auto px-6 py-5 space-y-4">
            {/* Date Filtering Bar */}
            <div className="card-premium p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 mr-1">Period:</span>
                  {[
                    { id: 'today', label: '📅 Today' },
                    { id: 'yesterday', label: '⏪ Yesterday' },
                    { id: '7days', label: '🗓️ 7 Days' },
                    { id: 'month', label: '📆 This Month' },
                    { id: 'all', label: '♾️ All Time' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setItemDateFilter(tab.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        itemDateFilter === tab.id
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Specific Custom Date Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-stone-500">Custom Date:</span>
                  <input
                    type="date"
                    value={customItemDate}
                    onChange={(e) => {
                      setCustomItemDate(e.target.value)
                      setItemDateFilter('custom')
                    }}
                    className={`input-premium text-xs py-1.5 px-2.5 w-auto ${
                      itemDateFilter === 'custom' ? 'border-orange-400 ring-2 ring-orange-200' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Filter & Search Controls */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-100 flex-wrap">
                <div className="pos-search flex-1 min-w-[220px]">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    placeholder="Search product name in sales…"
                    className="text-xs"
                  />
                  {itemSearch && (
                    <button
                      onClick={() => setItemSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400 font-medium">Sort by:</span>
                  <select
                    value={itemSort}
                    onChange={e => setItemSort(e.target.value)}
                    className="input-premium text-xs py-1.5 px-2.5 w-auto"
                  >
                    <option value="revenue_desc">💰 Highest Sales (Revenue)</option>
                    <option value="qty_desc">📦 Most Pieces Sold (Qty)</option>
                    <option value="name_asc">🔤 Product Name (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Performance KPI Highlights */}
            <div className="grid grid-cols-4 gap-3">
              <div className="card-premium p-3.5 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-85">Total Sales Revenue</div>
                <div className="font-mono text-2xl font-bold mt-0.5">₹{totalPeriodRevenue.toFixed(0)}</div>
                <div className="text-[11px] opacity-80 mt-0.5 truncate">{getPeriodLabel()}</div>
              </div>

              <div className="card-premium p-3.5 bg-white border border-stone-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Pieces Sold</div>
                <div className="font-mono text-2xl font-bold text-stone-900 mt-0.5">{totalPeriodQty} <span className="text-xs text-stone-400 font-sans font-normal">pcs</span></div>
                <div className="text-[11px] text-stone-400 mt-0.5">{selectedPeriodOrders.length} bills in period</div>
              </div>

              <div className="card-premium p-3.5 bg-white border border-stone-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Unique Items Sold</div>
                <div className="font-mono text-2xl font-bold text-stone-900 mt-0.5">{itemSales.length} <span className="text-xs text-stone-400 font-sans font-normal">products</span></div>
                <div className="text-[11px] text-stone-400 mt-0.5">varieties moved</div>
              </div>

              <div className="card-premium p-3.5 bg-white border border-stone-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-orange-500">🏆 Top Selling Item</div>
                <div className="font-heading font-bold text-stone-900 text-sm mt-1 truncate" title={topProduct?.name || 'None'}>
                  {topProduct ? topProduct.name : '—'}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  {topProduct ? `${topProduct.qty} sold · ₹${topProduct.revenue.toFixed(0)}` : 'No sales in period'}
                </div>
              </div>
            </div>

            {/* Sales Table */}
            {itemSales.length === 0 ? (
              <div className="card-premium p-12 text-center">
                <div className="text-4xl mb-2 opacity-30">📊</div>
                <p className="text-stone-600 font-medium">No sales recorded for this period</p>
                <p className="text-xs text-stone-400 mt-1">
                  {itemSearch ? 'Try a different search keyword' : 'Select another date or generate bills to view sales'}
                </p>
              </div>
            ) : (
              <div className="card-premium overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-stone-50/70 border-b border-stone-100 flex items-center justify-between">
                  <div className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    {getPeriodLabel()} — Product Breakdown
                  </div>
                  <div className="text-xs text-stone-400 font-medium">
                    Showing {itemSales.length} items
                  </div>
                </div>

                <table className="w-full text-sm">
                  <thead className="bg-white border-b border-stone-100">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-stone-400 text-xs uppercase tracking-wide w-12">#</th>
                      <th className="text-left px-4 py-3 font-semibold text-stone-400 text-xs uppercase tracking-wide">Product Name</th>
                      <th className="text-center px-4 py-3 font-semibold text-stone-400 text-xs uppercase tracking-wide">Rate</th>
                      <th className="text-center px-4 py-3 font-semibold text-stone-400 text-xs uppercase tracking-wide">Qty Sold</th>
                      <th className="text-right px-4 py-3 font-semibold text-stone-400 text-xs uppercase tracking-wide">Sales Generated</th>
                      <th className="text-left px-5 py-3 font-semibold text-stone-400 text-xs uppercase tracking-wide w-36">Sales Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50 bg-white">
                    {itemSales.map((item, idx) => {
                      const sharePercent = totalPeriodRevenue > 0
                        ? Math.min(100, Math.round((item.revenue / totalPeriodRevenue) * 100))
                        : 0

                      return (
                        <tr key={item.name} className="hover:bg-orange-50/40 transition-colors">
                          <td className="px-5 py-3 font-mono text-xs text-stone-400">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-stone-900">{item.name}</div>
                            <div className="text-[11px] text-stone-400">In {item.billCount} bill{item.billCount !== 1 ? 's' : ''}</div>
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-stone-600">
                            ₹{item.price}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center bg-orange-100 text-orange-700 font-mono font-bold text-xs px-2.5 py-1 rounded-full shadow-xs">
                              {item.qty} pcs
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-stone-900 text-sm">
                            ₹{item.revenue.toFixed(0)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all"
                                  style={{ width: `${Math.max(4, sharePercent)}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs font-semibold text-stone-500 w-9 text-right">
                                {sharePercent}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-orange-50 to-amber-50 border-t-2 border-orange-200">
                    <tr>
                      <td className="px-5 py-3.5" colSpan="2">
                        <span className="font-bold text-stone-800 text-sm">
                          Total ({itemSales.length} products)
                        </span>
                      </td>
                      <td></td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-orange-700 text-sm">
                        {totalPeriodQty} pcs
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-xl text-orange-700">
                        ₹{totalPeriodRevenue.toFixed(0)}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-stone-500">
                        100% total sales
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════════════
             ORDER HISTORY TABLE VIEW
             ═════════════════════════════════════════════════════════════ */
          loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-7 h-7 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="text-4xl mb-2 opacity-30">📋</div>
                <p className="text-stone-400">No bills found{date ? ` for ${date}` : ''}</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white border-b border-stone-100 sticky top-0 shadow-xs z-10">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-stone-400 text-xs uppercase tracking-wide">Bill #</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-400 text-xs uppercase tracking-wide">Date & Time</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-400 text-xs uppercase tracking-wide">Items Summary</th>
                  <th className="text-right px-4 py-3 font-medium text-stone-400 text-xs uppercase tracking-wide">Bill Total</th>
                  <th className="text-center px-4 py-3 font-medium text-stone-400 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 bg-white">
                {paged.map(order => (
                  <tr key={order.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-stone-500 text-xs font-semibold">
                      #{shortId(order.id)}
                    </td>
                    <td className="px-4 py-3.5 text-stone-600 whitespace-nowrap text-xs">
                      <span className="font-medium text-stone-800">{formatDate(order.created_at)}</span>
                      <span className="text-stone-400 ml-1.5">{formatTime(order.created_at)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-stone-700 max-w-sm truncate" title={formatItems(order.items)}>
                      {formatItems(order.items)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-stone-900 text-sm">
                      ₹{(order.total || 0).toFixed(0)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleReprint(order)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
                          title="Reprint receipt via thermal printer"
                        >
                          🖨️ Reprint
                        </button>
                        <button
                          onClick={() => handlePdfPreview(order)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 transition-colors"
                          title="Preview bill or print to PDF"
                        >
                          📄 PDF Preview
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Pagination for Orders */}
      {activeView === 'orders' && totalPages > 1 && (
        <div className="bg-white border-t border-stone-100 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-stone-400">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, orders.length)} of {orders.length} bills
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {previewOrder && (
        <ReceiptPreview
          orderId={previewOrder.id}
          items={previewOrder.items || []}
          total={previewOrder.total || 0}
          shopName={settings?.shop_name || 'BillEasy Store'}
          shopAddress={settings?.shop_address || ''}
          billFooter={settings?.bill_footer || ''}
          onClose={() => setPreviewOrder(null)}
        />
      )}

      {/* Notification Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm font-medium z-50 toast-enter ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
