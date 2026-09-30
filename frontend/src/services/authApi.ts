import { apiClient } from './apiClient';
import { ApiResponse, User } from '../types/domain';

export interface LoginResponseData {
    token: string;
    user: User;
}

export const authApi = {
    login: async (credentials: { email: string; password: string }) => {
        const res = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', credentials);
        return res.data.data!;
    },
    register: async (payload: unknown) => {
        const res = await apiClient.post<ApiResponse<User>>('/auth/register', payload);
        return res.data.data!;
    },
    me: async () => {
        const res = await apiClient.get<ApiResponse<User>>('/auth/me');
        return res.data.data!;
    },
};