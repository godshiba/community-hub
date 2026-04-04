import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  duration?: number
}

interface ToastState {
  toasts: readonly Toast[]
  push: (toast: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
}

let counter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  push: (toast) => {
    const id = String(++counter)
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...toast, id }] }))
    return id
  },

  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}))

export function useToast(): {
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
} {
  const push = useToastStore((s) => s.push)
  const dismiss = useToastStore((s) => s.dismiss)

  function show(variant: ToastVariant, title: string, description?: string): void {
    const id = push({ variant, title, description, duration: 4000 })
    setTimeout(() => dismiss(id), (variant === 'error' ? 6000 : 4000))
  }

  return {
    success: (t, d) => show('success', t, d),
    error: (t, d) => show('error', t, d),
    warning: (t, d) => show('warning', t, d),
    info: (t, d) => show('info', t, d)
  }
}
