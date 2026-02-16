import api from '../api';
import { Book, ApiResponse, PaginatedResponse } from '../types';

interface BookParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

interface CreateBookData {
  isbn: string;
  title: string;
  description?: string;
  totalCopies: number;
  publishedYear?: number;
  authorName?: string;
  publisher?: string;
}

interface UpdateBookData extends Partial<CreateBookData> {
  status?: string;
}

export const bookService = {
  getAll: async (params: BookParams = {}): Promise<ApiResponse<PaginatedResponse<Book>>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Book>>>('/books', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Book>> => {
    const response = await api.get<ApiResponse<Book>>(`/books/${id}`);
    return response.data;
  },

  create: async (data: CreateBookData): Promise<ApiResponse<Book>> => {
    const response = await api.post<ApiResponse<Book>>('/books', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBookData): Promise<ApiResponse<Book>> => {
    const response = await api.patch<ApiResponse<Book>>(`/books/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/books/${id}`);
    return response.data;
  },
};
