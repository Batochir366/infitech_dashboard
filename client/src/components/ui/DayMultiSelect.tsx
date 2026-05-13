import { useEffect, useRef, useState } from "react"
import { ChevronDown, } from "lucide-react"
import { cn } from "../../utils/cn"

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

function sortDays(days: number[]): number[] {
  return [...new Set(days)].filter((d) => d >= 1 && d <= 31).sort((a, b) => a - b)
}

export interface DayMultiSelectProps {
  value: number[]
  onChange: (days: number[]) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  id?: string
  "aria-invalid"?: boolean
  className?: string
}

export function DayMultiSelect({
  value,
  onChange,
  onBlur,
  placeholder = "Өдөр сонгоно уу...",
  disabled = false,
  id,
  "aria-invalid": ariaInvalid,
  className,
}: DayMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleDown)
    return () => document.removeEventListener("mousedown", handleDown)
  }, [open])

  const toggleDay = (day: number) => {
    const next = value.includes(day) ? value.filter((d) => d !== day) : [...value, day]
    onChange(sortDays(next))
  }


  const sorted = sortDays(value)

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onBlur={onBlur}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-invalid={ariaInvalid}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring",
          ariaInvalid ? "border-destructive" : "border-input",
          disabled ? "opacity-50 cursor-not-allowed" : "text-muted-foreground",
        )}
      >
        <span>
          {sorted.length === 0
            ? placeholder
            : `${sorted.length} өдөр сонгогдсон`}
        </span>
        <ChevronDown size={15} className={cn("shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && !disabled && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover p-2 shadow-md"
          role="listbox"
          aria-multiselectable
        >
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((day) => {
              const selected = value.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-md text-xs font-medium transition-colors cursor-pointer",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 hover:bg-accent text-foreground",
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
