import { useEffect, useState } from 'react'
import { call } from '../lib/tauri'
import { useSettingsStore } from '../store/settingsStore'
import ReceiptPreview from '../components/ReceiptPreview'

export default function Recent() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [previewOrder, setPreviewOrder] = useState(null)
  const { settings, fetchSettings } = useSettingsStore()

  useEffect(() => { loadRecent(); fetchSettings() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const loadRecent = async () => {
    setLoading(true)
    try {
      const o = await call('get_orders', { date: null })
      setOrders((o || []).slice(0, 10))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
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

  const shortId = (id) => {
    const s = String(id)
    return s.length > 6 ? s.slice(-4) : s
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#fff7ed' }}>
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-heading text-xl font-bold text-stone-900">Recent Bills</h1>
            <p className="text-sm text-stone-400 mt-0.5">Last 10 transactions</p>
          </div>
          <button onClick={loadRecent} className="btn-secondary text-sm px-4 py-2">🔄 Refresh</button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <div className="text-4xl mb-2 opacity-30">📋</div>
            <p className="text-stone-500 font-medium">No transactions yet</p>
            <p className="text-xs text-stone-400 mt-1">Generated bills will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, idx) => (
              <div key={order.id} className="card-premium p-4 animate-scale-up" style={{ animationDelay: `${idx * 40}ms` }}>
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-sm">#{shortId(order.id)}</span>
                    </div>
                    <div>
                      <div className="font-heading font-semibold text-stone-900 text-sm">Bill #{shortId(order.id)}</div>
                      <div className="text-xs text-stone-400">{formatDate(order.created_at)} · {formatTime(order.created_at)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xl text-stone-900">₹{(order.total || 0).toFixed(0)}</div>
                    <div className="text-[10px] text-stone-400">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</div>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-stone-50 rounded-xl p-3 mb-3">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-0.5">
                      <span className="text-stone-600">{item.name} <span className="text-stone-400">×{item.qty}</span></span>
                      <span className="font-mono text-stone-600">₹{((item.price || 0) * (item.qty || 1)).toFixed(0)}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReprint(order)}
                    className="flex-1 text-xs font-semibold text-orange-600 hover:text-orange-700 py-2 text-center rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
                  >
                    🖨️ Thermal Reprint
                  </button>
                  <button
                    onClick={() => setPreviewOrder(order)}
                    className="flex-1 text-xs font-semibold text-stone-600 hover:text-stone-800 py-2 text-center rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors"
                  >
                    📄 PDF / Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

      {toast && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm font-medium z-50 toast-enter ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
