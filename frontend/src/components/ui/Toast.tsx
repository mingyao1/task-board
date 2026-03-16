import React, { useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ToastMessage } from '@/types'

// ─── Context ─────────────────────────────────────────────────────────────────

interface ToastContextValue {
  showToast: (type: ToastMessage['type'], message: string) => void
  showError: (message: string) => void
  showSuccess: (message: string) => void
  showInfo: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// ─── Provider ────────────────────────────────────────────────────────────────

let idCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (type: ToastMessage['type'], message: string) => {
      const id = String(++idCounter)
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  const showError = useCallback((msg: string) => showToast('error', msg), [showToast])
  const showSuccess = useCallback((msg: string) => showToast('success', msg), [showToast])
  const showInfo = useCallback((msg: string) => showToast('info', msg), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess, showInfo }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// ─── Container ───────────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// ─── Item ─────────────────────────────────────────────────────────────────────

const toastConfig = {
  success: {
    icon: CheckCircle,
    classes: 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]',
    iconClass: 'text-[#10B981]',
  },
  error: {
    icon: XCircle,
    classes: 'border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]',
    iconClass: 'text-[#EF4444]',
  },
  info: {
    icon: Info,
    classes: 'border-[#6366F1]/30 bg-[#6366F1]/10 text-[#6366F1]',
    iconClass: 'text-[#6366F1]',
  },
}

interface ToastItemProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const config = toastConfig[toast.type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border',
        'shadow-xl shadow-black/40 min-w-[280px] max-w-[400px]',
        'bg-[#18181B]',
        config.classes,
      )}
    >
      <Icon size={16} className={cn('mt-0.5 flex-shrink-0', config.iconClass)} />
      <p className="text-sm text-[#FAFAFA] flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-[#71717A] hover:text-[#FAFAFA] transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
