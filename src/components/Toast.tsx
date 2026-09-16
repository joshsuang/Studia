import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, Info, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface ToastItem {
  id: string
  message: string
  kind: 'success' | 'info'
}

const ToastContext = createContext<(message: string, kind?: ToastItem['kind']) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((message: string, kind: ToastItem['kind'] = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setItems((prev) => [...prev, { id, message, kind }])
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm shadow-lg"
            >
              {t.kind === 'success' ? (
                <CheckCircle2 size={16} className="text-accent" />
              ) : (
                <Info size={16} className="text-muted" />
              )}
              <span>{t.message}</span>
              <button
                onClick={() => setItems((prev) => prev.filter((i) => i.id !== t.id))}
                className="ml-1 text-muted hover:text-white"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
