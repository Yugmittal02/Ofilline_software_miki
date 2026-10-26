import { useEffect, useState, useRef } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useCloudinaryStore } from '../store/cloudinaryStore'
import { call } from '../lib/tauri'

export default function Setup() {
  const { settings, fetchSettings, saveSettings, logoDataUri, fetchLogo, saveLogo, deleteLogo } = useSettingsStore()
  const { cloudName, uploadPreset, fetchConfig: fetchCloudinary, saveConfig: saveCloudinary } = useCloudinaryStore()

  const [testPrinting, setTestPrinting] = useState(false)
  const [toast, setToast] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [detectedPrinters, setDetectedPrinters] = useState([])
  const [loadingPrinters, setLoadingPrinters] = useState(false)
  const [localCloudName, setLocalCloudName] = useState('')
  const [localUploadPreset, setLocalUploadPreset] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchSettings()
    fetchLogo()
    fetchCloudinary()
    detectPrinters()
  }, [])

  useEffect(() => {
    setLocalCloudName(cloudName || '')
    setLocalUploadPreset(uploadPreset || '')
  }, [cloudName, uploadPreset])

  const detectPrinters = async () => {
    setLoadingPrinters(true)
    try {
      const raw = await call('list_printers')
      const printers = (raw || []).map(p => {
        if (typeof p === 'string') return { name: p, driver: '', port_name: '' }
        return { name: p?.name || 'Unknown', driver: p?.driver || '', port_name: p?.port_name || '' }
      })
      setDetectedPrinters(printers)
    } catch (e) {
      console.warn('Printer detection failed:', e)
      setDetectedPrinters([])
    } finally {
      setLoadingPrinters(false)
    }
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Print & Logo ──
  const handleTestPrint = async () => {
    setTestPrinting(true)
    try {
      await call('print_receipt', {
        orderId: 0,
        items: [{ item_id: 1, name: 'Test Item', price: 99, qty: 1 }],
        total: 99,
        shopName: settings.shop_name,
        shopAddress: settings.shop_address,
        billFooter: settings.bill_footer,
      })
      showToast('Test print sent!')
    } catch (e) {
      showToast(typeof e === 'string' ? e : 'Print failed', 'error')
    } finally { setTestPrinting(false) }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return }
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); return }
    setUploadingLogo(true)
    try {
      const reader = new FileReader()
      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => { resolve(reader.result.split(',')[1]) }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      await saveLogo(base64Data)
      showToast('Logo uploaded!')
    } catch (e) {
      showToast(typeof e === 'string' ? e : 'Logo upload failed', 'error')
    } finally {
      setUploadingLogo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteLogo = async () => {
    try { await deleteLogo(); showToast('Logo removed') }
    catch (e) { showToast(typeof e === 'string' ? e : 'Failed to remove logo', 'error') }
  }

  const handleSaveCloudinary = async () => {
    try {
      await saveCloudinary(localCloudName.trim(), localUploadPreset.trim())
      showToast('Cloudinary settings saved!')
    } catch (e) { showToast('Failed to save', 'error') }
  }

  return (
    <div className="flex h-full overflow-y-auto" style={{ background: '#f5f5f7' }}>
      <div className="max-w-3xl w-full mx-auto px-6 py-8 space-y-6">

        {/* Header banner */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">⚙️ Settings & Configuration</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Shop details, receipt customisation, thermal printer & cloud storage
            </p>
          </div>
          <div className="text-xs text-stone-500 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm">
            💡 Item & Category management is now in <span className="font-semibold text-orange-600">📦 Inventory</span>
          </div>
        </div>

        {/* ═══════════════ SHOP SETTINGS ═══════════════ */}
        <div>
          <div className="settings-section-title">Shop Information</div>
          <div className="settings-card">
            <div className="settings-row">
              <span className="text-sm text-gray-500 w-28 flex-shrink-0">Shop Name</span>
              <input
                value={settings.shop_name || ''}
                onChange={e => saveSettings({ shop_name: e.target.value })}
                className="input-premium text-sm flex-1"
                placeholder="My Shop"
              />
            </div>
            <div className="settings-row">
              <span className="text-sm text-gray-500 w-28 flex-shrink-0">Tagline</span>
              <input
                value={settings.shop_tagline || ''}
                onChange={e => saveSettings({ shop_tagline: e.target.value })}
                className="input-premium text-sm flex-1"
                placeholder="Crafted with Taste & Trust"
              />
            </div>
            <div className="settings-row">
              <span className="text-sm text-gray-500 w-28 flex-shrink-0">Address</span>
              <input
                value={settings.shop_address || ''}
                onChange={e => saveSettings({ shop_address: e.target.value })}
                className="input-premium text-sm flex-1"
                placeholder="Near Main Market, City"
              />
            </div>
            <div className="settings-row">
              <span className="text-sm text-gray-500 w-28 flex-shrink-0">Phone</span>
              <input
                value={settings.shop_phone || ''}
                onChange={e => saveSettings({ shop_phone: e.target.value })}
                className="input-premium text-sm flex-1"
                placeholder="+91 9XXXXXXXXX"
              />
            </div>
          </div>
        </div>

        {/* ═══════════════ RECEIPT SETTINGS ═══════════════ */}
        <div>
          <div className="settings-section-title">Receipt Settings</div>
          <div className="settings-card">
            <div className="settings-row">
              <span className="text-sm text-gray-500 w-28 flex-shrink-0">Bill Footer</span>
              <input
                value={settings.bill_footer || ''}
                onChange={e => saveSettings({ bill_footer: e.target.value })}
                className="input-premium text-sm flex-1"
                placeholder="Thank you ❤️"
              />
            </div>
            <div className="settings-row">
              <span className="text-sm text-gray-500 w-28 flex-shrink-0">GST %</span>
              <input
                type="number" min="0" max="28" step="0.5"
                value={settings.gst_percent || 0}
                onChange={e => saveSettings({ gst_percent: parseFloat(e.target.value) || 0 })}
                className="input-premium text-sm w-28"
                placeholder="5"
              />
            </div>
            <div className="settings-row">
              <span className="text-sm text-gray-500 w-28 flex-shrink-0">Payment Mode</span>
              <select
                value={settings.payment_mode || ''}
                onChange={e => saveSettings({ payment_mode: e.target.value })}
                className="input-premium text-sm flex-1"
              >
                <option value="">None</option>
                <option value="Cash">💵 Cash</option>
                <option value="UPI">📱 UPI</option>
                <option value="Card">💳 Card</option>
                <option value="Online">🌐 Online</option>
              </select>
            </div>

            {/* Logo */}
            <div className="settings-row items-start">
              <span className="text-sm text-gray-500 w-28 flex-shrink-0 mt-1">Receipt Logo</span>
              <div className="flex-1 flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoDataUri ? (
                    <img src={logoDataUri} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-300 text-xl">🖼️</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">Watermark on PDF • Header on thermal receipt</p>
                  <div className="flex gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      {uploadingLogo ? '⏳' : logoDataUri ? '🔄 Change' : '📤 Upload'}
                    </button>
                    {logoDataUri && (
                      <button onClick={handleDeleteLogo} className="text-red-500 hover:text-red-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">
                        🗑️ Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ PRINTER SETTINGS ═══════════════ */}
        <div>
          <div className="settings-section-title">Printer Configuration</div>
          <div className="settings-card">
            <div className="settings-row">
              <span className="text-sm text-gray-500 w-28 flex-shrink-0">Connection</span>
              <select
                value={settings.printer_type || 'usb'}
                onChange={e => saveSettings({ printer_type: e.target.value })}
                className="input-premium text-sm flex-1"
              >
                <option value="usb">🔌 USB Port</option>
                <option value="bluetooth">📶 Bluetooth (COM)</option>
                <option value="network">🌐 Network (IP)</option>
                <option value="name">🖨️ Windows Printer</option>
              </select>
            </div>

            <div className="settings-row">
              <span className="text-sm text-gray-500 w-28 flex-shrink-0">
                {settings.printer_type === 'bluetooth' ? 'COM Port'
                  : settings.printer_type === 'network' ? 'IP Address'
                  : settings.printer_type === 'name' ? 'Printer'
                  : 'USB Port'}
              </span>
              {settings.printer_type === 'name' && detectedPrinters.length > 0 ? (
                <select
                  value={settings.printer_name || ''}
                  onChange={e => saveSettings({ printer_name: e.target.value })}
                  className="input-premium text-sm flex-1"
                >
                  <option value="">— Select Printer —</option>
                  {detectedPrinters.map((p, i) => (
                    <option key={i} value={p.name}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={settings.printer_name || ''}
                  onChange={e => saveSettings({ printer_name: e.target.value })}
                  className="input-premium text-sm flex-1"
                  placeholder={
                    settings.printer_type === 'bluetooth' ? 'COM3'
                      : settings.printer_type === 'network' ? '192.168.1.100:9100'
                      : settings.printer_type === 'name' ? 'POS-58'
                      : 'USB001'
                  }
                />
              )}
            </div>

            <div className="settings-row">
              <span className="text-sm text-gray-500 w-28 flex-shrink-0">Auto-Cut</span>
              <button
                onClick={() => saveSettings({ has_cutter: !settings.has_cutter })}
                className={`toggle-switch ${settings.has_cutter ? 'active' : ''}`}
              />
              <span className="text-xs text-gray-400 ml-2">{settings.has_cutter ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>

          {/* Detected printers */}
          {detectedPrinters.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold text-blue-600">🖨️ Detected Printers ({detectedPrinters.length})</span>
                <button onClick={detectPrinters} disabled={loadingPrinters} className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                  {loadingPrinters ? '⏳' : '🔄 Refresh'}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {detectedPrinters.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => saveSettings({ printer_name: p.name, printer_type: 'name' })}
                    className={`card-interactive flex items-center gap-3 px-4 py-3 text-left text-xs ${
                      settings.printer_name === p.name && settings.printer_type === 'name' ? 'active' : ''
                    }`}
                  >
                    <span className="text-base">
                      {(p.name || '').toLowerCase().includes('pdf') ? '📄'
                        : (p.name || '').toLowerCase().includes('fax') ? '📠'
                        : (p.name || '').toLowerCase().includes('onenote') || (p.name || '').toLowerCase().includes('xps') ? '📝'
                        : '🖨️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">{p.name}</div>
                      <div className="text-[10px] text-gray-400 truncate">{p.driver} • {p.port_name}</div>
                    </div>
                    {settings.printer_name === p.name && settings.printer_type === 'name' && (
                      <span className="text-orange-500 font-bold">✓ Selected</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {detectedPrinters.length === 0 && !loadingPrinters && (
            <div className="mt-3 card-premium p-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">No printers detected</span>
              <button onClick={detectPrinters} className="text-xs text-orange-500 hover:text-orange-700 font-medium">
                🔍 Scan
              </button>
            </div>
          )}

          {loadingPrinters && detectedPrinters.length === 0 && (
            <div className="mt-3 card-premium p-4 flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Scanning for printers…</span>
            </div>
          )}

          {/* Test Print */}
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleTestPrint}
              disabled={testPrinting}
              className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2"
            >
              {testPrinting ? (
                <><div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Printing…</>
              ) : (
                <>🖨️ Test Print</>
              )}
            </button>
          </div>
        </div>

        {/* ═══════════════ CLOUDINARY SETTINGS ═══════════════ */}
        <div>
          <div className="settings-section-title">☁️ Product Images (Cloudinary)</div>
          <div className="settings-card">
            <div className="settings-row items-start">
              <span className="text-sm text-gray-500 w-28 flex-shrink-0 mt-2">Cloud Name</span>
              <div className="flex-1">
                <input
                  value={localCloudName}
                  onChange={e => setLocalCloudName(e.target.value)}
                  className="input-premium text-sm"
                  placeholder="your-cloud-name"
                />
                <p className="text-xs text-gray-400 mt-1">From Cloudinary Dashboard → Account Details</p>
              </div>
            </div>
            <div className="settings-row items-start">
              <span className="text-sm text-gray-500 w-28 flex-shrink-0 mt-2">Upload Preset</span>
              <div className="flex-1">
                <input
                  value={localUploadPreset}
                  onChange={e => setLocalUploadPreset(e.target.value)}
                  className="input-premium text-sm"
                  placeholder="billeasy-unsigned"
                />
                <p className="text-xs text-gray-400 mt-1">Settings → Upload → Add unsigned preset</p>
              </div>
            </div>
            <div className="settings-row justify-end">
              <button
                onClick={handleSaveCloudinary}
                className="btn-primary text-xs py-2 px-5"
              >
                Save Cloudinary Config
              </button>
            </div>
          </div>
          {!cloudName && (
            <div className="mt-2 px-1">
              <p className="text-xs text-amber-600">
                ⚠️ Configure Cloudinary to enable product image uploads in Inventory
              </p>
            </div>
          )}
        </div>

        <div className="h-6" />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium z-50 toast-enter ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
