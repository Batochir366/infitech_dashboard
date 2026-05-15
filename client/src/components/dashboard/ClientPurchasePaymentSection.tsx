import { Controller, useFieldArray, useFormContext } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "../ui/Button"
import { DatePicker } from "../ui/DatePicker"
import { NumberInput } from "../ui/NumberInput"
import type { ClientFormValues } from "./clientFormSchema"

interface ClientPurchasePaymentSectionProps {
  embedded?: boolean
}

export function ClientPurchasePaymentSection({ embedded = false }: ClientPurchasePaymentSectionProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ClientFormValues>()

  const { fields, append, remove } = useFieldArray({
    control,
    name: "installments",
  })

  return (
    <div className={embedded ? "space-y-4" : "rounded-lg border p-4 space-y-4"}>
      {!embedded && (
        <p className="text-sm font-semibold">Худалдан авалтын төлбөрийн мэдээлэл</p>
      )}

      <div className="grid gap-2">
        <label htmlFor="totalPrice" className="text-sm font-medium text-muted-foreground">
          Нийт үнэ *
        </label>
        <Controller
          name="totalPrice"
          control={control}
          render={({ field }) => (
            <NumberInput
              id="totalPrice"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              currency
              placeholder="0"
            />
          )}
        />
        {errors.totalPrice && (
          <p className="text-xs text-destructive">{errors.totalPrice.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          Хуваан төлбөр (огноо + дүн) *
        </label>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-wrap items-center gap-2">
              <Controller
                name={`installments.${index}.dueDate`}
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className="w-[180px]"
                  />
                )}
              />
              <span className="text-muted-foreground text-sm">—</span>
              <div className="flex-1 min-w-[120px]">
                <Controller
                  name={`installments.${index}.amount`}
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
                  className="h-9 w-9 text-destructive hover:text-destructive shrink-0"
                  onClick={() => remove(index)}
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          ))}
          {errors.installments && !Array.isArray(errors.installments) && (
            <p className="text-xs text-destructive">{errors.installments.message}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit gap-1.5 mt-1"
          onClick={() => append({ dueDate: "", amount: 0 })}
        >
          <Plus size={14} />
          <span>Төлбөр нэмэх</span>
        </Button>
      </div>
    </div>
  )
}
