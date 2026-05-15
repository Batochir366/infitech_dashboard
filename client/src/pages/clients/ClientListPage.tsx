import { useState } from "react"
import dayjs from "dayjs"
import { Plus, Search, Edit, Trash2, Eye, ImageIcon } from "lucide-react"
import { useClients, useDeleteClient, useUpdateClient } from "../../hooks/useClients"
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
import { ClientForm } from "../../components/dashboard/ClientForm"
import { Tabs } from "../../components/ui/Tabs"
import { useNavigate } from "react-router-dom"
import type { PaymentType } from "../../types/client"

type ListTab = "all" | PaymentType

export default function ClientListPage() {
  const { data: clients, isLoading } = useClients()
  const deleteClient = useDeleteClient()
  const updateClient = useUpdateClient()
  const toast = useToast()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [listTab, setListTab] = useState<ListTab>("rent")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addPaymentType, setAddPaymentType] = useState<PaymentType>("rent")
  const [editClientId, setEditClientId] = useState<string | null>(null)
  const navigate = useNavigate()

  const canAddFromTab = listTab === "rent" || listTab === "buy"

  const openAddModal = () => {
    if (!canAddFromTab) return
    setAddPaymentType(listTab)
    setIsAddModalOpen(true)
  }

  const filteredClients = clients?.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      (client.domain ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (client.regNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      client.phoneNumber.includes(search)

    const matchesStatus = statusFilter === "all" || client.status === statusFilter
    const matchesPayment =
      listTab === "all" || client.paymentType === listTab

    return matchesSearch && matchesStatus && matchesPayment
  })

  const handleDelete = async (id: string) => {
    if (window.confirm("Та энэ Харилцагчийг устгахдаа итгэлтэй байна уу?")) {
      try {
        await deleteClient.mutateAsync(id)
      } catch {
        toast.error("Устгахад алдаа гарлаа")
      }
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active"
    try {
      await updateClient.mutateAsync({
        id,
        data: { status: newStatus as "active" | "inactive" },
      })
    } catch {
      toast.error("Төлөв өөрчлөхөд алдаа гарлаа")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Харилцагчид</h2>
        </div>

      </div>
      <div className="flex items-center gap-2 justify-between">
        <Tabs
          fullWidth={false}
          value={listTab}
          onValueChange={(id) => setListTab(id as ListTab)}
          items={[
            { id: "rent", label: "Түрээс" },
            { id: "buy", label: "Худалдан авалт" },
          ]}
        />
        <Button
          className="gap-2"
          disabled={!canAddFromTab}
          title={
            canAddFromTab
              ? undefined
              : "Түрээс эсвэл Худалдан авалт табыг сонгоно уу"
          }
          onClick={openAddModal}
        >
          <Plus size={18} />
          <span>Харилцагч нэмэх</span>
        </Button>
      </div>
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
        title={
          addPaymentType === "rent"
            ? "Шинэ түрээсийн харилцагч"
            : "Шинэ худалдан авалтын харилцагч"
        }
      >
        <ClientForm
          defaultPaymentType={addPaymentType}
          onSuccess={() => setIsAddModalOpen(false)}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editClientId}
        onClose={() => setEditClientId(null)}
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
        title="Харилцагч засах"
        description="Харилцагчийн мэдээллийг шинэчлэнэ үү."
      >
        <ClientForm
          clientId={editClientId ?? undefined}
          onSuccess={() => setEditClientId(null)}
          onCancel={() => setEditClientId(null)}
        />
      </Modal>

      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Нэр эсвэл дугаараар хайх..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="bg-transparent border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Бүх төлөв</option>
              <option value="active">Идэвхтэй</option>
              <option value="inactive">Идэвхгүй</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Уншиж байна...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Регистр</TableHead>
                <TableHead>Утас</TableHead>
                <TableHead>Домэйн</TableHead>
                <TableHead>Бүтээгдэхүүн</TableHead>
                <TableHead>Төрөл</TableHead>
                <TableHead>Төлбөрийн хуваарь</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead>Бүртгэсэн</TableHead>
                <TableHead className="text-right">Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    Мэдээлэл олдсонгүй.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients?.map((client) => (
                  <TableRow
                    key={client.id}
                    className="hover:bg-muted cursor-pointer"
                  >
                    <TableCell className="font-medium">{client.name.length > 15 ? client.name.substring(0, 15) + "..." : client.name}</TableCell>
                    <TableCell className="text-muted-foreground">{client.regNumber || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div>{client.phoneNumber}</div>
                      {client.phoneNumber2 && <div className="text-xs text-muted-foreground">{client.phoneNumber2}</div>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.domain || "—"}</TableCell>
                    <TableCell>
                      {client.system ? (
                        <div className="flex items-center gap-2">
                          {client.system.photo ? (
                            <img src={client.system.photo} alt={client.system.name} className="h-6 w-6 rounded object-cover border" />
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center rounded border bg-muted">
                              <ImageIcon size={12} className="text-muted-foreground" />
                            </span>
                          )}
                          <span className="text-sm">{client.system.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.paymentType === "rent" ? "secondary" : "outline"}>
                        {client.paymentType === "rent" ? "Түрээс" : "Худалдан авалт"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {client.paymentType === "rent" &&
                        client.rentalAgreement &&
                        client.rentalAgreement.paymentSchedules.length > 0 ? (
                        <div className="space-y-0.5">
                          {client.rentalAgreement.paymentSchedules.map((ps, i) => (
                            <div key={i} className="whitespace-nowrap">
                              <span className="text-muted-foreground">{ps.day}-нд</span>{" "}
                              <span className="font-medium">{ps.amount.toLocaleString()}₮</span>
                            </div>
                          ))}
                        </div>
                      ) : client.paymentType === "buy" &&
                        client.purchaseAgreement &&
                        client.purchaseAgreement.installments.length > 0 ? (
                        <div className="space-y-0.5">
                          {client.purchaseAgreement.installments.map((ins) => (
                            <div key={ins.id} className="whitespace-nowrap">
                              <span className="text-muted-foreground">
                                {new Date(ins.dueDate).toLocaleDateString()}
                              </span>{" "}
                              <span className="font-medium">{ins.amount.toLocaleString()}₮</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={client.status === "active"}
                          onCheckedChange={() => handleToggleStatus(client.id, client.status)}
                          disabled={updateClient.isPending}
                        />
                        <Badge variant={client.status === "active" ? "success" : "warning"}>
                          {client.status === "active" ? "Идэвхтэй" : "Идэвхгүй"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {dayjs(client.createdAt).format("YYYY-MM-DD")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/clients/${client.id}`)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditClientId(client.id)}>
                          <Edit size={16} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(client.id)}
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
