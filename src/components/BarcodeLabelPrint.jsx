import { useState, useRef } from 'react'

/**
 * BarcodeLabelPrint — renders printable barcode labels for selected products.
 * Uses the browser print API to generate adhesive-style labels with:
 *   - Product name
 *   - Price
 *   - Barcode number (human-readable)
 *   - Code128-style barcode visual (CSS-only)
 */
export default function BarcodeLabelPrint({ products, onClose }) {
  const [labelSize, setLabelSize] = useState('medium') // 'small' | 'medium' | 'large'
  const [showPrice, setShowPrice] = useState(true)
  const [copies, setCopies] = useState(1)
  const printRef = useRef(null)

  const sizes = {
    small:  { w: 140, h: 70,  nameSz: 9,  barSz: 8,  priceSz: 10 },
    medium: { w: 200, h: 100, nameSz: 11, barSz: 10, priceSz: 13 },
    large:  { w: 280, h: 130, nameSz: 13, barSz: 12, priceSz: 16 },
  }

  const sz = sizes[labelSize]

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank', 'width=800,height=600')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Barcode Labels</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; }
        .labels-grid {
          display: flex; flex-wrap: wrap; gap: 4px; padding: 8px;
        }
        .label {
          width: ${sz.w}px; height: ${sz.h}px;
          border: 1px dashed #ccc; border-radius: 4px;
          padding: 6px 8px;
          display: flex; flex-direction: column;
          justify-content: space-between; align-items: center;
          page-break-inside: avoid;
        }
        .label-name {
          font-size: ${sz.nameSz}px; font-weight: 700;
          text-align: center; line-height: 1.2;
          max-height: ${sz.nameSz * 2.5}px; overflow: hidden;
          width: 100%;
        }
        .label-barcode-visual {
          display: flex; align-items: end; gap: 0;
          height: ${sz.h * 0.3}px;
        }
        .bar { background: #000; }
        .label-barcode-text {
          font-family: 'Courier New', monospace;
          font-size: ${sz.barSz}px; letter-spacing: 1.5px;
          text-align: center;
        }
        .label-price {
          font-size: ${sz.priceSz}px; font-weight: 800;
          text-align: center;
        }
        @media print {
          .label { border: 1px dashed #ddd; }
        }
      </style></head><body>
      ${printContent.innerHTML}
      <script>window.onload = function() { window.print(); window.close(); }<\/script>
      </body></html>
    `)
    printWindow.document.close()
  }

  // Generate pseudo-barcode bars from barcode string
  const generateBars = (code) => {
    if (!code) return []
    const bars = []
    // Create a visual pattern based on character codes
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i)
      // Alternate thick/thin bars based on character
      bars.push({ w: (charCode % 3) + 1, gap: false })
      bars.push({ w: (charCode % 2) + 1, gap: true })
    }
    // Guard bars
    bars.unshift({ w: 2, gap: false }, { w: 1, gap: true }, { w: 2, gap: false })
    bars.push({ w: 2, gap: false }, { w: 1, gap: true }, { w: 2, gap: false })
    return bars
  }

  // Build labels array with copies
  const allLabels = []
  for (const p of products) {
    for (let c = 0; c < copies; c++) {
      allLabels.push(p)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🏷️ Print Barcode Labels</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <div className="modal-body space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="inv-label">Label Size</label>
              <select value={labelSize} onChange={e => setLabelSize(e.target.value)} className="input-premium text-xs py-1.5 w-28">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <label className="inv-label">Copies Each</label>
              <input type="number" min="1" max="50" value={copies} onChange={e => setCopies(Math.max(1, parseInt(e.target.value) || 1))} className="input-premium text-xs py-1.5 w-20" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="show-price" checked={showPrice} onChange={e => setShowPrice(e.target.checked)} />
              <label htmlFor="show-price" className="text-xs text-stone-600 font-medium cursor-pointer">Show Price</label>
            </div>
          </div>

          <div className="text-xs text-stone-400">
            {products.length} product{products.length !== 1 ? 's' : ''} × {copies} copies = {allLabels.length} labels
          </div>

          {/* Label Preview */}
          <div className="bg-stone-50 rounded-xl p-3 max-h-64 overflow-y-auto" ref={printRef}>
            <div className="labels-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {allLabels.map((p, i) => (
                <div key={`${p.id}-${i}`} style={{
                  width: sz.w, height: sz.h,
                  border: '1px dashed #d6d3d1', borderRadius: 4,
                  padding: '5px 8px',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{
                    fontSize: sz.nameSz, fontWeight: 700,
                    textAlign: 'center', lineHeight: 1.2,
                    maxHeight: sz.nameSz * 2.5, overflow: 'hidden',
                    width: '100%',
                  }}>
                    {p.name}
                  </div>

                  {/* Barcode visual */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, height: sz.h * 0.3 }}>
                    {generateBars(p.barcode).map((bar, j) => (
                      <div key={j} style={{
                        width: bar.w,
                        height: `${60 + (j % 3) * 10}%`,
                        background: bar.gap ? 'transparent' : '#000',
                        marginRight: bar.gap ? 0 : 0,
                      }} />
                    ))}
                  </div>

                  <div style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: sz.barSz, letterSpacing: 1.5,
                    textAlign: 'center',
                  }}>
                    {p.barcode || '—'}
                  </div>

                  {showPrice && (
                    <div style={{ fontSize: sz.priceSz, fontWeight: 800, textAlign: 'center' }}>
                      ₹{p.selling_price}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary text-sm py-2.5 px-5">Close</button>
          <button onClick={handlePrint} className="btn-primary text-sm py-2.5 px-5">🖨️ Print Labels</button>
        </div>
      </div>
    </div>
  )
}
