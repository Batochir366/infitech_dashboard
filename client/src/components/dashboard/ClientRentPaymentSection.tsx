import { Controller, useFieldArray, useFormContext } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { NumberInput } from "../ui/NumberInput"
import type { ClientFormValues } from "./clientFormSchema"

export function ClientRentPaymentSection() {
  const {
    control,
    formState: { errors },
  } = useFormContext<ClientFormValues>()

  const { fields, append, remove } = useFieldArray({
    control,
    name: "paymentSchedules",
  })

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <p className="text-sm font-semibold">Түрээсийн төлбөрийн мэдээлэл</p>

      <div className="grid gap-2 max-w-xs">
        <label htmlFor="rentDurationMonths" className="text-sm font-medium text-muted-foreground">
          Түрээсийн сар (хугацаа)
        </label>
        <Controller
          name="rentDurationMonths"
          control={control}
          render={({ field }) => (
            <NumberInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              min={1}
              placeholder="12"
            />
          )}
        />
        {errors.rentDurationMonths && (
          <p className="text-xs text-destructive">{errors.rentDurationMonths.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Түрээс эхлэх огноо нь бүртгэлийн огнооноос автоматаар тооцогдоно
        </p>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          Сар бүрийн төлбөрийн өдөр, дүн *
        </label>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <div className="w-20">
                <Controller
                  name={`paymentSchedules.${index}.day`}
                  control={control}
                  render={({ field: dayField }) => (
                    <Input
                      inputMode="numeric"
                      maxLength={2}
                      placeholder="Өдөр"
                      value={dayField.value || ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "")
                        const num = parseInt(raw, 10) || 0
                        if (num > 31) return
                        dayField.onChange(num)
                      }}
                      onBlur={() => {
                        if (dayField.value < 1) dayField.onChange(1)
                        if (dayField.value > 31) dayField.onChange(31)
                      }}
                      className="text-center"
                    />
                  )}
                />
              </div>
              <span className="text-muted-foreground text-sm">—</span>
              <div className="flex-1">
                <Controller
                  name={`paymentSchedules.${index}.amount`}
                  control={control}
                  render={({ field: amountField }) => (
                    <NumberInput
                      value={amountField.value}
                      onChange={amountField.onChange}
                      onBlur={amountField.onBlur}
                      currency
                      placeholder="0"
                    />
                  )}
                />
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          ))}
          {errors.paymentSchedules && !Array.isArray(errors.paymentSchedules) && (
            <p className="text-xs text-destructive">{errors.paymentSchedules.message}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit gap-1.5 mt-1"
          onClick={() => append({ day: 1, amount: 0 })}
        >
          <Plus size={14} />
          <span>Өдөр нэмэх</span>
        </Button>
      </div>
    </div>
  )
}
