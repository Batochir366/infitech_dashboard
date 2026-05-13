import { useParams } from "react-router-dom";
import { Download, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { InvoiceHtmlPreview } from "../../components/invoice/InvoiceHtmlPreview";
import { usePublicInvoice } from "../../hooks/useInvoices";
import { buildInvoiceViewModel } from "../../utils/invoiceViewModel";
import { downloadInvoicePdf } from "../../utils/invoicePdf";

export default function PublicInvoicePage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, isError } = usePublicInvoice(token);

  const handleDownload = async () => {
    if (!data) return;
    await downloadInvoicePdf(data.invoice, data.company);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-6">
        <p className="text-lg font-medium">Нэхэмжлэх олдсонгүй</p>
      </div>
    );
  }

  const vm = buildInvoiceViewModel(data.invoice, data.company);

  return (
    <div className="min-h-screen bg-muted/40 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex justify-end print:hidden">
          <Button onClick={() => void handleDownload()} className="gap-2">
            <Download size={16} />
            Татах (PDF)
          </Button>
        </div>
        <InvoiceHtmlPreview data={vm} />
      </div>
    </div>
  );
}
