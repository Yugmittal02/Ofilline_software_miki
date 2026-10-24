import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import './index.css'

// Catch any unhandled window errors before/outside React
window.addEventListener('error', (event) => {
  console.error('[BillEasy Global Error]:', event.error || event.message)
  const preload = document.getElementById('preload-spinner')
  if (preload) {
    preload.innerHTML = `
      <div style="text-align:center;max-width:500px;padding:24px;background:#fff;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.1);border:1px solid #fee2e2;">
        <div style="font-size:36px;margin-bottom:12px;">⚠️</div>
        <h2 style="color:#b91c1c;margin:0 0 8px;font-size:18px;font-family:system-ui,sans-serif;">Application Startup Error</h2>
        <p style="color:#6b7280;font-size:13px;margin:0 0 16px;word-break:break-word;">${event.message || 'Unknown error during startup'}</p>
        <button onclick="window.location.reload()" style="background:#ea580c;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">Reload App</button>
      </div>
    `
  }
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('[BillEasy Unhandled Rejection]:', event.reason)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

