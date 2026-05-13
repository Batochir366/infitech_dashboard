export interface System {
  id: number;
  name: string;
  photo: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemApiResponse {
  data: System[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateSystemInput {
  name: string;
  photo?: string;
  isEnabled?: boolean;
}

export interface UpdateSystemInput {
  name?: string;
  photo?: string;
  isEnabled?: boolean;
}
