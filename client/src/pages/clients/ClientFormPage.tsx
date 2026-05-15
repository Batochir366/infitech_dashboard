import { useNavigate, useParams } from "react-router-dom"
import { Button } from "../../components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { ClientForm } from "../../components/dashboard/ClientForm"

export default function ClientFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          {isEdit ? "Харилцагч засах" : "Харилцагч нэмэх"}
        </h2>
        <Button variant="outline" onClick={() => navigate(`/clients/${id}`)}>
          Цуцлах
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Харилцагчийн мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm
            clientId={id}
            onSuccess={() => navigate(`/clients/${id}`)}
            onCancel={() => navigate(`/clients/${id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
