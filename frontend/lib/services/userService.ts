import api from '../api';
import { User, ApiResponse, PaginatedResponse, UserRole } from '../types';

interface UserParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
}

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface UpdateUserData extends Partial<Omit<CreateUserData, 'password'>> {
  isActive?: boolean;
}

export const userService = {
  getAll: async (params: UserParams = {}): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<User>>>('/users', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },

  create: async (data: CreateUserData): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserData): Promise<ApiResponse<User>> => {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/users/${id}`);
    return response.data;
  },
};
