'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastContext = createContext(null)

const typeConfig = {
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50 border-green-200',
    icon_color: 'text-green-500',
    title_color: 'text-green-800',
    text_color: 'text-green-700',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 border-red-200',
    icon_color: 'text-red-500',
    title_color: 'text-red-800',
    text_color: 'text-red-700',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 border-blue-200',
    icon_color: 'text-blue-500',
    title_color: 'text-blue-800',
    text_color: 'text-blue-700',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-50 border-yellow-200',
    icon_color: 'text-yellow-500',
    title_color: 'text-yellow-800',
    text_color: 'text-yellow-700',
  },
}

function ToastItem({ toast, onDismiss }) {
  const config = typeConfig[toast.type] || typeConfig.info
  const Icon = config.icon

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={cn(
        'flex items-start gap-3 w-full max-w-sm px-4 py-3 rounded-xl border shadow-lg',
        'animate-in slide-in-from-right-full duration-300',
        config.bg
      )}
      role="alert"
    >
      <Icon size={20} className={cn('shrink-0 mt-0.5', config.icon_color)} />
      <p className={cn('text-sm font-medium flex-1', config.text_color)}>
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((optionsOrMessage, maybeType) => {
    let message = ''
    let type = 'info'

    if (typeof optionsOrMessage === 'object' && optionsOrMessage !== null) {
      message = optionsOrMessage.message || optionsOrMessage.title || ''
      type = optionsOrMessage.type || 'info'
    } else {
      message = optionsOrMessage || ''
      type = maybeType || 'info'
    }

    const id = Date.now() + Math.random()
    setToasts((prev) => {
      // Only keep the 3 most recent
      const updated = [...prev, { id, message, type }]
      return updated.slice(-3)
    })
  }, [])

  const showToast = addToast

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, addToast, toast: addToast, dismiss }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 left-4 md:left-auto z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full md:w-auto">
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
