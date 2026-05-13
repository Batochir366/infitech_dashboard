export type InvoiceStatus = "pending" | "paid" | "overdue" | "cancelled";

export interface InvoiceCompany {
  name: string;
  address: string;
  phone: string;
  bank: string;
}

export interface InvoiceClientSnapshot {
  id: number;
  name: string;
  regNumber: string | null;
  domain: string | null;
  phoneNumber: string;
  system?: { id: number; name: string; photo: string | null } | null;
}

export interface InvoiceRecord {
  id: number;
  invoiceNumber: string;
  publicToken: string;
  clientId: number;
  amount: number;
  description: string | null;
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string;
  paidAt: string | null;
  scheduleDay: number;
  scheduleMonth: number;
  scheduleYear: number;
  client?: InvoiceClientSnapshot;
}

export interface GenerateInvoiceResponse {
  invoice: InvoiceRecord;
  company: InvoiceCompany;
}

export interface ListInvoicesResponse {
  data: InvoiceRecord[];
  company: InvoiceCompany;
}

export interface PublicInvoiceResponse {
  invoice: InvoiceRecord;
  company: InvoiceCompany;
}
