/**
 * 🔹 Frontend (React) - Mobile Detection Hook
 * MERN Concepts Used:
 * ✅ Components - Custom hook for responsive design
 * ✅ Props - Breakpoint configuration for mobile detection
 * ✅ State (useState) - Mobile state management
 * ✅ useEffect - Window resize event listeners and cleanup
 * ✅ Event Handling - Media query change events
 * ✅ Conditional Rendering - Used for responsive component rendering
 * ✅ Styling (CSS / Tailwind / Bootstrap) - Supporting responsive design patterns
 */

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}