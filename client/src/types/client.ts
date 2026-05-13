export type ClientStatus = 'active' | 'inactive';
export type PaymentType = 'rent' | 'buy';

export interface PaymentSchedule {
  id?: number;
  day: number;
  amount: number;
}

export interface Client {
  id: string;
  name: string;
  regNumber?: string;
  phoneNumber: string;
  phoneNumber2?: string;
  email?: string;
  paymentType: PaymentType;
  paymentSchedules: PaymentSchedule[];
  status: ClientStatus;
  domain?: string | null;
  systemId: number | null;
  system?: { id: number; name: string; photo: string | null } | null;
  notes?: string;
  productType?: string;
  createdAt: string;
}

export interface ClientApiResponse {
  data: Client[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateClientInput {
  name: string;
  regNumber?: string;
  phoneNumber: string;
  phoneNumber2?: string;
  email?: string;
  paymentType: PaymentType;
  paymentSchedules: PaymentSchedule[];
  status: ClientStatus;
  domain?: string | null;
  systemId?: number | null;
  notes?: string;
  productType?: string;
}
