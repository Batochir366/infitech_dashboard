import * as React from "react"
import { cn } from "../../utils/cn"

export interface TabItem {
  id: string
  label: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  items: TabItem[]
  value: string
  onValueChange: (id: string) => void
  className?: string
  fullWidth?: boolean
}

export function Tabs({
  items,
  value,
  onValueChange,
  className,
  fullWidth = false,
}: TabsProps) {
  return (
    <div
      className={cn("flex gap-1 rounded-lg bg-muted p-1", fullWidth ? "w-full" : "w-fit", className)}
      role="tablist"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          disabled={item.disabled}
          onClick={() => onValueChange(item.id)}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            fullWidth && "flex-1",
            value === item.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
            item.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

interface TabPanelsProps {
  value: string
  children: React.ReactElement<TabPanelProps> | React.ReactElement<TabPanelProps>[]
}

export interface TabPanelProps {
  id: string
  children: React.ReactNode
  className?: string
}

export function TabPanel({ children, className }: TabPanelProps) {
  return <div className={cn("pt-4", className)}>{children}</div>
}

export function TabPanels({ value, children }: TabPanelsProps) {
  const panels = React.Children.toArray(children) as React.ReactElement<TabPanelProps>[]
  const active = panels.find((p) => p.props.id === value)
  if (!active) return null
  return <div role="tabpanel">{active}</div>
}
