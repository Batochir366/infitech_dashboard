import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Search, Edit, Trash2, ImageIcon } from "lucide-react"
import { useSystems, useCreateSystem, useUpdateSystem, useDeleteSystem } from "../../hooks/useSystems"
import { useToast } from "../../context/ToastContext"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Badge } from "../../components/ui/Badge"
import { Switch } from "../../components/ui/Switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/Table"
import { Card } from "../../components/ui/Card"
import { Modal } from "../../components/ui/Modal"
import dayjs from "dayjs"

const systemSchema = z.object({
  name: z.string().min(1, "Системийн нэр оруулна уу"),
  photo: z.string().optional(),
  isEnabled: z.boolean(),
})

type SystemFormValues = z.infer<typeof systemSchema>

interface SystemFormProps {
  defaultValues?: SystemFormValues
  onSubmit: (data: SystemFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

function SystemForm({ defaultValues, onSubmit, onCancel, isSubmitting }: SystemFormProps) {
  const {
    register,
    handleSubmit,
    watch,

    formState: { errors },
  } = useForm<SystemFormValues>({
    resolver: zodResolver(systemSchema),
    defaultValues: defaultValues ?? { name: "", photo: "", isEnabled: true },
  })
  const photo = watch("photo")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
          Системийн нэр *
        </label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Ecommerce system"
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <label htmlFor="photo" className="text-sm font-medium text-muted-foreground">
          Зургийн URL (Сонголтоор)
        </label>
        <Input
          id="photo"
          {...register("photo")}
          placeholder="https://example.com/photo.png"
        />
        {photo && (
          <div className="mt-1 flex items-center gap-2">
            <img
              src={photo}
              alt="Preview"
              className="h-10 w-10 rounded-md object-cover border"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
            />
            <span className="text-xs text-muted-foreground">Урьдчилан харах</span>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Цуцлах
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Хадгалж байна..." : "Хадгалах"}
        </Button>
      </div>
    </form>
  )
}

export default function SystemListPage() {
  const [search, setSearch] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editSystemId, setEditSystemId] = useState<number | null>(null)

  const { data, isLoading } = useSystems({ search: search || undefined })
  const createSystem = useCreateSystem()
  const updateSystem = useUpdateSystem()
  const deleteSystem = useDeleteSystem()
  const toast = useToast()

  const editSystem = data?.data.find((s) => s.id === editSystemId)

  const handleCreate = async (values: SystemFormValues) => {
    try {
      await createSystem.mutateAsync({
        name: values.name,
        photo: values.photo || undefined,
        isEnabled: values.isEnabled,
      })
      setIsAddModalOpen(false)
    } catch {
      toast.error("Систем нэмэхэд алдаа гарлаа")
    }
  }

  const handleUpdate = async (values: SystemFormValues) => {
    if (!editSystemId) return
    try {
      await updateSystem.mutateAsync({
        id: editSystemId,
        data: {
          name: values.name,
          photo: values.photo || undefined,
          isEnabled: values.isEnabled,
        },
      })
      setEditSystemId(null)
    } catch {
      toast.error("Өөрчлөлт хадгалахад алдаа гарлаа")
    }
  }

  const handleToggleEnabled = async (id: number, current: boolean) => {
    try {
      await updateSystem.mutateAsync({ id, data: { isEnabled: !current } })
    } catch {
      toast.error("Төлөв өөрчлөхөд алдаа гарлаа")
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("Та энэ системийг устгахдаа итгэлтэй байна уу?")) {
      try {
        await deleteSystem.mutateAsync(id)
      } catch {
        toast.error("Устгахад алдаа гарлаа")
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Системүүд</h2>
          <p className="text-muted-foreground">Бүтээгдэхүүний системүүдийн жагсаалт.</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Нэмэх</span>
        </Button>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Шинэ Систем нэмэх"
        description="Системийн мэдээллийг доорх хэсэгт бүртгэнэ үү."
      >
        <SystemForm
          onSubmit={handleCreate}
          onCancel={() => setIsAddModalOpen(false)}
          isSubmitting={createSystem.isPending}
        />
      </Modal>

      <Modal
        isOpen={!!editSystemId}
        onClose={() => setEditSystemId(null)}
        title="Систем засах"
        description="Системийн мэдээллийг шинэчлэнэ үү."
      >
        {editSystem && (
          <SystemForm
            defaultValues={{
              name: editSystem.name,
              photo: editSystem.photo ?? "",
              isEnabled: editSystem.isEnabled,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditSystemId(null)}
            isSubmitting={updateSystem.isPending}
          />
        )}
      </Modal>

      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Системээр хайх..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Уншиж байна...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Зураг</TableHead>
                <TableHead>Системийн нэр</TableHead>
                <TableHead>Үүсгэсэн огноо</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead className="text-right">Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Мэдээлэл олдсонгүй.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((system) => (
                  <TableRow key={system.id}>
                    <TableCell>
                      {system.photo ? (
                        <img
                          src={system.photo}
                          alt={system.name}
                          className="h-9 w-9 rounded-md object-cover border"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted">
                          <ImageIcon size={16} className="text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{system.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {dayjs(system.createdAt).format("YYYY-MM-DD")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={system.isEnabled}
                          onCheckedChange={() => handleToggleEnabled(system.id, system.isEnabled)}
                          disabled={updateSystem.isPending}
                        />
                        <Badge variant={system.isEnabled ? "success" : "warning"}>
                          {system.isEnabled ? "Идэвхтэй" : "Идэвхгүй"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditSystemId(system.id)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(system.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
