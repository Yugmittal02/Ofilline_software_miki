import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * BarcodeInput — always-focused invisible input that captures USB/Bluetooth HID scanner data.
 * Scanners behave like keyboards: they type the barcode string followed by Enter.
 * 
 * Props:
 *   onScan(barcode)   — called with the scanned barcode string
 *   disabled           — disables scanning
 *   placeholder        — visible placeholder text
 */
export default function BarcodeInput({ onScan, disabled = false, placeholder = 'Scan barcode…' }) {
  const inputRef = useRef(null)
  const [value, setValue] = useState('')
  const [flash, setFlash] = useState(false)
  const debounceRef = useRef(null)

  // Keep focus on the barcode input — refocus every 500ms if lost
  useEffect(() => {
    if (disabled) return
    const refocus = () => {
      const el = document.activeElement
      // Don't steal focus from other inputs/textareas/selects or modals
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
        if (el !== inputRef.current) return
      }
      inputRef.current?.focus()
    }
    refocus()
    const interval = setInterval(refocus, 500)
    return () => clearInterval(interval)
  }, [disabled])

  // Global keyboard listener: if user types a printable char while no input is focused, focus barcode field
  useEffect(() => {
    if (disabled) return
    const handler = (e) => {
      const el = document.activeElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return
      // F-keys or meta keys — ignore
      if (e.key.length > 1) return
      if (e.ctrlKey || e.altKey || e.metaKey) return
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [disabled])

  const handleSubmit = useCallback(() => {
    const barcode = value.trim().replace(/[\r\n]/g, '').replace(/[^\x20-\x7E]/g, '')
    if (!barcode) return

    // Visual flash feedback
    setFlash(true)
    setTimeout(() => setFlash(false), 150)

    onScan?.(barcode)
    setValue('')
  }, [value, onScan])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={`barcode-input-wrapper ${flash ? 'flash' : ''} ${disabled ? 'disabled' : ''}`}>
      <span className="barcode-icon">⊟</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        className="barcode-field"
        id="barcode-scanner-input"
      />
      {value && (
        <button
          onClick={() => { setValue(''); inputRef.current?.focus() }}
          className="barcode-clear"
        >✕</button>
      )}
      <span className="barcode-hint">
        <kbd>⏎</kbd> scan
      </span>
    </div>
  )
}
