import { useCartStore } from '../store/cartStore'
import { useCloudinaryStore } from '../store/cloudinaryStore'

export default function ItemCard({ item }) {
  const qty = useCartStore(s => s.quantities[item.id] ?? 0)
  const increment = useCartStore(s => s.increment)
  const decrement = useCartStore(s => s.decrement)
  const getThumbnail = useCloudinaryStore(s => s.getThumbnail)

  const isTracked = item.track_inventory !== undefined 
    ? Boolean(item.track_inventory) 
    : (item.current_stock != null && item.current_stock >= 0)
  const isOutOfStock = isTracked && (item.current_stock ?? 0) <= 0
  const isMaxReached = isTracked && item.current_stock > 0 && qty >= item.current_stock
  const isLowStock = isTracked && item.current_stock > 0 && item.current_stock <= (item.min_stock || 5)

  const isActive = qty > 0
  const thumbUrl = item.image_url ? getThumbnail(item.image_url, 160, 160) : null

  const handleCardClick = () => {
    if (isOutOfStock) return
    increment(item)
  }

  return (
    <div
      className={`item-card relative ${isActive ? 'active' : ''} ${isOutOfStock ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
      onClick={handleCardClick}
    >
      {/* Qty badge — top right */}
      {isActive && (
        <span className="qty-badge absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md z-10">
          {qty}
        </span>
      )}

      {/* Out of stock or low stock badge — top left */}
      {isOutOfStock ? (
        <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow z-10">
          Out of Stock
        </span>
      ) : isLowStock ? (
        <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow z-10" title={`${item.current_stock} remaining`}>
          {item.current_stock} left
        </span>
      ) : null}

      {/* Image or emoji fallback */}
      {thumbUrl ? (
        <div className="w-11 h-11 rounded-lg overflow-hidden bg-stone-50 mb-1 flex-shrink-0">
          <img src={thumbUrl} alt="" className="w-full h-full object-cover" loading="lazy" onError={e => e.target.style.display='none'} />
        </div>
      ) : (
        <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center mb-1 flex-shrink-0">
          <span className="text-sm">🍞</span>
        </div>
      )}

      {/* Name — 1 line, truncated */}
      <div className="font-heading font-semibold text-stone-800 text-[13px] leading-tight text-center truncate w-full px-1">
        {item.name}
      </div>

      {/* Price — bold, mono */}
      <div className="font-mono font-bold text-orange-600 text-sm">₹{item.price}</div>

      {/* Stepper or Add button */}
      {isActive ? (
        <div className="flex items-center gap-1.5 mt-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => decrement(item.id)} className="add-btn minus sm">−</button>
          <span className="font-mono font-bold text-stone-800 text-sm min-w-[18px] text-center">{qty}</span>
          <button
            onClick={() => increment(item)}
            disabled={isMaxReached}
            className={`add-btn sm ${isMaxReached ? 'opacity-40 cursor-not-allowed' : ''}`}
            title={isMaxReached ? 'Max available stock reached' : 'Add one more'}
          >+</button>
        </div>
      ) : (
        <button
          className={`add-btn mt-1 ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''}`}
          disabled={isOutOfStock}
          onClick={(e) => { e.stopPropagation(); handleCardClick() }}
        >
          {isOutOfStock ? '✕' : '+'}
        </button>
      )}
    </div>
  )
}
