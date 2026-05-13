import type { InvoiceCompany, InvoiceRecord } from "../types/invoice";

export interface InvoiceViewModel {
  company: InvoiceCompany;
  invoiceNumber: string;
  issuedDateLabel: string;
  dueDateLabel: string;
  clientName: string;
  clientReg: string;
  clientDomain: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  paymentNote: string;
}

const PAYMENT_NOTE =
  "Нэхэмжлэл гарсаас хойш ажлын 1 хоногийн дотор төлбөрийг төлсөн байх";

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function buildInvoiceViewModel(
  invoice: InvoiceRecord,
  company: InvoiceCompany
): InvoiceViewModel {
  const client = invoice.client;
  const description =
    invoice.description ||
    (client?.domain
      ? `${client.domain} - нэхэмжлэх`
      : `${client?.name ?? ""} - нэхэмжлэх`);

  return {
    company,
    invoiceNumber: invoice.invoiceNumber,
    issuedDateLabel: formatDateLabel(invoice.issuedAt),
    dueDateLabel: formatDateLabel(invoice.dueDate),
    clientName: client?.name ?? "—",
    clientReg: client?.regNumber ?? "—",
    clientDomain: client?.domain ?? "—",
    description,
    quantity: 1,
    unitPrice: invoice.amount,
    total: invoice.amount,
    paymentNote: PAYMENT_NOTE,
  };
}
