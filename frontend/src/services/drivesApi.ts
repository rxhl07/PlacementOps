import { apiClient } from './apiClient';
import { ApiResponse, PlacementDrive } from '../types/domain';

export const drivesApi = {
    getAll: async () => {
        const res = await apiClient.get<ApiResponse<PlacementDrive[]>>('/drives');
        return res.data.data!;
    },
    getById: async (id: string) => {
        const res = await apiClient.get<ApiResponse<PlacementDrive>>(`/drives/${id}`);
        return res.data.data!;
    },
    create: async (payload: { name: string; academicYear: string; startDate: string; endDate: string }) => {
        const res = await apiClient.post<ApiResponse<PlacementDrive>>('/drives', payload);
        return res.data.data!;
    },
};