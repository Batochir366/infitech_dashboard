import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoiceDocument } from "../components/invoice/InvoiceDocument";
import { buildInvoiceViewModel } from "./invoiceViewModel";
import type { InvoiceCompany, InvoiceRecord } from "../types/invoice";

export async function downloadInvoicePdf(
  invoice: InvoiceRecord,
  company: InvoiceCompany,
  filename?: string
): Promise<void> {
  const vm = buildInvoiceViewModel(invoice, company);
  const doc = createElement(InvoiceDocument, { data: vm });
  const blob = await pdf(doc as Parameters<typeof pdf>[0]).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `invoice-${invoice.invoiceNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function invoicePdfBlob(
  invoice: InvoiceRecord,
  company: InvoiceCompany
): Promise<Blob> {
  const vm = buildInvoiceViewModel(invoice, company);
  return pdf(createElement(InvoiceDocument, { data: vm }) as Parameters<typeof pdf>[0]).toBlob();
}
