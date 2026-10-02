import axios, { AxiosError, AxiosResponse } from 'axios';
import { ApiResponse } from '../types/domain';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000,
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('placementops_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Normalize Errors and Handle 401 Session Expiry
apiClient.interceptors.response.use(
    (response: AxiosResponse<ApiResponse<any>>) => response,
    (error: AxiosError<ApiResponse<any>>) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('placementops_token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        const message =
            error.response?.data?.error?.message ||
            error.message ||
            'An unexpected operational error occurred.';

        return Promise.reject(new Error(message));
    }
);