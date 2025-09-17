/**
 * 🔹 Frontend (React) - Label UI Component
 * MERN Concepts Used:
 * ✅ Components - Reusable label component for forms
 * ✅ Props - Accepting className and other label props
 * ✅ Form Handling - Used in forms for input labeling
 * ✅ Styling (CSS / Tailwind / Bootstrap) - Label styling with variants
 */

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }