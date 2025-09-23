import { useEffect } from 'react'

export default function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    const { body } = document
    const prev = body.style.overflow
    body.style.overflow = 'hidden'           // prevent background scroll
    return () => { document.removeEventListener('keydown', onKey); body.style.overflow = prev }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* dialog */}
      <div className="relative z-10 max-w-lg w-full">
        {/* close button */}
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-20 h-9 w-9 rounded-full bg-white/90 shadow hover:bg-white"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  )
}
