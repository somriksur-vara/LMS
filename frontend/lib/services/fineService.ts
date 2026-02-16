import api from '../api';
import { Fine, ApiResponse, PaginatedResponse } from '../types';

interface FineParams {
  page?: number;
  limit?: number;
}

interface RecordPaymentData {
  amount: number;
  paidAt?: string;
}

export const fineService = {
  getAll: async (params: FineParams = {}): Promise<ApiResponse<PaginatedResponse<Fine>>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Fine>>>('/fines/overdue', { params });
    return response.data;
  },

  getMyFines: async (params: FineParams = {}): Promise<ApiResponse<PaginatedResponse<Fine>>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Fine>>>('/fines/my-fines', { params });
    return response.data;
  },

  recordPayment: async (issueId: string, data: RecordPaymentData): Promise<ApiResponse<Fine>> => {
    const response = await api.post<ApiResponse<Fine>>(`/fines/${issueId}/payment`, data);
    return response.data;
  },
};
