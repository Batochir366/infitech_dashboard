export type ClientStatus = 'active' | 'inactive';
export type PaymentType = 'rent' | 'buy';
export type RentalAgreementStatus = 'active' | 'cancelled';

export interface PaymentSchedule {
  id?: number;
  day: number;
  amount: number;
}

export interface RentalAgreement {
  id: number;
  clientId: number;
  status: RentalAgreementStatus;
  cancelledAt: string | null;
  leaseStartAt: string;
  rentDurationMonths: number;
  paymentSchedules: PaymentSchedule[];
}

export interface PurchaseInstallment {
  id: number;
  purchaseAgreementId: number;
  dueDate: string;
  amount: number;
  sortOrder: number;
}

export interface PurchaseAgreement {
  id: number;
  clientId: number;
  totalPrice: number;
  installments: PurchaseInstallment[];
}

export interface Client {
  id: string;
  name: string;
  regNumber?: string;
  phoneNumber: string;
  phoneNumber2?: string;
  email?: string;
  paymentType: PaymentType;
  status: ClientStatus;
  domain?: string | null;
  systemId: number | null;
  system?: { id: number; name: string; photo: string | null } | null;
  notes?: string;
  productType?: string;
  createdAt: string;
  rentalAgreement: RentalAgreement | null;
  purchaseAgreement: PurchaseAgreement | null;
}

export interface ClientApiResponse {
  data: Client[];
  total: number;
  page: number;
  limit: number;
}

export interface RentalInput {
  leaseStartAt?: string;
  rentDurationMonths: number;
  paymentSchedules: PaymentSchedule[];
}

export interface PurchaseInput {
  totalPrice: number;
  installments: { dueDate: string; amount: number }[];
}

export interface CreateClientInput {
  name: string;
  regNumber?: string;
  phoneNumber: string;
  phoneNumber2?: string;
  email?: string;
  paymentType: PaymentType;
  status: ClientStatus;
  domain?: string | null;
  systemId?: number | null;
  notes?: string;
  productType?: string;
  rental?: RentalInput;
  purchase?: PurchaseInput;
}
