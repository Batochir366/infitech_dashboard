import * as z from "zod"

export const paymentScheduleSchema = z.object({
  day: z.number().min(1, "1-31").max(31, "1-31"),
  amount: z.number().min(0, "0-с их"),
})

export const installmentRowSchema = z.object({
  dueDate: z.string(),
  amount: z.number().min(0, "0-с их"),
})

const clientBaseSchema = z.object({
  clientType: z.enum(["person", "company"]),
  name: z.string().min(2, "Нэр хамгийн багадаа 2 тэмдэгт байх ёстой"),
  regNumber: z.string().optional(),
  phoneNumber: z.string().min(1, "Утасны дугаар оруулна уу"),
  phoneNumber2: z.string().optional(),
  email: z.string().email("Зөв имэйл хаяг оруулна уу").optional().or(z.literal("")),
  domain: z.string().optional(),
  paymentType: z.enum(["rent", "buy"]),
  status: z.enum(["active", "inactive"]),
  notes: z.string().optional(),
  productType: z.string().optional(),
  systemId: z.string().optional(),
})

const rentFieldsSchema = z.object({
  rentDurationMonths: z.number().min(1, "1-с их").max(600),
  paymentSchedules: z.array(paymentScheduleSchema),
})

const purchaseFieldsSchema = z.object({
  totalPrice: z.number().min(0, "0-с их"),
  installments: z.array(installmentRowSchema),
})

export const clientSchema = clientBaseSchema
  .merge(rentFieldsSchema)
  .merge(purchaseFieldsSchema)
  .superRefine((data, ctx) => {
    if (data.clientType === "company" && data.regNumber?.replace(/\D/g, "").length !== 7) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["regNumber"],
        message: "7 оронтой байгууллагын регистр оруулна уу",
      })
    }

    if (data.paymentType === "rent") {
      if (data.paymentSchedules.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["paymentSchedules"],
          message: "Төлбөрийн хуваарь оруулна уу",
        })
      }
      return
    }

    if (data.installments.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installments"],
        message: "Хуваан төлбөрийн мөр оруулна уу",
      })
    }

    data.installments.forEach((row, index) => {
      if (!row.dueDate.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["installments", index, "dueDate"],
          message: "Огноо сонгоно уу",
        })
      }
    })

    const sum = data.installments.reduce((s, r) => s + r.amount, 0)
    if (data.installments.length > 0 && Math.abs(sum - data.totalPrice) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalPrice"],
        message: "Хуваан төлбөрийн нийлбэр нь нийт үнэтэй тэнцүү байх ёстой",
      })
    }
  })

export type ClientFormValues = z.infer<typeof clientSchema>

export const clientFormDefaultValues: ClientFormValues = {
  clientType: "person",
  status: "active",
  paymentType: "rent",
  rentDurationMonths: 12,
  paymentSchedules: [{ day: 1, amount: 0 }],
  totalPrice: 0,
  installments: [{ dueDate: "", amount: 0 }],
  name: "",
  regNumber: "",
  phoneNumber: "",
  phoneNumber2: "",
  email: "",
  domain: "",
  notes: "",
  productType: undefined,
  systemId: "",
}
