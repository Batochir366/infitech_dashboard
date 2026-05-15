import { useEffect, useMemo, useRef, useState } from "react"
import dayjs, { type Dayjs } from "dayjs"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../utils/cn"

const WEEKDAYS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"]

const MONTHS = [
  "1-р сар",
  "2-р сар",
  "3-р сар",
  "4-р сар",
  "5-р сар",
  "6-р сар",
  "7-р сар",
  "8-р сар",
  "9-р сар",
  "10-р сар",
  "11-р сар",
  "12-р сар",
]

function toValue(d: Dayjs): string {
  return d.format("YYYY-MM-DD")
}

function parseValue(value: string): Dayjs | null {
  if (!value?.trim()) return null
  const d = dayjs(value, "YYYY-MM-DD", true)
  return d.isValid() ? d : null
}

function mondayOffset(d: Dayjs): number {
  return (d.day() + 6) % 7
}

export interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
  "aria-invalid"?: boolean
}

export function DatePicker({
  value,
  onChange,
  onBlur,
  placeholder = "Огноо сонгоно уу",
  disabled = false,
  id,
  className,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const parsed = parseValue(value)
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => parsed ?? dayjs())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (parsed) setViewMonth(parsed.startOf("month"))
  }, [value])

  useEffect(() => {
    if (!open) return
    const handleDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        onBlur?.()
      }
    }
    document.addEventListener("mousedown", handleDown)
    return () => document.removeEventListener("mousedown", handleDown)
  }, [open, onBlur])

  const calendarDays = useMemo(() => {
    const start = viewMonth.startOf("month")
    const leading = mondayOffset(start)
    const daysInMonth = viewMonth.daysInMonth()
    const cells: { date: Dayjs; inMonth: boolean }[] = []

    for (let i = leading - 1; i >= 0; i--) {
      cells.push({ date: start.subtract(i + 1, "day"), inMonth: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: start.date(d), inMonth: true })
    }
    const trailing = (7 - (cells.length % 7)) % 7
    const end = start.add(daysInMonth - 1, "day")
    for (let i = 1; i <= trailing; i++) {
      cells.push({ date: end.add(i, "day"), inMonth: false })
    }
    return cells
  }, [viewMonth])

  const selectDate = (date: Dayjs) => {
    onChange(toValue(date))
    setOpen(false)
    onBlur?.()
  }

  const displayLabel = parsed ? parsed.format("YYYY-MM-DD") : placeholder

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-invalid={ariaInvalid}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          ariaInvalid ? "border-destructive" : "border-input",
          disabled && "cursor-not-allowed opacity-50",
          !parsed && "text-muted-foreground",
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <Calendar size={15} className="shrink-0 text-muted-foreground" />
      </button>

      {open && !disabled && (
        <div
          className="absolute z-50 mt-1 w-[280px] rounded-md border border-input bg-popover p-3 shadow-md animate-in fade-in slide-in-from-top-1 duration-150"
          role="dialog"
          aria-label="Огноо сонгох"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation()
                setViewMonth((m) => dayjs(m).subtract(1, "month"))
              }}
              aria-label="Өмнөх сар"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium">
              {viewMonth.year()} оны {MONTHS[viewMonth.month()]}
            </span>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation()
                setViewMonth((m) => dayjs(m).add(1, "month"))
              }}
              aria-label="Дараагийн сар"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((wd) => (
              <span
                key={wd}
                className="flex h-7 items-center justify-center text-[11px] font-medium text-muted-foreground"
              >
                {wd}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, inMonth }) => {
              const isSelected = parsed?.isSame(date, "day")
              const isToday = date.isSame(dayjs(), "day")
              return (
                <button
                  key={date.format("YYYY-MM-DD")}
                  type="button"
                  onClick={() => selectDate(date)}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-md text-xs font-medium transition-colors",
                    !inMonth && "text-muted-foreground/50",
                    inMonth && !isSelected && "hover:bg-accent",
                    isToday && !isSelected && "ring-1 ring-ring/50",
                    isSelected && "bg-primary text-primary-foreground",
                  )}
                >
                  {date.date()}
                </button>
              )
            })}
          </div>

          <div className="mt-2 flex justify-between gap-2 border-t pt-2">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => selectDate(dayjs())}
            >
              Өнөөдөр
            </button>
            {parsed && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onChange("")
                  setOpen(false)
                  onBlur?.()
                }}
              >
                Арилгах
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
