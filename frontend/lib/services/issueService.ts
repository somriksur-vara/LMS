import api from '../api';
import { Issue, ApiResponse, PaginatedResponse } from '../types';

interface IssueParams {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  issuedToId?: string;
}

interface CreateIssueData {
  bookId: string;
  userId: string;
  dueDate: string;
}

interface ReturnBookData {
  returnDate?: string;
}

export const issueService = {
  getAll: async (params: IssueParams = {}): Promise<ApiResponse<PaginatedResponse<Issue>>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Issue>>>('/issues', { params });
    return response.data;
  },

  getMyIssues: async (params: IssueParams = {}): Promise<ApiResponse<PaginatedResponse<Issue>>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Issue>>>('/issues/my-issues', { params });
    return response.data;
  },

  create: async (data: CreateIssueData): Promise<ApiResponse<Issue>> => {
    const response = await api.post<ApiResponse<Issue>>('/issues', data);
    return response.data;
  },

  returnBook: async (id: string, data: ReturnBookData = {}): Promise<ApiResponse<Issue>> => {
    const response = await api.post<ApiResponse<Issue>>(`/issues/${id}/return`, data);
    return response.data;
  },
};
