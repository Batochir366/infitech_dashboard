import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Check,
  Zap,
} from "lucide-react"
import { useModule, } from "../../hooks/useModules"
import { useDeletePlan } from "../../hooks/usePlans"
import { useToast } from "../../context/ToastContext"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
// import { Switch } from "../../components/ui/Switch"
import { Modal } from "../../components/ui/Modal"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/Card"
import { ModuleForm } from "../../components/dashboard/ModuleForm"
import { PlanForm } from "../../components/dashboard/PlanForm"
import type { Plan } from "../../types/plan"

export default function ModuleDetailPage() {
  const { id } = useParams()
  const moduleId = parseInt(id ?? "0")
  const navigate = useNavigate()
  const toast = useToast()

  const { data: module, isLoading, refetch } = useModule(moduleId)
  // const deleteModule = useDeleteModule()
  // const updateModule = useUpdateModule()
  const deletePlan = useDeletePlan()

  const [isEditModuleOpen, setIsEditModuleOpen] = useState(false)
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false)
  const [editPlanId, setEditPlanId] = useState<number | null>(null)

  const plans = (module as (typeof module & { plans?: Plan[] }) | undefined)?.plans ?? []

  // const handleDeleteModule = async () => {
  //   if (window.confirm("Та энэ Модулийг устгахдаа итгэлтэй байна уу?")) {
  //     try {
  //       await deleteModule.mutateAsync(moduleId)
  //       navigate("/modules")
  //     } catch {
  //       toast.error("Устгахад алдаа гарлаа")
  //     }
  //   }
  // }

  // const handleToggleModule = async () => {
  //   try {
  //     await updateModule.mutateAsync({ id: moduleId, data: { isEnabled: !module?.isEnabled } })
  //   } catch {
  //     toast.error("Төлөв өөрчлөхөд алдаа гарлаа")
  //   }
  // }

  const handleDeletePlan = async (planId: number) => {
    if (window.confirm("Та энэ Тарифыг устгахдаа итгэлтэй байна уу?")) {
      try {
        await deletePlan.mutateAsync(planId)
        refetch()
      } catch {
        toast.error("Устгахад алдаа гарлаа")
      }
    }
  }

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">Уншиж байна...</div>
  }

  if (!module) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold">Модуль олдсонгүй</h2>
        <Button variant="link" onClick={() => navigate("/modules")}>
          Жагсаалт руу буцах
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/modules")}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-primary tracking-tight">{module.title}</h2>
              <code className="rounded bg-muted px-2 py-0.5 text-sm font-mono text-muted-foreground">
                {module.code}
              </code>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => setIsAddPlanOpen(true)}>
            <Plus size={16} />
            <span>Тариф нэмэх</span>
          </Button>
        </div>
      </div>

      {/* Edit module modal */}
      <Modal
        isOpen={isEditModuleOpen}
        onClose={() => setIsEditModuleOpen(false)}
        title="Модуль засах"
        description="Модулийн мэдээллийг шинэчлэнэ үү."
      >
        <ModuleForm
          moduleId={moduleId}
          onSuccess={() => setIsEditModuleOpen(false)}
          onCancel={() => setIsEditModuleOpen(false)}
        />
      </Modal>

      {/* Add plan modal */}
      <Modal
        isOpen={isAddPlanOpen}
        onClose={() => setIsAddPlanOpen(false)}
        title="Шинэ Тариф нэмэх"
        description={`"${module.title}" модульд тариф нэмнэ үү.`}
        className="max-w-5xl"
      >
        <PlanForm
          defaultModuleId={moduleId}
          onSuccess={() => {
            setIsAddPlanOpen(false)
            refetch()
          }}
          onCancel={() => setIsAddPlanOpen(false)}
        />
      </Modal>

      {/* Edit plan modal */}
      <Modal
        isOpen={!!editPlanId}
        onClose={() => setEditPlanId(null)}
        title="Тариф засах"
        description="Тарифын мэдээллийг шинэчлэнэ үү."
        className="max-w-5xl"
      >
        <PlanForm
          planId={editPlanId ?? undefined}
          defaultModuleId={moduleId}
          onSuccess={() => {
            setEditPlanId(null)
            refetch()
          }}
          onCancel={() => setEditPlanId(null)}
        />
      </Modal>

      {/* Plans section */}
      <div className="space-y-4">

        {plans.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-dashed">
            <p className="text-muted-foreground">Тариф байхгүй байна.</p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => setIsAddPlanOpen(true)}
            >
              Эхний тарифаа нэмэх
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {plans.map((plan) => {
              const discountedPrice =
                plan.discount > 0
                  ? plan.price * (1 - plan.discount / 100)
                  : null

              return (
                <Card
                  key={plan.id}
                  className="flex flex-col relative overflow-hidden"
                >
                  {plan.discount > 0 && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="destructive">-{plan.discount}%</Badge>
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2 pr-8">
                      <CardTitle className="text-lg leading-tight">
                        {plan.title}
                      </CardTitle>
                      <Badge
                        variant={plan.isEnabled ? "success" : "warning"}
                        className="shrink-0 mt-0.5"
                      >
                        {plan.isEnabled ? "Идэвхтэй" : "Идэвхгүй"}
                      </Badge>
                    </div>
                    {plan.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {plan.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    {/* Pricing */}
                    <div>
                      {discountedPrice !== null ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">
                            {discountedPrice.toLocaleString()}₮
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            {plan.price.toLocaleString()}₮
                          </span>
                        </div>
                      ) : (
                        <span className="text-3xl font-bold">
                          {plan.price.toLocaleString()}₮
                        </span>
                      )}
                    </div>

                    {/* Credit */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Zap size={14} className="text-primary" />
                      <span>{plan.credit.toLocaleString()} кредит</span>
                    </div>

                    {/* Plan items checklist */}
                    {plan.items && plan.items.length > 0 && (
                      <ul className="space-y-1.5 pt-2 border-t">
                        {plan.items.map((item) => (
                          <li key={item.id} className="flex items-start gap-2 text-sm">
                            <Check
                              size={14}
                              className="mt-0.5 shrink-0 text-primary"
                            />
                            <span>{item.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>

                  <CardFooter className="gap-2 border-t pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => setEditPlanId(plan.id)}
                    >
                      <Edit size={14} />
                      Засах
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
