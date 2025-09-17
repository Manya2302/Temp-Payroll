/**
 * 🔹 Frontend (React) - Toaster Component
 * MERN Concepts Used:
 * ✅ Components - Toast notification renderer component
 * ✅ Props - Toast data and configuration props
 * ✅ State (useState) - Toast queue state from useToast hook
 * ✅ State with Array - Array of toasts to display
 * ✅ Event Handling - Toast actions and lifecycle events
 * ✅ Conditional Rendering - Rendering toasts based on state
 * ✅ List Rendering (map) - Mapping over toasts array
 * ✅ Context API (for global state) - Global toast state management
 * ✅ Styling (CSS / Tailwind / Bootstrap) - Toast positioning and layout
 */

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}