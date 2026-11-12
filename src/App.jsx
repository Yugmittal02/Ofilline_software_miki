import { useState, useEffect } from 'react'
import { call } from './lib/tauri'
import { useSettingsStore } from './store/settingsStore'
import LicenseScreen from './pages/LicenseScreen'
import POS from './pages/POS'
import Setup from './pages/Setup'
import History from './pages/History'
import Recent from './pages/Recent'
import Inventory from './pages/Inventory'
import UpdateBanner from './components/UpdateBanner'
import PasswordGate from './components/PasswordGate'

export default function App() {
  const [licenseValid, setLicenseValid] = useState(null)
  const [activeTab, setActiveTab] = useState('pos')
  const [updateAvailable, setUpdateAvailable] = useState(null)
  const [pendingTab, setPendingTab] = useState(null)
  const [unlockedTabs, setUnlockedTabs] = useState(new Set())
  const { fetchSettings } = useSettingsStore()

  const PROTECTED_TABS = ['history', 'setup']

  useEffect(() => {
    let cancelled = false
    const tryGetLicense = async (retries = 10) => {
      for (let i = 0; i < retries; i++) {
        try {
          const status = await call('get_license_status')
          if (!cancelled) setLicenseValid(status.valid)
          return
        } catch (err) {
          console.warn(`[BillEasy] License check attempt ${i + 1}/${retries}:`, err)
          if (i < retries - 1) {
            await new Promise(r => setTimeout(r, 250))
          } else {
            if (!cancelled) setLicenseValid(false)
          }
        }
      }
      if (!cancelled) setLicenseValid(false)
    }
    tryGetLicense()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!licenseValid) return
    const revalidate = () => {
      call('revalidate_license_with_server')
        .then(status => { if (!status.valid) setLicenseValid(false) })
        .catch(() => {})
    }
    const initial = setTimeout(revalidate, 10_000)
    const interval = setInterval(revalidate, 5 * 60 * 1000)
    return () => { clearTimeout(initial); clearInterval(interval) }
  }, [licenseValid])

  useEffect(() => {
    if (licenseValid) fetchSettings()
  }, [licenseValid])

  useEffect(() => {
    if (!licenseValid) return
    const timer = setTimeout(async () => {
      try {
        const { check } = await import('@tauri-apps/plugin-updater')
        const update = await check()
        if (update?.available) setUpdateAvailable(update)
      } catch {}
    }, 5000)
    return () => clearTimeout(timer)
  }, [licenseValid])

  const handleTabClick = (tabId) => {
    if (PROTECTED_TABS.includes(tabId) && !unlockedTabs.has(tabId)) {
      setPendingTab(tabId)
      return
    }
    setActiveTab(tabId)
  }

  const handleLockAll = () => {
    setUnlockedTabs(new Set())
    // If currently on a protected tab, go back to POS
    if (PROTECTED_TABS.includes(activeTab)) {
      setActiveTab('pos')
    }
  }

  const hasUnlocked = unlockedTabs.size > 0

  if (licenseValid === null) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', background: '#fff7ed',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40,
            border: '4px solid #fb923c', borderTopColor: 'transparent',
            borderRadius: '50%', margin: '0 auto 12px',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: '#78716c', fontSize: 14, fontWeight: 500 }}>Starting BillEasy…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!licenseValid) {
    return <LicenseScreen onActivated={() => setLicenseValid(true)} />
  }

  const tabs = [
    { id: 'pos', label: 'Billing', icon: '🧾' },
    { id: 'recent', label: 'Recent', icon: '📊' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'setup', label: 'Setup', icon: '⚙️' },
    { id: 'history', label: 'History', icon: '📋' },
  ]

  return (
    <div className="flex flex-col h-full" style={{ background: '#fff7ed' }}>
      {updateAvailable && (
        <UpdateBanner update={updateAvailable} onDismiss={() => setUpdateAvailable(null)} />
      )}

      {/* ═══════ Compact Nav ═══════ */}
      <nav className="flex items-center bg-white border-b border-stone-100 px-4 py-0 relative z-10">
        <div className="flex items-center gap-2 mr-6">
          <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">₹</span>
          </div>
          <span className="font-heading font-bold text-stone-900 text-sm tracking-tight">BillEasy</span>
        </div>

        <div className="flex items-center">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
              {PROTECTED_TABS.includes(tab.id) && !unlockedTabs.has(tab.id) && (
                <span className="ml-1 text-[10px] opacity-50">🔒</span>
              )}
            </button>
          ))}
        </div>

        {/* Lock button — visible when any protected tab is unlocked */}
        {hasUnlocked && (
          <button
            onClick={handleLockAll}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-red-50 text-red-600 hover:bg-red-100 border border-red-200
              transition-all duration-200 hover:shadow-sm"
            title="Lock History & Setup tabs"
          >
            <span>🔐</span>
            <span>Lock</span>
          </button>
        )}
      </nav>

      <main className="flex-1 overflow-hidden">
        {activeTab === 'pos' && <POS />}
        {activeTab === 'recent' && <Recent />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'setup' && <Setup />}
        {activeTab === 'history' && <History />}
      </main>

      {/* ═══════ Password Gate Modal ═══════ */}
      {pendingTab && (
        <PasswordGate
          onUnlock={() => {
            setUnlockedTabs(prev => new Set(prev).add(pendingTab))
            setActiveTab(pendingTab)
            setPendingTab(null)
          }}
          onCancel={() => setPendingTab(null)}
        />
      )}
    </div>
  )
}
