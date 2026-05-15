import { useForm, Controller, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useClient, useCreateClient, useUpdateClient } from "../../hooks/useClients"
import { useSystems } from "../../hooks/useSystems"
import { useToast } from "../../context/ToastContext"
import type { CreateClientInput, PaymentType } from "../../types/client"
import { Button } from "../ui/Button"
import { FormSection } from "../ui/FormSection"
import { Input } from "../ui/Input"
import { useEffect, useState, useRef } from "react"
import { User, Building2, Loader2, ChevronDown, X, ImageIcon } from "lucide-react"
import {
  clientSchema,
  clientFormDefaultValues,
  type ClientFormValues,
} from "./clientFormSchema"
import { ClientRentPaymentSection } from "./ClientRentPaymentSection"
import { ClientPurchasePaymentSection } from "./ClientPurchasePaymentSection"

const EBARIMT_MERCHANT_INFO_URL = "https://info.ebarimt.mn/rest/merchant/info"

interface EbarimtMerchantInfo {
  found: boolean
  name: string
}

const fetchMerchantByRegNo = async (regno: string): Promise<EbarimtMerchantInfo | null> => {
  const normalized = regno.replace(/\D/g, "")
  if (normalized.length !== 7) return null
  try {
    const res = await fetch(`${EBARIMT_MERCHANT_INFO_URL}?regno=${normalized}`)
    const data = (await res.json()) as EbarimtMerchantInfo
    return data
  } catch {
    return null
  }
}

function toDateInputValue(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

interface SystemOption {
  id: number
  name: string
  photo: string | null
}

function SystemSelect({
  systems,
  value,
  onChange,
  selected,
}: {
  systems: SystemOption[]
  value?: string
  onChange: (val: string) => void
  selected?: SystemOption
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            {selected.photo ? (
              <img src={selected.photo} alt={selected.name} className="h-5 w-5 rounded object-cover" />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded bg-muted">
                <ImageIcon size={12} className="text-muted-foreground" />
              </span>
            )}
            <span>{selected.name}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">— Сонгоно уу —</span>
        )}
        <span className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              className="rounded-sm p-0.5 hover:bg-accent"
              onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false) }}
            >
              <X size={14} className="text-muted-foreground" />
            </span>
          )}
          <ChevronDown size={14} className="text-muted-foreground" />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
          {systems.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">Систем олдсонгүй</div>
          ) : (
            <div className="max-h-52 overflow-y-auto py-1">
              {systems.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { onChange(String(s.id)); setOpen(false) }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-accent ${String(s.id) === value ? "bg-accent font-medium" : ""
                    }`}
                >
                  {s.photo ? (
                    <img src={s.photo} alt={s.name} className="h-7 w-7 rounded-md object-cover border" />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted">
                      <ImageIcon size={14} className="text-muted-foreground" />
                    </span>
                  )}
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ClientFormProps {
  clientId?: string
  /** Шинэ үүсгэхэд түрээс эсвэл худалдан авалт */
  defaultPaymentType?: PaymentType
  onSuccess: () => void
  onCancel: () => void
}

export function ClientForm({
  clientId,
  defaultPaymentType = "rent",
  onSuccess,
  onCancel,
}: ClientFormProps) {
  const isEdit = !!clientId
  const { data: client, isLoading: isFetching } = useClient(clientId || "")
  const { data: systemsData } = useSystems({ limit: 100 })
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const toast = useToast()
  const [isCheckingRegNo, setIsCheckingRegNo] = useState(false)

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      ...clientFormDefaultValues,
      paymentType: defaultPaymentType,
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    control,
    formState: { errors, isSubmitting },
  } = form

  const clientType = watch("clientType")
  const paymentType = watch("paymentType")

  useEffect(() => {
    if (!isEdit) {
      setValue("paymentType", defaultPaymentType)
    }
  }, [defaultPaymentType, isEdit, setValue])

  useEffect(() => {
    if (client) {
      reset({
        clientType: client.regNumber ? "company" : "person",
        name: client.name,
        regNumber: client.regNumber || "",
        phoneNumber: client.phoneNumber,
        phoneNumber2: client.phoneNumber2 || "",
        email: client.email || "",
        domain: client.domain || "",
        paymentType: client.paymentType,
        rentDurationMonths: client.rentalAgreement?.rentDurationMonths ?? 12,
        paymentSchedules:
          client.rentalAgreement && client.rentalAgreement.paymentSchedules.length > 0
            ? client.rentalAgreement.paymentSchedules.map((ps) => ({
              day: ps.day,
              amount: ps.amount,
            }))
            : [{ day: 1, amount: 0 }],
        totalPrice: client.purchaseAgreement?.totalPrice ?? 0,
        installments:
          client.purchaseAgreement && client.purchaseAgreement.installments.length > 0
            ? client.purchaseAgreement.installments.map((i) => ({
              dueDate: toDateInputValue(i.dueDate),
              amount: i.amount,
            }))
            : [{ dueDate: "", amount: 0 }],
        status: client.status,
        notes: client.notes || "",
        productType: client.productType || undefined,
        systemId: client.systemId ? String(client.systemId) : "",
      })
    }
  }, [client, reset])

  const lookupCompany = async (value: string) => {
    const normalized = value.replace(/\D/g, "")
    if (normalized.length !== 7) return
    setIsCheckingRegNo(true)
    clearErrors("regNumber")
    try {
      const result = await fetchMerchantByRegNo(normalized)
      if (result?.found && result?.name?.trim()) {
        setValue("name", result.name.trim())
        clearErrors("regNumber")
      } else {
        setValue("name", "")
        setError("regNumber", { type: "validate", message: "Регистрийн дугаар аа шалгана уу" })
      }
    } catch {
      setValue("name", "")
      setError("regNumber", { type: "validate", message: "Регистрийн дугаар аа шалгана уу" })
    } finally {
      setIsCheckingRegNo(false)
    }
  }

  const onSubmit = async (data: ClientFormValues) => {
    try {
      const {
        clientType: _clientType,
        systemId: systemIdStr,
        rentDurationMonths,
        paymentSchedules,
        totalPrice,
        installments,
        paymentType: pt,
        ...rest
      } = data
      const payload: CreateClientInput = {
        ...rest,
        paymentType: pt,
        domain: rest.domain || null,
        systemId: systemIdStr ? parseInt(systemIdStr, 10) : null,
        ...(pt === "rent"
          ? {
            rental: {
              rentDurationMonths,
              paymentSchedules,
            },
          }
          : {
            purchase: {
              totalPrice,
              installments: installments.map((r) => ({
                dueDate: r.dueDate,
                amount: r.amount,
              })),
            },
          }),
      }
      if (isEdit) {
        await updateClient.mutateAsync({ id: clientId!, data: payload })
      } else {
        await createClient.mutateAsync(payload)
      }
      onSuccess()
    } catch (error) {
      console.error("Failed to save client:", error)
    }
  }

  const switchToType = (type: "person" | "company") => {
    setValue("clientType", type)
    setValue("name", "")
    setValue("regNumber", "")
    clearErrors("name")
    clearErrors("regNumber")
  }

  if (isEdit && isFetching) {
    return <div className="py-10 text-center">Уншиж байна...</div>
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(onSubmit, () => {
          toast.error("Формыг шалгана уу — улаан талбаруудыг бөглөнө үү")
        })}
        className="space-y-5"
      >
        <input type="hidden" {...register("paymentType")} />
        <div className=" flex justify-between">
          <FormSection className="w-1/2" title="Ерөнхий мэдээлэл">
            {!isEdit && (
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                  type="button"
                  onClick={() => switchToType("person")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${clientType === "person"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                >
                  <User className="w-4 h-4" />
                  <span>Хувь хүн</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchToType("company")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${clientType === "company"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Байгууллага</span>
                </button>
              </div>
            )}

            {clientType === "company" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="regNumber" className="text-sm font-medium text-muted-foreground">
                    Байгууллагын регистрийн дугаар
                  </label>
                  <div className="relative">
                    <Input
                      id="regNumber"
                      {...register("regNumber", {
                        onChange: (e) => {
                          const val: string = e.target.value.replace(/\D/g, "")
                          if (val.length === 7) lookupCompany(val)
                          else if (val.length < 7) {
                            setValue("name", "")
                            clearErrors("regNumber")
                          }
                        },
                      })}
                      placeholder="1234567"
                      maxLength={7}
                      inputMode="numeric"
                      onBlur={(e) => lookupCompany(e.target.value)}
                      className="pr-8"
                    />
                    {isCheckingRegNo && (
                      <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {errors.regNumber && (
                    <p className="text-xs text-destructive">{errors.regNumber.message}</p>
                  )}
                </div>
                <div className="grid gap-2 min-w-0">
                  <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                    Байгууллагын нэр
                  </label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Регистр оруулахад автоматаар бөглөгдөнө"
                    readOnly
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                    Нэр *
                  </label>
                  <Input id="name" {...register("name")} placeholder="Нэр оруулна уу" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                    Имэйл (Сонголтоор)
                  </label>
                  <Input id="email" type="email" {...register("email")} placeholder="example@mail.com" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="phoneNumber" className="text-sm font-medium text-muted-foreground">Утасны дугаар *</label>
                <Input id="phoneNumber" {...register("phoneNumber")} placeholder="9900-0000" inputMode="numeric" maxLength={8} />
                {errors.phoneNumber && <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>}
              </div>
              <div className="grid gap-2">
                <label htmlFor="phoneNumber2" className="text-sm font-medium text-muted-foreground">Утасны дугаар 2 (Сонголтоор)</label>
                <Input id="phoneNumber2" {...register("phoneNumber2")} placeholder="9900-0000" inputMode="numeric" maxLength={8} />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="domain" className="text-sm font-medium text-muted-foreground">Домэйн (Сонголтоор)</label>
              <Input id="domain" {...register("domain")} placeholder="example.mn" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Бүтээгдэхүүний төрөл (Сонголтоор)</label>
              <Controller
                name="systemId"
                control={control}
                render={({ field }) => {
                  const systems = systemsData?.data.filter((s) => s.isEnabled) ?? []
                  const selected = systems.find((s) => String(s.id) === field.value)
                  return <SystemSelect systems={systems} value={field.value} onChange={field.onChange} selected={selected} />
                }}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="notes" className="text-sm font-medium text-muted-foreground">Тэмдэглэл (Сонголтоор)</label>
              <textarea
                id="notes"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("notes")}
                placeholder="Нэмэлт мэдээлэл..."
              />
            </div>
          </FormSection>

          <FormSection
            className="w-1/2"
            title="Төлбөрийн мэдээлэл"
            description={
              paymentType === "rent"
                ? "Түрээсийн хугацаа болон сар бүрийн төлбөр"
                : "Нийт үнэ болон хуваан төлбөрийн хуваарь"
            }
          >
            {paymentType === "rent" ? (
              <ClientRentPaymentSection embedded />
            ) : (
              <ClientPurchasePaymentSection embedded />
            )}
          </FormSection>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Цуцлах
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Хадгалж байна..." : isEdit ? "Шинэчлэх" : "Нэмэх"}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
