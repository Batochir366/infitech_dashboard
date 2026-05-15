import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoiceDocument } from "../components/invoice/InvoiceDocument";
import { invoiceLogoHref } from "./invoiceLogoHref";
import { buildInvoiceViewModel } from "./invoiceViewModel";
import type { InvoiceCompany, InvoiceRecord } from "../types/invoice";

/** `public/logo_black.png` — data URL so @react-pdf can render it (HTTP src often fails). */
async function fetchInvoiceLogoDataUrl(): Promise<string | undefined> {
  try {
    const res = await fetch(invoiceLogoHref());
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

export async function downloadInvoicePdf(
  invoice: InvoiceRecord,
  company: InvoiceCompany,
  filename?: string
): Promise<void> {
  const vm = buildInvoiceViewModel(invoice, company);
  const logoSrc = await fetchInvoiceLogoDataUrl();
  const doc = createElement(InvoiceDocument, { data: vm, logoSrc });
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
  const logoSrc = await fetchInvoiceLogoDataUrl();
  return pdf(
    createElement(InvoiceDocument, { data: vm, logoSrc }) as Parameters<typeof pdf>[0]
  ).toBlob();
}
