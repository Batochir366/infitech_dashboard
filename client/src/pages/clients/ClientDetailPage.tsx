import { useState, useEffect, useMemo } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import {
  ArrowLeft,
  Edit,
  Info,
  CalendarDays,
  Activity,
  Phone,
  Mail,
  Hash,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Pencil,
  Clock,
  AlertCircle,
  Ban,
} from "lucide-react"
import { useClient, useDeleteClient } from "../../hooks/useClients"
import { useClientInvoices, useGenerateInvoice, useUpdateInvoice } from "../../hooks/useInvoices"
import { Button } from "../../components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Input } from "../../components/ui/Input"
import { Modal } from "../../components/ui/Modal"
import { useToast } from "../../context/ToastContext"
import { downloadInvoicePdf } from "../../utils/invoicePdf"
import { buildInvoiceViewModel } from "../../utils/invoiceViewModel"
import { cn } from "../../utils/cn"
import { InvoiceHtmlPreview } from "../../components/invoice/InvoiceHtmlPreview"
import type { InvoiceRecord, InvoiceStatus } from "../../types/invoice"


const MONTH_NAMES = [
  "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
  "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар",
]
const STATUS_SELECT_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: "pending", label: "Хүлээгдэж буй" },
  { value: "paid", label: "Төлөгдсөн" },
  { value: "overdue", label: "Хэтэрсэн" },
  { value: "cancelled", label: "Цуцлагдсан" },
]

function toDateInputValue(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"]

function statusBadgeVariant(
  s: InvoiceStatus
): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  switch (s) {
    case "paid":
      return "success"
    case "pending":
      return "warning"
    case "overdue":
      return "destructive"
    case "cancelled":
      return "outline"
    default:
      return "secondary"
  }
}

function statusLabelMn(s: InvoiceStatus) {
  switch (s) {
    case "paid":
      return "Төлөгдсөн"
    case "pending":
      return "Хүлээгдэж буй"
    case "overdue":
      return "Хэтэрсэн"
    case "cancelled":
      return "Цуцлагдсан"
    default:
      return s
  }
}

function paydayInvoiceStatusVisual(status: InvoiceStatus): {
  cell: string
  amount: string
  Icon: typeof Check
  iconClass: string
  label: string
} {
  switch (status) {
    case "paid":
      return {
        cell: "bg-emerald-50 ring-1 ring-emerald-500/60 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-500/50",
        amount: "text-emerald-700 dark:text-emerald-300",
        Icon: Check,
        iconClass: "text-emerald-600 dark:text-emerald-400",
        label: "Төлөгдсөн",
      }
    case "pending":
      return {
        cell: "bg-amber-50 ring-1 ring-amber-400/70 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100 dark:ring-amber-500/50",
        amount: "text-amber-800 dark:text-amber-200",
        Icon: Clock,
        iconClass: "text-amber-600 dark:text-amber-400",
        label: "Хүлээгдэж буй",
      }
    case "overdue":
      return {
        cell: "bg-red-50 ring-1 ring-red-500/70 text-red-950 dark:bg-red-950/35 dark:text-red-50 dark:ring-red-500/50",
        amount: "text-red-700 dark:text-red-300",
        Icon: AlertCircle,
        iconClass: "text-red-600 dark:text-red-400",
        label: "Хэтэрсэн",
      }
    case "cancelled":
      return {
        cell: "bg-slate-100 ring-1 ring-slate-300 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-600",
        amount: "text-slate-500 dark:text-slate-400",
        Icon: Ban,
        iconClass: "text-slate-500 dark:text-slate-400",
        label: "Цуцлагдсан",
      }
    default:
      return {
        cell: "bg-primary/10 ring-1 ring-primary/30 text-primary",
        amount: "text-primary",
        Icon: Check,
        iconClass: "text-primary",
        label: "",
      }
  }
}

function PaymentCalendar({
  schedules,
  year,
  month,
  onPrev,
  onNext,
  onGoToday,
  invoices,
  onPaydayClick,
  clientJoinedAt,
  canGoPrev,
  clientActive,
}: {
  schedules: { day: number; amount: number }[]
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
  onGoToday: () => void
  invoices: InvoiceRecord[]
  onPaydayClick: (day: number) => void
  clientJoinedAt: string
  canGoPrev: boolean
  clientActive: boolean
}) {
  const now = new Date()
  const paymentMap = new Map(schedules.map((ps) => [ps.day, ps.amount]))

  const joined = new Date(clientJoinedAt)
  const joinedYear = joined.getFullYear()
  const joinedMonth = joined.getMonth()
  const joinedDay = joined.getDate()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const todayDate = now.getDate()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  const scheduleMonthOneIndexed = month + 1
  const invoiceStatusByDay = new Map<number, InvoiceStatus>()
  for (const inv of invoices) {
    if (
      inv.scheduleYear === year &&
      inv.scheduleMonth === scheduleMonthOneIndexed
    ) {
      invoiceStatusByDay.set(inv.scheduleDay, inv.status)
    }
  }

  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  if (schedules.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            Төлбөрийн хуваарь
          </p>
        </div>
        <p className="text-muted-foreground">Хуваарь оруулаагүй</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays size={16} className="text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          Төлбөрийн хуваарь
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Төлбөрийн өдөр дээр дарж нэхэмжлэх үүсгэх, харах цонхыг нээнэ. Бүртгэлээс өмнөх
        сар, өдрүүдийг харуулахгүй.
      </p>
      <div className="rounded-lg border">
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canGoPrev}
            title={canGoPrev ? "Өмнөх сар" : "Бүртгэлээс өмнөх сар байхгүй"}
            className={cn(
              "p-1 rounded-md transition-colors",
              canGoPrev ? "hover:bg-muted" : "opacity-40 cursor-not-allowed"
            )}
            aria-label="Өмнөх сар"
          >
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {year} оны {MONTH_NAMES[month]}
            </span>
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={onGoToday}
                className="text-[10px] text-primary hover:underline"
              >
                Өнөөдөр
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onNext}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-3">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-medium text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {blanks.map((i) => (
              <div key={`blank-${i}`} className="h-10" />
            ))}
            {days.map((day) => {
              const amount = paymentMap.get(day)
              const isPayday = amount !== undefined
              const isToday = isCurrentMonth && day === todayDate
              const invStatus = invoiceStatusByDay.get(day)
              const hasInvoice = invStatus !== undefined

              const isBeforeClientJoined =
                year < joinedYear ||
                (year === joinedYear && month < joinedMonth) ||
                (year === joinedYear && month === joinedMonth && day < joinedDay)

              if (isPayday && isBeforeClientJoined) {
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-md h-10 text-xs text-muted-foreground/40",
                      isToday && "ring-1 ring-foreground/15 font-medium text-muted-foreground/60"
                    )}
                    aria-hidden
                  >
                    <span className="text-[11px]">{day}</span>
                  </div>
                )
              }

              if (isPayday) {
                const visual = hasInvoice
                  ? paydayInvoiceStatusVisual(invStatus!)
                  : {
                    cell: "bg-primary/10 ring-1 ring-primary/30 font-semibold text-primary",
                    amount: "text-primary",
                    Icon: null as null,
                    iconClass: "",
                    label: "",
                  }
                const StatusIcon = visual.Icon
                const todayRing =
                  isToday && !hasInvoice
                    ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                    : isToday && hasInvoice
                      ? "ring-2 ring-offset-1 ring-offset-background ring-current/40"
                      : ""

                const cellInner = (
                  <>
                    <span className="text-[11px] flex items-center gap-0.5">
                      {day}
                      {StatusIcon ? (
                        <StatusIcon
                          className={cn("h-3 w-3 shrink-0", visual.iconClass)}
                          strokeWidth={2.5}
                        />
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        "text-[8px] leading-none font-bold mt-0.5",
                        visual.amount
                      )}
                    >
                      {amount! >= 1_000_000
                        ? `${(amount! / 1_000_000).toFixed(1)}M`
                        : `${(amount! / 1000).toFixed(0)}K`}
                    </span>
                  </>
                )

                const titleText = hasInvoice
                  ? `${day}-нд: ${amount!.toLocaleString()}₮ — ${visual.label}`
                  : `${day}-нд: ${amount!.toLocaleString()}₮ — нэхэмжлэх байхгүй`

                if (!clientActive && !hasInvoice) {
                  return (
                    <div
                      key={day}
                      title={`${titleText} (идэвхгүй)`}
                      className={cn(
                        "relative flex flex-col items-center justify-center rounded-md h-10 text-xs transition-colors opacity-55 cursor-not-allowed",
                        visual.cell,
                        todayRing
                      )}
                    >
                      {cellInner}
                    </div>
                  )
                }

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => onPaydayClick(day)}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-md h-10 text-xs transition-colors cursor-pointer",
                      visual.cell,
                      todayRing
                    )}
                    title={titleText}
                  >
                    {cellInner}
                  </button>
                )
              }

              return (
                <div
                  key={day}
                  className={`relative flex flex-col items-center justify-center rounded-md h-10 text-xs transition-colors text-muted-foreground/60
                    ${isToday ? "ring-1 ring-foreground/20 font-medium text-foreground" : ""}
                  `}
                >
                  {day}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm px-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-primary/20 ring-1 ring-primary/30" />
          <span className="text-muted-foreground text-xs">Нэхэмжлэхгүй</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 text-amber-600" />
          <span>Хүлээгдэж буй</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Check className="h-3 w-3 text-emerald-600" />
          <span>Төлөгдсөн</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3 text-red-600" />
          <span>Хэтэрсэн</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Ban className="h-3 w-3 text-slate-500" />
          <span>Цуцлагдсан</span>
        </div>
        <div className="font-semibold text-primary ml-auto w-full sm:w-auto text-right">
          Нийт:{" "}
          {schedules.reduce((sum, ps) => sum + ps.amount, 0).toLocaleString()}₮
        </div>
      </div>
    </div>
  )
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: client, isLoading } = useClient(id || "")
  const deleteClient = useDeleteClient()
  const toast = useToast()
  const { data: invoiceListRes } = useClientInvoices(id)
  const generateInvoice = useGenerateInvoice()
  const patchInvoice = useUpdateInvoice()
  const nowRef = new Date()
  const [calYear, setCalYear] = useState(() => nowRef.getFullYear())
  const [calMonth, setCalMonth] = useState(() => nowRef.getMonth())
  const [paydayModalDay, setPaydayModalDay] = useState<number | null>(null)
  const [generatingInModal, setGeneratingInModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRecord | null>(null)
  const [editAmount, setEditAmount] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editDue, setEditDue] = useState("")

  useEffect(() => {
    if (!editingInvoice) return
    setEditAmount(String(editingInvoice.amount))
    setEditDesc(editingInvoice.description ?? "")
    setEditDue(toDateInputValue(editingInvoice.dueDate))
  }, [editingInvoice])

  const joinedBounds = useMemo(() => {
    if (!client) {
      return { y: 1970, m: 0, d: 1 }
    }
    const j = new Date(client.createdAt)
    return {
      y: j.getFullYear(),
      m: j.getMonth(),
      d: j.getDate(),
    }
  }, [client?.createdAt])

  useEffect(() => {
    if (!client) return
    const j = new Date(client.createdAt)
    const jy = j.getFullYear()
    const jm = j.getMonth()
    const now = new Date()
    let ty = now.getFullYear()
    let tm = now.getMonth()
    if (ty < jy || (ty === jy && tm < jm)) {
      ty = jy
      tm = jm
    }
    setCalYear(ty)
    setCalMonth(tm)
  }, [client?.id])

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">Уншиж байна...</div>
  }

  if (!client) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold">Үйлчлүүлэгч олдсонгүй</h2>
        <Button variant="link" onClick={() => navigate("/clients")}>
          Жагсаалт руу буцах
        </Button>
      </div>
    )
  }

  const handleDelete = async () => {
    if (
      window.confirm(
        "Үйлчлүүлэгч болон түүний бүх нэхэмжлэхийг бүрмөсөн устгах уу? Энэ үйлдлийг буцаах боломжгүй."
      )
    ) {
      try {
        await deleteClient.mutateAsync(client.id)
        navigate("/clients")
      } catch {
        toast.error("Устгахад алдаа гарлаа")
      }
    }
  }

  const invoices = invoiceListRes?.data ?? []
  const listCompany = invoiceListRes?.company
  const clientIdNum = parseInt(client.id, 10)
  const clientActive = client.status === "active"
  const invoiceHistoryOnly = !clientActive

  const canGoPrevCal =
    calYear > joinedBounds.y ||
    (calYear === joinedBounds.y && calMonth > joinedBounds.m)

  const calPrev = () => {
    if (!canGoPrevCal) return
    if (calMonth === 0) {
      setCalMonth(11)
      setCalYear((y) => y - 1)
    } else setCalMonth((m) => m - 1)
  }
  const calNext = () => {
    if (calMonth === 11) {
      setCalMonth(0)
      setCalYear((y) => y + 1)
    } else setCalMonth((m) => m + 1)
  }
  const calGoToday = () => {
    const t = new Date()
    const ty = t.getFullYear()
    const tm = t.getMonth()
    const { y: jy, m: jm } = joinedBounds
    if (ty < jy || (ty === jy && tm < jm)) {
      setCalYear(jy)
      setCalMonth(jm)
      return
    }
    setCalYear(ty)
    setCalMonth(tm)
  }

  const handlePaydayClick = (day: number) => {
    setPaydayModalDay(day)
  }

  const scheduleMonthIdx = calMonth + 1
  const paydayScheduledAmount =
    paydayModalDay != null
      ? client.paymentSchedules.find((ps) => ps.day === paydayModalDay)?.amount
      : undefined
  const paydayExistingInvoice =
    paydayModalDay != null
      ? invoices.find(
        (i) =>
          i.scheduleYear === calYear &&
          i.scheduleMonth === scheduleMonthIdx &&
          i.scheduleDay === paydayModalDay
      )
      : undefined

  const handleGenerateInPaydayModal = async () => {
    if (paydayModalDay == null) return
    if (!clientActive) {
      toast.error("Идэвхгүй харилцагчид шинэ нэхэмжлэх үүсгэх боломжгүй")
      return
    }
    setGeneratingInModal(true)
    try {
      try {
        await generateInvoice.mutateAsync({
          clientId: clientIdNum,
          day: paydayModalDay,
          month: scheduleMonthIdx,
          year: calYear,
        })
        toast.success("Нэхэмжлэх үүслээ")
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 409) {
          await queryClient.invalidateQueries({
            queryKey: ["invoices", "client", id],
          })
          toast.info("Энэ сарын энэ өдрийн нэхэмжлэх аль хэдийн байна")
          return
        }
        if (axios.isAxiosError(e) && e.response?.status === 403) {
          const msg =
            (e.response?.data as { message?: string })?.message ||
            "Нэхэмжлэх үүсгэх боломжгүй"
          toast.error(msg)
          return
        }
        throw e
      }
    } catch {
      toast.error("Нэхэмжлэх үүсгэхэд алдаа гарлаа")
    } finally {
      setGeneratingInModal(false)
    }
  }

  const closePaydayModal = () => {
    setPaydayModalDay(null)
  }

  const copyPublicLink = async (token: string) => {
    const url = `${window.location.origin}/invoice/${token}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Холбоос хуулагдлаа")
    } catch {
      toast.error("Хуулахад алдаа гарлаа")
    }
  }

  const handleDownloadExisting = async (inv: InvoiceRecord) => {
    if (!listCompany) {
      toast.error("Тохиргоо ачааллаагүй байна")
      return
    }
    await downloadInvoicePdf(inv, listCompany)
  }

  const handleInvoiceStatusChange = async (
    inv: InvoiceRecord,
    status: InvoiceStatus
  ) => {
    if (!clientActive) {
      toast.error("Идэвхгүй харилцагчийн нэхэмжлэхийн төлөвийг өөрчлөх боломжгүй")
      return
    }
    try {
      await patchInvoice.mutateAsync({
        id: inv.id,
        clientId: id!,
        status,
      })
      toast.success("Төлөв шинэчлэгдлээ")
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 403) {
        const msg =
          (e.response?.data as { message?: string })?.message ||
          "Төлөв өөрчлөх боломжгүй"
        toast.error(msg)
        return
      }
      toast.error("Төлөв шинэчлэхэд алдаа гарлаа")
    }
  }

  const handleSaveEditedInvoice = async () => {
    if (!editingInvoice) return
    if (!clientActive) {
      toast.error("Идэвхгүй харилцагчийн нэхэмжлэхийг засах боломжгүй")
      return
    }
    const amount = Number(editAmount)
    if (Number.isNaN(amount) || amount < 0) {
      toast.error("Дүн зөв оруулна уу")
      return
    }
    try {
      await patchInvoice.mutateAsync({
        id: editingInvoice.id,
        clientId: id!,
        amount,
        description: editDesc.trim() === "" ? null : editDesc.trim(),
        dueDate: new Date(`${editDue}T12:00:00`).toISOString(),
      })
      toast.success("Нэхэмжлэх шинэчлэгдлээ")
      setEditingInvoice(null)
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 403) {
        const msg =
          (e.response?.data as { message?: string })?.message ||
          "Засах боломжгүй"
        toast.error(msg)
        return
      }
      toast.error("Хадгалахад алдаа гарлаа")
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{client.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={client.status === "active" ? "success" : "warning"}>
                  {client.status === "active" ? "Идэвхтэй" : "Идэвхгүй"}
                </Badge>
                <Badge variant={client.paymentType === "rent" ? "secondary" : "outline"}>
                  {client.paymentType === "rent" ? "Түрээс" : "Худалдан авалт"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/clients/${client.id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Edit size={16} />
                <span>Засах</span>
              </Button>
            </Link>
            <Button variant="destructive" onClick={handleDelete}>Устгах</Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info size={18} />
                <span>Ерөнхий мэдээлэл</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Нэр</p>
                  <p className="text-lg font-semibold">{client.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Регистрийн дугаар</p>
                  <div className="flex items-center gap-2">
                    <Hash size={16} className="text-muted-foreground" />
                    <p className="text-lg font-semibold">{client.regNumber || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Утасны дугаар</p>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-muted-foreground" />
                    <p className="text-lg">{client.phoneNumber}</p>
                  </div>
                </div>
                {client.phoneNumber2 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Утасны дугаар 2</p>
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-muted-foreground" />
                      <p className="text-lg">{client.phoneNumber2}</p>
                    </div>
                  </div>
                )}
              </div>

              {client.email && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Имэйл</p>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-muted-foreground" />
                    <p className="text-lg">{client.email}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Бүтээгдэхүүний төрөл</p>
                  <div className="flex items-center gap-2">
                    {client.system ? (
                      <div className="flex items-center gap-2">
                        {client.system.photo ? (
                          <img src={client.system.photo} alt={client.system.name} className="h-8 w-8 rounded-md object-cover border" />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-md border bg-muted">
                            <ImageIcon size={14} className="text-muted-foreground" />
                          </span>
                        )}
                        <p className="text-lg">{client.system.name}</p>
                      </div>
                    ) : (
                      <p className="text-lg text-muted-foreground">—</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Домэйн</p>
                  <a href={`https://${client.domain}`} target="_blank" rel="noopener noreferrer" className="text-lg text-primary hover:underline">{client.domain || "—"}</a>
                </div>
              </div>

              {/* Payment Schedule Calendar */}
              <PaymentCalendar
                schedules={client.paymentSchedules}
                year={calYear}
                month={calMonth}
                onPrev={calPrev}
                onNext={calNext}
                onGoToday={calGoToday}
                invoices={invoices}
                onPaydayClick={handlePaydayClick}
                clientJoinedAt={client.createdAt}
                canGoPrev={canGoPrevCal}
                clientActive={clientActive}
              />

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Тэмдэглэл</p>
                <p className="text-sm bg-muted/30 p-4 rounded-md min-h-[100px]">
                  {client.notes || "Тэмдэглэл байхгүй."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={18} />
                <span>Системийн мэдээлэл</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Бүртгэсэн огноо</p>
                <p className="text-sm">{new Date(client.createdAt).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Төлбөрийн төрөл</p>
                <Badge variant={client.paymentType === "rent" ? "secondary" : "outline"}>
                  {client.paymentType === "rent" ? "Түрээс" : "Худалдан авалт"}
                </Badge>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">Мэдээлэл шинэчлэгдсэн</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={paydayModalDay !== null}
        onClose={closePaydayModal}
        title="Нэхэмжлэх"
        description={
          paydayModalDay != null
            ? `${calYear} оны ${MONTH_NAMES[calMonth]} · ${paydayModalDay}-ны төлбөр`
            : undefined
        }
        className="max-w-3xl w-[min(72rem,calc(100vw-1.25rem))] max-h-[96vh] p-4 sm:p-5"
      >
        {paydayModalDay != null && (
          <div className="space-y-4 pt-1 overflow-y-auto max-h-[calc(96vh-7.5rem)] pr-1 -mx-1">
            {paydayScheduledAmount != null && (
              <p className="text-sm text-muted-foreground">
                Хуваарьт дүн:{" "}
                <span className="font-semibold text-foreground">
                  {paydayScheduledAmount.toLocaleString()}₮
                </span>
              </p>
            )}

            {paydayExistingInvoice && listCompany ? (
              <>
                {invoiceHistoryOnly ? (
                  <p className="text-xs rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-950 dark:text-amber-100">
                    Идэвхгүй харилцагч: нэхэмжлэхийг түүхээр харна. Төлөв өөрчлөх, засах боломжгүй.
                  </p>
                ) : null}
                <div className="rounded-lg border bg-muted/20 overflow-hidden shrink-0">
                  <div className="p-2 sm:p-4">
                    <InvoiceHtmlPreview
                      className="max-w-3xl w-full mx-0 p-6 sm:p-10 text-[13px] sm:text-sm shadow-none border-0 rounded-md"
                      data={buildInvoiceViewModel(
                        paydayExistingInvoice,
                        listCompany
                      )}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusBadgeVariant(paydayExistingInvoice.status)}>
                    {statusLabelMn(paydayExistingInvoice.status)}
                  </Badge>
                  {!invoiceHistoryOnly ? (
                    <select
                      value={paydayExistingInvoice.status}
                      onChange={(e) =>
                        void handleInvoiceStatusChange(
                          paydayExistingInvoice,
                          e.target.value as InvoiceStatus
                        )
                      }
                      disabled={patchInvoice.isPending}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {STATUS_SELECT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() =>
                      void copyPublicLink(paydayExistingInvoice.publicToken)
                    }
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Холбоос
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() =>
                      void handleDownloadExisting(paydayExistingInvoice)
                    }
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                  <Button type="button" size="sm" variant="outline" asChild>
                    <a
                      href={`/invoice/${paydayExistingInvoice.publicToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-1 inline-flex items-center"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Нээх
                    </a>
                  </Button>
                  {!invoiceHistoryOnly ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => {
                        setEditingInvoice(paydayExistingInvoice)
                        closePaydayModal()
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Засах
                    </Button>
                  ) : null}
                </div>
              </>
            ) : paydayExistingInvoice && !listCompany ? (
              <p className="text-sm text-muted-foreground">Ачааллаж байна...</p>
            ) : (
              <div className="space-y-3 rounded-lg border border-dashed p-4">
                {invoiceHistoryOnly ? (
                  <p className="text-sm text-muted-foreground">
                    Идэвхгүй төлөвт энэ сарын энэ өдөрт шинэ нэхэмжлэх үүсгэх боломжгүй.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Энэ сарын энэ өдөрт нэхэмжлэх үүсээгүй байна. Доорх товчоор үүсгэнэ үү.
                    </p>
                    <Button
                      type="button"
                      disabled={generatingInModal}
                      onClick={() => void handleGenerateInPaydayModal()}
                      className="gap-2"
                    >
                      {generatingInModal ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Нэхэмжлэх үүсгэх
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!editingInvoice}
        onClose={() => setEditingInvoice(null)}
        title="Нэхэмжлэх засах"
        description={editingInvoice ? `Дугаар: ${editingInvoice.invoiceNumber}` : undefined}
        className="max-w-md"
      >
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Дүн (₮)</label>
            <Input
              type="number"
              min={0}
              step={1}
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              disabled={!clientActive}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Тайлбар</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              disabled={!clientActive}
              className={cn(
                "flex min-h-[88px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              )}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Төлбөрийн хугацаа</label>
            <Input
              type="date"
              value={editDue}
              onChange={(e) => setEditDue(e.target.value)}
              disabled={!clientActive}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setEditingInvoice(null)}>
              Болих
            </Button>
            <Button
              type="button"
              disabled={patchInvoice.isPending || !clientActive}
              onClick={() => void handleSaveEditedInvoice()}
            >
              Хадгалах
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
