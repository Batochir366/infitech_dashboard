import type { ReactNode } from "react"
import { cn } from "../../utils/cn"

interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section className={cn(" bg-card/50 p-4 space-y-4", className)}>
      <div>
        <h3 className="text-sm font-semibold leading-none">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}
